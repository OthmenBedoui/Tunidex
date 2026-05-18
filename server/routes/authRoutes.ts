
import express from 'express';
import { login, register, verifyRegistrationOtp, resendRegistrationOtp, sendVerificationEmail, getMe } from '../controllers/authController.js';
import { getPublicAuthProviders } from '../controllers/authProviderController.js';
import { handleSocialAuthCallback, startSocialAuth } from '../controllers/socialAuthController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/register/verify-otp', verifyRegistrationOtp);
router.post('/register/resend-otp', resendRegistrationOtp);
router.get('/providers', getPublicAuthProviders);
router.get('/oauth/:provider/start', startSocialAuth);
router.get('/oauth/:provider/callback', handleSocialAuthCallback);
router.post('/oauth/:provider/callback', handleSocialAuthCallback);
router.get('/callback/:provider', handleSocialAuthCallback);
router.post('/callback/:provider', handleSocialAuthCallback);
router.post('/verify-email', authenticate, sendVerificationEmail);
router.get('/me', authenticate, getMe);

export default router;
