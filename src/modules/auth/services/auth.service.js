const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ParentProfile, TutorProfile } = require('../../users/models');
const sequelize = require('../../../config/database');
const AppError = require('../../../shared/utils/AppError');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

const registerUser = async (data) => {
    const { role, email, phone, password, name, city, pincode, street, district, aadharNumber, subjectIds } = data;

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
            await ParentProfile.create({
                userId: user.id,
                fullName: name,
                city,
                pincode,
                street,
                district,
            }, { transaction });
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
        throw new AppError('Registration failed during profile creation.', 500);
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

    if (user.status !== 'ACTIVE') {
        throw new AppError(`Your account is currently ${user.status.toLowerCase()}.`, 403);
    }

    const token = generateToken(user.id);
    return { user, token };
};

module.exports = {
    registerUser,
    loginUser,
};
