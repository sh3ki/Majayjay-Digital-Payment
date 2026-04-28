import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendError } from '../utils/response';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, 'No token provided', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };
};

export const logAudit = (eventType: string, entityType: string, action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'VERIFY' | 'APPROVE' | 'REJECT') => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        try {
          await prisma.auditLog.create({
            data: {
              eventType,
              userId: req.user.sub,
              entityType,
              entityId: req.params.id || 'N/A',
              action,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
              status: 'SUCCESS',
            },
          });
        } catch (error) {
          logger.warn(`Audit log write skipped: ${(error as Error).message}`);
        }
      }
    } catch {
      // Don't block on audit errors
    }
    next();
  };
};
