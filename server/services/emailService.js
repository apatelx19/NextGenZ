const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });
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
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS on port 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      family: 4 // Force IPv4 locally
    });

    this.companyName = process.env.COMPANY_NAME || 'NextGenZ Tech';
    this.companyEmail = process.env.COMPANY_EMAIL || 'admin@nextgenz.tech';
  }

  async sendEmail(to, subject, htmlContent, attachments = []) {
    try {
      // 1. If SENDGRID_API_KEY is configured, use SendGrid HTTP API (recommended)
      if (process.env.SENDGRID_API_KEY) {
        // Since we are using Single Sender Verification, sender MUST be the verified Gmail address
        const fromEmail = process.env.EMAIL_USER || 'nextgenztech.admin@gmail.com';
        
        // Format attachments for SendGrid API (requires base64 content)
        const formattedAttachments = attachments.map(att => {
          let contentBase64 = '';
          if (Buffer.isBuffer(att.content)) {
            contentBase64 = att.content.toString('base64');
          } else if (typeof att.content === 'string') {
            contentBase64 = Buffer.from(att.content).toString('base64');
          }
          return {
            filename: att.filename,
            content: contentBase64,
            type: att.contentType || 'application/pdf',
            disposition: 'attachment'
          };
        });

        const payload = {
          personalizations: [
            {
              to: [{ email: to }]
            }
          ],
          from: {
            email: fromEmail,
            name: this.companyName
          },
          subject: subject,
          content: [
            {
              type: 'text/html',
              value: htmlContent
            }
          ]
        };

        if (formattedAttachments.length > 0) {
          payload.attachments = formattedAttachments;
        }

        const response = await axios.post('https://api.sendgrid.com/v3/mail/send', payload, {
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        logger.info(`✅ Email Sent Successfully to ${to} via SendGrid`);
        return true;
      }

      // 2. If RESEND_API_KEY is configured, use Resend HTTP API (fallback)
      if (process.env.RESEND_API_KEY) {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        
        const formattedAttachments = attachments.map(att => {
          let contentBase64 = '';
          if (Buffer.isBuffer(att.content)) {
            contentBase64 = att.content.toString('base64');
          } else if (typeof att.content === 'string') {
            contentBase64 = Buffer.from(att.content).toString('base64');
          }
          return {
            filename: att.filename,
            content: contentBase64
          };
        });

        const payload = {
          from: `"${this.companyName}" <${fromEmail}>`,
          to: [to],
          subject,
          html: htmlContent,
          attachments: formattedAttachments
        };

        const response = await axios.post('https://api.resend.com/emails', payload, {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        logger.info(`✅ Email Sent Successfully to ${to} via Resend (ID: ${response.data.id})`);
        return true;
      }

      // 3. Fallback to Nodemailer SMTP (good for local dev / local testing)
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn('⚠️  Email skipped: Missing SendGrid, Resend, or SMTP credentials in environment variables.');
        return false;
      }

      const mailOptions = {
        from: `"${this.companyName}" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
        attachments: attachments
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Email Sent Successfully to ${to} via SMTP`);
      return true;

    } catch (error) {
      const errorMsg = error.response && error.response.data 
        ? JSON.stringify(error.response.data) 
        : error.message;
      logger.error(`❌ Email Failed to ${to}: ${errorMsg}`);
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
