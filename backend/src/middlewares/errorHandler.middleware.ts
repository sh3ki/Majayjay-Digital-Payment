import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  logger.error(`${req.method} ${req.path} - ${err.message}`, err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(res, 'A record with this value already exists', 409);
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'Record not found', 404);
      return;
    }
  }

  if (err.name === 'ValidationError') {
    sendError(res, err.message, 400);
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401);
    return;
  }

  sendError(res, 'Internal server error', 500);
};

export const notFound = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.path} not found`, 404);
};
