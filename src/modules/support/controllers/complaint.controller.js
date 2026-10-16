const complaintService = require('../services/complaint.service');

// 1. Submit a complaint
const createComplaint = async (req, res, next) => {
    try {
        const complaint = await complaintService.createComplaint(req.user.id, req.body);
        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully. Our support team will review it.',
            data: complaint
        });
    } catch (error) {
        next(error);
    }
};

// 2. Get my complaints
const getMyComplaints = async (req, res, next) => {
    try {
        const complaints = await complaintService.getMyComplaints(req.user.id);
        res.status(200).json({
            success: true,
            data: complaints
        });
    } catch (error) {
        next(error);
    }
};

// 3. Admin: Get all complaints
const getAdminComplaints = async (req, res, next) => {
    try {
        const result = await complaintService.getAdminComplaints(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// 4. Admin: Update complaint status
const updateComplaintStatus = async (req, res, next) => {
    try {
        const updated = await complaintService.updateComplaintStatus(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: 'Complaint status updated successfully',
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createComplaint,
    getMyComplaints,
    getAdminComplaints,
    updateComplaintStatus
};
