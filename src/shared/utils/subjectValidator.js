const { Subject, Category } = require('../../modules/users/models');
const { Op } = require('sequelize');
const AppError = require('./AppError');

/**
 * Validates that the provided subjects match the tutor's professionalType.
 * Single Source of Truth (SSOT):
 * - Teacher  -> Category type must be 'ACADEMIC'
 * - Therapist -> Category type must be 'SERVICE'
 * 
 * @param {string} professionalType - 'Teacher' | 'Therapist'
 * @param {Array<string>} subjectIdsOrNames - Array of subject UUIDs or subject names
 * @param {object} [options] - Optional options like { transaction }
 * @returns {Promise<Array<Subject>>} - Array of matched Subject instances with category included
 */
const validateTutorSubjects = async (professionalType, subjectIdsOrNames, options = {}) => {
    if (!subjectIdsOrNames || !Array.isArray(subjectIdsOrNames) || subjectIdsOrNames.length === 0) {
        return [];
    }

    const cleanIdentifiers = subjectIdsOrNames
        .map(id => (typeof id === 'string' ? id.trim() : id))
        .filter(Boolean);

    if (cleanIdentifiers.length === 0) return [];

    const isTherapist = (professionalType || '').trim().toLowerCase() === 'therapist';
    const normalizedType = isTherapist ? 'Therapist' : 'Teacher';
    const expectedCategoryType = isTherapist ? 'SERVICE' : 'ACADEMIC';
    const disallowedDesc = isTherapist ? 'academic' : 'therapy / developmental service';
    const allowedDesc = isTherapist ? 'therapy and developmental services' : 'academic subjects';

    const subjects = await Subject.findAll({
        where: {
            [Op.or]: [
                { id: { [Op.in]: cleanIdentifiers } },
                { name: { [Op.in]: cleanIdentifiers } },
            ]
        },
        include: [{
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'type', 'isActive']
        }],
        transaction: options.transaction
    });

    const invalidSubjects = subjects.filter(sub => {
        const catType = (sub.category?.type || '').toUpperCase();
        return catType !== expectedCategoryType;
    });

    if (invalidSubjects.length > 0) {
        const invalidNames = invalidSubjects.map(s => `"${s.name}"`).join(', ');
        throw new AppError(
            `A professional of type "${normalizedType}" cannot be assigned ${disallowedDesc} subjects (${invalidNames}). Only ${allowedDesc} are allowed for a ${normalizedType}.`,
            400
        );
    }

    return subjects;
};

module.exports = {
    validateTutorSubjects,
};

