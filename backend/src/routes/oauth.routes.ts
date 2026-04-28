import { Router } from 'express';
import { oauthController } from '../controllers/oauth.controller';

const router = Router();

// Get Google OAuth authorization URL
router.post('/google-auth-url', oauthController.getGoogleAuthUrl);

// Google OAuth callback
router.get('/google-callback', oauthController.googleCallback);

export default router;
