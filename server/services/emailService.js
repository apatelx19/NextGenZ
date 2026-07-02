const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' }); // Adjust path based on where it's called, but process.env should be loaded in app.js
const logger = require('../utils/logger');

// Import Templates
const pendingTemplate = require('../templates/pendingTemplate');
const underReviewTemplate = require('../templates/underReviewTemplate');
const shortlistedTemplate = require('../templates/shortlistedTemplate');
const interviewScheduledTemplate = require('../templates/interviewScheduledTemplate');
const selectedTemplate = require('../templates/selectedTemplate');
const rejectedTemplate = require('../templates/rejectedTemplate');
const verifiedTemplate = require('../templates/verifiedTemplate');
const adminNotificationTemplate = require('../templates/adminNotificationTemplate');
const offerLetterService = require('./offerLetterService');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    this.companyName = process.env.COMPANY_NAME || 'NextGenZ Tech';
    this.companyEmail = process.env.COMPANY_EMAIL || 'admin@nextgenz.tech';
  }

  async sendEmail(to, subject, htmlContent, attachments = [], retries = 0) {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn('⚠️  Email skipped: Missing EMAIL_USER or EMAIL_PASS in environment variables.');
        return false;
      }

      const mailOptions = {
        from: `"${this.companyName}" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
        attachments: attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Email Sent Successfully to ${to}`);
      return true;
    } catch (error) {
      // Determine if error is transient (network timeout, 4xx/5xx SMTP code excluding auth)
      const isTransient = error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ESOCKETTIMEDOUT' || error.code === 'ENOTFOUND' || (error.responseCode && error.responseCode >= 400 && error.responseCode !== 535 && error.responseCode !== 400);
      
      if (isTransient && retries < 3) {
        const delay = Math.pow(2, retries) * 1000;
        logger.warn(`⚠️ Transient email error for ${to}. Retrying in ${delay}ms... (Attempt ${retries + 1}/3)`);
        await new Promise(res => setTimeout(res, delay));
        return this.sendEmail(to, subject, htmlContent, attachments, retries + 1);
      }
      
      logger.error(`❌ Email Failed to ${to} after ${retries} retries`);
      logger.error(error.message);
      return false;
    }
  }

  // Application Success Email (To Student)
  async sendApplicationSuccessEmail(applicationData) {
    const subject = `Application Received Successfully | ${this.companyName}`;
    const html = pendingTemplate(applicationData);
    return this.sendEmail(applicationData.email, subject, html);
  }

  // Admin Notification Email (To Admin)
  async sendAdminNotificationEmail(applicationData) {
    const subject = `New Internship Application Received - ${applicationData.fullName}`;
    const html = adminNotificationTemplate(applicationData);
    return this.sendEmail(this.companyEmail, subject, html);
  }

  // Central Status Update Email
  async sendStatusEmail(applicationData) {
    const status = applicationData.status;
    let subject = '';
    let html = '';
    let attachments = [];

    switch(status) {
      case 'Pending Payment Verification':
      case 'Pending':
        subject = `Application Received Successfully | ${this.companyName}`;
        html = pendingTemplate(applicationData);
        break;
      case 'Verified':
        subject = `Payment Verified Successfully! | ${this.companyName}`;
        html = verifiedTemplate(applicationData);
        break;
      case 'Under Review':
        subject = `Your Application is Under Review | ${this.companyName}`;
        html = underReviewTemplate(applicationData);
        break;
      case 'Shortlisted':
        subject = `Congratulations! You have been Shortlisted | ${this.companyName}`;
        html = shortlistedTemplate(applicationData);
        break;
      case 'Interview Scheduled':
        subject = `Interview Scheduled | ${this.companyName}`;
        html = interviewScheduledTemplate(applicationData);
        break;
      case 'Selected':
        subject = `Congratulations! You have been Selected | ${this.companyName}`;
        html = selectedTemplate(applicationData);
        try {
          const pdfBuffer = await offerLetterService.generateOfferLetter(applicationData);
          attachments.push({
            filename: 'NextGenZ_Offer_Letter.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf'
          });
        } catch (error) {
          console.error('Failed to generate offer letter PDF:', error);
        }
        break;
      case 'Rejected':
        subject = `Application Update | ${this.companyName}`;
        html = rejectedTemplate(applicationData);
        break;
      default:
        return false;
    }

    return this.sendEmail(applicationData.email, subject, html, attachments);
  }
}

module.exports = new EmailService();
