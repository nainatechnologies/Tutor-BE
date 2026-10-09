const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');
const {
    PROFESSIONAL_TYPES,
    TUTOR_TYPES,
    APPROVAL_STATUSES,
} = require('../../../shared/constants/userConstants');

const TutorProfile = sequelize.define('TutorProfile', {
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
    fullName: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    avatarUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    location: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    pincode: {
        type: DataTypes.STRING(6),
        allowNull: true,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    aadharNumber: {
        type: DataTypes.STRING(12),
        allowNull: true,
    },
    aadharDocUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    tutorType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: TUTOR_TYPES.OUTSOURCED,
    },
    inhouseId: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    outsourcingAgency: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    professionalType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: PROFESSIONAL_TYPES.TEACHER,
    },
    rciNumber: {
        type: DataTypes.STRING(6),
        allowNull: true,
        validate: {
            len: [0, 6]
        }
    },
    rciValidityDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isFutureDate(value) {
                if (value && new Date(value) < new Date(new Date().toDateString())) {
                    throw new Error('RCI Certificate Validity Date cannot be in the past.');
                }
            }
        }
    },
    rciCertUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    qualification: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    qualCertUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    experienceYears: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },

    areasOfPractice: {
        type: DataTypes.JSON, // Array of specializations (Speech Therapy, OT, etc.)
        allowNull: false,
        defaultValue: [],
    },
    languages: {
        type: DataTypes.JSON, // Array of languages
        allowNull: false,
        defaultValue: [],
    },
    teachingModes: {
        type: DataTypes.JSON, // Array of ['online', 'home', 'center']
        allowNull: false,
        defaultValue: ['online'],
    },
    perSessionFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    monthlyEstimateFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    trialFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'INR',
    },
    availability: {
        type: DataTypes.JSON, // Array of { day: string, slots: string[] }
        allowNull: false,
        defaultValue: [],
    },
    about: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    bankName: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    accountName: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    accountNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    ifscCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    teachingApproach: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    responseTime: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Usually within 1 hr',
    },
    verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    featured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    approvalStatus: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: APPROVAL_STATUSES.PENDING_REVIEW,
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    reviewCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    studentsCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    sessionsCompleted: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    revenueGenerated: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
}, {
    tableName: 'tutor_profiles',
    timestamps: true,
    indexes: [
        { fields: ['pincode'] },
        { fields: ['city'] },
        { fields: ['tutorType'] },
        { fields: ['professionalType'] },
        { fields: ['approvalStatus'] },
        { fields: ['rating'] },
        { fields: ['featured'] },
    ],
});

module.exports = TutorProfile;
