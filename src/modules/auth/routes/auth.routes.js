const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema, resetPasswordSchema, changePasswordSchema, verifyAdmin2FASchema, resendAdmin2FASchema } = require('../validators/auth.validator');
const validate = require('../../../shared/middlewares/validate.middleware');
const { protect, optionalProtect } = require('../../../shared/middlewares/auth.middleware');
const { otpRateLimiter, authRateLimiter } = require('../../../shared/middlewares/rateLimit.middleware');

router.post(
    '/register',
    authRateLimiter,
    validate(registerSchema),
    authController.register
);

router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

// --- Admin Two-Step Verification Routes ---
router.post('/admin/verify-2fa', authRateLimiter, validate(verifyAdmin2FASchema), authController.verifyAdmin2FA);
router.post('/admin/resend-2fa', otpRateLimiter, validate(resendAdmin2FASchema), authController.resendAdmin2FA);


// --- OTP & Password Reset Routes ---
router.post('/send-otp', otpRateLimiter, validate(sendOtpSchema), authController.sendOtp);

router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

// --- Change Password (Requires Login) ---
router.post('/change-password', protect, validate(changePasswordSchema), authController.changePassword);

// --- Logout (Safe & Idempotent) ---
router.post('/logout', optionalProtect, authController.logout);

module.exports = router;

