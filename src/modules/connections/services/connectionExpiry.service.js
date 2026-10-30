const cron = require('node-cron');
const { Op } = require('sequelize');
const { Connection, ParentProfile, TutorProfile, User } = require('../../users/models');
const walletService = require('../../wallet/services/wallet.service');
const { COIN_COSTS } = require('../../wallet/constants/wallet.constants');
const { createNotification } = require('../../notifications/services/notification.service');
const { NOTIFICATION_TYPES, NOTIFICATION_TARGET_ROLES } = require('../../../shared/constants/notificationConstants');

const EXPIRY_DAYS = 7;
const REMINDER_DAYS = 4;

/**
 * Automatically expires pending connection requests that are older than 7 days,
 * refunds 50 coins to the parent's wallet, and dispatches in-app notifications.
 */
const expireStaleConnections = async () => {
    try {
        const cutoffDate = new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        const staleConnections = await Connection.findAll({
            where: {
                status: Connection.STATUS.PENDING,
                createdAt: {
                    [Op.lte]: cutoffDate,
                },
            },
            include: [
                {
                    model: ParentProfile,
                    as: 'parent',
                    include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone'] }],
                },
                {
                    model: TutorProfile,
                    as: 'tutor',
                    include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone'] }],
                },
            ],
        });

        if (!staleConnections || staleConnections.length === 0) {
            return { processedCount: 0, expiredIds: [] };
        }

        console.log(`[ConnectionExpiry] Found ${staleConnections.length} pending connection(s) older than ${EXPIRY_DAYS} days. Processing auto-expiry & coin refunds...`);

        const expiredIds = [];

        for (const conn of staleConnections) {
            try {
                // 1. Mark status as REJECTED with rejectionReason
                conn.status = Connection.STATUS.REJECTED;
                conn.rejectionReason = 'AUTO_EXPIRED_7_DAYS';
                await conn.save();
                expiredIds.push(conn.id);

                // 2. Refund 50 coins to parent wallet
                if (conn.parent && conn.parent.userId) {
                    try {
                        await walletService.refundCoins(conn.parent.userId, {
                            amount: COIN_COSTS.PARENT_CONNECTION_COST,
                            referenceId: conn.id,
                            description: 'Refund: Connection request auto-expired after 7 days without tutor response',
                        });
                    } catch (refundErr) {
                        console.error(`[ConnectionExpiry] Failed to refund coins for connection ${conn.id}:`, refundErr.message);
                    }

                    // 3. Notify Parent
                    try {
                        const tutorName = conn.tutor?.fullName || 'the tutor';
                        await createNotification({
                            userId: conn.parent.userId,
                            targetRole: NOTIFICATION_TARGET_ROLES.PARENT,
                            type: NOTIFICATION_TYPES.CONNECTION,
                            title: 'Connection Request Expired & Refunded',
                            message: `Your connection request to ${tutorName} was not accepted within 7 days. Your 50 coins have been refunded to your wallet.`,
                            data: {
                                connectionId: conn.id,
                                status: Connection.STATUS.REJECTED,
                                reason: 'AUTO_EXPIRED_7_DAYS',
                                coinsRefunded: COIN_COSTS.PARENT_CONNECTION_COST,
                            },
                        });
                    } catch (notifErr) {
                        console.warn(`[ConnectionExpiry] Failed to notify parent for connection ${conn.id}:`, notifErr.message);
                    }
                }

                // 4. Notify Tutor
                if (conn.tutor && conn.tutor.userId) {
                    try {
                        const parentName = conn.parent?.fullName || 'A parent';
                        await createNotification({
                            userId: conn.tutor.userId,
                            targetRole: NOTIFICATION_TARGET_ROLES.TUTOR,
                            type: NOTIFICATION_TYPES.CONNECTION,
                            title: 'Connection Request Expired',
                            message: `A connection request from ${parentName} expired because it was not responded to within 7 days.`,
                            data: {
                                connectionId: conn.id,
                                status: Connection.STATUS.REJECTED,
                                reason: 'AUTO_EXPIRED_7_DAYS',
                            },
                        });
                    } catch (tutorNotifErr) {
                        console.warn(`[ConnectionExpiry] Failed to notify tutor for connection ${conn.id}:`, tutorNotifErr.message);
                    }
                }

                console.log(`[ConnectionExpiry] Successfully auto-expired connection #${conn.id.slice(0, 8)} and refunded coins.`);
            } catch (singleErr) {
                console.error(`[ConnectionExpiry] Error expiring connection ${conn.id}:`, singleErr.message);
            }
        }

        return { processedCount: expiredIds.length, expiredIds };
    } catch (err) {
        console.error('[ConnectionExpiry] Error during expireStaleConnections:', err);
        return { processedCount: 0, error: err.message };
    }
};

/**
 * Sends a gentle advance reminder at Day 4 to tutors with pending connection requests.
 */
const sendPendingConnectionReminders = async () => {
    try {
        const reminderCutoff = new Date(Date.now() - REMINDER_DAYS * 24 * 60 * 60 * 1000);
        const expiryCutoff = new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        const pendingReminders = await Connection.findAll({
            where: {
                status: Connection.STATUS.PENDING,
                createdAt: {
                    [Op.lte]: reminderCutoff,
                    [Op.gt]: expiryCutoff,
                },
                reminderSentAt: null,
            },
            include: [
                {
                    model: ParentProfile,
                    as: 'parent',
                },
                {
                    model: TutorProfile,
                    as: 'tutor',
                },
            ],
        });

        if (!pendingReminders || pendingReminders.length === 0) {
            return { remindersSent: 0 };
        }

        console.log(`[ConnectionReminder] Found ${pendingReminders.length} pending connection(s) awaiting Day 4 reminder.`);

        let sentCount = 0;
        for (const conn of pendingReminders) {
            if (conn.tutor && conn.tutor.userId) {
                try {
                    const parentName = conn.parent?.fullName || 'A parent';
                    await createNotification({
                        userId: conn.tutor.userId,
                        targetRole: NOTIFICATION_TARGET_ROLES.TUTOR,
                        type: NOTIFICATION_TYPES.CONNECTION,
                        title: 'Pending Student Request Expiring Soon',
                        message: `Reminder: You have a pending connection request from ${parentName} that will expire in 3 days. Please accept or decline.`,
                        data: {
                            connectionId: conn.id,
                            status: Connection.STATUS.PENDING,
                            expiresInDays: 3,
                        },
                    });

                    conn.reminderSentAt = new Date();
                    await conn.save();
                    sentCount++;
                } catch (remErr) {
                    console.warn(`[ConnectionReminder] Failed to send reminder for connection ${conn.id}:`, remErr.message);
                }
            }
        }

        return { remindersSent: sentCount };
    } catch (err) {
        console.error('[ConnectionReminder] Error during sendPendingConnectionReminders:', err);
        return { remindersSent: 0, error: err.message };
    }
};

/**
 * Initialize background cron scheduler.
 * Runs once every hour ('0 * * * *').
 * Also runs immediately upon server boot to process any pending items.
 */
const initConnectionExpiryCron = () => {
    console.log('[ConnectionExpiry] Initializing 7-Day Connection Expiry & Refund scheduler...');

    // Run once on server startup (with small delay to allow DB sync to finish)
    setTimeout(async () => {
        try {
            await expireStaleConnections();
            await sendPendingConnectionReminders();
        } catch (bootErr) {
            console.warn('[ConnectionExpiry] Initial boot run note:', bootErr.message);
        }
    }, 5000);

    // Schedule cron to run every hour at minute 0: '0 * * * *'
    cron.schedule('0 * * * *', async () => {
        console.log('[ConnectionExpiry] Running hourly check for stale connection requests...');
        await expireStaleConnections();
        await sendPendingConnectionReminders();
    });

    console.log('[ConnectionExpiry] Scheduler registered. Running every hour (0 * * * *).');
};

module.exports = {
    expireStaleConnections,
    sendPendingConnectionReminders,
    initConnectionExpiryCron,
    EXPIRY_DAYS,
    REMINDER_DAYS,
};
