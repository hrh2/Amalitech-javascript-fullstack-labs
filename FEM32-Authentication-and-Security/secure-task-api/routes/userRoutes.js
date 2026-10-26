const express = require('express');
const controller = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');
const { parseId } = require('../utils/validators');
const { sendError } = require('../utils/responses');

// Mounted twice in app.js:
//   /api/users            GET /, DELETE /:id         (the lab: admins view and manage users)
//   /admin                DELETE /user/:id           (the module's "Secure Portal" challenge path)
const router = express.Router();

// Everything here needs a valid token AND the admin role. Order matters: authenticate first.
router.use(authenticateToken, authorizeRole('admin'));

const checkId = (req, res, next) => {
  const id = parseId(req.params.id);
  if (id === null) return sendError(res, 400, 'id must be a valid 24-character ObjectId');
  req.userId = id;
  next();
};

router.get('/', controller.getUsers);
router.delete('/:id', checkId, controller.deleteUser);
router.delete('/user/:id', checkId, controller.deleteUser);

module.exports = router;
