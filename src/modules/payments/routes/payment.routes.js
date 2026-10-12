const express = require('express');
const { createOrder, verifyPayment, handleCallback } = require('../controllers/payment.controller');
const { protect } = require('../../../shared/middlewares/auth.middleware');

const router = express.Router();

// POST /api/payments/create-order
router.post('/create-order', protect, createOrder);

// POST /api/payments/verify
router.post('/verify', protect, verifyPayment);

// Razorpay redirect callback (called by browser after bank 3D-Secure / Netbanking redirect)
router.post('/callback', handleCallback);
router.get('/callback', handleCallback);

module.exports = router;
