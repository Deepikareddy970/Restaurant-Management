const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    assignedEmployee: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      name: {
        type: String,
      },
      employeeId: {
        type: String,
      },
      assignedAt: {
        type: Date,
      },
    },
    history: [
      {
        status: {
          type: String,
          required: true,
        },
        updatedBy: {
          type: String, // E.g. "Jane Doe (Manager)"
          required: true,
        },
        notes: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save validation to auto-generate order number (e.g. ORD-10001)
orderSchema.pre('validate', async function (next) {
  if (!this.orderNumber) {
    try {
      const lastOrder = await this.constructor.findOne(
        {},
        {},
        { sort: { orderNumber: -1 } }
      );
      let nextNum = 10001;
      if (lastOrder && lastOrder.orderNumber) {
        const numericPart = parseInt(lastOrder.orderNumber.replace('ORD-', ''));
        if (!isNaN(numericPart)) {
          nextNum = numericPart + 1;
        }
      }
      this.orderNumber = `ORD-${nextNum}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
