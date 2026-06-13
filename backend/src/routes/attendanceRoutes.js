const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, restrictTo } = require('../middleware/auth');

// All attendance operations require authentication
router.use(protect);

router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/history', attendanceController.getMyHistory);

// Admin & Manager access only
router.get('/all', restrictTo('ADMIN', 'MANAGER'), attendanceController.getAllLogs);

module.exports = router;
