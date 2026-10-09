const connectionService = require('../services/connection.service');
const { connectionRequestSchema, updateConnectionSchema } = require('../validators/connection.validator');
const { ParentProfile, TutorProfile } = require('../../users/models');

const manageConnection = async (req, res) => {
    try {
        const { connectionId, tutorId, message, status } = req.body;

        if (!connectionId) {
            // New connection request
            const parent = await ParentProfile.findOne({ where: { userId: req.user.id } });
            if (!parent) return res.status(403).json({ success: false, message: 'Only parents can send connection requests' });
            
            const connection = await connectionService.requestConnection(parent.id, tutorId, message);
            return res.status(201).json({ success: true, data: connection });
        } else {
            // Respond to existing request
            const tutor = await TutorProfile.findOne({ where: { userId: req.user.id } });
            if (!tutor) return res.status(403).json({ success: false, message: 'Only tutors can respond to connection requests' });
            
            const connection = await connectionService.respondToConnection(connectionId, tutor.id, status);
            return res.status(200).json({ success: true, data: connection });
        }
    } catch (error) {
        return res.status(400).json({ success: false, message: error.errors || error.message });
    }
};

const getMyConnections = async (req, res) => {
    try {
        if (req.user.role === 'PARENT') {
            const parent = await ParentProfile.findOne({ where: { userId: req.user.id } });
            if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });
            
            const connections = await connectionService.getParentConnections(parent.id);
            return res.status(200).json({ success: true, data: connections });
        } else if (req.user.role === 'TUTOR') {
            const tutor = await TutorProfile.findOne({ where: { userId: req.user.id } });
            if (!tutor) return res.status(404).json({ success: false, message: 'Tutor profile not found' });
            
            const connections = await connectionService.getTutorConnections(tutor.id);
            return res.status(200).json({ success: true, data: connections });
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized role' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch connections' });
    }
};



module.exports = {
    manageConnection,
    getMyConnections
};
