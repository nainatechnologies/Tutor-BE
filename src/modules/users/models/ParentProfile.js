const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const ParentProfile = sequelize.define('ParentProfile', {
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
    city: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    pincode: {
        type: DataTypes.STRING(6),
        allowNull: true,
    },
    street: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    landmark: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    village: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    mandal: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    district: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    state: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },

    consentAgreed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'parent_profiles',
    timestamps: true,
    indexes: [
        { fields: ['pincode'] },
        { fields: ['city'] },
    ],
});

module.exports = ParentProfile;
