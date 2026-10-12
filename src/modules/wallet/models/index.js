const Wallet = require('./Wallet');
const WalletTransaction = require('./WalletTransaction');

// Internal associations between Wallet and WalletTransaction
Wallet.hasMany(WalletTransaction, { foreignKey: 'walletId', as: 'transactions', onDelete: 'CASCADE' });
WalletTransaction.belongsTo(Wallet, { foreignKey: 'walletId', as: 'wallet' });

module.exports = {
    Wallet,
    WalletTransaction,
};
