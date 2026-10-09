const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate a 6 digit random number
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash the OTP before saving to DB
const hashOtp = async (otp) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(otp, salt);
};

// Compare provided OTP with hashed OTP
const verifyOtpHash = async (providedOtp, hashedOtp) => {
    return await bcrypt.compare(providedOtp, hashedOtp);
};

// Send SMS using SpearUC Gateway
const sendSms = async (phone, otp, action) => {
    console.log(`\n======================================`);
    console.log(`[SMS MOCK/LOG SERVER]`);
    console.log(`To: ${phone}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Action: ${action}`);
    console.log(`======================================\n`);

    try {
        const { default: axios } = await import('axios');
        
        let message = '';
        let tid = '';
        
        if (action === 'REGISTER') {
            message = `Dear Customer , your Registration OTP is ${otp} for True Mentor Login -Support Team RisiEdu`;
            tid = process.env.SMS_TEMPLATE_ID || process.env.SPEAR_UC_TID_REGISTRATION; 
        } else {
            message = `Dear Customer , your Registration OTP is ${otp} for True Mentor Login -Support Team RisiEdu`; // Fallback to same approved template
            tid = process.env.SMS_TEMPLATE_ID || process.env.SPEAR_UC_TID_REGISTRATION; 
        }

        if (process.env.SPEAR_UC_BASE_URL && process.env.SPEAR_UC_AUTH_KEY) {
            console.log(`[SMS] Sending live SMS via SpearUC to ${phone}...`);
            const params = new URLSearchParams({
              type: 'smsquicksend',
              authKey: process.env.SPEAR_UC_AUTH_KEY,
              sender: process.env.SPEAR_UC_SENDER_ID,
              to_mobileno: phone,
              sms_text: message,
              t_id: tid
            });
            const url = `${process.env.SPEAR_UC_BASE_URL}?${params.toString()}`;
            
            const response = await axios.get(url);
            console.log(`[SMS] SpearUC Response:`, response.data);
            return response.data;
        } else {
            console.log(`[SMS] Live SMS Gateway not configured, skipping actual network request.`);
            return { success: true, message: "Mock SMS sent" };
        }
    } catch (error) {
        console.error(`[SMS] Error sending SMS via SpearUC:`, error.message);
        // We throw an AppError so the controller knows the SMS failed
        const AppError = require('./AppError');
        throw new AppError('Failed to send SMS OTP. Please try again.', 500);
    }
};

module.exports = {
    generateOtp,
    hashOtp,
    verifyOtpHash,
    sendSms
};
