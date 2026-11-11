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

// Send SMS using SpearUC Gateway (Live in all environments)
const sendSms = async (phone, otp, action) => {
    console.log(`\n======================================`);
    console.log(`[SMS DISPATCH - LIVE GATEWAY]`);
    console.log(`To: ${phone}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Action: ${action}`);
    console.log(`======================================\n`);

    try {
        const { default: axios } = await import('axios');
        
        const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
        if (!cleanPhone || cleanPhone.length !== 10) {
            console.error(`[SMS] Invalid 10-digit mobile number provided: ${phone}`);
            const AppError = require('./AppError');
            throw new AppError('Invalid mobile number. Please provide a valid 10-digit mobile number.', 400);
        }

        const tid = process.env.SPEAR_UC_TID_REGISTRATION || process.env.SMS_TEMPLATE_ID || '1707173623405426000';
        
        let message = '';
        if (tid === '1777179421847838122') {
            message = `Dear Customer, your NAINA TECHNOLOGIES LLP verification OTP is ${otp} Do not share this OTP with anyone.`;
        } else {
            // Working True Mentor DLT approved template (1707173623405426000)
            message = `Dear Customer, your Registration OTP is ${otp} for True Mentor Login -Support Team RisiEdu`;
        }

        if (process.env.SPEAR_UC_BASE_URL && process.env.SPEAR_UC_AUTH_KEY) {
            console.log(`[SMS] Sending live SMS via SpearUC to ${cleanPhone}...`);
            const params = new URLSearchParams({
              type: 'smsquicksend',
              authKey: process.env.SPEAR_UC_AUTH_KEY,
              sender: process.env.SPEAR_UC_SENDER_ID || 'RSTEdu',
              to_mobileno: cleanPhone,
              sms_text: message,
              t_id: tid
            });
            const url = `${process.env.SPEAR_UC_BASE_URL}?${params.toString()}`;
            
            const response = await axios.get(url);
            console.log(`[SMS] SpearUC Response:`, response.data);

            if (response.data && response.data.status === 'error') {
                console.error(`\n[SMS GATEWAY CRITICAL ERROR] Provider: SpearUC | Recipient: ${cleanPhone} | Reason: ${response.data.Message || 'Failed to deliver SMS'} | Action: Check credits / DLT registration at login4.spearuc.com`);
                console.error('[SMS Error Payload]:', response.data);
                const AppError = require('./AppError');
                throw new AppError('Unable to send verification code at this time. Please try again in a few minutes or contact support.', 503);
            }

            return response.data;
        } else {
            console.warn(`[SMS] Live SMS Gateway not configured, skipping actual network request.`);
            return { success: true, message: "Mock SMS sent" };
        }
    } catch (error) {
        if (error.statusCode) throw error;
        console.error(`\n[SMS GATEWAY CRITICAL ERROR] Network/Transport failure for ${phone}:`, error.message);
        const AppError = require('./AppError');
        throw new AppError('Unable to send verification code at this time. Please try again in a few minutes or contact support.', 503);
    }
};

module.exports = {
    generateOtp,
    hashOtp,
    verifyOtpHash,
    sendSms
};
