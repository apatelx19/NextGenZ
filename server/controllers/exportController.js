const Application = require('../models/Application');
const { Parser } = require('json2csv');
const exceljs = require('exceljs');

// Helper to fetch data with optional filters
const fetchExportData = async (req) => {
  const { domain, status } = req.query;
  let query = {};
  if (domain) query.domain = domain;
  if (status) query.status = status;

  return await Application.find(query).sort({ createdAt: -1 }).lean(); // Use lean() for plain JS objects
};

// GET /api/admin/export/csv
exports.exportCSV = async (req, res) => {
  try {
    const applications = await fetchExportData(req);
    
    if (applications.length === 0) {
      return res.status(404).json({ success: false, message: 'No data to export' });
    }

    const fields = ['fullName', 'email', 'phone', 'college', 'course', 'year', 'domain', 'status', 'paymentId', 'orderId', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(applications);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
    res.status(200).send(csv);

  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ success: false, message: 'Server error exporting CSV' });
  }
};

// GET /api/admin/export/excel
exports.exportExcel = async (req, res) => {
  try {
    const applications = await fetchExportData(req);

    if (applications.length === 0) {
      return res.status(404).json({ success: false, message: 'No data to export' });
    }

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Applications');

    // Define columns
    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'College', key: 'college', width: 30 },
      { header: 'Course', key: 'course', width: 20 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Domain', key: 'domain', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Payment ID', key: 'paymentId', width: 25 },
      { header: 'Order ID', key: 'orderId', width: 25 },
      { header: 'Date Applied', key: 'createdAt', width: 25 }
    ];

    // Add rows
    applications.forEach((app) => {
      worksheet.addRow({
        ...app,
        createdAt: new Date(app.createdAt).toLocaleString()
      });
    });

    // Style headers
    worksheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=applications.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ success: false, message: 'Server error exporting Excel' });
  }
};
