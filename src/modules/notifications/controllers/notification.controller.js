const notificationService = require('../services/notification.service');
const sseService = require('../services/sse.service');

/**
 * GET /api/notifications - Get current user notifications
 */
const getMyNotifications = async (req, res, next) => {
    try {
        const result = await notificationService.getUserNotifications(req.user, req.query);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/notifications/unread-count - Get unread count
 */
const getUnreadCount = async (req, res, next) => {
    try {
        const result = await notificationService.getUnreadCount(req.user);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/notifications/:id/read - Mark single notification as read
 */
const markAsRead = async (req, res, next) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id, req.user);
        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/notifications/read-all - Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
    try {
        const result = await notificationService.markAllAsRead(req.user);
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/notifications/:id - Delete a notification
 */
const deleteNotification = async (req, res, next) => {
    try {
        const result = await notificationService.deleteNotification(req.params.id, req.user);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/notifications/broadcast - Admin broadcast notification
 */
const createBroadcastNotification = async (req, res, next) => {
    try {
        const notification = await notificationService.createNotification({
            userId: req.body.userId || null,
            targetRole: req.body.targetRole,
            type: req.body.type,
            title: req.body.title,
            message: req.body.message,
            data: req.body.data,
        });
        res.status(201).json({
            success: true,
            message: 'Notification dispatched successfully',
            data: notification,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/notifications/stream - Server-Sent Events stream for real-time notifications
 */
const streamNotifications = (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
    }

    const userId = req.user.id;
    const role = req.user.role;

    sseService.addClient(userId, role, res);

    req.on('close', () => {
        sseService.removeClient(userId, res);
    });
};

module.exports = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createBroadcastNotification,
    streamNotifications,
};
