// Central constants for Notifications System

const NOTIFICATION_TYPES = Object.freeze({
    CONNECTION: 'CONNECTION',
    APPOINTMENT: 'APPOINTMENT',
    PAYMENT: 'PAYMENT',
    REVIEW: 'REVIEW',
    COMPLAINT: 'COMPLAINT',
    REGISTRATION: 'REGISTRATION',
    SYSTEM: 'SYSTEM',
});

const NOTIFICATION_TARGET_ROLES = Object.freeze({
    PARENT: 'PARENT',
    TUTOR: 'TUTOR',
    ADMIN: 'ADMIN',
    ALL: 'ALL',
});

module.exports = {
    NOTIFICATION_TYPES,
    NOTIFICATION_TARGET_ROLES,
};
