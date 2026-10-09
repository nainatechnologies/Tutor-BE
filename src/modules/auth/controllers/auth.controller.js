const authService = require('../services/auth.service');
const { sendSuccess } = require('../../../shared/utils/response');

const register = async (req, res, next) => {
    try {
        const { user, token } = await authService.registerUser(req.body);
        return sendSuccess(res, { user, token }, 'Registered successfully', 201);
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body;
        
        const { user, token } = await authService.loginUser(identifier, password);
        
        return sendSuccess(res, { user, token }, 'Logged in successfully', 200);
    } catch (error) {
        next(error);
    }
};

const sendOtp = async (req, res, next) => {
    try {
        const { phone, action, email } = req.body;
        await authService.sendOtp(phone, action, email);
        return sendSuccess(res, null, 'OTP sent successfully to your phone.', 200);
    } catch (error) {
        next(error);
    }
};



const resetPassword = async (req, res, next) => {
    try {
        const { phone, otp, newPassword } = req.body;
        await authService.resetPassword(phone, newPassword, otp);
        return sendSuccess(res, null, 'Password reset successfully. You can now login.', 200);
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        // User ID comes from the JWT token via the protect middleware
        await authService.changePassword(req.user.id, currentPassword, newPassword);
        return sendSuccess(res, null, 'Password updated successfully.', 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    sendOtp,
    resetPassword,
    changePassword
};
