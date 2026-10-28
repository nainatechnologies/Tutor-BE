const { Category: MasterCategory, Subject: MasterSubject } = require('../../users/models');
const sequelize = require('../../../config/database');

const getCategoriesAndSubjects = async (req, res, next) => {
    try {
        const categories = await MasterCategory.findAll({
            where: { isActive: true },
            include: [
                {
                    model: MasterSubject,
                    as: 'subjects',
                    where: { isActive: true },
                    required: false, // LEFT JOIN so we get categories even if they have no active subjects
                    attributes: {
                        include: [
                            [
                                sequelize.literal(`COALESCE((
                                    SELECT COUNT(DISTINCT ts.tutorProfileId)
                                    FROM tutor_subjects AS ts
                                    INNER JOIN tutor_profiles AS tp ON tp.id = ts.tutorProfileId
                                    INNER JOIN users AS u ON u.id = tp.userId
                                    WHERE ts.subjectId = \`subjects\`.\`id\`
                                      AND tp.approvalStatus = 'approved'
                                      AND tp.verified = 1
                                      AND u.status = 'ACTIVE'
                                ), 0)`),
                                'tutorCount'
                            ]
                        ]
                    }
                }
            ],
            order: [
                ['name', 'ASC'],
                [{ model: MasterSubject, as: 'subjects' }, 'name', 'ASC']
            ]
        });

        // Ensure tutorCount is converted to clean integer
        const formatted = categories.map(cat => {
            const catJson = cat.toJSON();
            if (catJson.subjects && Array.isArray(catJson.subjects)) {
                catJson.subjects = catJson.subjects.map(sub => ({
                    ...sub,
                    tutorCount: parseInt(sub.tutorCount || 0, 10)
                }));
            }
            return catJson;
        });

        res.status(200).json({
            status: 'success',
            data: formatted,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategoriesAndSubjects,
};
