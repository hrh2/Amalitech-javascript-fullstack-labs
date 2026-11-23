const express = require('express');

const router = express.Router();

// For uptime monitors and the deployment platform. It only says "the process is alive": no database call, so it
// answers fast and never fails because of a slow query.
router.get('/', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

module.exports = router;
