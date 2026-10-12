const walletService = require('../services/wallet.service');

/**
 * Controller for retrieving current wallet balance and ledger history.
 */
const getBalance = async (req, res, next) => {
    try {
        const data = await walletService.getWalletDetails(req.user.id);
        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller for retrieving available coin packages for current user role.
 */
const getPackages = async (req, res, next) => {
    try {
        const packages = walletService.getPackages(req.user.role);
        res.status(200).json({
            success: true,
            data: packages,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller for topping up coins after payment.
 */
const topup = async (req, res, next) => {
    try {
        const result = await walletService.topupWallet(req.user.id, req.user.role, req.body);
        res.status(200).json({
            success: true,
            message: 'Coins credited successfully!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller for deducting coins (for connection or lead unlock).
 */
const deduct = async (req, res, next) => {
    try {
        const result = await walletService.deductCoins(req.user.id, req.body);
        res.status(200).json({
            success: true,
            message: 'Coins deducted successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBalance,
    getPackages,
    topup,
    deduct,
};
