import { Response } from 'express';

interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  message: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
  meta?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Express delegates JSON serialization to JSON.stringify, which throws when
 * a Prisma BigInt reaches the response body. Convert BigInts to strings so
 * identifiers remain exact and API responses stay JSON-compatible.
 */
const toJsonSafe = <T>(value: T): T => {
  if (typeof value === 'bigint') return value.toString() as T;
  if (Array.isArray(value)) return value.map(toJsonSafe) as T;
  if (value instanceof Date) return value;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toJsonSafe(item)])
    ) as T;
  }
  return value;
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Operation successful',
  statusCode = 200,
  meta?: Record<string, unknown>
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    status: statusCode,
    message,
    data: toJsonSafe(data),
    timestamp: new Date().toISOString(),
  };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message = 'An error occurred',
  statusCode = 500,
  errors?: Array<{ field?: string; message: string }>
): Response => {
  const response: ApiResponse = {
    success: false,
    status: statusCode,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Data retrieved successfully'
): Response => {
  return sendSuccess(res, data, message, 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};
