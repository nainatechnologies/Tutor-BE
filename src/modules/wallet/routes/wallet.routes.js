const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { protect } = require('../../../shared/middlewares/auth.middleware');
const validate = require('../../../shared/middlewares/validate.middleware');
const { topupSchema, deductSchema } = require('../validators/wallet.validator');

// All wallet endpoints require authentication
router.use(protect);

// GET /api/wallet/balance - Retrieve live balance, validity, and transactions
router.get('/balance', walletController.getBalance);

// GET /api/wallet/packages - Retrieve available coin packages
router.get('/packages', walletController.getPackages);

// POST /api/wallet/topup - Top up coins with rollover logic
router.post('/topup', validate(topupSchema, 'body'), walletController.topup);

// POST /api/wallet/deduct - Deduct coins atomically
router.post('/deduct', validate(deductSchema, 'body'), walletController.deduct);

module.exports = router;
