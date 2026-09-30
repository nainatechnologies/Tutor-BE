const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Subject = sequelize.define('Subject', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'id',
        },
        onDelete: 'RESTRICT', // Prevent deleting a category if subjects exist inside it
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'subjects',
    timestamps: true,
});

module.exports = Subject;
