const appointmentService = require('../services/appointment.service');

const createAppointment = async (req, res, next) => {
    try {
        const appointment = await appointmentService.createAppointment(req.user.id, req.body);
        return res.status(201).json({
            success: true,
            message: 'Session booked successfully',
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

const getMyAppointments = async (req, res, next) => {
    try {
        const result = await appointmentService.getUserAppointments(req.user, req.query);
        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

const getAppointmentById = async (req, res, next) => {
    try {
        const appointment = await appointmentService.getAppointmentById(req.params.id, req.user);
        return res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

const updateAppointmentStatus = async (req, res, next) => {
    try {
        const appointment = await appointmentService.updateAppointmentStatus(
            req.params.id,
            req.user,
            req.body
        );
        return res.status(200).json({
            success: true,
            message: 'Appointment updated successfully',
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

const getAdminAppointments = async (req, res, next) => {
    try {
        const result = await appointmentService.getAdminAppointments(req.query);
        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

const updateAppointmentByAdmin = async (req, res, next) => {
    try {
        const appointment = await appointmentService.updateAppointmentByAdmin(
            req.params.id,
            req.body
        );
        return res.status(200).json({
            success: true,
            message: 'Appointment status updated successfully',
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createAppointment,
    getMyAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    getAdminAppointments,
    updateAppointmentByAdmin,
};
