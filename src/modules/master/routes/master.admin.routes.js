const express = require('express');
const masterController = require('../controllers/master.admin.controller');
const { protect } = require('../../../shared/middlewares/auth.middleware');
const { requireRole } = require('../../../shared/middlewares/role.middleware');
const validate = require('../../../shared/middlewares/validate.middleware');
const {
    categoryIdParamsSchema,
    subjectIdParamsSchema,
    createCategorySchema,
    updateCategorySchema,
    createSubjectSchema,
    updateSubjectSchema,
} = require('../validators/master.validator');

const router = express.Router();

router.use(protect);
router.use(requireRole('admin', 'ADMIN'));

router.get('/categories', masterController.getCategories);
router.post('/categories', validate(createCategorySchema), masterController.createCategory);
router.patch('/categories/:categoryId', validate(categoryIdParamsSchema, 'params'), validate(updateCategorySchema), masterController.updateCategory);
router.post('/categories/:categoryId/subjects', validate(categoryIdParamsSchema, 'params'), validate(createSubjectSchema), masterController.createSubject);
router.patch('/subjects/:subjectId', validate(subjectIdParamsSchema, 'params'), validate(updateSubjectSchema), masterController.updateSubject);

module.exports = router;