const { Category: MasterCategory, Subject: MasterSubject } = require('../../users/models');

const getCategoriesAndSubjects = async (req, res, next) => {
    try {
        const categories = await MasterCategory.findAll({
            where: { isActive: true },
            include: [
                {
                    model: MasterSubject,
                    as: 'subjects',
                    where: { isActive: true },
                    required: false // LEFT JOIN so we get categories even if they have no active subjects
                }
            ],
            order: [
                ['name', 'ASC'],
                [{ model: MasterSubject, as: 'subjects' }, 'name', 'ASC']
            ]
        });

        res.status(200).json({
            status: 'success',
            data: categories,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategoriesAndSubjects,
};
