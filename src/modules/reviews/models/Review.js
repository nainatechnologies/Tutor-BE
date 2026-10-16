const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');
const { REVIEW_TARGET_TYPE, REVIEW_STATUS } = require('../../../shared/constants/reviewConstants');

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    reviewerId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'User ID of the reviewer (Parent or Tutor)'
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
    parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Only required if targetType is PARENT'
    },
    appointmentId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Optional verified completed appointment link'
    },
    subject: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Subject or course context (e.g., Mathematics, Speech Therapy)'
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
    },
    tutorReply: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Official public reply from the tutor'
    },
    tutorRepliedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM(Object.values(REVIEW_STATUS)),
        defaultValue: REVIEW_STATUS.PUBLISHED,
        allowNull: false,
        comment: 'Moderation status: published or hidden'
    }
}, {
    tableName: 'reviews',
    timestamps: true,
});

Review.TARGET_TYPE = REVIEW_TARGET_TYPE;
Review.STATUS = REVIEW_STATUS;

module.exports = Review;
