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

/**
 * Controller to fetch aggregated Admin Dashboard KPIs.
 * GET /api/admin/dashboard/stats
 */
const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await adminService.getDashboardStats();
        res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch class connection requests.
 * GET /api/admin/leads?page=1&limit=10&status=...&search=...
 */
const getAdminLeads = async (req, res, next) => {
    try {
        const result = await adminService.getAdminLeads(req.query);
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
 * Controller to fetch platform payment transactions.
 * GET /api/admin/payments?page=1&limit=15
 */
const getAdminPayments = async (req, res, next) => {
    try {
        const result = await adminService.getAdminPayments(req.query);
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
 * Controller to fetch parent & child registrations.
 * GET /api/admin/parent-registrations
 */
const getParentRegistrations = async (req, res, next) => {
    try {
        const result = await adminService.getParentRegistrations(req.query);
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
 * Controller to get Admin & Business Profile.
 * GET /api/admin/profile
 */
const getAdminProfile = async (req, res, next) => {
    try {
        const profile = await adminService.getAdminProfile(req.user?.id);
        res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to update Admin & Business Profile.
 * PUT /api/admin/profile
 */
const updateAdminProfile = async (req, res, next) => {
    try {
        const profile = await adminService.updateAdminProfile(req.user?.id, req.body);
        res.status(200).json({
            success: true,
            message: 'Admin profile updated successfully',
            data: profile,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch dynamic revenue analytics.
 * GET /api/admin/revenue/analytics
 */
const getRevenueAnalytics = async (req, res, next) => {
    try {
        const analytics = await adminService.getRevenueAnalytics(req.query);
        res.status(200).json({
            success: true,
            data: analytics,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRegistrationRequests,
    updateRegistrationStatus,
    registerTutor,
    getDashboardStats,
    getAdminLeads,
    getAdminPayments,
    getParentRegistrations,

    getAdminProfile,
    updateAdminProfile,
    getRevenueAnalytics,
};

