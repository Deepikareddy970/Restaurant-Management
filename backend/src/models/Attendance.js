const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    photoUrl: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    distanceMeters: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'LATE', 'REJECTED'],
      required: true,
    },
    clockInTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    clockOutTime: {
      type: Date,
    },
    workHours: {
      type: Number, // In hours (e.g. 8.5)
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
