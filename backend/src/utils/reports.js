const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

// Generates a professional PDF report with tables and headers
const generatePDFReport = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header block
      doc.rect(0, 0, 595.28, 130).fill('#1e1b4b'); // Deep indigo background
      doc.fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(22)
        .text('GURAMRIT RESTAURANT PLATFORM', 50, 35);

      doc.fontSize(10)
        .font('Helvetica')
        .text('Restaurant Management System Report', 50, 65);

      doc.font('Helvetica-Oblique')
        .fontSize(9)
        .text(
          `Generated: ${new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata'
          })}`,
          380,
          20,
          {
            align: 'right',
            width: 180
          }
        );

      // Title Section
      doc.y = 160;
      doc.fillColor('#1e293b')
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('OPERATIONAL METRICS', 50, doc.y);
      doc.moveDown(0.5);

      // Draw grid boxes for cards
      const startY = doc.y;

      // Card 1: Revenue
      doc.rect(50, startY, 150, 60).fill('#e0e7ff');
      doc.fillColor('#1e1b4b').font('Helvetica-Bold').fontSize(10).text('TOTAL REVENUE', 60, startY + 10);
      doc.fontSize(14).text(`Rs. ${data.summary.totalRevenue.toFixed(2)}`, 60, startY + 30);

      // Card 2: Orders
      doc.rect(220, startY, 150, 60).fill('#dcfce7');
      doc.fillColor('#14532d').font('Helvetica-Bold').fontSize(10).text('TOTAL ORDERS', 230, startY + 10);
      doc.fontSize(14).text(`${data.summary.totalOrders}`, 230, startY + 30);

      // Card 3: Employees
      doc.rect(390, startY, 150, 60).fill('#fef9c3');
      doc.fillColor('#713f12').font('Helvetica-Bold').fontSize(10).text('ACTIVE STAFF', 400, startY + 10);
      doc.fontSize(14).text(`${data.summary.activeEmployees}`, 400, startY + 30);

      doc.y = startY + 80;

      // Table 1: Top Selling Items
      doc.fillColor('#1e293b')
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('TOP SELLING ITEMS', 50, doc.y);
      doc.moveDown(0.5);

      let tableY = doc.y;
      // Draw Header Row
      doc.rect(50, tableY, 490, 20).fill('#1e1b4b');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
      doc.text('Item Name', 60, tableY + 5);
      doc.text('Quantity Sold', 250, tableY + 5);
      doc.text('Total Revenue', 400, tableY + 5);
      tableY += 20;

      // Draw rows
      doc.font('Helvetica').fontSize(9).fillColor('#334155');
      data.topItems.forEach((item, index) => {
        // Alternating background
        if (index % 2 === 0) {
          doc.rect(50, tableY, 490, 18).fill('#f8fafc');
          doc.fillColor('#334155');
        }
        doc.text(item.name, 60, tableY + 5);
        doc.text(item.quantity.toString(), 250, tableY + 5);
        doc.text(`Rs. ${item.revenue.toFixed(2)}`, 400, tableY + 5);
        tableY += 18;
      });

      doc.y = tableY + 20;

      // Table 2: Recent Orders status
      doc.fillColor('#1e293b')
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('RECENT ORDERS SUMMARY', 50, doc.y);
      doc.moveDown(0.5);

      tableY = doc.y;
      doc.rect(50, tableY, 490, 20).fill('#1e1b4b');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
      doc.text('Order #', 60, tableY + 5);
      doc.text('Customer', 140, tableY + 5);
      doc.text('Amount', 280, tableY + 5);
      doc.text('Status', 360, tableY + 5);
      doc.text('Handler', 440, tableY + 5);
      tableY += 20;

      doc.font('Helvetica').fontSize(9).fillColor('#334155');
      data.recentOrders.forEach((order, index) => {
        if (index % 2 === 0) {
          doc.rect(50, tableY, 490, 18).fill('#f8fafc');
          doc.fillColor('#334155');
        }
        doc.text(order.orderNumber, 60, tableY + 5);
        doc.text(order.customerName, 140, tableY + 5, { width: 130, height: 12, ellipsis: true });
        doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, 280, tableY + 5);
        doc.text(order.status, 360, tableY + 5);
        doc.text(order.handler || 'Unassigned', 440, tableY + 5, { width: 95, height: 12, ellipsis: true });
        tableY += 18;
      });

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fillColor('#94a3b8')
          .font('Helvetica')
          .fontSize(8)
          .text('Guramrit Platform • Confidential Report', 50, 780, { align: 'left' });
        doc.text(`Page ${i + 1} of ${pages.count}`, 400, 780, { align: 'right', width: 145 });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generates an Excel report using SheetJS (xlsx)
const generateExcelReport = (data) => {
  const wb = XLSX.utils.book_new();

  // 1. Orders Sheet
  const ordersData = data.orders.map((ord) => ({
    'Order Number': ord.orderNumber,
    'Customer Name': ord.customerName,
    'Total Amount (₹)': ord.totalAmount,
    'Order Status': ord.status,
    'Assigned Employee': ord.assignedEmployee?.name || 'Unassigned',
    'Employee ID': ord.assignedEmployee?.employeeId || 'N/A',
    'Assigned Time': ord.assignedEmployee?.assignedAt ? new Date(ord.assignedEmployee.assignedAt).toLocaleString() : 'N/A',
    'Created At': new Date(ord.createdAt).toLocaleString(),
  }));
  const ordersWS = XLSX.utils.json_to_sheet(ordersData);
  XLSX.utils.book_append_sheet(wb, ordersWS, 'Orders History');

  // 2. Attendance Sheet
  const attendanceData = data.attendance.map((att) => ({
    'Employee Name': att.userId?.name || 'Unknown',
    'Employee ID': att.userId?.employeeId || 'N/A',
    'Clock In Time': new Date(att.clockInTime).toLocaleString(),
    'Clock Out Time': att.clockOutTime ? new Date(att.clockOutTime).toLocaleString() : 'N/A',
    'Total Work Hours': att.workHours || 0,
    'Distance from Restaurant (m)': att.distanceMeters,
    'GPS Coordinates': `${att.latitude}, ${att.longitude}`,
    'Status': att.status,
  }));
  const attendanceWS = XLSX.utils.json_to_sheet(attendanceData);
  XLSX.utils.book_append_sheet(wb, attendanceWS, 'Attendance Logs');

  // 3. Top Items Sheet
  const topItemsData = data.topItems.map((item) => ({
    'Item Name': item.name,
    'Quantity Sold': item.quantity,
    'Total Revenue (₹)': item.revenue,
  }));
  const topItemsWS = XLSX.utils.json_to_sheet(topItemsData);
  XLSX.utils.book_append_sheet(wb, topItemsWS, 'Top Items');

  // Write Excel file buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
};

module.exports = {
  generatePDFReport,
  generateExcelReport,
};
