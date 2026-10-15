const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/upload');
const taskController = require('../controllers/taskController');

const router = Router();

router.use(authenticate);

// Static routes first — must come before /:id to avoid "report" being matched as a task ID
router.get('/report', asyncHandler(taskController.downloadReport));

// CRUD
router.get('/', asyncHandler(taskController.list));
router.post('/', asyncHandler(taskController.create));
router.get('/:id', asyncHandler(taskController.getOne));
router.patch('/:id', asyncHandler(taskController.update));
router.delete('/:id', asyncHandler(taskController.remove));

// File attachments
router.post('/:id/attachments', upload.single('file'), asyncHandler(taskController.uploadAttachment));
router.get('/:id/attachments/:filename', asyncHandler(taskController.downloadAttachment));

module.exports = router;
