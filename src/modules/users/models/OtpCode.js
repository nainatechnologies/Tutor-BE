const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const OtpCode = sequelize.define('OtpCode', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    phoneNumber: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    otpHash: {
        // We hash the OTP for security just like a password
        type: DataTypes.STRING,
        allowNull: false,
    },
    action: {
        type: DataTypes.ENUM('REGISTER', 'RESET_PASSWORD'),
        allowNull: false,
        defaultValue: 'REGISTER',
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {
    tableName: 'otp_codes',
    timestamps: true,
    indexes: [
        { fields: ['phoneNumber'] },
        { fields: ['expiresAt'] } // Useful for a cron job to sweep expired OTPs
    ],
});

module.exports = OtpCode;
