const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const AdminProfile = sequelize.define('AdminProfile', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    businessName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'TutorApp India',
    },
    registrationNo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'REG-2023-9912',
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '123 Education Hub, Tech Park, City - 400001',
    },
    businessDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: 'Leading tutoring platform connecting students with expert educators across various subjects and disciplines.',
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Super Admin',
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'contact@tutorapp.in',
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '+91 98765 43210',
    },
}, {
    tableName: 'admin_profiles',
    timestamps: true,
});

module.exports = AdminProfile;
