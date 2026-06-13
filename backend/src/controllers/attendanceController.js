const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const { verifyRestaurantProximity } = require('../utils/gps');

// Setup multer storage for attendance selfies
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads/attendance');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `selfie-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname || '.jpg')}`);
  },
});

const uploadSelfie = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
}).single('photo');

// 1. Clock In
const clockIn = async (req, res) => {
  uploadSelfie(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { latitude, longitude } = req.body;
      if (!latitude || !longitude) {
        return res.status(400).json({ success: false, message: 'GPS coordinates (latitude & longitude) are required.' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Webcam selfie/photo is required for verification.' });
      }

      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);

      // Verify proximity to restaurant (100m threshold)
      const { isWithinRange, distanceMeters } = verifyRestaurantProximity(userLat, userLon);

      // Store selfie URL relative path
      const photoUrl = `/uploads/attendance/${req.file.filename}`;

      // Check if employee is already clocked in
      const activeAttendance = await Attendance.findOne({
        userId: req.user._id,
        clockOutTime: { $exists: false },
        status: { $ne: 'REJECTED' },
      });

      if (activeAttendance) {
        return res.status(400).json({
          success: false,
          message: 'You are already clocked in. Please clock out first.',
        });
      }

      // Late arrival tracking (e.g. shifts start at 9:00 AM)
      let status = 'PRESENT';
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Assume late if clocking in after 9:15 AM
      if (currentHour > 9 || (currentHour === 9 && currentMinute > 15)) {
        status = 'LATE';
      }

      // If outside 100m range, reject attendance
      if (!isWithinRange) {
        status = 'REJECTED';
        
        // Save rejected attendance record for audit trail
        await Attendance.create({
          userId: req.user._id,
          photoUrl,
          latitude: userLat,
          longitude: userLon,
          distanceMeters,
          status: 'REJECTED',
          clockInTime: now,
          clockOutTime: now,
          workHours: 0,
        });

        await AuditLog.create({
          userId: req.user._id,
          action: 'CLOCK_IN_REJECTED',
          details: `Rejected clock-in attempt. Distance: ${distanceMeters}m (Limit: 100m). Coordinates: ${userLat}, ${userLon}`,
          ipAddress: req.ip,
        });

        return res.status(400).json({
          success: false,
          message: `Clock-in rejected: You are ${distanceMeters}m away from the restaurant. Geofence boundary is 100m.`,
          distanceMeters,
        });
      }

      // Create successful attendance record
      const attendance = await Attendance.create({
        userId: req.user._id,
        photoUrl,
        latitude: userLat,
        longitude: userLon,
        distanceMeters,
        status,
        clockInTime: now,
      });

      await AuditLog.create({
        userId: req.user._id,
        action: 'CLOCK_IN_SUCCESS',
        details: `Successfully clocked in (${status}). Distance: ${distanceMeters}m`,
        ipAddress: req.ip,
      });

      // Emit attendance alert to Socket.IO if late
      if (req.app.get('io')) {
        req.app.get('io').emit('attendanceAlert', {
          employeeName: req.user.name,
          employeeId: req.user.employeeId,
          status,
          time: now,
          distanceMeters,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Clocked in successfully as ${status}.`,
        attendance,
      });
    } catch (error) {
      console.error('Clock-in Error:', error);
      return res.status(500).json({ success: false, message: 'Server error during clock-in.' });
    }
  });
};

// 2. Clock Out
const clockOut = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      userId: req.user._id,
      clockOutTime: { $exists: false },
      status: { $in: ['PRESENT', 'LATE'] },
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No active clock-in session found. Please clock in first.',
      });
    }

    const clockOutTime = new Date();
    const clockInTime = new Date(attendance.clockInTime);
    
    // Calculate total hours worked
    const diffMs = clockOutTime - clockInTime;
    const workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    attendance.clockOutTime = clockOutTime;
    attendance.workHours = workHours;
    await attendance.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'CLOCK_OUT_SUCCESS',
      details: `Clocked out successfully. Duration: ${workHours} hrs.`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Clocked out successfully.',
      attendance,
    });
  } catch (error) {
    console.error('Clock-out Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during clock-out.' });
  }
};

// 3. Get User Attendance History
const getMyHistory = async (req, res) => {
  try {
    const logs = await Attendance.find({ userId: req.user._id })
      .sort({ clockInTime: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('Fetch attendance logs error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching history.' });
  }
};

// 4. Get All Attendance Logs (Admin & Manager)
const getAllLogs = async (req, res) => {
  try {
    const { status, employeeId, startDate, endDate } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (employeeId) {
      // Find user first
      const emp = await User.findOne({ employeeId });
      if (emp) {
        filter.userId = emp._id;
      } else {
        // Return empty if employee not found
        return res.status(200).json({ success: true, logs: [] });
      }
    }

    if (startDate || endDate) {
      filter.clockInTime = {};
      if (startDate) {
        filter.clockInTime.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.clockInTime.$lte = end;
      }
    }

    const logs = await Attendance.find(filter)
      .populate('userId', 'name email employeeId role')
      .sort({ clockInTime: -1 });

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('Fetch all attendance error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching logs.' });
  }
};

module.exports = {
  clockIn,
  clockOut,
  getMyHistory,
  getAllLogs,
};
