const { Connection, TutorProfile, ParentProfile, User } = require('../../users/models');
const walletService = require('../../wallet/services/wallet.service');
const { COIN_COSTS, TRANSACTION_TYPE } = require('../../wallet/constants/wallet.constants');
const { createNotification } = require('../../notifications/services/notification.service');
const { NOTIFICATION_TYPES, NOTIFICATION_TARGET_ROLES } = require('../../../shared/constants/notificationConstants');
const AppError = require('../../../shared/utils/AppError');

const requestConnection = async (parentId, tutorId, message) => {
    // Check if parent exists
    const parent = await ParentProfile.findByPk(parentId);
    if (!parent) {
        throw new AppError('Parent profile not found', 404);
    }

    // Check if tutor exists (support tutor profile ID or user ID)
    let tutor = await TutorProfile.findByPk(tutorId);
    if (!tutor) {
        tutor = await TutorProfile.findOne({ where: { userId: tutorId } });
    }
    if (!tutor) {
        throw new AppError('Tutor not found', 404);
    }

    // Check if an existing connection exists
    let connection = await Connection.findOne({
        where: { parentId, tutorId: tutor.id }
    });

    if (connection) {
        if (connection.status === Connection.STATUS.PENDING) {
            throw new AppError('You have already sent a connection request to this tutor. It is currently pending their approval.', 400);
        }
        if (connection.status === Connection.STATUS.ACCEPTED) {
            throw new AppError('You are already connected with this tutor. You can message them directly.', 400);
        }

        // If previously REJECTED, allow parent to submit a new request
        await walletService.deductCoins(parent.userId, {
            amount: COIN_COSTS.PARENT_CONNECTION_COST,
            type: TRANSACTION_TYPE.SPEND_CONNECTION,
            referenceId: tutor.id,
            description: `Connection request to tutor`,
        });

        connection.status = Connection.STATUS.PENDING;
        connection.message = message;
        await connection.save();
    } else {
        // Atomically deduct 50 coins from parent's wallet
        await walletService.deductCoins(parent.userId, {
            amount: COIN_COSTS.PARENT_CONNECTION_COST,
            type: TRANSACTION_TYPE.SPEND_CONNECTION,
            referenceId: tutor.id,
            description: `Connection request to tutor`,
        });

        connection = await Connection.create({
            parentId,
            tutorId: tutor.id,
            message,
            status: Connection.STATUS.PENDING
        });
    }

    // Notify tutor of new connection request
    try {
        await createNotification({
            userId: tutor.userId,
            targetRole: NOTIFICATION_TARGET_ROLES.TUTOR,
            type: NOTIFICATION_TYPES.CONNECTION,
            title: 'New Connection Request',
            message: 'A parent has sent you a connection request.',
            data: { connectionId: connection.id, parentId: parent.id },
        });
    } catch (e) {
        console.warn('Failed to dispatch connection notification to tutor:', e?.message);
    }

    return connection;
};


const getParentConnections = async (parentId) => {
    return await Connection.findAll({
        where: { parentId },
        include: [{
            model: TutorProfile,
            as: 'tutor',
            include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone'] }]
        }],
        order: [['createdAt', 'DESC']]
    });
};

const getTutorConnections = async (tutorProfileOrUserId) => {
    let tutor = await TutorProfile.findByPk(tutorProfileOrUserId);
    if (!tutor) {
        tutor = await TutorProfile.findOne({ where: { userId: tutorProfileOrUserId } });
    }
    const tutorId = tutor ? tutor.id : tutorProfileOrUserId;
    return await Connection.findAll({
        where: { tutorId },
        include: [{
            model: ParentProfile,
            as: 'parent',
            include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone'] }]
        }],
        order: [['createdAt', 'DESC']]
    });
};

const respondToConnection = async (connectionId, tutorId, status) => {
    const connection = await Connection.findOne({
        where: { id: connectionId, tutorId }
    });

    if (!connection) {
        throw new AppError('Connection request not found', 404);
    }

    if (connection.status !== Connection.STATUS.PENDING) {
        throw new AppError('Connection request has already been processed', 400);
    }

    connection.status = status;
    await connection.save();

    // If tutor rejects, automatically refund 50 coins back to parent
    const parent = await ParentProfile.findByPk(connection.parentId);
    if (status === Connection.STATUS.REJECTED && parent) {
        await walletService.refundCoins(parent.userId, {
            amount: COIN_COSTS.PARENT_CONNECTION_COST,
            referenceId: connection.id,
            description: 'Refund: Connection request rejected by tutor',
        });
    }

    // Notify parent of connection response
    try {
        if (parent && parent.userId) {
            const isAccepted = status === Connection.STATUS.ACCEPTED;
            await createNotification({
                userId: parent.userId,
                targetRole: NOTIFICATION_TARGET_ROLES.PARENT,
                type: NOTIFICATION_TYPES.CONNECTION,
                title: isAccepted ? 'Connection Request Accepted' : 'Connection Request Declined',
                message: isAccepted
                    ? 'The tutor accepted your connection request.'
                    : 'The tutor declined your connection request. Your coins have been refunded.',
                data: { connectionId: connection.id, status },
            });
        }
    } catch (e) {
        console.warn('Failed to dispatch connection response notification:', e?.message);
    }

    return connection;
};

module.exports = {
    requestConnection,
    getParentConnections,
    getTutorConnections,
    respondToConnection,
};
