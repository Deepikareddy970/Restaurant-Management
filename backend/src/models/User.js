const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // Optional if logging in/registering via Google OAuth
      required: function () {
        return !this.googleId;
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER'],
      default: 'CUSTOMER',
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true, // Allows nulls to be unique
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'BLOCKED'],
      default: 'PENDING',
    },
    performance: {
      totalOrdersHandled: {
        type: Number,
        default: 0,
      },
      lateClockIns: {
        type: Number,
        default: 0,
      },
    },
    otpCode: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
    googleId: {
      type: String,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save validation to auto-assign sequential Employee IDs if role is EMPLOYEE/MANAGER
userSchema.pre('validate', async function (next) {
  if ((this.role === 'EMPLOYEE' || this.role === 'MANAGER') && !this.employeeId) {
    try {
      // Find the user with the highest employeeId
      const lastUser = await this.constructor.findOne(
        { employeeId: { $exists: true } },
        {},
        { sort: { employeeId: -1 } }
      );

      let nextId = 1001;
      if (lastUser && lastUser.employeeId) {
        const numericPart = parseInt(lastUser.employeeId.replace('EMP-', ''));
        if (!isNaN(numericPart)) {
          nextId = numericPart + 1;
        }
      }
      this.employeeId = `EMP-${nextId}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
