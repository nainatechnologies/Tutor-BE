const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');
const { COMPLAINT_STATUS, COMPLAINT_CATEGORY, COMPLAINT_PRIORITY } = require('../constants/complaint.constants');

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
    appointmentId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Linked session ID if the complaint relates to a specific session'
    },
    category: {
        type: DataTypes.ENUM(Object.values(COMPLAINT_CATEGORY)),
        defaultValue: COMPLAINT_CATEGORY.OTHER,
        allowNull: false,
    },
    priority: {
        type: DataTypes.ENUM(Object.values(COMPLAINT_PRIORITY)),
        defaultValue: COMPLAINT_PRIORITY.MEDIUM,
        allowNull: false,
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
    indexes: [
        { name: 'idx_complaints_reporter', fields: ['reporterId'] },
        { name: 'idx_complaints_reported', fields: ['reportedId'] },
        { name: 'idx_complaints_status', fields: ['status'] },
        { name: 'idx_complaints_created', fields: ['createdAt'] }
    ]
});

Complaint.STATUS = COMPLAINT_STATUS;
Complaint.CATEGORY = COMPLAINT_CATEGORY;
Complaint.PRIORITY = COMPLAINT_PRIORITY;

module.exports = Complaint;
