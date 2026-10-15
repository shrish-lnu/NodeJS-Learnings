const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const adminController = require('../controllers/adminController');

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/users', asyncHandler(adminController.getAllUsers));
router.get('/tasks', asyncHandler(adminController.getAllTasks));
router.post('/cleanup-tokens', asyncHandler(adminController.cleanupTokens));
router.post('/trigger-reminders', asyncHandler(adminController.triggerReminders));

module.exports = router;
