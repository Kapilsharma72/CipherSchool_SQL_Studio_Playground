const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', assignmentController.getAllAssignments);
router.get('/:id', assignmentController.getAssignment);

router.post('/:id/progress', protect, assignmentController.saveProgress);
router.get('/:id/progress', protect, assignmentController.getProgress);

module.exports = router;

