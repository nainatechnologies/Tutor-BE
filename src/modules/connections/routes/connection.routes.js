const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connection.controller');
const { protect } = require('../../../shared/middlewares/auth.middleware');

// All connection routes require authentication
router.use(protect);

// GET /api/connections
router.get('/', connectionController.getMyConnections);

// POST /api/connections (Creates new request OR updates status if connectionId is provided)
router.post('/', connectionController.manageConnection);

module.exports = router;
