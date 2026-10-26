const express = require('express');
const { dashboard } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, dashboard); // GET /dashboard: any logged-in user, their own profile

module.exports = router;
