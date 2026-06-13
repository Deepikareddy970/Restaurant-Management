const Order = require('../models/Order');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { generatePDFReport, generateExcelReport } = require('../utils/reports');

// Helper to get start times
const getDateRanges = () => {
  const now = new Date();
  
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return { startOfDay, startOfWeek, startOfMonth };
};

// 1. Get Analytics Summary Metrics
const getSummary = async (req, res) => {
  try {
    const { startOfDay, startOfWeek, startOfMonth } = getDateRanges();

    // Queries for revenue and order count
    const [
      dailyStats,
      weeklyStats,
      monthlyStats,
      activeEmployees,
      totalOrdersCount
    ] = await Promise.all([
      // Daily revenue & count
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay }, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      // Weekly revenue & count
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek }, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      // Monthly revenue & count
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      // Active employees logged in today
      User.countDocuments({ role: { $in: ['EMPLOYEE', 'MANAGER'] }, status: 'ACTIVE' }),
      Order.countDocuments()
    ]);

    const dailyRevenue = dailyStats[0]?.total || 0;
    const dailyCount = dailyStats[0]?.count || 0;

    const weeklyRevenue = weeklyStats[0]?.total || 0;
    const weeklyCount = weeklyStats[0]?.count || 0;

    const monthlyRevenue = monthlyStats[0]?.total || 0;
    const monthlyCount = monthlyStats[0]?.count || 0;

    return res.status(200).json({
      success: true,
      summary: {
        dailyRevenue,
        dailyOrders: dailyCount,
        weeklyRevenue,
        weeklyOrders: weeklyCount,
        monthlyRevenue,
        monthlyOrders: monthlyCount,
        activeEmployees,
        totalOrders: totalOrdersCount
      }
    });
  } catch (error) {
    console.error('Analytics Summary Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving summary.' });
  }
};

// 2. Get Advanced Chart & Details Analytics
const getChartsData = async (req, res) => {
  try {
    // 1. Top Selling Items
    const topItems = await Order.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $project: { name: '$_id', _id: 0, quantity: 1, revenue: 1 } },
      { $sort: { quantity: -1 } },
      { $limit: 5 }
    ]);

    // 2. Peak Order Hours
    const peakHours = await Order.aggregate([
      {
        $project: {
          hour: { $hour: '$createdAt' }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      { $project: { hour: '$_id', _id: 0, count: 1 } },
      { $sort: { hour: 1 } } // Sort chronologically 0-23
    ]);

    // Fill missing hours with 0
    const fullHours = Array.from({ length: 24 }, (_, i) => {
      const match = peakHours.find(h => h.hour === i);
      return { hour: `${i}:00`, count: match ? match.count : 0 };
    });

    // 3. Customer Statistics
    const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' });
    const orderFrequency = await Order.aggregate([
      { $group: { _id: '$customerId', count: { $sum: 1 } } },
      { $group: { _id: null, avgOrdersPerCustomer: { $avg: '$count' } } }
    ]);

    const avgOrders = orderFrequency[0]?.avgOrdersPerCustomer 
      ? Math.round(orderFrequency[0].avgOrdersPerCustomer * 10) / 10 
      : 0;

    return res.status(200).json({
      success: true,
      charts: {
        topSellingItems: topItems,
        peakHours: fullHours,
        customerStats: {
          totalRegisteredCustomers: totalCustomers,
          averageOrdersPerCustomer: avgOrders
        }
      }
    });
  } catch (error) {
    console.error('Analytics Charts Error:', error);
    return res.status(500).json({ success: false, message: 'Server error compiling chart data.' });
  }
};

// Compile aggregate data package for reports
const compileReportDataset = async () => {
  const { startOfMonth } = getDateRanges();

  const [
    revenueAgg,
    orders,
    attendance,
    topItems,
    activeEmployeesCount,
    totalOrdersCount
  ] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.find().sort({ createdAt: -1 }),
    Attendance.find().populate('userId', 'name employeeId').sort({ clockInTime: -1 }),
    Order.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $project: { name: '$_id', _id: 0, quantity: 1, revenue: 1 } },
      { $sort: { quantity: -1 } },
      { $limit: 10 }
    ]),
    User.countDocuments({ role: { $in: ['EMPLOYEE', 'MANAGER'] }, status: 'ACTIVE' }),
    Order.countDocuments()
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;

  // Format orders for PDF preview table
  const recentOrders = orders.slice(0, 8).map(o => ({
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    totalAmount: o.totalAmount,
    status: o.status,
    handler: o.assignedEmployee?.name || 'Unassigned'
  }));

  return {
    summary: {
      totalRevenue,
      totalOrders: totalOrdersCount,
      activeEmployees: activeEmployeesCount
    },
    topItems,
    recentOrders,
    orders,
    attendance
  };
};

// 3. Download PDF Report
const downloadPDF = async (req, res) => {
  try {
    const reportData = await compileReportDataset();
    const pdfBuffer = await generatePDFReport(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Epitome_Report_${Date.now()}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Download PDF Error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating PDF report.' });
  }
};

// 4. Download Excel Report
const downloadExcel = async (req, res) => {
  try {
    const reportData = await compileReportDataset();
    const excelBuffer = await generateExcelReport(reportData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Epitome_Report_${Date.now()}.xlsx`);
    return res.send(excelBuffer);
  } catch (error) {
    console.error('Download Excel Error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating Excel report.' });
  }
};

module.exports = {
  getSummary,
  getChartsData,
  downloadPDF,
  downloadExcel
};
