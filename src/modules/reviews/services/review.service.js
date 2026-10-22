const { Op } = require('sequelize');
const sequelize = require('../../../config/database');
const {
    Review,
    User,
    ParentProfile,
    TutorProfile,
    Appointment,
} = require('../../users/models');
const { REVIEW_TARGET_TYPE, REVIEW_STATUS } = require('../../../shared/constants/reviewConstants');
const { createNotification } = require('../../notifications/services/notification.service');
const { NOTIFICATION_TYPES, NOTIFICATION_TARGET_ROLES } = require('../../../shared/constants/notificationConstants');
const AppError = require('../../../shared/utils/AppError');

/**
 * Recalculate average rating and total review count for a tutor atomically.
 * Only reviews with status = 'published' and targetType = 'TUTOR' are included.
 */
const recalculateTutorRating = async (tutorId, transaction) => {
    if (!tutorId) return { averageRating: 0.00, totalReviews: 0 };

    const stats = await Review.findOne({
        attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
            [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        ],
        where: {
            tutorId,
            status: REVIEW_STATUS.PUBLISHED,
            targetType: REVIEW_TARGET_TYPE.TUTOR,
        },
        raw: true,
        transaction,
    });

    const totalReviews = parseInt(stats?.totalReviews, 10) || 0;
    const rawAvg = stats?.averageRating !== null ? parseFloat(stats.averageRating) : 0;
    const averageRating = totalReviews > 0 ? parseFloat(rawAvg.toFixed(2)) : 0.00;

    await TutorProfile.update(
        {
            rating: averageRating,
            reviewCount: totalReviews,
        },
        {
            where: { id: tutorId },
            transaction,
        }
    );

    return { averageRating, totalReviews };
};

/**
 * Recalculate average rating and total review count for a parent atomically.
 * Only reviews with status = 'published' and targetType = 'PARENT' are included.
 */
const recalculateParentRating = async (parentId, transaction) => {
    if (!parentId) return { averageRating: 0.00, totalReviews: 0 };

    const stats = await Review.findOne({
        attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
            [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        ],
        where: {
            parentId,
            status: REVIEW_STATUS.PUBLISHED,
            targetType: REVIEW_TARGET_TYPE.PARENT,
        },
        raw: true,
        transaction,
    });

    const totalReviews = parseInt(stats?.totalReviews, 10) || 0;
    const rawAvg = stats?.averageRating !== null ? parseFloat(stats.averageRating) : 0;
    const averageRating = totalReviews > 0 ? parseFloat(rawAvg.toFixed(2)) : 0.00;

    await ParentProfile.update(
        {
            rating: averageRating,
            reviewCount: totalReviews,
        },
        {
            where: { id: parentId },
            transaction,
        }
    );

    return { averageRating, totalReviews };
};

/**
 * Create a new review (360° reviews):
 * - Parent rates Tutor
 * - Tutor rates Parent
 * - Parent or Tutor rates Application / Platform
 */
const createReview = async (userId, data) => {
    const { targetType, tutorId, parentId, appointmentId, subject, rating, comment } = data;

    // Validate rating
    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        throw new AppError('Rating must be an integer between 1 and 5', 400);
    }

    if (!Object.values(REVIEW_TARGET_TYPE).includes(targetType)) {
        throw new AppError(`Invalid target type: ${targetType}`, 400);
    }

    let resolvedTutorId = null;
    let resolvedParentId = null;

    if (targetType === REVIEW_TARGET_TYPE.TUTOR) {
        if (!tutorId) {
            throw new AppError('Tutor ID is required for tutor reviews', 400);
        }

        const tutor = await TutorProfile.findByPk(tutorId);
        if (!tutor) {
            throw new AppError('Tutor profile not found', 404);
        }

        // Anti-self-review guard
        if (tutor.userId === userId) {
            throw new AppError('You cannot review your own profile', 400);
        }

        resolvedTutorId = tutorId;

        // If reviewing through an appointment, enforce single review per appointment
        if (appointmentId) {
            const appointment = await Appointment.findByPk(appointmentId);
            if (!appointment) {
                throw new AppError('Appointment not found', 404);
            }

            const existingAptReview = await Review.findOne({
                where: { appointmentId },
            });
            if (existingAptReview) {
                throw new AppError('You have already submitted a review for this appointment', 409);
            }
        } else {
            // General review without appointmentId: check if user already wrote an active review for this tutor
            const existingGeneralReview = await Review.findOne({
                where: {
                    reviewerId: userId,
                    tutorId,
                    targetType: REVIEW_TARGET_TYPE.TUTOR,
                    appointmentId: null,
                },
            });

            if (existingGeneralReview) {
                // Update their existing review instead of creating duplicate clutter
                return await sequelize.transaction(async (t) => {
                    existingGeneralReview.rating = numRating;
                    existingGeneralReview.comment = comment || existingGeneralReview.comment;
                    if (subject) existingGeneralReview.subject = subject;
                    existingGeneralReview.status = REVIEW_STATUS.PUBLISHED;
                    await existingGeneralReview.save({ transaction: t });

                    const { averageRating, totalReviews } = await recalculateTutorRating(tutorId, t);

                    return {
                        review: existingGeneralReview,
                        updatedTutorRating: averageRating,
                        updatedReviewCount: totalReviews,
                    };
                });
            }
        }
    } else if (targetType === REVIEW_TARGET_TYPE.PARENT) {
        if (!parentId) {
            throw new AppError('Parent ID is required for parent reviews', 400);
        }

        const parent = await ParentProfile.findByPk(parentId);
        if (!parent) {
            throw new AppError('Parent profile not found', 404);
        }

        // Anti-self-review guard
        if (parent.userId === userId) {
            throw new AppError('You cannot review your own parent profile', 400);
        }

        resolvedParentId = parentId;

        // If reviewing through an appointment
        if (appointmentId) {
            const appointment = await Appointment.findByPk(appointmentId);
            if (!appointment) {
                throw new AppError('Appointment not found', 404);
            }

            const existingAptReview = await Review.findOne({
                where: {
                    reviewerId: userId,
                    appointmentId,
                    targetType: REVIEW_TARGET_TYPE.PARENT,
                },
            });
            if (existingAptReview) {
                throw new AppError('You have already submitted a review for this parent for this appointment', 409);
            }
        } else {
            // General review without appointmentId
            const existingGeneralReview = await Review.findOne({
                where: {
                    reviewerId: userId,
                    parentId,
                    targetType: REVIEW_TARGET_TYPE.PARENT,
                    appointmentId: null,
                },
            });

            if (existingGeneralReview) {
                return await sequelize.transaction(async (t) => {
                    existingGeneralReview.rating = numRating;
                    existingGeneralReview.comment = comment || existingGeneralReview.comment;
                    if (subject) existingGeneralReview.subject = subject;
                    existingGeneralReview.status = REVIEW_STATUS.PUBLISHED;
                    await existingGeneralReview.save({ transaction: t });

                    const { averageRating, totalReviews } = await recalculateParentRating(parentId, t);

                    return {
                        review: existingGeneralReview,
                        updatedParentRating: averageRating,
                        updatedReviewCount: totalReviews,
                    };
                });
            }
        }
    }

    // Atomic transaction for creating review & recalculating ratings
    return await sequelize.transaction(async (t) => {
        const review = await Review.create(
            {
                reviewerId: userId,
                targetType,
                tutorId: resolvedTutorId,
                parentId: resolvedParentId,
                appointmentId: appointmentId || null,
                subject: subject || null,
                rating: numRating,
                comment: comment || null,
                status: REVIEW_STATUS.PUBLISHED,
            },
            { transaction: t }
        );

        let tutorStats = null;
        let parentStats = null;

        if (targetType === REVIEW_TARGET_TYPE.TUTOR && resolvedTutorId) {
            tutorStats = await recalculateTutorRating(resolvedTutorId, t);

            // Notify Tutor of new review
            TutorProfile.findByPk(resolvedTutorId).then(tutor => {
                if (tutor && tutor.userId) {
                    createNotification({
                        userId: tutor.userId,
                        targetRole: NOTIFICATION_TARGET_ROLES.TUTOR,
                        type: NOTIFICATION_TYPES.REVIEW,
                        title: 'New Review Received',
                        message: `You received a ${numRating}-star review: "${(comment || '').slice(0, 80)}"`,
                        data: { tutorId: resolvedTutorId, rating: numRating },
                    }).catch(() => {});
                }
            }).catch(() => {});
        } else if (targetType === REVIEW_TARGET_TYPE.PARENT && resolvedParentId) {
            parentStats = await recalculateParentRating(resolvedParentId, t);
        }

        return {
            review,
            updatedTutorRating: tutorStats ? tutorStats.averageRating : null,
            updatedParentRating: parentStats ? parentStats.averageRating : null,
            updatedReviewCount: (tutorStats ? tutorStats.totalReviews : null) || (parentStats ? parentStats.totalReviews : null),
        };
    });
};

/**
 * Get public reviews and rating distribution for a specific tutor
 */
const getTutorPublicReviews = async (tutorId, query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const tutor = await TutorProfile.findByPk(tutorId, {
        attributes: ['id', 'fullName', 'avatarUrl', 'rating', 'reviewCount', 'professionalType'],
    });
    if (!tutor) {
        throw new AppError('Tutor not found', 404);
    }

    // Distribution breakdown
    const allPublished = await Review.findAll({
        attributes: ['rating'],
        where: {
            tutorId,
            targetType: REVIEW_TARGET_TYPE.TUTOR,
            status: REVIEW_STATUS.PUBLISHED,
        },
        raw: true,
    });

    const total = allPublished.length;
    const distributionMap = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allPublished.forEach((r) => {
        if (distributionMap[r.rating] !== undefined) {
            distributionMap[r.rating] += 1;
        }
    });

    const distribution = [5, 4, 3, 2, 1].map((stars) => {
        const count = distributionMap[stars];
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return { stars, count, percent };
    });

    // Paginated review records
    const { count, rows } = await Review.findAndCountAll({
        where: {
            tutorId,
            targetType: REVIEW_TARGET_TYPE.TUTOR,
            status: REVIEW_STATUS.PUBLISHED,
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: ParentProfile,
                as: 'reviewer',
                attributes: ['fullName', 'avatarUrl', 'city'],
            },
            {
                model: User,
                as: 'reviewerUser',
                attributes: ['id', 'role'],
            },
        ],
    });

    const formattedReviews = rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        subject: r.subject,
        parentName: r.reviewer?.fullName || 'Parent',
        parentAvatar: r.reviewer?.avatarUrl || null,
        parentCity: r.reviewer?.city || '',
        tutorReply: r.tutorReply,
        tutorRepliedAt: r.tutorRepliedAt,
        date: r.createdAt ? r.createdAt.toISOString().split('T')[0] : '',
        createdAt: r.createdAt,
    }));

    return {
        tutor,
        averageRating: parseFloat(tutor.rating) || 0.00,
        totalReviews: tutor.reviewCount || total,
        distribution,
        reviews: formattedReviews,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

/**
 * Get reviews received by a specific parent (given by tutors)
 */
const getParentPublicReviews = async (parentId, query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const parent = await ParentProfile.findByPk(parentId, {
        attributes: ['id', 'fullName', 'avatarUrl', 'rating', 'reviewCount', 'city'],
    });
    if (!parent) {
        throw new AppError('Parent not found', 404);
    }

    const { count, rows } = await Review.findAndCountAll({
        where: {
            parentId,
            targetType: REVIEW_TARGET_TYPE.PARENT,
            status: REVIEW_STATUS.PUBLISHED,
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: TutorProfile,
                as: 'reviewerTutor',
                attributes: ['fullName', 'avatarUrl', 'professionalType'],
            },
            {
                model: User,
                as: 'reviewerUser',
                attributes: ['id', 'role'],
            },
        ],
    });

    const formattedReviews = rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        subject: r.subject,
        tutorName: r.reviewerTutor?.fullName || 'Tutor',
        tutorAvatar: r.reviewerTutor?.avatarUrl || null,
        tutorProfessionalType: r.reviewerTutor?.professionalType || 'Tutor',
        date: r.createdAt ? r.createdAt.toISOString().split('T')[0] : '',
        createdAt: r.createdAt,
    }));

    return {
        parent,
        averageRating: parseFloat(parent.rating) || 0.00,
        totalReviews: parent.reviewCount || count,
        reviews: formattedReviews,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

/**
 * Get reviews received by the logged in tutor (for tutor portal)
 */
const getTutorPortalReviews = async (userId) => {
    const tutor = await TutorProfile.findOne({ where: { userId } });
    if (!tutor) {
        throw new AppError('Tutor profile not found for this account', 404);
    }

    const publicData = await getTutorPublicReviews(tutor.id, { limit: 50 });
    return publicData;
};

/**
 * Get reviews received by the logged in parent (for parent portal)
 */
const getParentPortalReviews = async (userId) => {
    const parent = await ParentProfile.findOne({ where: { userId } });
    if (!parent) {
        throw new AppError('Parent profile not found for this account', 404);
    }

    const parentData = await getParentPublicReviews(parent.id, { limit: 50 });
    return parentData;
};

/**
 * Submit a 1-time reply to a review (tutors replying to reviews on them, or parents replying)
 */
const replyToReview = async (userId, reviewId, replyText) => {
    if (!replyText || !replyText.trim()) {
        throw new AppError('Reply content cannot be empty', 400);
    }

    const review = await Review.findByPk(reviewId);
    if (!review) {
        throw new AppError('Review not found', 404);
    }

    // Check authorization: either target tutor or target parent
    let isAuthorized = false;

    if (review.targetType === REVIEW_TARGET_TYPE.TUTOR && review.tutorId) {
        const tutor = await TutorProfile.findOne({ where: { userId } });
        if (tutor && review.tutorId === tutor.id) {
            isAuthorized = true;
        }
    } else if (review.targetType === REVIEW_TARGET_TYPE.PARENT && review.parentId) {
        const parent = await ParentProfile.findOne({ where: { userId } });
        if (parent && review.parentId === parent.id) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        throw new AppError('You are not authorized to reply to this review', 403);
    }

    review.tutorReply = replyText.trim();
    review.tutorRepliedAt = new Date();
    await review.save();

    return review;
};

/**
 * Get reviews submitted by the logged in user
 */
const getMySubmittedReviews = async (userId) => {
    const reviews = await Review.findAll({
        where: { reviewerId: userId },
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: TutorProfile,
                as: 'tutor',
                attributes: ['id', 'fullName', 'avatarUrl'],
            },
            {
                model: ParentProfile,
                as: 'reviewedParent',
                attributes: ['id', 'fullName', 'avatarUrl'],
            },
        ],
    });

    return reviews;
};

/**
 * Admin: Get all reviews with filter and search
 */
const getAdminReviews = async (query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (query.targetType && query.targetType !== 'all') {
        whereClause.targetType = query.targetType.toUpperCase();
    }

    if (query.status && query.status !== 'all') {
        whereClause.status = query.status.toLowerCase();
    }

    if (query.search && query.search.trim()) {
        const searchTerm = `%${query.search.trim()}%`;
        whereClause[Op.or] = [
            { comment: { [Op.like]: searchTerm } },
            { subject: { [Op.like]: searchTerm } },
            { '$tutor.fullName$': { [Op.like]: searchTerm } },
            { '$reviewedParent.fullName$': { [Op.like]: searchTerm } },
            { '$reviewer.fullName$': { [Op.like]: searchTerm } },
            { '$reviewerTutor.fullName$': { [Op.like]: searchTerm } },
        ];
    }

    const { count, rows } = await Review.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: TutorProfile,
                as: 'tutor',
                attributes: ['id', 'fullName', 'avatarUrl'],
            },
            {
                model: ParentProfile,
                as: 'reviewedParent',
                attributes: ['id', 'fullName', 'avatarUrl'],
            },
            {
                model: ParentProfile,
                as: 'reviewer',
                attributes: ['id', 'fullName', 'avatarUrl'],
            },
            {
                model: TutorProfile,
                as: 'reviewerTutor',
                attributes: ['id', 'fullName', 'avatarUrl'],
            },
            {
                model: User,
                as: 'reviewerUser',
                attributes: ['id', 'email', 'phone', 'role'],
            },
        ],
    });

    // Format reviews for the Admin Reviews table
    const formatted = rows.map((r) => {
        let targetName = 'Website / Platform';
        let authorName = 'Client';

        if (r.targetType === REVIEW_TARGET_TYPE.TUTOR) {
            targetName = r.tutor?.fullName || 'Tutor';
            authorName = r.reviewer?.fullName || (r.reviewerUser?.email ? r.reviewerUser.email.split('@')[0] : 'Parent');
        } else if (r.targetType === REVIEW_TARGET_TYPE.PARENT) {
            targetName = r.reviewedParent?.fullName || 'Parent';
            authorName = r.reviewerTutor?.fullName || (r.reviewerUser?.email ? r.reviewerUser.email.split('@')[0] : 'Tutor');
        } else if (r.targetType === REVIEW_TARGET_TYPE.PLATFORM) {
            targetName = 'Application / Platform';
            authorName = r.reviewer?.fullName || r.reviewerTutor?.fullName || (r.reviewerUser?.email ? r.reviewerUser.email.split('@')[0] : 'User');
        }

        return {
            id: r.id,
            targetType: r.targetType,
            targetName,
            tutor: r.targetType === REVIEW_TARGET_TYPE.TUTOR ? targetName : (r.reviewerTutor?.fullName || 'N/A'),
            tutorId: r.tutorId,
            parentId: r.parentId,
            client: authorName,
            clientId: r.reviewerId,
            clientEmail: r.reviewerUser?.email || '',
            rating: r.rating,
            text: r.comment || '(No comment)',
            subject: r.subject || (r.targetType === REVIEW_TARGET_TYPE.TUTOR ? 'General' : r.targetType === REVIEW_TARGET_TYPE.PARENT ? 'Parent Evaluation' : 'Website Feedback'),
            date: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
            status: r.status,
            tutorReply: r.tutorReply,
            tutorRepliedAt: r.tutorRepliedAt,
        };
    });

    return {
        reviews: formatted,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

/**
 * Admin: Update review moderation status (published or hidden)
 * Atomically updates tutor or parent average rating when status toggles.
 */
const updateReviewStatusByAdmin = async (reviewId, newStatus) => {
    if (!Object.values(REVIEW_STATUS).includes(newStatus)) {
        throw new AppError(`Status must be either '${REVIEW_STATUS.PUBLISHED}' or '${REVIEW_STATUS.HIDDEN}'`, 400);
    }

    const review = await Review.findByPk(reviewId);
    if (!review) {
        throw new AppError('Review not found', 404);
    }

    return await sequelize.transaction(async (t) => {
        review.status = newStatus;
        await review.save({ transaction: t });

        // Recalculate target's rating immediately so hidden reviews do not affect stats
        if (review.targetType === REVIEW_TARGET_TYPE.TUTOR && review.tutorId) {
            await recalculateTutorRating(review.tutorId, t);
        } else if (review.targetType === REVIEW_TARGET_TYPE.PARENT && review.parentId) {
            await recalculateParentRating(review.parentId, t);
        }

        return review;
    });
};

/**
 * Public: Get published testimonials for the landing page
 */
const getTestimonials = async (limit = 6) => {
    const reviews = await Review.findAll({
        where: {
            status: REVIEW_STATUS.PUBLISHED,
            rating: { [Op.gte]: 3 },
        },
        include: [
            {
                model: User,
                as: 'reviewerUser',
                attributes: ['id', 'email', 'phone', 'role'],
            },
            {
                model: ParentProfile,
                as: 'reviewer',
                attributes: ['id', 'fullName', 'city', 'avatarUrl'],
            },
            {
                model: TutorProfile,
                as: 'reviewerTutor',
                attributes: ['id', 'fullName', 'city', 'avatarUrl', 'professionalType'],
            },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit, 10) || 6,
    });

    const formatted = reviews.map((r) => {
        const name = r.reviewer?.fullName || r.reviewerTutor?.fullName || r.reviewerUser?.email?.split('@')[0] || 'Verified Parent';
        const city = r.reviewer?.city || r.reviewerTutor?.city || 'India';
        const avatar = name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'VP';

        const child = r.targetType === REVIEW_TARGET_TYPE.PLATFORM
            ? 'Parent · Verified User'
            : r.subject || (r.reviewerUser?.role === 'PARENT' ? 'Parent' : 'Verified Tutor');

        return {
            id: r.id,
            name,
            city,
            avatar,
            child,
            text: r.comment,
            rating: r.rating,
            createdAt: r.createdAt,
            targetType: r.targetType,
        };
    });

    const DEFAULT_SEED_TESTIMONIALS = [
        {
            id: 'seed-1',
            name: 'Kavita Menon',
            city: 'Bengaluru',
            avatar: 'KM',
            child: 'Son, Grade 9',
            text: "Nurtiva helped us find an amazing Math teacher in just 2 days. Arjun's confidence has transformed completely. Highly recommend!",
            rating: 5,
        },
        {
            id: 'seed-2',
            name: 'Rajesh Sharma',
            city: 'Mumbai',
            avatar: 'RS',
            child: 'Daughter, Grade 4',
            text: 'Finding a qualified English tutor for primary school was tough. Nurtiva made it simple. The verification system gives us real peace of mind.',
            rating: 5,
        },
        {
            id: 'seed-3',
            name: 'Priya Reddy',
            city: 'Hyderabad',
            avatar: 'PR',
            child: 'Daughter, Pre-K',
            text: 'The special education teachers available on Nurtiva are incredibly patient and skilled. My daughter is showing great progress.',
            rating: 5,
        },
    ];

    if (formatted.length < 3) {
        const remaining = DEFAULT_SEED_TESTIMONIALS.slice(0, 3 - formatted.length);
        return [...formatted, ...remaining];
    }

    return formatted;
};

module.exports = {
    recalculateTutorRating,
    recalculateParentRating,
    createReview,
    getTutorPublicReviews,
    getParentPublicReviews,
    getTutorPortalReviews,
    getParentPortalReviews,
    replyToReview,
    getMySubmittedReviews,
    getAdminReviews,
    updateReviewStatusByAdmin,
    getTestimonials,
};
