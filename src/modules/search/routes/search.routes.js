const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

// Public or Protected depending on requirements.
// Usually search is public or at least accessible to any logged-in parent.
router.get('/tutors', searchController.searchTutors);

module.exports = router;
