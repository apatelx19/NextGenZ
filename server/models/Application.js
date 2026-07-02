const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true, index: true },
  college: { type: String, required: true },
  course: { type: String, required: true },
  year: { type: String, required: true },
  domain: { type: String, required: true, index: true },
  plan: { type: String, enum: ["Normal", "Gold", "Premium"], required: true },
  resume: {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String }
  },
  linkedin: { type: String },
  github: { type: String },
  whyJoin: { type: String, required: true },
  paymentRequestId: { type: String }, // To track Instamojo payment request
  paymentId: { type: String }, // To track Instamojo successful payment ID
  paymentScreenshot: {
    url: { type: String },
    publicId: { type: String }
  },
  transactionId: { type: String, unique: true, sparse: true, index: true },
  applicationId: { type: String, unique: true, index: true }, // e.g. NGZ-2026-0001
  status: { 
    type: String, 
    enum: ["Pending Payment Verification", "Pending Payment", "Pending", "Under Review", "Shortlisted", "Interview Scheduled", "Selected", "Rejected", "Verified"],
    default: "Pending Payment Verification",
    index: true
  },
  verificationDate: { type: Date, default: null },
  verifiedBy: { type: String, default: null },
  statusHistory: [{
    status: String,
    updatedBy: String,
    updatedAt: { type: Date, default: Date.now },
    remarks: String
  }],
  interviewDate: { type: Date },
  internshipBatch: { type: String, default: "July 2026" },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp on save
applicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
