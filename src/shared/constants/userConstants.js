// Central constants for Roles, Types, and Statuses

const USER_ROLES = {
    PARENT: 'parent',
    TUTOR: 'tutor',
    ADMIN: 'admin',
};

const USER_STATUSES = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING: 'pending',
};

// Only 2 professional types as per the Nurtiva platform
const PROFESSIONAL_TYPES = {
    TEACHER: 'Teacher',
    THERAPIST: 'Therapist',
};

// Only 2 tutor employment types
const TUTOR_TYPES = {
    IN_HOUSE: 'In-house',
    OUTSOURCED: 'Outsourced',
};

const APPROVAL_STATUSES = {
    PENDING_REVIEW: 'pending review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    NEEDS_CHANGES: 'needs changes',
};

const TEACHING_MODES = {
    ONLINE: 'online',
    HOME: 'home',
    CENTER: 'center',
};

module.exports = {
    USER_ROLES,
    USER_STATUSES,
    PROFESSIONAL_TYPES,
    TUTOR_TYPES,
    APPROVAL_STATUSES,
    TEACHING_MODES,
};
