// Central constants for Reviews and Ratings System

const REVIEW_TARGET_TYPE = Object.freeze({
    TUTOR: 'TUTOR',
    PARENT: 'PARENT',
    PLATFORM: 'PLATFORM',
});

const REVIEW_STATUS = Object.freeze({
    PENDING: 'pending',
    PUBLISHED: 'published',
    HIDDEN: 'hidden',
});

module.exports = {
    REVIEW_TARGET_TYPE,
    REVIEW_STATUS,
};
