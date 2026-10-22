const { z } = require('zod');
const { NOTIFICATION_TYPES, NOTIFICATION_TARGET_ROLES } = require('../../../shared/constants/notificationConstants');

const getNotificationsQuerySchema = z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
    unreadOnly: z.enum(['true', 'false', '1', '0']).optional(),
    type: z.enum(Object.values(NOTIFICATION_TYPES)).optional(),
});

const createNotificationSchema = z.object({
    userId: z.string().uuid().optional().nullable(),
    targetRole: z.enum(Object.values(NOTIFICATION_TARGET_ROLES)).optional(),
    type: z.enum(Object.values(NOTIFICATION_TYPES)),
    title: z.string().min(1, 'Title is required').max(255),
    message: z.string().min(1, 'Message is required'),
    data: z.record(z.any()).optional().nullable(),
});

module.exports = {
    getNotificationsQuerySchema,
    createNotificationSchema,
};
