const { Op } = require('sequelize');
const {
    Appointment,
    ParentProfile,
    TutorProfile,
    ChildProfile,
    User,
    Subject,
} = require('../../users/models');
const AppError = require('../../../shared/utils/AppError');
const { createNotification } = require('../../notifications/services/notification.service');
const { NOTIFICATION_TYPES, NOTIFICATION_TARGET_ROLES } = require('../../../shared/constants/notificationConstants');

/**
 * Create a new appointment booking (by Parent)
 */
const createAppointment = async (userId, data) => {
    // 1. Validate parent profile
    const parent = await ParentProfile.findOne({ where: { userId } });
    if (!parent) {
        throw new AppError('Only registered parents can book appointments', 403);
    }

    // 2. Validate tutor profile
    const tutor = await TutorProfile.findByPk(data.tutorId);
    if (!tutor) {
        throw new AppError('Tutor not found', 404);
    }

    // 3. Validate child if provided
    if (data.childId) {
        const child = await ChildProfile.findOne({
            where: { id: data.childId, parentId: parent.id },
        });
        if (!child) {
            throw new AppError('Child profile not found for this parent', 400);
        }
    }

    // 4. Validate subject if provided
    if (data.subjectId) {
        const subject = await Subject.findByPk(data.subjectId);
        if (!subject) {
            throw new AppError('Selected subject does not exist', 400);
        }
    }

    // 5. Create the appointment
    const appointment = await Appointment.create({
        parentId: parent.id,
        tutorId: data.tutorId,
        childId: data.childId || null,
        subjectId: data.subjectId || null,
        scheduledDate: new Date(data.scheduledDate),
        durationMinutes: data.durationMinutes || 60,
        mode: data.mode || 'ONLINE',
        meetingLink: data.meetingLink || null,
        notes: data.notes || null,
        status: 'REQUESTED',
    });

    // Notify Tutor
    if (tutor.userId) {
        createNotification({
            userId: tutor.userId,
            targetRole: NOTIFICATION_TARGET_ROLES.TUTOR,
            type: NOTIFICATION_TYPES.APPOINTMENT,
            title: 'New Session Requested',
            message: `${parent.fullName || 'A parent'} requested a new tutoring session.`,
            data: { appointmentId: appointment.id },
        }).catch(err => console.warn('Notification trigger error:', err.message));
    }

    return await getAppointmentDetailsById(appointment.id);
};

/**
 * Helper to fetch complete appointment with associations
 */
const getAppointmentDetailsById = async (id) => {
    return await Appointment.findByPk(id, {
        include: [
            {
                model: TutorProfile,
                as: 'tutor',
                include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone'] }],
            },
            {
                model: ParentProfile,
                as: 'parent',
                include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone'] }],
            },
            { model: ChildProfile, as: 'child' },
            { model: Subject, as: 'subject' },
        ],
    });
};

/**
 * Get appointments for logged in parent or tutor
 */
const getUserAppointments = async (user, filters = {}) => {
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const whereClause = {};

    const role = (user.role || '').toUpperCase();
    if (role === 'PARENT') {
        const parent = await ParentProfile.findOne({ where: { userId: user.id } });
        if (!parent) throw new AppError('Parent profile not found', 404);
        whereClause.parentId = parent.id;
    } else if (role === 'TUTOR') {
        const tutor = await TutorProfile.findOne({ where: { userId: user.id } });
        if (!tutor) throw new AppError('Tutor profile not found', 404);
        whereClause.tutorId = tutor.id;
    } else {
        throw new AppError('Unauthorized role for this endpoint', 403);
    }

    if (filters.status) {
        whereClause.status = filters.status;
    }
    if (filters.mode) {
        whereClause.mode = filters.mode;
    }

    const { count, rows } = await Appointment.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['scheduledDate', 'DESC']],
        include: [
            {
                model: TutorProfile,
                as: 'tutor',
                include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone'] }],
            },
            {
                model: ParentProfile,
                as: 'parent',
                include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone'] }],
            },
            { model: ChildProfile, as: 'child' },
            { model: Subject, as: 'subject' },
        ],
    });

    return {
        appointments: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

/**
 * Get single appointment by ID
 */
const getAppointmentById = async (id, user) => {
    const appointment = await getAppointmentDetailsById(id);
    if (!appointment) {
        throw new AppError('Appointment not found', 404);
    }

    // Role verification
    const isAdmin = user.role === 'admin' || user.role === 'ADMIN';
    const isOwnerParent = appointment.parent?.userId === user.id;
    const isOwnerTutor = appointment.tutor?.userId === user.id;

    if (!isAdmin && !isOwnerParent && !isOwnerTutor) {
        throw new AppError('You do not have access to this appointment', 403);
    }

    return appointment;
};

/**
 * Update appointment status (confirm, cancel, complete, reschedule)
 */
const updateAppointmentStatus = async (id, user, updateData) => {
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
        throw new AppError('Appointment not found', 404);
    }

    const isAdmin = user.role === 'admin' || user.role === 'ADMIN';
    const parent = await ParentProfile.findOne({ where: { userId: user.id } });
    const tutor = await TutorProfile.findOne({ where: { userId: user.id } });

    const isParent = parent && appointment.parentId === parent.id;
    const isTutor = tutor && appointment.tutorId === tutor.id;

    if (!isAdmin && !isParent && !isTutor) {
        throw new AppError('Unauthorized to update this appointment', 403);
    }

    // Validations based on role
    if (isParent && !isAdmin) {
        if (updateData.status && !['CANCELLED'].includes(updateData.status)) {
            throw new AppError('Parents can only cancel appointments', 400);
        }
    }

    const previousStatus = appointment.status;

    if (updateData.status) {
        appointment.status = updateData.status;
    }
    if (updateData.scheduledDate) {
        appointment.scheduledDate = new Date(updateData.scheduledDate);
    }
    if (updateData.durationMinutes) {
        appointment.durationMinutes = updateData.durationMinutes;
    }
    if (updateData.meetingLink !== undefined) {
        appointment.meetingLink = updateData.meetingLink;
    }
    if (updateData.notes !== undefined) {
        appointment.notes = updateData.notes;
    }

    await appointment.save();

    // Increment completed sessions counter if changed to COMPLETED
    if (updateData.status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
        await TutorProfile.increment('sessionsCompleted', {
            by: 1,
            where: { id: appointment.tutorId },
        });
    }

    // Notify Parent on appointment status update
    if (updateData.status && updateData.status !== previousStatus) {
        ParentProfile.findByPk(appointment.parentId).then(parent => {
            if (parent && parent.userId) {
                createNotification({
                    userId: parent.userId,
                    targetRole: NOTIFICATION_TARGET_ROLES.PARENT,
                    type: NOTIFICATION_TYPES.APPOINTMENT,
                    title: `Session ${updateData.status.toLowerCase()}`,
                    message: `Your tutoring session status is now ${updateData.status}.`,
                    data: { appointmentId: appointment.id, status: updateData.status },
                }).catch(() => {});
            }
        }).catch(() => {});
    }

    return await getAppointmentDetailsById(appointment.id);
};

/**
 * Get all appointments for Admin with rich search, filter, and pagination
 */
const getAdminAppointments = async (query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (query.status && query.status !== 'all' && query.status !== 'ALL') {
        whereClause.status = query.status.toUpperCase();
    }

    if (query.mode && query.mode !== 'all' && query.mode !== 'ALL') {
        whereClause.mode = query.mode.toUpperCase();
    }

    if (query.search && query.search.trim() !== '') {
        const searchTerm = `%${query.search.trim()}%`;
        whereClause[Op.or] = [
            { id: { [Op.like]: searchTerm } },
            { notes: { [Op.like]: searchTerm } },
            { '$tutor.fullName$': { [Op.like]: searchTerm } },
            { '$parent.fullName$': { [Op.like]: searchTerm } },
            { '$child.name$': { [Op.like]: searchTerm } },
            { '$subject.name$': { [Op.like]: searchTerm } },
        ];
    }

    const { count, rows } = await Appointment.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['scheduledDate', 'DESC']],
        include: [
            {
                model: TutorProfile,
                as: 'tutor',
                include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone'] }],
            },
            {
                model: ParentProfile,
                as: 'parent',
                include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone'] }],
            },
            { model: ChildProfile, as: 'child' },
            { model: Subject, as: 'subject' },
        ],
    });

    // Format appointments for Admin table compatibility
    const formatted = rows.map((apt) => {
        const dateObj = new Date(apt.scheduledDate);
        const dateStr = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const timeStr = dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        // Determine readable status for Admin UI
        let displayStatus = 'Upcoming';
        if (apt.status === 'COMPLETED') displayStatus = 'Completed';
        else if (apt.status === 'CANCELLED') displayStatus = 'Cancelled';
        else if (apt.status === 'REQUESTED') displayStatus = 'Requested';
        else if (apt.status === 'CONFIRMED') displayStatus = 'Upcoming';

        return {
            id: apt.id,
            parent: apt.child?.name || apt.parent?.fullName || 'Parent',
            parentName: apt.parent?.fullName || 'Parent',
            parentEmail: apt.parent?.user?.email || '',
            parentPhone: apt.parent?.user?.phone || '',
            tutor: apt.tutor?.fullName || 'Tutor',
            tutorName: apt.tutor?.fullName || 'Tutor',
            tutorEmail: apt.tutor?.user?.email || '',
            tutorPhone: apt.tutor?.user?.phone || '',
            service: apt.subject?.name || 'General Session',
            date: dateStr,
            time: timeStr,
            scheduledDate: apt.scheduledDate,
            durationMinutes: apt.durationMinutes,
            mode: apt.mode === 'ONLINE' ? 'Online' : 'Offline',
            rawStatus: apt.status,
            status: displayStatus,
            meetingLink: apt.meetingLink,
            notes: apt.notes,
            child: apt.child,
            createdAt: apt.createdAt,
        };
    });

    return {
        appointments: formatted,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

/**
 * Admin update appointment
 */
const updateAppointmentByAdmin = async (id, updateData) => {
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
        throw new AppError('Appointment not found', 404);
    }

    const previousStatus = appointment.status;

    if (updateData.status) {
        // Map UI status like 'Upcoming', 'Completed', 'Cancelled', 'Requested' to ENUM
        let enumStatus = updateData.status.toUpperCase();
        if (enumStatus === 'UPCOMING') enumStatus = 'CONFIRMED';
        appointment.status = enumStatus;
    }
    if (updateData.meetingLink !== undefined) {
        appointment.meetingLink = updateData.meetingLink;
    }
    if (updateData.notes !== undefined) {
        appointment.notes = updateData.notes;
    }
    if (updateData.scheduledDate) {
        appointment.scheduledDate = new Date(updateData.scheduledDate);
    }

    await appointment.save();

    if (appointment.status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
        await TutorProfile.increment('sessionsCompleted', {
            by: 1,
            where: { id: appointment.tutorId },
        });
    }

    return await getAppointmentDetailsById(appointment.id);
};

module.exports = {
    createAppointment,
    getUserAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    getAdminAppointments,
    updateAppointmentByAdmin,
};
