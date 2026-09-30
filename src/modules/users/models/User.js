const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../../../config/database');
const { USER_ROLES, USER_STATUSES } = require('../../../shared/constants/userConstants');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    phone: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: USER_ROLES.PARENT,
    },
    status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: USER_STATUSES.ACTIVE,
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    lastActiveAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'users',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['email'] },
        { unique: true, fields: ['phone'] },
        { fields: ['role'] },
        { fields: ['status'] },
    ],
});

// Security Best Practice: Never expose password hash in JSON responses
User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
};

// Domain Helper: Verify password with bcrypt
User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
