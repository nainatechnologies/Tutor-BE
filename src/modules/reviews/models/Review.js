const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const REVIEW_TARGET_TYPE = {
    TUTOR: 'TUTOR',
    PLATFORM: 'PLATFORM'
};

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    reviewerId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'User ID of the Parent leaving the review'
    },
    targetType: {
        type: DataTypes.ENUM(Object.values(REVIEW_TARGET_TYPE)),
        allowNull: false,
    },
    tutorId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Only required if targetType is TUTOR'
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'reviews',
    timestamps: true,
});

Review.TARGET_TYPE = REVIEW_TARGET_TYPE;

module.exports = Review;
