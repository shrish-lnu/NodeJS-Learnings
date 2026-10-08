const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const controller = require('../controllers/taskController');

const router = Router();

router.get('/', asyncHandler(controller.list));
router.post('/', asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.getOne));
router.put('/:id', asyncHandler(controller.replace));
router.patch('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
