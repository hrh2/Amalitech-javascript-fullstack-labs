const express = require('express');
const controller = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { parseId } = require('../utils/validators');
const { sendError } = require('../utils/responses');

const router = express.Router();

// Every task route requires a logged-in user. Who may do what is decided in the controller (owner / admin).
router.use(authenticateToken);

router.param('id', (req, res, next, value) => {
  const id = parseId(value);
  if (id === null) {
    return sendError(res, 400, 'id must be a valid 24-character ObjectId');
  }
  req.taskId = id;
  next();
});

router.route('/').get(controller.getTasks).post(controller.createTask);

router
  .route('/:id')
  .get(controller.getTask)
  .put(controller.replaceTask)
  .patch(controller.updateTask)
  .delete(controller.deleteTask);

module.exports = router;
