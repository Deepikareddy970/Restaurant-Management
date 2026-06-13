const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id/history', orderController.getOrderHistory);

// Employee, Manager, Admin access
router.patch('/:id/status', restrictTo('ADMIN', 'MANAGER', 'EMPLOYEE'), orderController.updateOrderStatus);
router.patch('/:id/assign', restrictTo('ADMIN', 'MANAGER', 'EMPLOYEE'), orderController.assignEmployee);

module.exports = router;
