const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/authenticate');
const taskController = require('../controllers/taskController');

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(taskController.list));
router.post('/', asyncHandler(taskController.create));
router.get('/:id', asyncHandler(taskController.getOne));
router.patch('/:id', asyncHandler(taskController.update));
router.delete('/:id', asyncHandler(taskController.remove));

module.exports = router;
