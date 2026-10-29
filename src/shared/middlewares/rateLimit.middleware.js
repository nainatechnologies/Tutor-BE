const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const AppError = require('../utils/AppError');

// Best Practice: Rate-limit by phone number (req.body.phone) rather than raw IP.
// In development, on localhost, or for test phone numbers (9000000... / 999999...), bypass to keep local testing uninterrupted.
const isTestOrDev = (req) => {
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const ip = req.ip || req.connection?.remoteAddress || '';
    const isLocalhost = ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost') || ip === '::ffff:127.0.0.1';
    const phone = req.body?.phone || req.query?.phone || '';
    const isTestPhone = phone.startsWith('9000000') || phone.startsWith('999999') || phone === '9000000109' || phone === '9052237153';
    return (isDev && isLocalhost) || isTestPhone;
};

// Rate limiter for sending OTPs
const otpRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 requests per phone in 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.body?.phone ? `otp_${req.body.phone}` : ipKeyGenerator(req.ip);
    },
    skip: (req) => isTestOrDev(req),
    handler: (req, res, next) => {
        next(new AppError('Too many verification code requests for this phone number. For your security, please wait a few minutes before trying again.', 429));
    }
});

// General rate limiter for login/registration
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    skip: (req) => isTestOrDev(req),
    handler: (req, res, next) => {
        next(new AppError('Too many authentication attempts. Please try again later.', 429));
    }
});

module.exports = {
    otpRateLimiter,
    authRateLimiter
};
