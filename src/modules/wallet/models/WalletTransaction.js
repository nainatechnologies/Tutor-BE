const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');
const { TRANSACTION_TYPE } = require('../constants/wallet.constants');

const WalletTransaction = sequelize.define('WalletTransaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    walletId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'wallets',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    balanceAfter: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM(Object.values(TRANSACTION_TYPE)),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    referenceId: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
    },
}, {
    tableName: 'wallet_transactions',
    timestamps: true,
    indexes: [
        { fields: ['walletId'] },
        { fields: ['userId'] },
        { fields: ['createdAt'] },
    ],
});

WalletTransaction.TYPE = TRANSACTION_TYPE;

module.exports = WalletTransaction;
