const express = require('express');
const { register, login } = require('../controllers/authController');
const { createAuthLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(createAuthLimiter()); // brute-force protection on both credential endpoints
router.post('/register', register); // POST /auth/register   (public)
router.post('/login', login);       // POST /auth/login      (public)

module.exports = router;
