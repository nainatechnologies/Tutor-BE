const masterService = require('../services/master.service');

const getCategories = async (req, res, next) => {
    try {
        const data = await masterService.getAdminCategories();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const createCategory = async (req, res, next) => {
    try {
        const data = await masterService.createCategory(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const data = await masterService.updateCategory(req.params.categoryId, req.body);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const createSubject = async (req, res, next) => {
    try {
        const data = await masterService.createSubject(req.params.categoryId, req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const updateSubject = async (req, res, next) => {
    try {
        const data = await masterService.updateSubject(req.params.subjectId, req.body);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    createSubject,
    updateSubject,
};