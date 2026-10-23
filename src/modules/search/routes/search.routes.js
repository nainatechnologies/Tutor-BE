const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const validate = require('../../../shared/middlewares/validate.middleware');
const { searchTutorsQuerySchema, tutorIdParamSchema } = require('../validators/search.validator');

// Public or Protected depending on requirements.
// Usually search is public or at least accessible to any logged-in parent.
router.get('/tutors', validate(searchTutorsQuerySchema, 'query'), searchController.searchTutors);
router.get('/tutors/:id', validate(tutorIdParamSchema, 'params'), searchController.getTutorById);

module.exports = router;
