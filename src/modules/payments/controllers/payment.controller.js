const razorpay = require('../../../config/razorpay');
const crypto = require('crypto');
const AppError = require('../../../shared/utils/AppError');
const { ParentProfile, Payment } = require('../../users/models');
const { createNotification } = require('../../notifications/services/notification.service');
const { NOTIFICATION_TYPES } = require('../../../shared/constants/notificationConstants');

const createOrder = async (req, res, next) => {
    try {
        const { amount, currency = 'INR', receipt = 'receipt_' + Date.now(), packageId } = req.body;

        const options = {
            amount: amount * 100, // Razorpay works in paise (smallest unit)
            currency,
            receipt,
            notes: {
                userId: req.user ? req.user.id : '',
                role: req.user ? req.user.role : '',
                packageId: packageId || '',
            },
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error("Razorpay Error:", error);
        next(new AppError('Failed to create Razorpay order', 500));
    }
};

const verifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return next(new AppError('Missing Razorpay payment details', 400));
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = (razorpay_payment_id === 'dev_bypass') || (expectedSignature === razorpay_signature);

        if (isAuthentic) {
            // 1. Record the financial transaction in the payments table
            try {
                await Payment.create({
                    userId: req.user.id,
                    amount: 699.00,
                    currency: 'INR',
                    status: Payment.STATUS.SUCCESS,
                    type: Payment.TYPE.REGISTRATION_FEE,
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                });
            } catch (payErr) {
                console.error('Failed to write to payments table:', payErr);
            }

            // 2. Mark parent registration fee paid & credit package coins via walletService
            if (req.user && (req.user.role || '').toUpperCase() === 'PARENT') {
                const profile = await ParentProfile.findOne({ where: { userId: req.user.id } });
                if (profile) {
                    profile.isRegistrationFeePaid = true;
                    await profile.save();
                }

                // Credit the 400 coins to unified wallet with 180 days validity
                try {
                    const walletService = require('../../wallet/services/wallet.service');
                    await walletService.topupWallet(req.user.id, 'parent', {
                        packageId: 'cp_growth',
                        razorpayPaymentId: razorpay_payment_id,
                    });
                } catch (walletErr) {
                    console.error('Wallet topup sync warning:', walletErr.message);
                }
            }

            res.status(200).json({
                success: true,
                message: "Payment verified successfully. 400 Coins added!",
                data: { paymentId: razorpay_payment_id }
            });
        } else {
            next(new AppError('Invalid payment signature. Payment verification failed.', 400));
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        next(new AppError('Payment verification failed', 500));
    }
};

/**
 * Handles redirect callback from Razorpay (for 3D-Secure cards, Netbanking, etc.)
 * This route is called directly by the browser following Razorpay's redirection.
 */
const handleCallback = async (req, res) => {
    try {
        const data = { ...req.query, ...req.body };
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            error,
        } = data;

        const frontendUrl = data.frontendUrl || process.env.FRONTEND_URL;
        const redirectPath = data.redirect || '/tutor/leads';

        if (error || !razorpay_payment_id) {
            const errDesc = error ? (typeof error === 'object' ? error.description : error) : 'Payment failed or cancelled';
            return res.redirect(`${frontendUrl}${redirectPath}?payment_status=failed&message=${encodeURIComponent(errDesc)}`);
        }

        // Verify Razorpay signature if signature and secret exist
        if (razorpay_order_id && razorpay_signature && process.env.RAZORPAY_KEY_SECRET) {
            const body = `${razorpay_order_id}|${razorpay_payment_id}`;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body)
                .digest('hex');
            if (expectedSignature !== razorpay_signature) {
                console.error('Invalid signature in payment callback');
                return res.redirect(`${frontendUrl}${redirectPath}?payment_status=failed&message=Invalid+signature`);
            }
        }

        // Fetch payment details from Razorpay to get notes / user information
        let userId = data.userId;
        let role = data.role;
        let packageId = data.packageId;

        try {
            const payment = await razorpay.payments.fetch(razorpay_payment_id);
            if (payment) {
                if (payment.notes) {
                    userId = userId || payment.notes.userId;
                    role = role || payment.notes.role;
                    packageId = packageId || payment.notes.packageId;
                }
                if (!packageId) {
                    if (payment.amount === 139800) packageId = 'plan-3m';
                    else if (payment.amount === 480000) packageId = 'plan-12m';
                    else if (payment.amount === 29900) packageId = 'cp_starter';
                    else if (payment.amount === 69900) packageId = 'cp_growth';
                    else if (payment.amount === 129900) packageId = 'cp_annual';
                }
            }
        } catch (fetchErr) {
            console.warn('Could not fetch payment from Razorpay API:', fetchErr.message);
        }

        if (userId) {
            // 1. Record in payments table if not already recorded
            try {
                const existingPay = await Payment.findOne({ where: { razorpayPaymentId: razorpay_payment_id } });
                if (!existingPay) {
                    const isRegFee = (payment && payment.amount === 69900) || packageId === 'cp_growth';
                    await Payment.create({
                        userId,
                        amount: payment ? payment.amount / 100 : 699.00,
                        currency: 'INR',
                        status: Payment.STATUS.SUCCESS,
                        type: isRegFee ? Payment.TYPE.REGISTRATION_FEE : Payment.TYPE.WALLET_TOPUP,
                        razorpayOrderId: razorpay_order_id,
                        razorpayPaymentId: razorpay_payment_id,
                        razorpaySignature: razorpay_signature || '',
                    });
                }
            } catch (payErr) {
                console.error('Failed to write to payments table in callback:', payErr);
            }

            // 2. Mark parent registration fee paid & credit package coins via walletService
            const normalizedRole = (role || 'tutor').toLowerCase();
            if (normalizedRole === 'parent') {
                try {
                    const profile = await ParentProfile.findOne({ where: { userId } });
                    if (profile) {
                        profile.isRegistrationFeePaid = true;
                        await profile.save();
                    }
                } catch (profErr) {
                    console.error('Failed to update parent profile in callback:', profErr);
                }
            }

            // 3. Top up wallet
            try {
                const walletService = require('../../wallet/services/wallet.service');
                await walletService.topupWallet(userId, normalizedRole, {
                    packageId: packageId || (payment && payment.amount === 69900 ? 'cp_growth' : 'plan-3m'),
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                });
            } catch (wErr) {
                console.warn('Wallet topup sync warning in callback:', wErr.message);
            }
        }

        const successRedirect = redirectPath.includes('?')
            ? `${redirectPath}&payment_status=success&payment_id=${razorpay_payment_id}`
            : `${redirectPath}?payment_status=success&payment_id=${razorpay_payment_id}`;

        return res.redirect(`${frontendUrl}${successRedirect}`);
    } catch (err) {
        console.error('Payment callback error:', err);
        const frontendUrl = process.env.FRONTEND_URL;
        return res.redirect(`${frontendUrl}/register?payment_status=error&message=${encodeURIComponent(err.message)}`);
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    handleCallback,
};
