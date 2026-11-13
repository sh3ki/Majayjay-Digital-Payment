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
 * Convert Prisma values to JSON-compatible values before sending a response.
 *
 * Prisma Decimal instances are deliberately handled before the generic object
 * branch. Treating them as plain objects exposes decimal.js internals (`s`,
 * `e`, and `d`) to the frontend, where Number(value) becomes NaN.
 */
const toJsonSafe = <T>(value: T): T => {
  if (typeof value === 'bigint') return value.toString() as T;
  if (Array.isArray(value)) return value.map(toJsonSafe) as T;
  if (value instanceof Date) return value;
  if (value && typeof value === 'object') {
    const decimal = value as unknown as {
      constructor?: { name?: string };
      toNumber?: () => number;
      s?: number;
      e?: number | null;
      d?: number[];
    };
    const toNumber = decimal.toNumber;
    const isDecimal =
      (decimal.constructor?.name === 'Decimal' ||
        (typeof decimal.s === 'number' && 'e' in decimal && Array.isArray(decimal.d))) &&
      typeof toNumber === 'function';
    if (isDecimal && toNumber) {
      return toNumber.call(value) as T;
    }
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
