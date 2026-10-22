const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../../../shared/middlewares/auth.middleware');
const { requireRole } = require('../../../shared/middlewares/role.middleware');
const validate = require('../../../shared/middlewares/validate.middleware');
const {
    getNotificationsQuerySchema,
    createNotificationSchema,
} = require('../validators/notification.validator');

// All notification operations require authentication
router.use(protect);

// GET /api/notifications/stream - Real-time Server-Sent Events stream
router.get(
    '/stream',
    notificationController.streamNotifications
);

// GET /api/notifications - List user's notifications
router.get(
    '/',
    validate(getNotificationsQuerySchema, 'query'),
    notificationController.getMyNotifications
);

// GET /api/notifications/unread-count - Get total unread notifications count
router.get(
    '/unread-count',
    notificationController.getUnreadCount
);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch(
    '/read-all',
    notificationController.markAllAsRead
);

// PATCH /api/notifications/:id/read - Mark specific notification as read
router.patch(
    '/:id/read',
    notificationController.markAsRead
);

// DELETE /api/notifications/:id - Delete a notification
router.delete(
    '/:id',
    notificationController.deleteNotification
);

// POST /api/notifications/broadcast - Admin broadcast notification
router.post(
    '/broadcast',
    requireRole('admin', 'ADMIN'),
    validate(createNotificationSchema, 'body'),
    notificationController.createBroadcastNotification
);

module.exports = router;
