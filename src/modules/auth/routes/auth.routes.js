const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema, resetPasswordSchema, changePasswordSchema } = require('../validators/auth.validator');
const validate = require('../../../shared/middlewares/validate.middleware');
const { protect } = require('../../../shared/middlewares/auth.middleware');
const { otpRateLimiter, authRateLimiter } = require('../../../shared/middlewares/rateLimit.middleware');

router.post(
    '/register',
    validate(registerSchema),
    authController.register
);

router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

// --- OTP & Password Reset Routes ---
router.post('/send-otp', otpRateLimiter, validate(sendOtpSchema), authController.sendOtp);

router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

// --- Change Password (Requires Login) ---
router.post('/change-password', protect, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
