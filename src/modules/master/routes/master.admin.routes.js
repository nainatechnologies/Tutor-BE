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

const validateRequest = (paramsSchema, bodySchema, controller) => (req, res, next) => {
    const runBody = () => (bodySchema ? validate(bodySchema)(req, res, next) : controller(req, res, next));
    if (paramsSchema) return validate(paramsSchema, 'params')(req, res, runBody);
    return runBody();
};

router.use(protect);
router.use(requireRole('admin', 'ADMIN'));

router.get('/categories', masterController.getCategories);
router.post('/categories', validate(createCategorySchema), masterController.createCategory);
router.patch('/categories/:categoryId', validateRequest(categoryIdParamsSchema, updateCategorySchema, masterController.updateCategory));
router.post('/categories/:categoryId/subjects', validateRequest(categoryIdParamsSchema, createSubjectSchema, masterController.createSubject));
router.patch('/subjects/:subjectId', validateRequest(subjectIdParamsSchema, updateSubjectSchema, masterController.updateSubject));

module.exports = router;