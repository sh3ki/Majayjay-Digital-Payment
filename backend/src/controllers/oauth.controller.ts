import { Request, Response, NextFunction } from 'express';
import { oauthService } from '../services/oauth.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const oauthController = {
  /**
   * Handle Google OAuth callback
   * GET /api/v1/auth/google-callback?code=...&state=...
   */
  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        return sendError(res, 'Authorization code not provided', 400);
      }

      // Handle OAuth flow
      const result = await oauthService.handleGoogleCallback(
        code,
        req.ip,
        req.headers['user-agent']
      );

      // Build redirect URL with tokens
      const redirectUrl = new URL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback`);
      redirectUrl.searchParams.append('token', result.token);
      redirectUrl.searchParams.append('refreshToken', result.refreshToken);
      redirectUrl.searchParams.append('userId', String(result.user.id));
      redirectUrl.searchParams.append('email', result.user.email);
      redirectUrl.searchParams.append('status', result.user.status);

      logger.info(`User ${result.user.email} authenticated via Google OAuth with status ${result.user.status}`);

      // Redirect to frontend with tokens
      res.redirect(redirectUrl.toString());
    } catch (error) {
      logger.error('Error in Google callback:', error);
      const message = (error as Error).message || 'Authentication failed';
      const redirectUrl = new URL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`);
      redirectUrl.searchParams.append('error', message);
      res.redirect(redirectUrl.toString());
    }
  },

  /**
   * Get Google OAuth authorization URL
   * POST /api/v1/auth/google-auth-url
   */
  async getGoogleAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { GOOGLE_CLIENT_ID, GOOGLE_CALLBACK_URL } = process.env;

      if (!GOOGLE_CLIENT_ID || !GOOGLE_CALLBACK_URL) {
        return sendError(res, 'Google OAuth not configured', 500);
      }

      const scopes = [
        'openid',
        'profile',
        'email',
      ];

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', GOOGLE_CALLBACK_URL);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', scopes.join(' '));

      sendSuccess(res, { authUrl: authUrl.toString() }, 'Google auth URL generated');
    } catch (err) {
      next(err);
    }
  },
};
