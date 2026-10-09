const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const CONNECTION_STATUS = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED'
};

const Connection = sequelize.define('Connection', {
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
    status: {
        type: DataTypes.ENUM(Object.values(CONNECTION_STATUS)),
        defaultValue: CONNECTION_STATUS.PENDING,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'connections',
    timestamps: true,
});

Connection.STATUS = CONNECTION_STATUS;

module.exports = Connection;
