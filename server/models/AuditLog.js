const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'ADMIN_LOGIN_SUCCESS', 'ADMIN_LOGIN_FAILED', 'APPLICATION_DELETED'
  adminEmail: { type: String, required: true }, // 'System' or admin's email
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
