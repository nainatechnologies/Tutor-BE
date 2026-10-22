const { Op } = require('sequelize');
const Notification = require('../models/Notification');
const { NOTIFICATION_TYPES, NOTIFICATION_TARGET_ROLES } = require('../../../shared/constants/notificationConstants');
const AppError = require('../../../shared/utils/AppError');
const sseService = require('./sse.service');

/**
 * Build recipient filter for a given user
 */
const buildUserRecipientFilter = (user) => {
    const roleUpper = (user?.role || '').toUpperCase();
    return {
        [Op.or]: [
            { userId: user.id },
            {
                userId: null,
                targetRole: {
                    [Op.in]: [roleUpper, NOTIFICATION_TARGET_ROLES.ALL],
                },
            },
        ],
    };
};

/**
 * Dispatch / create a new notification in the database
 */
const createNotification = async ({
    userId = null,
    targetRole = NOTIFICATION_TARGET_ROLES.ALL,
    type,
    title,
    message,
    data = null,
}) => {
    if (!type || !Object.values(NOTIFICATION_TYPES).includes(type)) {
        throw new AppError(`Invalid notification type: ${type}`, 400);
    }

    const notification = await Notification.create({
        userId: userId || null,
        targetRole: targetRole || NOTIFICATION_TARGET_ROLES.ALL,
        type,
        title,
        message,
        data: data || null,
        isRead: false,
    });

    // Real-time broadcast via SSE
    try {
        sseService.sendNotification(notification);
    } catch (sseErr) {
        console.warn('Failed to stream notification via SSE:', sseErr?.message);
    }

    return notification;
};

/**
 * Get paginated notifications for the authenticated user
 */
const getUserNotifications = async (user, query = {}) => {
    const page = query.page && Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = query.limit && Number(query.limit) > 0 ? Number(query.limit) : 20;
    const offset = (page - 1) * limit;

    const whereClause = buildUserRecipientFilter(user);

    if (query.unreadOnly === 'true' || query.unreadOnly === '1') {
        whereClause.isRead = false;
    }

    if (query.type && Object.values(NOTIFICATION_TYPES).includes(query.type)) {
        whereClause.type = query.type;
    }

    const { count: total, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });

    const unreadCount = await Notification.count({
        where: {
            ...buildUserRecipientFilter(user),
            isRead: false,
        },
    });

    return {
        notifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        unreadCount,
    };
};

/**
 * Get quick count of unread notifications for a user
 */
const getUnreadCount = async (user) => {
    const count = await Notification.count({
        where: {
            ...buildUserRecipientFilter(user),
            isRead: false,
        },
    });
    return { unreadCount: count };
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (notificationId, user) => {
    const whereClause = {
        id: notificationId,
        ...buildUserRecipientFilter(user),
    };

    const notification = await Notification.findOne({ where: whereClause });
    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    notification.isRead = true;
    await notification.save();

    return notification;
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (user) => {
    const whereClause = {
        ...buildUserRecipientFilter(user),
        isRead: false,
    };

    const [updatedCount] = await Notification.update(
        { isRead: true },
        { where: whereClause }
    );

    return { updatedCount };
};

/**
 * Delete / dismiss a notification
 */
const deleteNotification = async (notificationId, user) => {
    const whereClause = {
        id: notificationId,
        ...buildUserRecipientFilter(user),
    };

    const notification = await Notification.findOne({ where: whereClause });
    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    await notification.destroy();
    return { success: true, message: 'Notification removed' };
};

module.exports = {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
