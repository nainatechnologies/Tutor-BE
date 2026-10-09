const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/payment.controller');
const { protect } = require('../../../shared/middlewares/auth.middleware');

const router = express.Router();

// POST /api/payments/create-order
router.post('/create-order', protect, createOrder);

// POST /api/payments/verify
router.post('/verify', protect, verifyPayment);

module.exports = router;
