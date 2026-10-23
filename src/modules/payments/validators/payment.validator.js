const { z } = require('zod');

const createOrderSchema = z.object({
    amount: z.number({
        required_error: "Payment amount is required",
        invalid_type_error: "Payment amount must be a number",
    }).positive("Payment amount must be greater than zero"),
    currency: z.string().default('INR').optional(),
    receipt: z.string().optional(),
    packageId: z.string().optional(),
});

const verifyPaymentSchema = z.object({
    razorpay_order_id: z.string({
        required_error: "Razorpay order ID is required",
    }).min(1, "Razorpay order ID cannot be empty"),
    razorpay_payment_id: z.string({
        required_error: "Razorpay payment ID is required",
    }).min(1, "Razorpay payment ID cannot be empty"),
    razorpay_signature: z.string().optional(),
    packageId: z.string().optional(),
});

module.exports = {
    createOrderSchema,
    verifyPaymentSchema,
};
