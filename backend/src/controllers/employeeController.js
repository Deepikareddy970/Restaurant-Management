const User = require('../models/User');
const Order = require('../models/Order');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');

// 1. Get List of Employees (restricted to ADMIN, MANAGER)
const getEmployeesList = async (req, res) => {
  try {
    const employees = await User.find({ role: { $in: ['EMPLOYEE', 'MANAGER'] } })
      .select('-password -refreshToken -otpCode -otpExpiresAt')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error('Fetch Employees List Error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing employees.' });
  }
};

// 2. Get Employee Performance Dashboard Reports
const getEmployeePerformance = async (req, res) => {
  try {
    const employees = await User.find({ role: { $in: ['EMPLOYEE', 'MANAGER'] } })
      .select('name email employeeId role createdAt')
      .lean();

    const performanceRecords = await Promise.all(
      employees.map(async (emp) => {
        const [ordersHandled, attendanceStats] = await Promise.all([
          // Count orders processed by this employee
          Order.countDocuments({ 'assignedEmployee.id': emp._id }),
          // Aggregate attendance stats
          Attendance.aggregate([
            { $match: { userId: emp._id } },
            {
              $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                presentCount: {
                  $sum: { $cond: [{ $in: ['$status', ['PRESENT', 'LATE']] }, 1, 0] },
                },
                lateCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] },
                },
                rejectedCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] },
                },
                totalHours: { $sum: '$workHours' },
              },
            },
          ]),
        ]);

        const stats = attendanceStats[0] || {
          totalSessions: 0,
          presentCount: 0,
          lateCount: 0,
          rejectedCount: 0,
          totalHours: 0,
        };

        const totalHoursWorked = Math.round((stats.totalHours || 0) * 100) / 100;
        
        // Attendance compliance rating
        let complianceRating = 100;
        if (stats.presentCount > 0) {
          complianceRating = Math.round(((stats.presentCount - stats.lateCount) / stats.presentCount) * 100);
        } else if (stats.totalSessions > 0) {
          complianceRating = 0; // all clock-ins rejected
        }

        return {
          id: emp._id,
          name: emp.name,
          employeeId: emp.employeeId,
          role: emp.role,
          ordersCompleted: ordersHandled,
          totalHoursWorked,
          attendanceSessions: stats.totalSessions,
          daysPresent: stats.presentCount,
          daysLate: stats.lateCount,
          gpsRejections: stats.rejectedCount,
          complianceRating,
        };
      })
    );

    return res.status(200).json({
      success: true,
      performance: performanceRecords,
    });
  } catch (error) {
    console.error('Fetch Employee Performance Error:', error);
    return res.status(500).json({ success: false, message: 'Server error aggregating performance logs.' });
  }
};

// 3. Get System Audit Trail (Restricted to ADMIN)
const getAuditLogs = async (req, res) => {
  try {
    const { limit, action } = req.query;
    const filter = {};
    if (action) {
      filter.action = action;
    }

    const queryLimit = parseInt(limit) || 200;
    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email employeeId role')
      .sort({ timestamp: -1 })
      .limit(queryLimit);

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('Fetch Audit Logs Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching audit trail.' });
  }
};

module.exports = {
  getEmployeesList,
  getEmployeePerformance,
  getAuditLogs,
};
