const mongoose = require('mongoose');

const statusLogSchema = new mongoose.Schema({
  adminName: { type: String, required: true },
  applicationId: { type: String, required: true }, // e.g., NGZ-2026-0001
  applicationMongoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  oldStatus: { type: String, required: true },
  newStatus: { type: String, required: true },
  remarks: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StatusLog', statusLogSchema);
