import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { JwtPayload } from '../middlewares/auth.middleware';
import { emailService } from './email.service';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export const authService = {
  async register(dto: RegisterDto) {
    const existingUser = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new Error('Email already registered');

    const residentRole = await prisma.role.findUnique({ where: { roleName: 'resident' } });
    if (!residentRole) throw new Error('Default role not found');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        contactNumber: dto.contactNumber,
        roleId: residentRole.id,
        status: 'ACTIVE',
        emailVerified: false,
      },
      include: { role: true },
    });

    await safeAuditLog({
      eventType: 'USER_REGISTERED',
      userId: user.id,
      entityType: 'user',
      entityId: String(user.id),
      action: 'CREATE',
      status: 'SUCCESS',
    });

    // Send OTP (non-blocking)
    authService.sendVerificationOtp(user.id, user.email, user.firstName).catch((err) => {
      logger.error(`[auth] Failed to send verification OTP: ${(err as Error).message}`);
    });

    return user;
  },

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new Error('Invalid credentials or account is inactive');
    }

    // Account lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new Error(`Account is temporarily locked. Try again in ${minutesLeft} minute(s).`);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockedUntil = newAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MS)
        : null;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: newAttempts, ...(lockedUntil ? { lockedUntil } : {}) },
      });
      await safeAuditLog({
        eventType: 'LOGIN_FAILED',
        userId: user.id,
        entityType: 'user',
        entityId: String(user.id),
        action: 'READ',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        reason: 'Invalid password',
      });
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        throw new Error(`Too many failed attempts. Account locked for 15 minutes.`);
      }
      throw new Error('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    // If email is not verified, send a fresh OTP and return a signal to the client
    if (!user.emailVerified) {
      authService.sendVerificationOtp(user.id, user.email, user.firstName).catch((err) => {
        logger.error(`[auth] Failed to send verification OTP on login: ${(err as Error).message}`);
      });
      return { requiresVerification: true, userId: user.id };
    }

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role.roleName },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRATION }
    );

    const refreshToken = uuidv4();
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRATION * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    await safeAuditLog({
      eventType: 'LOGIN_SUCCESS',
      userId: user.id,
      entityType: 'user',
      entityId: String(user.id),
      action: 'READ',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        contactNumber: user.contactNumber,
        status: user.status,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        role: {
          roleName: user.role.roleName,
          description: user.role.description || undefined,
        },
      },
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRATION,
    };
  },

  async logout(token: string) {
    await prisma.session.deleteMany({ where: { token } });
  },

  async sendVerificationOtp(userId: number, email: string, firstName: string) {
    // Invalidate previous unused OTPs for this user
    await prisma.emailVerificationOtp.deleteMany({ where: { userId } });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await prisma.emailVerificationOtp.create({
      data: { userId, otpHash, expiresAt },
    });

    await emailService.sendOtpVerification(email, firstName, otp);

    logger.info(`[auth] OTP sent to user ${userId}`);
  },

  async verifyOtp(userId: number, otp: string, ipAddress?: string, userAgent?: string) {
    const record = await prisma.emailVerificationOtp.findFirst({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) throw new Error('OTP expired or not found');

    const valid = await bcrypt.compare(otp, record.otpHash);
    if (!valid) throw new Error('Invalid OTP');

    await prisma.emailVerificationOtp.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });

    await safeAuditLog({
      eventType: 'EMAIL_VERIFIED',
      userId,
      entityType: 'user',
      entityId: String(userId),
      action: 'VERIFY',
      status: 'SUCCESS',
    });

    // Create session and return tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new Error('User not found');

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role.roleName },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRATION }
    );

    const refreshToken = uuidv4();
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRATION * 1000);

    await prisma.session.create({
      data: { userId: user.id, token: accessToken, refreshToken, ipAddress, userAgent, expiresAt },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        contactNumber: user.contactNumber,
        status: user.status,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        role: { roleName: user.role.roleName, description: user.role.description || undefined },
      },
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRATION,
    };
  },

  async resendOtp(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (user.emailVerified) throw new Error('Email already verified');
    await authService.sendVerificationOtp(user.id, user.email, user.firstName);
  },

  async refreshToken(refreshToken: string) {
    const session = await prisma.session.findFirst({
      where: { refreshToken, expiresAt: { gt: new Date() } },
      include: { user: { include: { role: true } } },
    });

    if (!session) throw new Error('Invalid or expired refresh token');

    const accessToken = jwt.sign(
      { sub: session.user.id, email: session.user.email, role: session.user.role.roleName },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRATION }
    );

    await prisma.session.update({
      where: { id: session.id },
      data: { token: accessToken },
    });

    return { accessToken, expiresIn: env.JWT_EXPIRATION };
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new Error('Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

    await safeAuditLog({
      eventType: 'PASSWORD_CHANGED',
      userId: userId,
      entityType: 'user',
      entityId: String(userId),
      action: 'UPDATE',
      status: 'SUCCESS',
    });
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return silently to prevent email enumeration
    if (!user || user.status !== 'ACTIVE') return;

    // Invalidate any previous reset tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: rawToken, expiresAt },
    });

    // Send email (non-blocking)
    emailService.sendPasswordReset(user.email, user.firstName, rawToken).catch((err) => {
      logger.error(`[auth] Failed to send password reset email: ${err.message}`);
    });

    await safeAuditLog({
      eventType: 'PASSWORD_RESET_REQUESTED',
      userId: user.id,
      entityType: 'user',
      entityId: String(user.id),
      action: 'UPDATE',
      status: 'SUCCESS',
    });
  },

  async resetPassword(token: string, newPassword: string) {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date() || record.usedAt) {
      throw new Error('Invalid or expired reset token');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: record.userId }, data: { passwordHash: newHash } });
    await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });

    // Invalidate all active sessions
    await prisma.session.deleteMany({ where: { userId: record.userId } });

    await safeAuditLog({
      eventType: 'PASSWORD_RESET',
      userId: record.userId,
      entityType: 'user',
      entityId: String(record.userId),
      action: 'UPDATE',
      status: 'SUCCESS',
    });
  },
};

async function safeAuditLog(data: Parameters<typeof prisma.auditLog.create>[0]['data']) {
  try {
    await prisma.auditLog.create({ data });
  } catch (error) {
    logger.warn(`Audit log write skipped: ${(error as Error).message}`);
  }
}
