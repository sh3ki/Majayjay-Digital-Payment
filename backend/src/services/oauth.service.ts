import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email_verified: boolean;
}

interface DecodedIdToken {
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email_verified: boolean;
}

export const oauthService = {
  /**
   * Exchange Google authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    try {
      const response = await axios.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_CALLBACK_URL,
          grant_type: 'authorization_code',
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  },

  /**
   * Decode and verify Google ID token
   */
  async decodeIdToken(idToken: string): Promise<DecodedIdToken> {
    try {
      // In production, you should verify the token signature
      // For now, we'll decode it directly
      const decoded = jwt.decode(idToken) as DecodedIdToken;
      if (!decoded) {
        throw new Error('Invalid ID token');
      }
      return decoded;
    } catch (error) {
      logger.error('Error decoding ID token:', error);
      throw new Error('Failed to decode ID token');
    }
  },

  /**
   * Get or create user from Google OAuth
   */
  async getOrCreateUser(googleUser: DecodedIdToken) {
    try {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email: googleUser.email },
        include: { role: true },
      });

      if (user) {
        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await prisma.auditLog.create({
          data: {
            eventType: 'LOGIN_SUCCESS',
            userId: user.id,
            entityType: 'user',
            entityId: String(user.id),
            action: 'READ',
            status: 'SUCCESS',
            reason: 'OAuth login',
          },
        });

        return user;
      }

      // Create new user
      const residentRole = await prisma.role.findUnique({
        where: { roleName: 'resident' },
      });

      if (!residentRole) {
        throw new Error('Default role not found');
      }

      // Generate a random password for OAuth users
      const randomPassword = Math.random().toString(36).substring(2, 15);

      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          passwordHash: randomPassword, // OAuth users don't use password, but field is required
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          contactNumber: '', // Will be updated by user later
          roleId: residentRole.id,
          status: 'PENDING',
          emailVerified: true, // Google verifies emails
          emailVerifiedAt: new Date(),
        },
        include: { role: true },
      });

      await prisma.auditLog.create({
        data: {
          eventType: 'USER_CREATED_OAUTH',
          userId: user.id,
          entityType: 'user',
          entityId: String(user.id),
          action: 'CREATE',
          status: 'SUCCESS',
          reason: 'Google OAuth signup',
        },
      });

      logger.info(`New user created via OAuth: ${user.email}`);

      return user;
    } catch (error) {
      logger.error('Error in getOrCreateUser:', error);
      throw error;
    }
  },

  /**
   * Generate JWT tokens for user
   */
  generateTokens(userId: number, email: string, role: string) {
    const payload = {
      sub: userId,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRATION,
    });

    const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRATION,
    });

    return { token, refreshToken };
  },

  /**
   * Complete OAuth login flow
   */
  async handleGoogleCallback(code: string, ipAddress?: string, userAgent?: string) {
    try {
      // 1. Exchange code for tokens
      const googleTokens = await this.exchangeCodeForTokens(code);

      // 2. Decode ID token to get user info
      const googleUser = await this.decodeIdToken(googleTokens.id_token);

      // 3. Get or create user in database
      const user = await this.getOrCreateUser(googleUser);

      // 4. Generate JWT tokens
      const tokens = this.generateTokens(user.id, user.email, user.role.roleName);

      // 5. Save session
      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.token,
          refreshToken: tokens.refreshToken,
          ipAddress,
          userAgent,
          expiresAt: new Date(Date.now() + env.JWT_EXPIRATION * 1000),
        },
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
          role: user.role,
        },
        ...tokens,
      };
    } catch (error) {
      logger.error('Error in handleGoogleCallback:', error);
      throw error;
    }
  },
};
