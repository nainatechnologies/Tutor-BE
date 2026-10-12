const adminService = require('../services/admin.service');

/**
 * Controller to fetch all registration requests.
 * GET /api/admin/registration-requests?status=new|accepted|rejected&search=...
 */
const getRegistrationRequests = async (req, res, next) => {
    try {
        const result = await adminService.getRegistrationRequests(req.query);
        res.status(200).json({
            success: true,
            count: result.data.length,
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};


/**
 * Controller to update registration status (Accept or Reject).
 * PATCH /api/admin/registration-requests/:id
 */
const updateRegistrationStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updated = await adminService.updateRegistrationStatus(id, req.body);
        res.status(200).json({
            success: true,
            message: `Registration status updated to ${req.body.status}`,
            data: updated,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller for Admin to register a new Insource/Outsourced Tutor.
 * POST /api/admin/registration-requests or POST /api/admin/tutors
 */
const registerTutor = async (req, res, next) => {
    try {
        const newTutor = await adminService.registerTutorByAdmin(req.body);
        res.status(201).json({
            success: true,
            message: 'In-house tutor profile created and approved successfully!',
            data: newTutor,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRegistrationRequests,
    updateRegistrationStatus,
    registerTutor,
};
