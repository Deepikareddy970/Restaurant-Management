const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// Admin & Manager access
router.get('/', restrictTo('ADMIN', 'MANAGER'), employeeController.getEmployeesList);
router.get('/performance', restrictTo('ADMIN', 'MANAGER'), employeeController.getEmployeePerformance);

// Admin only access to System Audit Logs
router.get('/audit-logs', restrictTo('ADMIN'), employeeController.getAuditLogs);

module.exports = router;
