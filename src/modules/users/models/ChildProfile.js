const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');
const { TEACHING_MODES } = require('../../../shared/constants/userConstants');

const ChildProfile = sequelize.define('ChildProfile', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    parentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'parent_profiles',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    gender: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    grade: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    schoolName: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },

    learningGoals: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    preferredMode: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: TEACHING_MODES.ONLINE,
    },
    preferredSchedule: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    medicalInformation: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    emergencyContactName: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    emergencyContactPhone: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    relationship: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    approvalStatus: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'approved',
    },
    status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'active',
    },
}, {
    tableName: 'child_profiles',
    timestamps: true,
    indexes: [
        { fields: ['parentId'] },
        { fields: ['grade'] },
    ],
});

module.exports = ChildProfile;
