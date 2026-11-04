const { Op } = require('sequelize');
const { TutorProfile, User, Subject, Category, ChildProfile } = require('../../users/models');
const sequelize = require('../../../config/database');

exports.searchTutors = async (filters) => {
    const {
        q,
        city,
        pincode,
        subjectId,
        childId,
        parentId,
        childIds,
        explore,
        tutorType,
        professionalType,
        gender,
        minFee,
        maxFee,
        minSessionFee,
        maxSessionFee,
        minMonthlyFee,
        maxMonthlyFee,
        minRating,
        minExperience,
        teachingMode,
        sortBy = 'relevance',
        page = 1,
        limit = 12
    } = filters;

    const whereClause = {
        approvalStatus: 'approved',
        verified: true,
    };

    const generalQuery = (q || '').trim();
    if (generalQuery) {
        const searchTerm = `%${generalQuery}%`;

        // Search in Subject names to find matching tutors
        const matchedSubjects = await Subject.findAll({
            where: { name: { [Op.like]: searchTerm } },
            attributes: ['id']
        });
        const matchedSubjectIds = matchedSubjects.map(s => s.id);

        let tutorIdsFromSubjects = [];
        if (matchedSubjectIds.length > 0) {
            const [tutorWithSubjects] = await sequelize.query(
                'SELECT tutorProfileId FROM tutor_subjects WHERE subjectId IN (?)',
                { replacements: [matchedSubjectIds] }
            );
            tutorIdsFromSubjects = tutorWithSubjects.map(r => r.tutorProfileId);
        }

        whereClause[Op.or] = [
            { fullName: { [Op.like]: searchTerm } },
            { city: { [Op.like]: searchTerm } },
            { location: { [Op.like]: searchTerm } },
            { pincode: { [Op.like]: searchTerm } },
            ...(tutorIdsFromSubjects.length ? [{ id: { [Op.in]: tutorIdsFromSubjects } }] : [])
        ];
    } else if (city) {
        whereClause[Op.or] = [
            { city: { [Op.like]: `%${city}%` } },
            { location: { [Op.like]: `%${city}%` } },
            { pincode: { [Op.like]: `%${city}%` } }
        ];
    }

    if (pincode) {
        whereClause.pincode = pincode;
    }

    if (tutorType) {
        whereClause.tutorType = tutorType;
    }

    // Role / Professional Type (support multi-select comma-separated)
    if (professionalType) {
        const types = professionalType.split(',').map(t => t.trim()).filter(Boolean);
        if (types.length === 1) {
            whereClause.professionalType = types[0];
        } else if (types.length > 1) {
            whereClause.professionalType = { [Op.in]: types };
        }
    }

    // Gender (support multi-select comma-separated)
    if (gender && gender !== 'All' && gender !== 'Any') {
        const genders = gender.split(',').map(g => g.trim()).filter(g => g && g !== 'All' && g !== 'Any');
        if (genders.length === 1) {
            whereClause.gender = genders[0];
        } else if (genders.length > 1) {
            whereClause.gender = { [Op.in]: genders };
        }
    }

    // Session / Hourly Fee Filter (support range: min and max)
    const effectiveMinFee = minSessionFee !== undefined ? minSessionFee : minFee;
    const effectiveMaxFee = maxSessionFee !== undefined ? maxSessionFee : maxFee;
    if (effectiveMinFee !== undefined && effectiveMaxFee !== undefined) {
        whereClause.perSessionFee = { [Op.between]: [effectiveMinFee, effectiveMaxFee] };
    } else if (effectiveMinFee !== undefined) {
        whereClause.perSessionFee = { [Op.gte]: effectiveMinFee };
    } else if (effectiveMaxFee !== undefined) {
        whereClause.perSessionFee = { [Op.lte]: effectiveMaxFee };
    }

    // Monthly Fee Filter (support range: min and max)
    if (minMonthlyFee !== undefined && maxMonthlyFee !== undefined) {
        whereClause.monthlyEstimateFee = { [Op.between]: [minMonthlyFee, maxMonthlyFee] };
    } else if (minMonthlyFee !== undefined) {
        whereClause.monthlyEstimateFee = { [Op.gte]: minMonthlyFee };
    } else if (maxMonthlyFee !== undefined) {
        whereClause.monthlyEstimateFee = { [Op.lte]: maxMonthlyFee };
    }

    // Minimum Rating Filter (e.g. 4★ & above)
    if (minRating !== undefined && minRating > 0) {
        whereClause.rating = { [Op.gte]: minRating };
    }

    // Minimum Experience Filter (e.g. 2+, 5+, 8+ years)
    if (minExperience !== undefined && minExperience > 0) {
        whereClause.experienceYears = { [Op.gte]: minExperience };
    }

    // Teaching Mode (JSON array filtering)
    if (teachingMode) {
        const modes = teachingMode.split(',').map(m => m.trim().toLowerCase()).filter(Boolean);
        if (modes.length === 1) {
            whereClause[Op.and] = whereClause[Op.and] || [];
            whereClause[Op.and].push(sequelize.literal(`JSON_CONTAINS(teachingModes, '"${modes[0]}"')`));
        } else if (modes.length > 1) {
            whereClause[Op.and] = whereClause[Op.and] || [];
            const modeLiterals = modes.map(m => `JSON_CONTAINS(teachingModes, '"${m}"')`).join(' OR ');
            whereClause[Op.and].push(sequelize.literal(`(${modeLiterals})`));
        }
    }

    // Context-Aware Child & Subject Recommendation Engine
    let matchedChildInfo = null;
    const isExploreMode = explore === 'true' || explore === 'all';

    if (!isExploreMode) {
        if (childId && childId !== 'all') {
            // Case 1: Specific Child selected
            const child = await ChildProfile.findByPk(childId, {
                include: [{
                    model: Subject,
                    as: 'subjects',
                    attributes: ['id', 'name'],
                    through: { attributes: [] }
                }]
            });

            if (child) {
                matchedChildInfo = {
                    id: child.id,
                    name: child.name,
                    grade: child.grade,
                    gender: child.gender,
                    preferredTutorGender: child.preferredTutorGender || 'Any',
                    preferredMode: child.preferredMode,
                    subjects: (child.subjects || []).map(s => s.name)
                };

                // Auto-gender match if not explicitly overridden by parent
                if (!gender && child.preferredTutorGender && child.preferredTutorGender !== 'Any') {
                    whereClause.gender = child.preferredTutorGender;
                }

                if (child.subjects && child.subjects.length > 0) {
                    const childSubjectIds = child.subjects.map(s => s.id);
                    const [tutorWithSubjects] = await sequelize.query(
                        'SELECT DISTINCT tutorProfileId FROM tutor_subjects WHERE subjectId IN (?)',
                        { replacements: [childSubjectIds] }
                    );
                    const childTutorIds = tutorWithSubjects.map(r => r.tutorProfileId);
                    if (childTutorIds.length > 0) {
                        if (whereClause.id && whereClause.id[Op.in]) {
                            whereClause.id = { [Op.in]: childTutorIds.filter(id => whereClause.id[Op.in].includes(id)) };
                        } else {
                            whereClause.id = { [Op.in]: childTutorIds };
                        }
                    } else {
                        whereClause.id = { [Op.in]: [] };
                    }
                }
            }
        } else if ((childId === 'all' || !childId) && (parentId || childIds)) {
            // Case 2: All Children selected - match union of all children's needed subjects
            let targetChildIds = [];
            if (childIds) {
                targetChildIds = childIds.split(',').map(s => s.trim()).filter(Boolean);
            } else if (parentId) {
                const parentChildren = await ChildProfile.findAll({
                    where: { parentId, status: 'active' },
                    attributes: ['id']
                });
                targetChildIds = parentChildren.map(c => c.id);
            }

            if (targetChildIds.length > 0) {
                const [childSubs] = await sequelize.query(
                    'SELECT DISTINCT subjectId FROM child_subjects WHERE childProfileId IN (?)',
                    { replacements: [targetChildIds] }
                );
                const combinedSubjectIds = childSubs.map(s => s.subjectId);
                if (combinedSubjectIds.length > 0) {
                    const [tutorWithSubjects] = await sequelize.query(
                        'SELECT DISTINCT tutorProfileId FROM tutor_subjects WHERE subjectId IN (?)',
                        { replacements: [combinedSubjectIds] }
                    );
                    const combinedTutorIds = tutorWithSubjects.map(r => r.tutorProfileId);
                    if (combinedTutorIds.length > 0) {
                        if (whereClause.id && whereClause.id[Op.in]) {
                            whereClause.id = { [Op.in]: combinedTutorIds.filter(id => whereClause.id[Op.in].includes(id)) };
                        } else {
                            whereClause.id = { [Op.in]: combinedTutorIds };
                        }
                    } else {
                        whereClause.id = { [Op.in]: [] };
                    }
                }
            }
        }
    }

    // Subject Filter (single or comma-separated)
    const includeSubjects = {
        model: Subject,
        as: 'subjects',
        attributes: ['id', 'name'],
        through: { attributes: [] }
    };

    if (subjectId) {
        const subjectIds = subjectId.split(',').map(s => s.trim()).filter(Boolean);
        if (subjectIds.length === 1) {
            includeSubjects.where = { id: subjectIds[0] };
        } else if (subjectIds.length > 1) {
            includeSubjects.where = { id: { [Op.in]: subjectIds } };
        }
    }

    // Dynamic Sort Order (Featured & Pro partner tutors appear first in search relevance)
    const priorityOrder = [
        sequelize.literal(`CASE WHEN subscriptionTier = 'PRO' THEN 2 WHEN featured = 1 OR subscriptionTier = 'GROWTH' THEN 1 ELSE 0 END`),
        'DESC'
    ];

    let orderClause = [priorityOrder, ['rating', 'DESC'], ['reviewCount', 'DESC'], ['createdAt', 'DESC']];
    if (sortBy === 'rating_desc') {
        orderClause = [priorityOrder, ['rating', 'DESC'], ['reviewCount', 'DESC']];
    } else if (sortBy === 'fee_asc') {
        orderClause = [['perSessionFee', 'ASC'], priorityOrder, ['rating', 'DESC']];
    } else if (sortBy === 'fee_desc') {
        orderClause = [['perSessionFee', 'DESC'], priorityOrder, ['rating', 'DESC']];
    } else if (sortBy === 'experience_desc') {
        orderClause = [priorityOrder, ['experienceYears', 'DESC'], ['rating', 'DESC']];
    } else if (sortBy === 'newest') {
        orderClause = [priorityOrder, ['createdAt', 'DESC']];
    }

    const offset = (page - 1) * limit;

    const { rows: tutors, count: total } = await TutorProfile.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'phone', 'status'],
                where: { status: 'ACTIVE' },
            },
            includeSubjects,
        ],
        attributes: { exclude: ['aadharNumber', 'bankName', 'accountName', 'accountNumber', 'ifscCode', 'aadharDocUrl', 'rciCertUrl', 'qualCertUrl'] },
        limit,
        offset,
        order: orderClause,
        distinct: true, 
    });

    // Compute dynamic facet counts for filter sidebar
    const [facetCountsRaw] = await sequelize.query(`
        SELECT 
            professionalType,
            gender,
            CASE 
                WHEN rating >= 4.5 THEN '4.5_plus'
                WHEN rating >= 4.0 THEN '4.0_plus'
                WHEN rating >= 3.0 THEN '3.0_plus'
                ELSE 'below_3'
            END as ratingBracket,
            COUNT(*) as count
        FROM tutor_profiles
        WHERE approvalStatus = 'approved' AND verified = 1
        GROUP BY professionalType, gender, ratingBracket
    `);

    const facets = {
        roles: { Therapist: 0, Teacher: 0 },
        genders: { Female: 0, Male: 0 },
        ratings: { fourPlus: 0, threePlus: 0 },
    };

    (facetCountsRaw || []).forEach(row => {
        const c = Number(row.count) || 0;
        if (row.professionalType && facets.roles[row.professionalType] !== undefined) {
            facets.roles[row.professionalType] += c;
        }
        if (row.gender && facets.genders[row.gender] !== undefined) {
            facets.genders[row.gender] += c;
        }
        if (row.ratingBracket === '4.5_plus' || row.ratingBracket === '4.0_plus') {
            facets.ratings.fourPlus += c;
            facets.ratings.threePlus += c;
        } else if (row.ratingBracket === '3.0_plus') {
            facets.ratings.threePlus += c;
        }
    });

    return {
        tutors,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
        matchedChild: matchedChildInfo,
        facets,
    };
};

exports.getTutorById = async (id) => {
    const tutor = await TutorProfile.findByPk(id, {
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'phone', 'status'],
            },
            {
                model: Subject,
                as: 'subjects',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }
        ],
        attributes: { exclude: ['aadharNumber', 'bankName', 'accountName', 'accountNumber', 'ifscCode', 'aadharDocUrl', 'rciCertUrl', 'qualCertUrl'] },
    });

    if (tutor) {
        tutor.increment('viewsCount').catch(() => {});
    }

    return tutor;
};

exports.getAutocompleteSuggestions = async (q) => {
    const queryStr = (q || '').trim();
    if (!queryStr) {
        return { subjects: [], tutors: [], locations: [] };
    }

    const searchTerm = `%${queryStr}%`;

    // 1. Fetch matching subjects (limit 5)
    const subjects = await Subject.findAll({
        where: { name: { [Op.like]: searchTerm }, isActive: true },
        include: [{ model: Category, as: 'category', attributes: ['name', 'type'] }],
        attributes: ['id', 'name'],
        limit: 5,
        order: [['name', 'ASC']]
    });

    // 2. Fetch matching tutors (limit 5)
    const tutors = await TutorProfile.findAll({
        where: {
            approvalStatus: 'approved',
            verified: true,
            [Op.or]: [
                { fullName: { [Op.like]: searchTerm } },
            ]
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'status'],
                where: { status: 'ACTIVE' }
            },
            {
                model: Subject,
                as: 'subjects',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }
        ],
        attributes: ['id', 'fullName', 'city', 'pincode', 'professionalType', 'tutorType', 'avatarUrl', 'rating'],
        limit: 5,
        order: [['rating', 'DESC']]
    });

    // 3. Unique location matching (City or Pincode)
    const [locations] = await sequelize.query(`
        SELECT DISTINCT city, pincode 
        FROM tutor_profiles 
        WHERE approvalStatus = 'approved' AND verified = 1 
          AND (city LIKE :term OR pincode LIKE :term) 
          AND (city IS NOT NULL OR pincode IS NOT NULL)
        LIMIT 5
    `, {
        replacements: { term: searchTerm }
    });

    return {
        subjects: subjects.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category?.name || 'General',
            type: s.category?.type || 'ACADEMIC'
        })),
        tutors: tutors.map(t => ({
            id: t.id,
            name: t.fullName,
            city: t.city,
            pincode: t.pincode,
            professionalType: t.professionalType,
            tutorType: t.tutorType,
            avatarUrl: t.avatarUrl,
            rating: t.rating,
            subjects: (t.subjects || []).map(s => s.name)
        })),
        locations: locations.map(l => ({
            city: l.city || '',
            pincode: l.pincode || ''
        }))
    };
};
