const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);
router.use(restrictTo('ADMIN', 'MANAGER'));

router.get('/summary', analyticsController.getSummary);
router.get('/charts', analyticsController.getChartsData);
router.get('/reports/pdf', analyticsController.downloadPDF);
router.get('/reports/excel', analyticsController.downloadExcel);

module.exports = router;
