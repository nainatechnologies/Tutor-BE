const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');
const { NOTIFICATION_TYPES, NOTIFICATION_TARGET_ROLES } = require('../../../shared/constants/notificationConstants');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Target User ID (null for broadcast to targetRole)',
    },
    targetRole: {
        type: DataTypes.ENUM(Object.values(NOTIFICATION_TARGET_ROLES)),
        defaultValue: NOTIFICATION_TARGET_ROLES.ALL,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM(Object.values(NOTIFICATION_TYPES)),
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Optional metadata payload (e.g. { link, bookingId, leadId, appointmentId })',
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['targetRole'] },
        { fields: ['isRead'] },
        { fields: ['createdAt'] },
    ],
});

module.exports = Notification;
