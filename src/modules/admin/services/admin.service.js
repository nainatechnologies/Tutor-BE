const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const sequelize = require('../../../config/database');
const { User, TutorProfile, Subject } = require('../../users/models');
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
        tutorType: tutor.tutorType || 'Outsourced',
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

        // 3. Link Subjects if matching names or IDs exist
        if (specialization) {
            const specList = specialization.split(',').map(s => s.trim());
            const matchedSubjects = await Subject.findAll({
                where: {
                    name: { [Op.in]: specList }
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

module.exports = {
    getRegistrationRequests,
    updateRegistrationStatus,
    registerTutorByAdmin,
};
