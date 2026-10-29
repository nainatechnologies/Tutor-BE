const { Op } = require('sequelize');
const { TutorProfile, User, Subject, Category, ChildProfile } = require('../../users/models');

const sequelize = require('../../../config/database');

exports.searchTutors = async (filters) => {
    const { q, city, pincode, subjectId, childId, tutorType, professionalType, maxFee, page = 1, limit = 10 } = filters;

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
    if (professionalType) {
        whereClause.professionalType = professionalType;
    }
    if (maxFee) {
        whereClause.perSessionFee = { [Op.lte]: maxFee };
    }

    
    let matchedChildInfo = null;
    if (childId && childId !== 'all') {
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
                preferredMode: child.preferredMode,
                subjects: (child.subjects || []).map(s => s.name)
            };

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
    }

    const includeSubjects = {
        model: Subject,
        as: 'subjects',
        attributes: ['id', 'name'],
        through: { attributes: [] } // hide junction table data
    };

    if (subjectId) {
        includeSubjects.where = { id: subjectId };
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
        order: [['rating', 'DESC'], ['reviewCount', 'DESC'], ['createdAt', 'DESC']],
        distinct: true, 
    });

    return {
        tutors,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
        matchedChild: matchedChildInfo,
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
    const escapedTerm = queryStr.replace(/'/g, "''");

    // 1. Fetch matching subjects (limit 5)
    const subjects = await Subject.findAll({
        where: {
            name: { [Op.like]: searchTerm },
            isActive: true,
        },
        include: [{
            model: Category,
            as: 'category',
            attributes: ['name', 'type'],
            required: false,
        }],
        attributes: ['id', 'name'],
        order: [
            sequelize.literal(`CASE WHEN Subject.name LIKE '${escapedTerm}%' THEN 0 ELSE 1 END`),
            ['name', 'ASC'],
        ],
        limit: 5,
    });

    // 2. Fetch matching approved & active tutors (limit 5)
    const tutors = await TutorProfile.findAll({
        where: {
            fullName: { [Op.like]: searchTerm },
            approvalStatus: 'approved',
            verified: true,
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'status'],
                where: { status: 'ACTIVE' },
                required: true,
            },
            {
                model: Subject,
                as: 'subjects',
                attributes: ['id', 'name'],
                through: { attributes: [] },
                required: false,
            }
        ],
        attributes: ['id', 'fullName', 'city', 'pincode', 'professionalType', 'tutorType', 'avatarUrl', 'rating'],
        order: [
            sequelize.literal(`CASE WHEN TutorProfile.fullName LIKE '${escapedTerm}%' THEN 0 ELSE 1 END`),
            ['rating', 'DESC'],
        ],
        limit: 5,
    });

    // 3. Fetch matching locations (city or pincode) from approved active tutors (limit 4)
    const [locations] = await sequelize.query(`
        SELECT DISTINCT city, pincode 
        FROM tutor_profiles 
        WHERE (city LIKE :searchTerm OR pincode LIKE :searchTerm)
          AND approvalStatus = 'approved' 
          AND verified = 1
          AND city IS NOT NULL 
          AND city != ''
        LIMIT 4
    `, {
        replacements: { searchTerm }
    });

    return {
        subjects: subjects.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category?.name || 'Subject',
            type: s.category?.type || 'academic',
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
            subjects: (t.subjects || []).map(s => s.name),
        })),
        locations: locations.map(l => ({
            city: l.city,
            pincode: l.pincode,
        })),
    };
};
