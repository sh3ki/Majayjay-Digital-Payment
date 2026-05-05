import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import prisma from '../config/database';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      sendSuccess(res, { id: user.id, email: user.email }, 'Registration successful', 201);
    } catch (err) {
      if ((err as Error).message === 'Email already registered') {
        return sendError(res, 'Email already registered', 409);
      }
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      sendSuccess(res, result, 'Login successful');
    } catch (err) {
      if ((err as Error).message === 'Invalid credentials') {
        return sendError(res, 'Invalid email or password', 401);
      }
      if ((err as Error).message.includes('locked')) {
        return sendError(res, (err as Error).message, 429);
      }
      if ((err as Error).message.includes('inactive')) {
        return sendError(res, 'Account is inactive or suspended', 403);
      }
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) await authService.logout(token);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return sendError(res, 'Refresh token required', 400);
      const result = await authService.refreshToken(refreshToken);
      sendSuccess(res, result, 'Token refreshed');
    } catch (err) {
      if ((err as Error).message.includes('Invalid')) {
        return sendError(res, 'Invalid or expired refresh token', 401);
      }
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.sub, currentPassword, newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (err) {
      if ((err as Error).message === 'Current password is incorrect') {
        return sendError(res, 'Current password is incorrect', 400);
      }
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      sendSuccess(res, null, 'If that email exists, a reset link will be sent');
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      sendSuccess(res, null, 'Password reset successfully');
    } catch (err) {
      if ((err as Error).message.includes('Invalid or expired')) {
        return sendError(res, 'Invalid or expired reset token', 400);
      }
      next(err);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({
        where: { id: req.user!.sub },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          middleName: true, contactNumber: true, address: true, barangay: true,
          status: true, emailVerified: true,
          lastLoginAt: true, createdAt: true,
          role: { select: { roleName: true, description: true } },
          department: { select: { id: true, departmentName: true } },
        },
      });
      if (!user) return sendError(res, 'User not found', 404);
      sendSuccess(res, user, 'User profile retrieved');
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, contactNumber, middleName, address, barangay } = req.body;
      const user = await prisma.user.update({
        where: { id: req.user!.sub },
        data: { firstName, lastName, contactNumber, middleName, address, barangay },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          middleName: true, contactNumber: true, address: true, barangay: true,
          status: true, emailVerified: true,
          lastLoginAt: true, createdAt: true,
          role: { select: { roleName: true, description: true } },
          department: { select: { id: true, departmentName: true } },
        },
      });
      sendSuccess(res, user, 'Profile updated');
    } catch (err) {
      next(err);
    }
  },
};
