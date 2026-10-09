const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const APPOINTMENT_STATUS = {
    REQUESTED: 'REQUESTED',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED'
};

const APPOINTMENT_MODE = {
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE'
};

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    parentId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    tutorId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    childId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    scheduledDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    durationMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 60,
    },
    status: {
        type: DataTypes.ENUM(Object.values(APPOINTMENT_STATUS)),
        defaultValue: APPOINTMENT_STATUS.REQUESTED,
    },
    mode: {
        type: DataTypes.ENUM(Object.values(APPOINTMENT_MODE)),
        defaultValue: APPOINTMENT_MODE.ONLINE,
    },
    meetingLink: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'appointments',
    timestamps: true,
});

Appointment.STATUS = APPOINTMENT_STATUS;
Appointment.MODE = APPOINTMENT_MODE;

module.exports = Appointment;
