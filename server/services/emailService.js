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
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      family: 4
    });

    this.companyName = process.env.COMPANY_NAME || 'NextGenZ Tech';
    this.companyEmail = process.env.COMPANY_EMAIL || 'admin@nextgenz.tech';
  }

  async getGmailAccessToken() {
    try {
      const params = new URLSearchParams();
      params.append('client_id', process.env.GMAIL_CLIENT_ID);
      params.append('client_secret', process.env.GMAIL_CLIENT_SECRET);
      params.append('refresh_token', process.env.GMAIL_REFRESH_TOKEN);
      params.append('grant_type', 'refresh_token');

      const response = await axios.post('https://oauth2.googleapis.com/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return response.data.access_token;
    } catch (error) {
      const errorDetails = error.response && error.response.data 
        ? JSON.stringify(error.response.data) 
        : error.message;
      throw new Error(`Failed to refresh Gmail access token: ${errorDetails}`);
    }
  }

  async sendEmail(to, subject, htmlContent, attachments = []) {
    try {
      // 1. If GMAIL_REFRESH_TOKEN is configured, use Gmail HTTP API (Recommended for Render Free Tier)
      if (process.env.GMAIL_REFRESH_TOKEN) {
        const fromEmail = process.env.EMAIL_USER || 'nextgenztech.admin@gmail.com';
        const MailComposer = require('nodemailer/lib/mail-composer');

        const mailOptions = {
          from: `"${this.companyName}" <${fromEmail}>`,
          to,
          subject,
          html: htmlContent,
          attachments: attachments
        };

        // Compile raw MIME message (RFC 2822)
        const composer = new MailComposer(mailOptions);
        const rawBuffer = await new Promise((resolve, reject) => {
          composer.compile().build((err, message) => {
            if (err) reject(err);
            else resolve(message);
          });
        });

        // Encode as base64url
        const base64url = rawBuffer.toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        // Fetch fresh Access Token
        const accessToken = await this.getGmailAccessToken();

        // POST request to Gmail API (Standard HTTPS Port 443 - never blocked on Render)
        await axios.post(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          { raw: base64url },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        logger.info(`✅ Email Sent Successfully to ${to} via Gmail HTTP API`);
        return true;
      }

      // 2. If SENDGRID_API_KEY is configured, use SendGrid HTTP API (Fallback 1)
      if (process.env.SENDGRID_API_KEY) {
        const fromEmail = process.env.EMAIL_USER || 'nextgenztech.admin@gmail.com';
        
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

        await axios.post('https://api.sendgrid.com/v3/mail/send', payload, {
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        logger.info(`✅ Email Sent Successfully to ${to} via SendGrid`);
        return true;
      }

      // 3. Fallback to Nodemailer SMTP (good for local dev / local testing)
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn('⚠️  Email skipped: Missing credentials (Gmail API, SendGrid, or SMTP) in environment variables.');
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
