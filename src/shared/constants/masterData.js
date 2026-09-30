/**
 * Central constants for the application.
 * This file acts as the single source of truth for allowed values,
 * replacing rigid database ENUMs for easier future scalability.
 */

const CATEGORY_TYPES = {
    ACADEMIC: 'ACADEMIC',
    SERVICE: 'SERVICE',
};

// We will use this in Zod validators: e.g., z.enum(Object.values(CATEGORY_TYPES))

module.exports = {
    CATEGORY_TYPES,
};
