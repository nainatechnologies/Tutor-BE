const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ParentProfile, TutorProfile, ChildProfile } = require('../../users/models');
const OtpCode = require('../../users/models/OtpCode');
const sequelize = require('../../../config/database');
const AppError = require('../../../shared/utils/AppError');
const otpUtils = require('../../../shared/utils/otp.utils');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

const registerUser = async (data) => {
    const { role, email, phone, password, name, city, pincode, street, district, aadharNumber, subjectIds, childName, childGrade, goal, mode, availableTime, otp } = data;

    if (!otp) {
        throw new AppError('OTP is required for registration.', 400);
    }

    // Verify OTP First!
    await verifyOtp(phone, otp, 'REGISTER');

    // Check if user already exists
    const existingUser = await User.findOne({
        where: {
            [sequelize.Sequelize.Op.or]: [{ email }, { phone }]
        }
    });

    if (existingUser) {
        throw new AppError('A user with this email or phone already exists.', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Use a transaction to guarantee both User and Profile are created safely
    const transaction = await sequelize.transaction();

    try {
        const user = await User.create({
            email,
            phone,
            password: hashedPassword,
            role,
        }, { transaction });

        if (role === 'PARENT') {
            const parent = await ParentProfile.create({
                userId: user.id,
                fullName: name,
                city,
                pincode,
                street,
                district,
            }, { transaction });

            if (childName && childGrade) {
                const child = await ChildProfile.create({
                    parentId: parent.id,
                    name: childName,
                    grade: childGrade,
                    learningGoals: goal,
                    preferredMode: mode || 'online',
                    preferredSchedule: availableTime,
                }, { transaction });

                if (subjectIds && subjectIds.length > 0) {
                    await child.setSubjects(subjectIds, { transaction });
                }
            }
        } else if (role === 'TUTOR') {
            const tutor = await TutorProfile.create({
                userId: user.id,
                fullName: name,
                city,
                pincode,
                aadharNumber,
            }, { transaction });

            // Automatically wire up the junction table if subject IDs were provided!
            if (subjectIds && subjectIds.length > 0) {
                await tutor.setSubjects(subjectIds, { transaction });
            }
        }

        await transaction.commit();

        const token = generateToken(user.id);
        return { user, token };
    } catch (error) {
        await transaction.rollback();
        console.error("Profile creation error:", error);
        throw new AppError(`Registration failed during profile creation: ${error.message}`, 500);
    }
};

const loginUser = async (identifier, password) => {
    // Identifier can be email or phone
    const user = await User.findOne({
        where: {
            [sequelize.Sequelize.Op.or]: [{ email: identifier }, { phone: identifier }]
        }
    });

    if (!user) {
        throw new AppError('Authentication failed. Invalid credentials.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new AppError('Authentication failed. Invalid credentials.', 401);
    }

    if (user.status !== 'active') {
        throw new AppError(`Your account is currently ${user.status.toLowerCase()}.`, 403);
    }

    let isProfileComplete = false;
    if (user.role === 'PARENT') {
        const profile = await ParentProfile.findOne({ where: { userId: user.id } });
        if (profile && profile.city && profile.district) isProfileComplete = true;
    } else if (user.role === 'TUTOR') {
        const profile = await TutorProfile.findOne({ where: { userId: user.id } });
        if (profile && profile.city && profile.aadharNumber) isProfileComplete = true;
    } else if (user.role === 'admin' || user.role === 'ADMIN') {
        isProfileComplete = true;
    }

    const token = generateToken(user.id);
    const userData = user.toJSON();
    userData.isProfileComplete = isProfileComplete;
    
    return { user: userData, token };
};

const sendOtp = async (phone, action, email = null) => {
    // 1. For Registration, check if user already exists
    if (action === 'REGISTER') {
        const existingPhone = await User.findOne({ where: { phone } });
        if (existingPhone) throw new AppError('Phone number already registered.', 400);

        if (email) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) throw new AppError('Email address already registered.', 400);
        }
    }
    
    // 2. For Reset Password, check if user actually exists
    if (action === 'RESET_PASSWORD') {
        const existingUser = await User.findOne({ where: { phone } });
        if (!existingUser) throw new AppError('No account found with this phone number.', 404);
    }

    // 3. 30-second cooldown check
    const lastOtp = await OtpCode.findOne({
        where: { phoneNumber: phone, action },
        order: [['createdAt', 'DESC']]
    });

    if (lastOtp) {
        const secondsSinceLast = (new Date() - lastOtp.createdAt) / 1000;
        if (secondsSinceLast < 30) {
            throw new AppError(`Please wait ${Math.ceil(30 - secondsSinceLast)} seconds before requesting a new OTP.`, 429);
        }
    }

    // 4. Generate and Hash OTP
    const rawOtp = otpUtils.generateOtp();
    const otpHash = await otpUtils.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins from now

    // 5. Save to DB
    await OtpCode.create({
        phoneNumber: phone,
        otpHash,
        action,
        expiresAt
    });

    // 6. Send SMS
    await otpUtils.sendSms(phone, rawOtp, action);
    
    return true;
};

const verifyOtp = async (phone, providedOtp, action, deleteRecord = true) => {
    // 1. Get the most recent OTP for this number & action
    const latestOtpRecord = await OtpCode.findOne({
        where: { phoneNumber: phone, action },
        order: [['createdAt', 'DESC']]
    });

    if (!latestOtpRecord) {
        throw new AppError('No OTP request found for this phone number.', 400);
    }

    // 2. Check Expiry
    if (new Date() > latestOtpRecord.expiresAt) {
        throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    // 3. Verify Hash
    const isValid = await otpUtils.verifyOtpHash(providedOtp, latestOtpRecord.otpHash);
    if (!isValid) {
        throw new AppError('Invalid OTP code.', 400);
    }

    // 4. Delete the OTP record so it can't be reused, unless explicitly told not to (e.g., for pre-verification)
    if (deleteRecord) {
        await latestOtpRecord.destroy();
    }

    return true;
};

const resetPassword = async (phone, newPassword, otp) => {
    // 1. Verify OTP specifically for RESET_PASSWORD action
    await verifyOtp(phone, otp, 'RESET_PASSWORD');

    // 2. Get User
    const user = await User.findOne({ where: { phone } });
    if (!user) throw new AppError('User not found.', 404);

    // 3. Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();

    return true;
};

const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new AppError('Incorrect current password', 401);

    user.password = newPassword;
    await user.save();
    return true;
};

module.exports = {
    registerUser,
    loginUser,
    sendOtp,
    verifyOtp,
    resetPassword,
    changePassword
};
