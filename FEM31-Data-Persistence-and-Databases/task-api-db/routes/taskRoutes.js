// Routing only: which URL and method goes to which controller function.
const express = require('express');
const controller = require('../controllers/taskController');
const { parseId } = require('../validators/taskValidator');

const router = express.Router();

// Runs once for every route that contains :id, so the id is validated in a single place.
router.param('id', (req, res, next, value) => {
  const id = parseId(value);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a valid 24-character ObjectId' });
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
