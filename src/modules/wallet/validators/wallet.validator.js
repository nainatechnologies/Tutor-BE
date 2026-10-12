const { z } = require('zod');
const { TRANSACTION_TYPE } = require('../constants/wallet.constants');

const topupSchema = z.object({
    packageId: z.string().min(1, 'Package ID is required'),
    razorpayOrderId: z.string().optional(),
    razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
    razorpaySignature: z.string().optional(),
});

const deductSchema = z.object({
    amount: z.number().int().positive('Amount must be a positive integer'),
    type: z.enum(Object.values(TRANSACTION_TYPE)),
    referenceId: z.string().optional(),
    description: z.string().min(1, 'Description is required').max(255),
});

module.exports = {
    topupSchema,
    deductSchema,
};
