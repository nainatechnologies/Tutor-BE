const { Op } = require('sequelize');
const { Complaint, User, ParentProfile, TutorProfile, Appointment } = require('../../users/models');
const AppError = require('../../../shared/utils/AppError');
const { COMPLAINT_CATEGORY } = require('../constants/complaint.constants');

const CATEGORY_LABEL_MAP = {
    [COMPLAINT_CATEGORY.TUTOR_BEHAVIOR]: 'Teaching Quality & Conduct',
    [COMPLAINT_CATEGORY.PAYMENT_COINS]: 'Payment & Coins Issue',
    [COMPLAINT_CATEGORY.TECHNICAL_ISSUE]: 'Technical Issue',
    [COMPLAINT_CATEGORY.SAFETY_CONCERN]: 'Child Safety & Harassment',
    [COMPLAINT_CATEGORY.OTHER]: 'General Grievance'
};

/**
 * 1. Submit a new complaint
 */
const createComplaint = async (reporterId, data) => {
    let targetUserId = data.reportedId || null;

    // If reportedId is provided, resolve whether it's a TutorProfile ID, ParentProfile ID, or a User ID
    if (targetUserId) {
        const tutor = await TutorProfile.findByPk(targetUserId);
        if (tutor && tutor.userId) {
            targetUserId = tutor.userId;
        } else {
            const parent = await ParentProfile.findByPk(targetUserId);
            if (parent && parent.userId) {
                targetUserId = parent.userId;
            } else {
                const user = await User.findByPk(targetUserId);
                if (!user) {
                    targetUserId = null;
                }
            }
        }
    }

    // Verify appointment if provided
    let appointmentId = data.appointmentId || null;
    if (appointmentId) {
        const apt = await Appointment.findByPk(appointmentId);
        if (!apt) {
            appointmentId = null;
        }
    }

    const complaint = await Complaint.create({
        reporterId,
        reportedId: targetUserId,
        appointmentId,
        category: data.category,
        priority: data.priority || 'MEDIUM',
        subject: data.subject.trim(),
        description: data.description.trim(),
        status: 'OPEN'
    });

    return complaint;
};

/**
 * 2. Get user's own filed complaints
 */
const getMyComplaints = async (userId) => {
    return await Complaint.findAll({
        where: { reporterId: userId },
        include: [
            {
                model: User,
                as: 'reportedUser',
                attributes: ['id', 'email', 'phone', 'role'],
                include: [
                    { model: TutorProfile, as: 'tutorProfile', attributes: ['id', 'fullName', 'avatarUrl'] },
                    { model: ParentProfile, as: 'parentProfile', attributes: ['id', 'fullName'] }
                ]
            },
            {
                model: Appointment,
                as: 'appointment'
            }
        ],
        order: [['createdAt', 'DESC']]
    });
};

/**
 * 3. Admin: Get paginated complaints with filtering
 */
const getAdminComplaints = async (query = {}) => {
    const { status = 'ALL', userType = 'ALL', search, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Map status filter
    if (status) {
        const upperStatus = status.toUpperCase();
        if (upperStatus === 'PENDING') {
            whereClause.status = { [Op.in]: ['OPEN', 'IN_PROGRESS'] };
        } else if (upperStatus !== 'ALL') {
            whereClause.status = upperStatus;
        }
    }

    // Search filter across subject and description
    if (search && search.trim().length > 0) {
        const term = `%${search.trim()}%`;
        whereClause[Op.or] = [
            { subject: { [Op.like]: term } },
            { description: { [Op.like]: term } }
        ];
    }

    // Reporter role filter (Parent vs Tutor)
    const reporterWhere = {};
    if (userType) {
        const upperUserType = userType.toUpperCase();
        if (upperUserType !== 'ALL') {
            reporterWhere.role = upperUserType;
        }
    }

    const { rows: complaints, count: total } = await Complaint.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: User,
                as: 'reporter',
                attributes: ['id', 'email', 'phone', 'role'],
                where: reporterWhere,
                include: [
                    { model: ParentProfile, as: 'parentProfile', attributes: ['fullName'] },
                    { model: TutorProfile, as: 'tutorProfile', attributes: ['fullName'] }
                ]
            },
            {
                model: User,
                as: 'reportedUser',
                attributes: ['id', 'email', 'phone', 'role'],
                include: [
                    { model: TutorProfile, as: 'tutorProfile', attributes: ['fullName'] },
                    { model: ParentProfile, as: 'parentProfile', attributes: ['fullName'] }
                ]
            },
            {
                model: Appointment,
                as: 'appointment'
            }
        ],
        distinct: true,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
    });

    // Format for Admin Panel table consumption
    const formatted = complaints.map(c => {
        const submittedBy = c.reporter?.parentProfile?.fullName || c.reporter?.tutorProfile?.fullName || c.reporter?.email || 'Anonymous User';
        const userRole = (c.reporter?.role || 'parent').toLowerCase();
        const against = c.reportedUser?.tutorProfile?.fullName || c.reportedUser?.parentProfile?.fullName || (c.reportedUser ? c.reportedUser.email : 'Platform / System');

        return {
            id: c.id,
            submittedBy,
            userType: userRole,
            againstUser: against,
            category: CATEGORY_LABEL_MAP[c.category] || c.category,
            rawCategory: c.category,
            subject: c.subject,
            description: c.description,
            priority: (c.priority || 'medium').toLowerCase(),
            status: c.status === 'OPEN' || c.status === 'IN_PROGRESS' ? 'pending' : c.status.toLowerCase(),
            rawStatus: c.status,
            resolutionNotes: c.resolutionNotes || '',
            createdDate: c.createdAt,
            lastUpdated: c.updatedAt
        };
    });

    return {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
        complaints: formatted
    };
};

/**
 * 4. Admin: Update complaint status
 */
const updateComplaintStatus = async (id, { status, resolutionNotes }) => {
    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
        throw new AppError('Complaint not found', 404);
    }

    const updates = {};
    if (status) {
        updates.status = status;
    }
    if (resolutionNotes !== undefined) {
        updates.resolutionNotes = resolutionNotes;
    }

    await complaint.update(updates);
    return complaint;
};

module.exports = {
    createComplaint,
    getMyComplaints,
    getAdminComplaints,
    updateComplaintStatus
};
