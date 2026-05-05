import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),

  DATABASE_URL: process.env.DATABASE_URL || '',

  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRATION: parseInt(process.env.JWT_EXPIRATION || '3600', 10),
  REFRESH_TOKEN_EXPIRATION: parseInt(process.env.REFRESH_TOKEN_EXPIRATION || '604800', 10),

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google-callback',

  PAYMONGO_API_KEY: process.env.PAYMONGO_API_KEY || '',
  PAYMONGO_SECRET_KEY: process.env.PAYMONGO_SECRET_KEY || '',
  PAYMONGO_WEBHOOK_SECRET: process.env.PAYMONGO_WEBHOOK_SECRET || '',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@majayjay.gov.ph',

  SMS_API_KEY: process.env.SMS_API_KEY || '',
  SMS_SENDER_ID: process.env.SMS_SENDER_ID || 'MAJAYJAY',
};

// Validate critical env vars at startup
const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'] as const;
for (const key of REQUIRED) {
  if (!env[key]) {
    if (env.NODE_ENV === 'production') {
      throw new Error(`[env] Missing required environment variable: ${key}`);
    } else {
      console.warn(`[env] WARNING: ${key} is not set. This will cause failures in production.`);
    }
  }
}
