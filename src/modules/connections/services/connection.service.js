const { Connection, TutorProfile, ParentProfile, User } = require('../../users/models');

const requestConnection = async (parentId, tutorId, message) => {
    // Check if tutor exists
    const tutor = await TutorProfile.findByPk(tutorId);
    if (!tutor) {
        throw new Error('Tutor not found');
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
        where: { parentId, tutorId }
    });

    if (existingConnection) {
        throw new Error('A connection request already exists between you and this tutor');
    }

    const connection = await Connection.create({
        parentId,
        tutorId,
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
        }]
    });
};

const getTutorConnections = async (tutorId) => {
    return await Connection.findAll({
        where: { tutorId },
        include: [{
            model: ParentProfile,
            as: 'parent',
            include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone'] }]
        }]
    });
};

const respondToConnection = async (connectionId, tutorId, status) => {
    const connection = await Connection.findOne({
        where: { id: connectionId, tutorId }
    });

    if (!connection) {
        throw new Error('Connection request not found');
    }

    if (connection.status !== Connection.STATUS.PENDING) {
        throw new Error('Connection request has already been processed');
    }

    connection.status = status;
    await connection.save();

    return connection;
};

module.exports = {
    requestConnection,
    getParentConnections,
    getTutorConnections,
    respondToConnection,
};
