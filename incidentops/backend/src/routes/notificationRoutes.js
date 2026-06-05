const express = require('express');
const { listNotifications, markRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);
router.get('/', listNotifications);
router.patch('/:id/read', markRead);
module.exports = router;
