const { Op } = require('sequelize');
const { TutorProfile, User, Subject } = require('../../users/models');

exports.searchTutors = async (filters) => {
    const { city, pincode, subjectId, tutorType, professionalType, maxFee, page = 1, limit = 10 } = filters;

    const whereClause = {
        approvalStatus: 'approved',
        verified: true,
    };

    if (city) {
        whereClause.city = { [Op.iLike]: `%${city}%` };
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
    };
};
