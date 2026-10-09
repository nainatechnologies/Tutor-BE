const express = require('express');
const router = express.Router();
const masterController = require('../controllers/master.controller');

router.get('/categories', masterController.getCategoriesAndSubjects);

module.exports = router;
