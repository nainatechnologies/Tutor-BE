const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const PAYMENT_STATUS = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED'
};

const PAYMENT_TYPE = {
    REGISTRATION_FEE: 'REGISTRATION_FEE',
    APPOINTMENT_FEE: 'APPOINTMENT_FEE',
    WALLET_TOPUP: 'WALLET_TOPUP'
};

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'INR',
    },
    status: {
        type: DataTypes.ENUM(Object.values(PAYMENT_STATUS)),
        defaultValue: PAYMENT_STATUS.PENDING,
    },
    type: {
        type: DataTypes.ENUM(Object.values(PAYMENT_TYPE)),
        allowNull: false,
    },
    razorpayOrderId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    razorpayPaymentId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    razorpaySignature: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'payments',
    timestamps: true,
});

Payment.STATUS = PAYMENT_STATUS;
Payment.TYPE = PAYMENT_TYPE;

module.exports = Payment;
