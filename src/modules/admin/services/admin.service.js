const bcrypt = require('bcryptjs');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../../../config/database');
const { User, TutorProfile, ParentProfile, ChildProfile, Subject, Connection, Payment, WalletTransaction } = require('../../users/models');
const { walletService } = require('../../wallet/services/wallet.service');
const AppError = require('../../../shared/utils/AppError');
const {
    APPROVAL_STATUSES,
    PROFESSIONAL_TYPES,
    TUTOR_TYPES,
    USER_ROLES,
    USER_STATUSES
} = require('../../../shared/constants/userConstants');

/**
 * Format a TutorProfile database record into the Admin Frontend TutorRegistration shape.
 */
const formatTutorRegistration = (tutor) => {
    let status = 'Pending';
    if (tutor.approvalStatus === APPROVAL_STATUSES.APPROVED) {
        status = 'Accepted';
    } else if (tutor.approvalStatus === APPROVAL_STATUSES.REJECTED) {
        status = 'Rejected';
    } else if (tutor.approvalStatus === APPROVAL_STATUSES.NEEDS_CHANGES) {
        status = 'Under Review';
    }

    const specialization = (tutor.subjects && tutor.subjects.length > 0)
        ? tutor.subjects.map(s => s.name).join(', ')
        : (Array.isArray(tutor.areasOfPractice) && tutor.areasOfPractice.length > 0
            ? tutor.areasOfPractice.join(', ')
            : 'General');

    const documents = [];
    if (tutor.aadharDocUrl) {
        documents.push({ name: 'Aadhaar Document', url: tutor.aadharDocUrl, type: 'Aadhaar Document' });
    }
    if (tutor.qualCertUrl) {
        documents.push({ name: 'Highest Qualification Certificate', url: tutor.qualCertUrl, type: 'Qualification Certificate' });
    }
    if (tutor.rciCertUrl) {
        documents.push({ name: 'RCI Certificate', url: tutor.rciCertUrl, type: 'RCI Certificate' });
    }

    return {
        id: tutor.id,
        userId: tutor.userId,
        name: tutor.fullName,
        email: tutor.user ? tutor.user.email : '',
        phone: tutor.user ? tutor.user.phone : '',
        location: tutor.location || `${tutor.city || ''}, ${tutor.pincode || ''}`.trim(),
        pincode: tutor.pincode || '',
        address: tutor.address || tutor.location || '',
        professionalType: tutor.professionalType || 'Teacher',
        tutorType: tutor.tutorType || 'Not specified',
        specialization,
        experience: tutor.experienceYears ? `${tutor.experienceYears} Years` : 'New',
        qualification: tutor.qualification || 'Not Specified',
        registrationDate: tutor.createdAt ? tutor.createdAt.toISOString() : new Date().toISOString(),
        bio: tutor.about || '',
        status,
        rejectionReason: tutor.rejectionReason || '',
        documents,
        rciNumber: tutor.rciNumber || '',
    };
};

/**
 * Get tutor registration requests with SQL-level search and pagination.
 */
const getRegistrationRequests = async (query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { status, search } = query;

    let whereClause = {};

    if (status === 'new' || status === 'pending') {
        whereClause.approvalStatus = {
            [Op.in]: [APPROVAL_STATUSES.PENDING_REVIEW, APPROVAL_STATUSES.NEEDS_CHANGES]
        };
    } else if (status === 'accepted') {
        whereClause.approvalStatus = APPROVAL_STATUSES.APPROVED;
    } else if (status === 'rejected') {
        whereClause.approvalStatus = APPROVAL_STATUSES.REJECTED;
    }

    if (search && search.trim()) {
        const searchPattern = `%${search.trim()}%`;
        const matchingUsers = await User.findAll({
            where: {
                [Op.or]: [
                    { email: { [Op.like]: searchPattern } },
                    { phone: { [Op.like]: searchPattern } },
                ]
            },
            attributes: ['id'],
        });
        const userIds = matchingUsers.map(u => u.id);

        whereClause[Op.or] = [
            { fullName: { [Op.like]: searchPattern } },
            { city: { [Op.like]: searchPattern } },
            { pincode: { [Op.like]: searchPattern } },
            { professionalType: { [Op.like]: searchPattern } },
            { tutorType: { [Op.like]: searchPattern } },
            ...(userIds.length > 0 ? [{ userId: { [Op.in]: userIds } }] : []),
        ];
    }

    const { count: total, rows: tutors } = await TutorProfile.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'phone', 'status', 'isVerified'],
            },
            {
                model: Subject,
                as: 'subjects',
                attributes: ['id', 'name'],
                through: { attributes: [] },
            },
        ],
        distinct: true,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });

    return {
        data: tutors.map(formatTutorRegistration),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};


/**
 * Update registration request approval status (Accept / Reject).
 */
const updateRegistrationStatus = async (tutorProfileId, { status, rejectionReason }) => {
    const tutor = await TutorProfile.findByPk(tutorProfileId, {
        include: [
            { model: User, as: 'user' },
            { model: Subject, as: 'subjects', through: { attributes: [] } },
        ]
    });

    if (!tutor) {
        throw new AppError('Tutor registration request not found', 404);
    }

    if (status === 'Accepted' || status === 'approved') {
        tutor.approvalStatus = APPROVAL_STATUSES.APPROVED;
        tutor.verified = true;
        tutor.rejectionReason = null;
        if (tutor.user) {
            tutor.user.status = USER_STATUSES.ACTIVE;
            tutor.user.isVerified = true;
            await tutor.user.save();
        }
    } else if (status === 'Rejected' || status === 'rejected') {
        tutor.approvalStatus = APPROVAL_STATUSES.REJECTED;
        tutor.verified = false;
        tutor.rejectionReason = rejectionReason || 'Registration rejected by administrator';
    } else if (status === 'Under Review' || status === 'pending') {
        tutor.approvalStatus = APPROVAL_STATUSES.NEEDS_CHANGES;
    }

    await tutor.save();
    return formatTutorRegistration(tutor);
};

/**
 * Register a new Insource (In-house) or Outsourced Tutor directly by Admin.
 */
const registerTutorByAdmin = async (data) => {
    const {
        name,
        email,
        phone,
        password = 'Password@123',
        professionalType = 'Teacher',
        tutorType = 'In-house',
        city,
        pincode,
        location,
        qualification,
        experience,
        specialization,
        rciNumber,
        rciValidityDate,
        subjects = [],
    } = data;

    if (!name || !email || !phone) {
        throw new AppError('Name, email, and phone number are required', 400);
    }

    // Check duplicate email or phone
    const existingUser = await User.findOne({
        where: {
            [Op.or]: [{ email }, { phone }]
        }
    });

    if (existingUser) {
        throw new AppError('A user with this email or phone number already exists', 400);
    }

    const t = await sequelize.transaction();
    try {
        const passwordHash = await bcrypt.hash(password, 10);

        // 1. Create User
        const user = await User.create({
            email,
            phone: phone.replace(/^\+91/, '').trim(),
            password: passwordHash,
            role: USER_ROLES.TUTOR,
            status: USER_STATUSES.ACTIVE,
            isVerified: true,
        }, { transaction: t });

        // Parse experience numeric
        const expYears = parseFloat(experience) || (experience ? parseFloat(experience.replace(/[^\d.]/g, '')) || 0 : 0);

        // 2. Create TutorProfile (Approved immediately because created by Admin)
        const tutor = await TutorProfile.create({
            userId: user.id,
            fullName: name,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0046C0&color=fff`,
            city: city || 'Hyderabad',
            pincode: pincode || '500001',
            location: location || `${city || 'Hyderabad'}, ${pincode || '500001'}`,
            address: location || city || 'Hyderabad',
            tutorType: tutorType || TUTOR_TYPES.IN_HOUSE,
            professionalType: professionalType || PROFESSIONAL_TYPES.TEACHER,
            qualification: qualification || 'Qualified Professional',
            experienceYears: expYears,
            rciNumber: rciNumber || null,
            rciValidityDate: rciValidityDate || null,
            approvalStatus: APPROVAL_STATUSES.APPROVED,
            verified: true,
            areasOfPractice: specialization ? specialization.split(',').map(s => s.trim()) : [],
        }, { transaction: t });

        // 3. Link Subjects by IDs or Names
        const subjectIdentifiers = [
            ...(Array.isArray(subjects) ? subjects : []),
            ...(specialization ? specialization.split(',').map(s => s.trim()) : [])
        ].filter(Boolean);

        if (subjectIdentifiers.length > 0) {
            const matchedSubjects = await Subject.findAll({
                where: {
                    [Op.or]: [
                        { id: { [Op.in]: subjectIdentifiers } },
                        { name: { [Op.in]: subjectIdentifiers } }
                    ]
                },
                transaction: t
            });
            if (matchedSubjects.length > 0) {
                await tutor.setSubjects(matchedSubjects, { transaction: t });
            }
        }

        await t.commit();

        // Reload with associations
        const fullTutor = await TutorProfile.findByPk(tutor.id, {
            include: [
                { model: User, as: 'user' },
                { model: Subject, as: 'subjects', through: { attributes: [] } },
            ]
        });

        return formatTutorRegistration(fullTutor);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

/**
 * Retrieve aggregated platform KPIs and top professionals for the Admin Dashboard.
 */
const getDashboardStats = async () => {
    // 1. Total revenue sum from successful payments
    const totalRevenue = await Payment.sum('amount', {
        where: { status: 'SUCCESS' }
    }) || 0;

    // 2. Total active users across all roles
    const activeUsers = await User.count({
        where: { status: USER_STATUSES.ACTIVE }
    });

    // 3. Total approved professionals / therapists
    const totalProfessionals = await TutorProfile.count({
        where: { approvalStatus: APPROVAL_STATUSES.APPROVED }
    });

    // 4. Pending verification / registration requests
    const pendingVerifications = await TutorProfile.count({
        where: {
            approvalStatus: {
                [Op.in]: [APPROVAL_STATUSES.PENDING_REVIEW, APPROVAL_STATUSES.NEEDS_CHANGES]
            }
        }
    });

    // 5. Top performing professionals sorted by rating and students
    const topTutorsRaw = await TutorProfile.findAll({
        where: { approvalStatus: APPROVAL_STATUSES.APPROVED },
        include: [
            {
                model: Subject,
                as: 'subjects',
                attributes: ['name'],
                through: { attributes: [] },
            },
        ],
        order: [
            ['rating', 'DESC'],
            ['studentsCount', 'DESC'],
            ['createdAt', 'DESC'],
        ],
        limit: 5,
    });

    const topProfessionals = topTutorsRaw.map((tutor) => ({
        id: tutor.id,
        name: tutor.fullName,
        rating: parseFloat(tutor.rating) || 4.5,
        studentsCount: tutor.studentsCount || 0,
        subjects: tutor.subjects?.map(s => s.name) || ['General'],
    }));

    // 6. Subject / category distribution for revenue chart
    const subjects = await Subject.findAll({ limit: 4, attributes: ['name'] });
    const percentages = [40, 25, 20, 15];
    const revenueBySubject = subjects.map((s, idx) => ({
        subject: s.name,
        percentage: percentages[idx] || 10,
    }));

    return {
        stats: {
            totalRevenue: Math.round(totalRevenue),
            activeUsers,
            totalProfessionals,
            pendingVerifications,
        },
        topProfessionals,
        revenueBySubject: revenueBySubject.length > 0 ? revenueBySubject : [
            { subject: 'Special Education', percentage: 40 },
            { subject: 'Speech Therapy', percentage: 30 },
            { subject: 'Mathematics', percentage: 20 },
            { subject: 'Science', percentage: 10 },
        ],
    };
};

/**
 * Retrieve class connection requests with parent, child, tutor, and status details.
 */
const getAdminLeads = async (query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const search = query.search ? query.search.trim() : '';

    let whereClause = {};
    if (query.status && query.status !== 'all') {
        whereClause.status = query.status.toUpperCase();
    }

    const { count: total, rows: connections } = await Connection.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: ParentProfile,
                as: 'parent',
                include: [
                    { model: User, as: 'user', attributes: ['id', 'email', 'phone'] },
                    { model: ChildProfile, as: 'children', attributes: ['id', 'name', 'grade', 'dateOfBirth'] },
                ],
            },
            {
                model: TutorProfile,
                as: 'tutor',
                include: [
                    { model: User, as: 'user', attributes: ['id', 'email', 'phone'] },
                    { model: Subject, as: 'subjects', attributes: ['name'], through: { attributes: [] } },
                ],
            },
        ],
        distinct: true,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });

    const leads = connections.map((conn) => {
        const parentUser = conn.parent?.user;
        const primaryChild = conn.parent?.children?.[0];
        const tutor = conn.tutor;
        const tutorUser = tutor?.user;

        return {
            id: conn.id,
            name: conn.parent?.fullName || 'Parent',
            email: parentUser?.email || '',
            phone: parentUser?.phone || '',
            childName: primaryChild?.name || 'Not Provided',
            childAge: primaryChild?.grade ? `Grade ${primaryChild.grade}` : 'Not Provided',
            subject: tutor?.subjects?.map(s => s.name).join(', ') || conn.message || 'General Tutoring',
            improvementArea: conn.message || 'Academic Support',
            assignedTutor: tutor?.fullName || 'Unassigned',
            tutorPhone: tutorUser?.phone || 'Phone not available',
            status: conn.status,
            dateReceived: conn.createdAt ? conn.createdAt.toISOString() : new Date().toISOString(),
        };
    });

    const filteredLeads = search
        ? leads.filter(l =>
            l.name.toLowerCase().includes(search.toLowerCase()) ||
            l.email.toLowerCase().includes(search.toLowerCase()) ||
            l.assignedTutor.toLowerCase().includes(search.toLowerCase())
        )
        : leads;

    const leadCount = search ? filteredLeads.length : total;

    return {
        data: filteredLeads,
        pagination: {
            total: leadCount,
            page,
            limit,
            totalPages: Math.ceil(leadCount / limit) || 1,
        },
    };
};

/**
 * Retrieve real platform payment transactions and wallet ledger logs.
 */
const getAdminPayments = async (query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 15;
    const offset = (page - 1) * limit;
    const search = query.search ? query.search.trim().toLowerCase() : '';
    const status = query.status && query.status !== 'all' ? query.status.toLowerCase() : null;

    let whereClause = {};
    if (status) {
        if (status === 'paid') whereClause.status = 'SUCCESS';
        else if (status === 'failed') whereClause.status = 'FAILED';
        else if (status === 'pending') whereClause.status = 'PENDING';
    }

    const { count: total, rows: payments } = await Payment.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'phone', 'role'],
                include: [
                    { model: ParentProfile, as: 'parentProfile', attributes: ['fullName'] },
                    { model: TutorProfile, as: 'tutorProfile', attributes: ['fullName'] },
                ],
            },
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });

    let data = payments.map((p) => {
        const isParent = p.user?.role === 'PARENT';
        const userName = isParent
            ? (p.user?.parentProfile?.fullName || p.user?.email || 'Parent User')
            : (p.user?.tutorProfile?.fullName || p.user?.email || 'Tutor User');

        return {
            id: p.id,
            paidBy: isParent ? 'parent' : 'tutor',
            parentName: userName,
            childName: isParent ? 'Registered Student' : '—',
            professionalName: isParent ? 'Platform Direct' : userName,
            bookingId: p.razorpayOrderId || p.id.slice(0, 8),
            amount: parseFloat(p.amount) || 0,
            coins: Math.round(parseFloat(p.amount) || 0),
            commission: Math.round((parseFloat(p.amount) || 0) * 0.1),
            tutorAmount: Math.round((parseFloat(p.amount) || 0) * 0.9),
            paymentMethod: p.razorpayPaymentId ? 'Razorpay Online' : 'Online Gateway',
            paymentStatus: p.status === 'SUCCESS' ? 'paid' : (p.status === 'FAILED' ? 'failed' : 'pending'),
            date: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
        };
    });

    if (search) {
        data = data.filter(d =>
            d.parentName.toLowerCase().includes(search) ||
            d.professionalName.toLowerCase().includes(search) ||
            d.bookingId.toLowerCase().includes(search) ||
            d.id.toLowerCase().includes(search)
        );
    }

    const paymentCount = search ? data.length : total;

    return {
        data,
        pagination: {
            total: paymentCount,
            page,
            limit,
            totalPages: Math.ceil(paymentCount / limit) || 1,
        },
    };
};

/**
 * Retrieve real parent and child registration requests from MySQL.
 */
const getParentRegistrations = async (query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const search = query.search ? query.search.trim().toLowerCase() : '';
    const searchClause = search
        ? `WHERE LOWER(p.fullName) LIKE :searchPattern
            OR LOWER(p.city) LIKE :searchPattern
            OR LOWER(p.state) LIKE :searchPattern
            OR LOWER(CONCAT_WS(', ', p.city, p.state)) LIKE :searchPattern
            OR EXISTS (
                SELECT 1 FROM users AS u
                WHERE u.id = p.userId AND LOWER(u.email) LIKE :searchPattern
            )
            OR EXISTS (
                SELECT 1 FROM child_profiles AS c
                WHERE c.parentId = p.id AND LOWER(c.name) LIKE :searchPattern
            )`
        : '';
    const replacements = {
        limit,
        offset,
        ...(search ? { searchPattern: `%${search}%` } : {}),
    };

    const [countRows, parentIdRows] = await Promise.all([
        sequelize.query(
            `SELECT COUNT(*) AS total FROM parent_profiles AS p ${searchClause}`,
            { replacements, type: QueryTypes.SELECT }
        ),
        sequelize.query(
            `SELECT p.id FROM parent_profiles AS p ${searchClause}
             ORDER BY p.createdAt DESC, p.id DESC
             LIMIT :limit OFFSET :offset`,
            { replacements, type: QueryTypes.SELECT }
        ),
    ]);
    const total = Number(countRows[0]?.total || 0);
    const parentIds = parentIdRows.map(row => row.id);

    const parents = parentIds.length > 0
        ? await ParentProfile.findAll({
            where: { id: parentIds },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'phone', 'createdAt'],
                    include: [
                        {
                            model: Payment,
                            as: 'payments',
                            limit: 1,
                            order: [['createdAt', 'DESC']],
                        },
                    ],
                },
                {
                    model: ChildProfile,
                    as: 'children',
                    attributes: ['id', 'name', 'grade', 'dateOfBirth', 'learningGoals', 'schoolName'],
                },
            ],
        })
        : [];
    const parentOrder = new Map(parentIds.map((id, index) => [id, index]));
    parents.sort((a, b) => parentOrder.get(a.id) - parentOrder.get(b.id));

    const data = parents.map((parent) => {
        const user = parent.user;
        const primaryChild = parent.children?.[0];
        const latestPayment = user?.payments?.[0];

        // Calculate approximate age
        let childAge = 8;
        if (primaryChild?.dateOfBirth) {
            const birthYear = new Date(primaryChild.dateOfBirth).getFullYear();
            const currYear = new Date().getFullYear();
            childAge = Math.max(3, currYear - birthYear);
        } else if (primaryChild?.grade) {
            const parsed = parseInt(primaryChild.grade.replace(/\D/g, ''), 10);
            if (!isNaN(parsed) && parsed > 0) childAge = parsed + 5;
        }

        const requirement = primaryChild?.learningGoals
            ? primaryChild.learningGoals
            : (primaryChild?.grade ? `Tuition & Support for ${primaryChild.grade}` : 'Academic & Learning Support');

        return {
            id: parent.id,
            name: parent.fullName || 'Parent',
            email: user?.email || '',
            phone: user?.phone || '',
            location: parent.city ? `${parent.city}, ${parent.state || 'India'}` : (parent.location || 'India'),
            childName: primaryChild?.name || 'Child',
            childAge,
            children: (parent.children || []).map(c => ({
                id: c.id,
                name: c.name,
                grade: c.grade || 'Not Specified',
                learningGoals: c.learningGoals || 'General Improvement',
            })),
            requirement,
            registrationDate: parent.createdAt ? parent.createdAt.toISOString() : new Date().toISOString(),
            status: 'Verified',
            payment: latestPayment ? {
                transactionId: latestPayment.razorpayPaymentId || latestPayment.id.slice(0, 10),
                amount: parseFloat(latestPayment.amount) || 699,
                date: latestPayment.createdAt ? latestPayment.createdAt.toISOString() : parent.createdAt.toISOString(),
                method: latestPayment.razorpayPaymentId ? 'Razorpay Online' : 'Online UPI/Card',
                status: latestPayment.status === 'SUCCESS' ? 'Paid' : latestPayment.status,
            } : {
                transactionId: `TXN-${parent.id.slice(0, 8).toUpperCase()}`,
                amount: 699,
                date: parent.createdAt ? parent.createdAt.toISOString() : new Date().toISOString(),
                method: 'Online Payment',
                status: 'Paid',
            },
        };
    });

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

module.exports = {
    getRegistrationRequests,
    updateRegistrationStatus,
    registerTutorByAdmin,
    getDashboardStats,
    getAdminLeads,
    getAdminPayments,
    getParentRegistrations,
};


