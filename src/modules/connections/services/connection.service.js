const { Connection, TutorProfile, ParentProfile, User } = require('../../users/models');
const walletService = require('../../wallet/services/wallet.service');
const { COIN_COSTS, TRANSACTION_TYPE } = require('../../wallet/constants/wallet.constants');
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

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
        where: { parentId, tutorId: tutor.id }
    });

    if (existingConnection) {
        throw new AppError('A connection request already exists between you and this tutor', 400);
    }

    // Atomically deduct 50 coins from parent's wallet
    await walletService.deductCoins(parent.userId, {
        amount: COIN_COSTS.PARENT_CONNECTION_COST,
        type: TRANSACTION_TYPE.SPEND_CONNECTION,
        referenceId: tutor.id,
        description: `Connection request to tutor`,
    });

    const connection = await Connection.create({
        parentId,
        tutorId: tutor.id,
        message,
        status: Connection.STATUS.PENDING
    });

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
    if (status === Connection.STATUS.REJECTED) {
        const parent = await ParentProfile.findByPk(connection.parentId);
        if (parent) {
            await walletService.refundCoins(parent.userId, {
                amount: COIN_COSTS.PARENT_CONNECTION_COST,
                referenceId: connection.id,
                description: 'Refund: Connection request rejected by tutor',
            });
        }
    }

    return connection;
};

module.exports = {
    requestConnection,
    getParentConnections,
    getTutorConnections,
    respondToConnection,
};
