const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');
const { WALLET_STATUS } = require('../constants/wallet.constants');

const Wallet = sequelize.define('Wallet', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    balance: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    validUntil: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'INR',
    },
    status: {
        type: DataTypes.ENUM(Object.values(WALLET_STATUS)),
        allowNull: false,
        defaultValue: WALLET_STATUS.ACTIVE,
    },
}, {
    tableName: 'wallets',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['userId'] },
    ],
});

Wallet.STATUS = WALLET_STATUS;

module.exports = Wallet;
