const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const COMPLAINT_STATUS = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    RESOLVED: 'RESOLVED',
    CLOSED: 'CLOSED'
};

const Complaint = sequelize.define('Complaint', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    reporterId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'User ID of the person making the complaint'
    },
    reportedId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'User ID of the person being complained about (if applicable)'
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM(Object.values(COMPLAINT_STATUS)),
        defaultValue: COMPLAINT_STATUS.OPEN,
    },
    resolutionNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'complaints',
    timestamps: true,
});

Complaint.STATUS = COMPLAINT_STATUS;

module.exports = Complaint;
