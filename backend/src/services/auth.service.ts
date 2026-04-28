import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { JwtPayload } from '../middlewares/auth.middleware';

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
        emailVerified: true,
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

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
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
      throw new Error('Invalid credentials');
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
    if (!user) return;
    // In production: send reset email with token
    // For now just return success (security: don't reveal if email exists)
  },
};

async function safeAuditLog(data: Parameters<typeof prisma.auditLog.create>[0]['data']) {
  try {
    await prisma.auditLog.create({ data });
  } catch (error) {
    logger.warn(`Audit log write skipped: ${(error as Error).message}`);
  }
}
