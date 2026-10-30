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
        
        const result = await authService.loginUser(identifier, password);

        if (result.requires2FA) {
            return sendSuccess(res, {
                requires2FA: true,
                tempToken: result.tempToken,
                maskedPhone: result.maskedPhone,
                email: result.email,
            }, 'Two-step verification required. Please enter the OTP sent to your registered phone.', 200);
        }
        
        return sendSuccess(res, { user: result.user, token: result.token }, 'Logged in successfully', 200);
    } catch (error) {
        next(error);
    }
};

const verifyAdmin2FA = async (req, res, next) => {
    try {
        const { tempToken, otp } = req.body;
        const { user, token } = await authService.verifyAdmin2FA(tempToken, otp);
        return sendSuccess(res, { user, token }, 'Two-step verification successful. Welcome to Admin Panel.', 200);
    } catch (error) {
        next(error);
    }
};

const resendAdmin2FA = async (req, res, next) => {
    try {
        const { tempToken } = req.body;
        const result = await authService.resendAdmin2FA(tempToken);
        return sendSuccess(res, result, 'New verification code sent to your phone.', 200);
    } catch (error) {
        next(error);
    }
};

const sendOtp = async (req, res, next) => {
    try {
        const { phone, action, email } = req.body;
        const result = await authService.sendOtp(phone, action, email);
        const resolvedPhone = result?.phone || phone;
        const maskedPhone = resolvedPhone ? `${resolvedPhone.slice(0, 3)}••••${resolvedPhone.slice(-3)}` : undefined;
        return sendSuccess(res, { phone: resolvedPhone, maskedPhone }, 'OTP sent successfully to your phone.', 200);
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

const logout = async (req, res, next) => {
    try {
        const result = await authService.logoutUser(req.user);
        return sendSuccess(res, null, result.message, 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    sendOtp,
    resetPassword,
    changePassword,
    logout,
    verifyAdmin2FA,
    resendAdmin2FA,
};

