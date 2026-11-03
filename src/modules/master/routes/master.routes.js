const express = require('express');
const router = express.Router();
const masterController = require('../controllers/master.controller');

router.get('/categories', masterController.getCategoriesAndSubjects);
router.get('/conditions', masterController.getConditions);

module.exports = router;
