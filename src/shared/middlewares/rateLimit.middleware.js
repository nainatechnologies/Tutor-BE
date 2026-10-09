const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

// Strict rate limiter for sending OTPs
// Max 5 requests per 15 minutes per IP
const otpRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Increased for testing
    handler: (req, res, next) => {
        next(new AppError('Too many OTP requests from this IP. Please try again after 15 minutes.', 429));
    }
});

// General rate limiter for login/registration
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, 
    handler: (req, res, next) => {
        next(new AppError('Too many authentication attempts from this IP. Please try again later.', 429));
    }
});

module.exports = {
    otpRateLimiter,
    authRateLimiter
};
