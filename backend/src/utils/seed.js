require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://localhost:27017/epitome';
    console.log(`[Seed] Connecting to: ${connString}`);
    await mongoose.connect(connString);
    console.log('[Seed] Connected.');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Order.deleteMany({}),
      Attendance.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('[Seed] Cleared existing records.');

    // Create user accounts
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);

    const admin = await User.create({
      name: 'Elena Vance',
      email: 'admin@epitome.com',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    const manager = await User.create({
      name: 'Marcus Brody',
      email: 'manager@epitome.com',
      password: passwordHash,
      role: 'MANAGER',
      status: 'ACTIVE',
    });

    const employee = await User.create({
      name: 'Sarah Connor',
      email: 'employee@epitome.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    });

    const customer = await User.create({
      name: 'John Doe',
      email: 'customer@epitome.com',
      password: passwordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });

    console.log('[Seed] Default accounts generated:');
    console.log(' - Admin: admin@epitome.com / Password@123');
    console.log(' - Manager: manager@epitome.com / Password@123');
    console.log(' - Employee: employee@epitome.com / Password@123');
    console.log(' - Customer: customer@epitome.com / Password@123');

    // Create mock order history over the last 30 days
    const itemsPool = [
      { name: 'Truffle Mushroom Pasta', price: 18.5 },
      { name: 'Smashed Avocado Toast', price: 12.0 },
      { name: 'Belgian Chocolate Lava Cake', price: 8.5 },
      { name: 'Iced Matcha Latte', price: 5.5 },
      { name: 'Ribeye Steak w/ Asparagus', price: 34.0 },
      { name: 'Crispy Garlic Parmesan Wings', price: 10.5 },
      { name: 'Classic Caesar Salad', price: 11.0 },
    ];

    const customerNames = [
      'John Doe', 'Alice Cooper', 'Bob Marley', 'Clara Oswald', 
      'David Miller', 'Emma Watson', 'Frank Sinatra', 'Grace Hopper'
    ];

    const orders = [];
    const now = new Date();

    // Create about 65 orders distributed over the last 30 days
    for (let i = 0; i < 65; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);
      const orderDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));

      // Decide how many items this order contains (1 to 4)
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const orderItems = [];
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const poolItem = itemsPool[Math.floor(Math.random() * itemsPool.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        orderItems.push({
          name: poolItem.name,
          quantity,
          price: poolItem.price,
        });
        totalAmount += poolItem.price * quantity;
      }

      // Determine status (older orders are DELIVERED, newer ones could be PENDING/PREPARING/READY)
      let status = 'DELIVERED';
      if (daysAgo === 0) {
        const rand = Math.random();
        if (rand < 0.2) status = 'PENDING';
        else if (rand < 0.5) status = 'PREPARING';
        else if (rand < 0.8) status = 'READY';
      } else if (daysAgo < 3 && Math.random() < 0.1) {
        status = 'CANCELLED';
      }

      const assignedEmployee = (status !== 'PENDING' && status !== 'CANCELLED') ? {
        id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        assignedAt: new Date(orderDate.getTime() + 5 * 60 * 1000), // 5 min later
      } : undefined;

      const hist = [
        { status: 'PENDING', updatedBy: 'System', notes: 'Order placed', timestamp: orderDate }
      ];

      if (assignedEmployee) {
        hist.push({
          status: 'PREPARING',
          updatedBy: `${employee.name} (Employee)`,
          notes: 'Accepted order and started preparation.',
          timestamp: assignedEmployee.assignedAt,
        });
      }

      if (status === 'READY' || status === 'DELIVERED') {
        hist.push({
          status: 'READY',
          updatedBy: `${employee.name} (Employee)`,
          notes: 'Order prepared and ready for pick up.',
          timestamp: new Date(orderDate.getTime() + 25 * 60 * 1000),
        });
      }

      if (status === 'DELIVERED') {
        hist.push({
          status: 'DELIVERED',
          updatedBy: `${employee.name} (Employee)`,
          notes: 'Order handed over to customer.',
          timestamp: new Date(orderDate.getTime() + 35 * 60 * 1000),
        });
      }

      const orderNumber = `ORD-${10001 + i}`;
      orders.push({
        orderNumber,
        customerId: Math.random() > 0.3 ? customer._id : undefined,
        customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
        items: orderItems,
        totalAmount,
        status,
        assignedEmployee,
        history: hist,
        createdAt: orderDate,
        updatedAt: orderDate,
      });
    }

    await Order.insertMany(orders);
    console.log(`[Seed] Seeded ${orders.length} mock orders.`);

    // Seed attendance records for the employee over the last 14 days
    const attendanceRecords = [];
    for (let d = 0; d < 14; d++) {
      // Don't clock in on weekends (e.g. days 5, 6, 12, 13)
      if (d % 7 === 5 || d % 7 === 6) continue;

      const date = new Date(now.getTime() - (d * 24 * 60 * 60 * 1000));
      
      // Clock in around 8:45 AM to 9:20 AM
      const isLate = d === 3 || d === 8; // Simulate some late days
      const hr = isLate ? 9 : 8;
      const min = isLate ? Math.floor(Math.random() * 15) + 20 : Math.floor(Math.random() * 30) + 30; // 8:30-9:00 or 9:20-9:35
      
      const clockInTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hr, min, 0);
      
      // Clock out after 8-9 hours
      const workHours = 8.0 + Math.random();
      const clockOutTime = new Date(clockInTime.getTime() + workHours * 60 * 60 * 1000);

      // Distance close to restaurant (within 100m)
      const distanceMeters = Math.random() * 85; 

      attendanceRecords.push({
        userId: employee._id,
        photoUrl: '/uploads/attendance/selfie-seed.jpg',
        latitude: 12.9715987 + (Math.random() - 0.5) * 0.0008,
        longitude: 77.5945627 + (Math.random() - 0.5) * 0.0008,
        distanceMeters,
        status: isLate ? 'LATE' : 'PRESENT',
        clockInTime,
        clockOutTime,
        workHours: Math.round(workHours * 100) / 100,
        createdAt: clockInTime,
      });
    }

    // Add one rejected attendance (GPS failure) 4 days ago
    const rejectedDate = new Date(now.getTime() - (4 * 24 * 60 * 60 * 1000));
    const clockInRejected = new Date(rejectedDate.getFullYear(), rejectedDate.getMonth(), rejectedDate.getDate(), 9, 2, 0);
    attendanceRecords.push({
      userId: employee._id,
      photoUrl: '/uploads/attendance/selfie-seed-fail.jpg',
      latitude: 13.0826802, // Far away (Chennai coordinates)
      longitude: 80.2707184,
      distanceMeters: 260000, // 260 km away!
      status: 'REJECTED',
      clockInTime: clockInRejected,
      clockOutTime: clockInRejected,
      workHours: 0,
      createdAt: clockInRejected,
    });

    await Attendance.insertMany(attendanceRecords);
    console.log(`[Seed] Seeded ${attendanceRecords.length} attendance records.`);

    // Seed audit logs
    const auditLogs = [
      { action: 'SYSTEM_STARTUP', details: 'Database seeded successfully', timestamp: new Date() }
    ];
    await AuditLog.insertMany(auditLogs);
    console.log('[Seed] Seeding completed successfully.');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
