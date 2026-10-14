const { Category, Subject, TutorProfile, ChildProfile } = require('../../users/models');
const { Op } = require('sequelize');
const AppError = require('../../../shared/utils/AppError');

const ensureUniqueName = async (model, name, excludedId) => {
    const where = { name };
    if (excludedId) where.id = { [Op.ne]: excludedId };
    const existing = await model.findOne({ where });
    if (existing) throw new AppError('An item with this name already exists.', 409);
};

const ensureSubjectNameCanChange = async (subjectId) => {
    const [tutorCount, childCount] = await Promise.all([
        TutorProfile.count({
            include: [{ model: Subject, as: 'subjects', where: { id: subjectId }, through: { attributes: [] }, required: true }],
            distinct: true,
        }),
        ChildProfile.count({
            include: [{ model: Subject, as: 'subjects', where: { id: subjectId }, through: { attributes: [] }, required: true }],
            distinct: true,
        }),
    ]);

    if (tutorCount || childCount) {
        throw new AppError('This subject is already used by tutor or child profiles and cannot be renamed. Deactivate it and create a replacement to preserve existing profile links.', 409);
    }
};

const categoryInclude = [{
    model: Subject,
    as: 'subjects',
    required: false,
}];

const getAdminCategories = async () => Category.findAll({
    include: categoryInclude,
    order: [['type', 'ASC'], ['name', 'ASC'], [{ model: Subject, as: 'subjects' }, 'name', 'ASC']],
});

const createCategory = async ({ name, type }) => {
    await ensureUniqueName(Category, name);
    return Category.create({ name, type });
};

const updateCategory = async (categoryId, changes) => {
    const category = await Category.findByPk(categoryId);
    if (!category) throw new AppError('Category not found.', 404);

    if (changes.name && changes.name !== category.name) await ensureUniqueName(Category, changes.name, categoryId);
    await category.update(changes);
    return Category.findByPk(categoryId, { include: categoryInclude });
};

const createSubject = async (categoryId, { name }) => {
    const category = await Category.findByPk(categoryId);
    if (!category) throw new AppError('Category not found.', 404);

    if (!category.isActive) {
        throw new AppError('Cannot add a subject to an inactive category.', 409);
    }

    await ensureUniqueName(Subject, name);
    return Subject.create({ name, categoryId });
};

const updateSubject = async (subjectId, changes) => {
    const subject = await Subject.findByPk(subjectId);
    if (!subject) throw new AppError('Subject not found.', 404);

    if (changes.name && changes.name !== subject.name) {
        await ensureSubjectNameCanChange(subjectId);
        await ensureUniqueName(Subject, changes.name, subjectId);
    }
    if (changes.categoryId) {
        const category = await Category.findByPk(changes.categoryId);
        if (!category) throw new AppError('Category not found.', 404);
        if (!category.isActive && changes.categoryId !== subject.categoryId) {
            throw new AppError('Cannot move a subject into an inactive category.', 409);
        }
    }

    await subject.update(changes);
    return Subject.findByPk(subjectId, {
        include: [{ model: Category, as: 'category' }],
    });
};

module.exports = {
    getAdminCategories,
    createCategory,
    updateCategory,
    createSubject,
    updateSubject,
};