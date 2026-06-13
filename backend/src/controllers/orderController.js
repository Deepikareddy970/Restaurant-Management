const Order = require('../models/Order');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// 1. Create/Place Order
const createOrder = async (req, res) => {
  try {
    const { items, customerName, totalAmount } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Please add items.' });
    }

    let resolvedCustomerName = customerName || req.user.name;
    let customerId = req.user.role === 'CUSTOMER' ? req.user._id : undefined;

    // Calculate total from items to ensure security
    let computedTotal = 0;
    const itemsList = items.map((item) => {
      computedTotal += item.price * item.quantity;
      return {
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      };
    });

    const finalTotal = totalAmount || computedTotal;

    const order = new Order({
      customerId,
      customerName: resolvedCustomerName,
      items: itemsList,
      totalAmount: finalTotal,
      status: 'PENDING',
      history: [
        {
          status: 'PENDING',
          updatedBy: `${req.user.name} (${req.user.role})`,
          notes: 'Order placed successfully.',
          timestamp: new Date(),
        },
      ],
    });

    await order.save();

    // Log to Audit trail
    await AuditLog.create({
      userId: req.user._id,
      action: 'ORDER_CREATE',
      details: `Created order ${order.orderNumber} for $${finalTotal.toFixed(2)}`,
      ipAddress: req.ip,
    });

    // Broadcast real-time Socket.IO notification
    const io = req.app.get('io');
    if (io) {
      io.emit('newOrderAlert', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    return res.status(500).json({ success: false, message: 'Server error placing order.' });
  }
};

// 2. Get All Orders / Filtered
const getOrders = async (req, res) => {
  try {
    const { status, search, limit } = req.query;
    const filter = {};

    // Customers should only see their own order history
    if (req.user.role === 'CUSTOMER') {
      filter.customerId = req.user._id;
    } else {
      // Admin, Manager, and Employee filters
      if (status) {
        filter.status = status;
      }
      if (search) {
        // Search by order number or customer name
        filter.$or = [
          { orderNumber: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } },
        ];
      }
    }

    const orderLimit = parseInt(limit) || 100;
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(orderLimit);

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching orders.' });
  }
};

// 3. Update Order Status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.status = status;
    order.history.push({
      status,
      updatedBy: `${req.user.name} (${req.user.role})`,
      notes: notes || `Order status updated to ${status}`,
      timestamp: new Date(),
    });

    await order.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'ORDER_STATUS_UPDATE',
      details: `Updated order ${order.orderNumber} status to ${status}`,
      ipAddress: req.ip,
    });

    // Real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdate', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedBy: req.user.name,
        notes: notes || `Order status updated to ${status}`,
        history: order.history,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status} successfully.`,
      order,
    });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating order status.' });
  }
};

// 4. Accept/Assign Employee to Order
const assignEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    let employeeId = req.body.employeeId; // optional - Managers can assign specific employees
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    let targetEmployee = req.user;

    // If a manager/admin specifies a custom employee to handle the order
    if (employeeId && ['ADMIN', 'MANAGER'].includes(req.user.role)) {
      const foundEmp = await User.findOne({ employeeId, role: { $in: ['EMPLOYEE', 'MANAGER'] } });
      if (!foundEmp) {
        return res.status(404).json({ success: false, message: 'Employee not found.' });
      }
      targetEmployee = foundEmp;
    }

    // Update assignment details
    order.assignedEmployee = {
      id: targetEmployee._id,
      name: targetEmployee.name,
      employeeId: targetEmployee.employeeId,
      assignedAt: new Date(),
    };

    // Auto-advance to PREPARING if order was PENDING
    if (order.status === 'PENDING') {
      order.status = 'PREPARING';
    }

    order.history.push({
      status: order.status,
      updatedBy: `${req.user.name} (${req.user.role})`,
      notes: `Order assigned to/accepted by ${targetEmployee.name} (${targetEmployee.employeeId})`,
      timestamp: new Date(),
    });

    await order.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'ORDER_ASSIGNMENT',
      details: `Assigned order ${order.orderNumber} to ${targetEmployee.name} (${targetEmployee.employeeId})`,
      ipAddress: req.ip,
    });

    // Real-time broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdate', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        assignedEmployee: order.assignedEmployee,
        history: order.history,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order successfully assigned to ${targetEmployee.name}.`,
      order,
    });
  } catch (error) {
    console.error('Assign Order Error:', error);
    return res.status(500).json({ success: false, message: 'Server error assigning order.' });
  }
};

// 5. Get Order Details & History Timeline
const getOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Customers can only see their own order history
    if (req.user.role === 'CUSTOMER' && order.customerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order.' });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Get Order History Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching history.' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  assignEmployee,
  getOrderHistory,
};
