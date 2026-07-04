const PDFDocument = require('pdfkit');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');

class CertificateService {
  /**
   * Helper to determine start and end dates based on the internship batch
   * @param {string} batch - e.g. "July 2026"
   * @returns {Object} { start, end } formatted dates
   */
  getBatchDates(batch) {
    const defaultDates = {
      start: 'July 1, 2026',
      end: 'July 31, 2026'
    };

    if (!batch) return defaultDates;

    const parts = batch.trim().split(/\s+/);
    if (parts.length < 2) return defaultDates;

    const monthName = parts[0];
    const year = parseInt(parts[1]) || new Date().getFullYear();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());

    if (monthIndex === -1) return defaultDates;

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0); // Last day of month

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return {
      start: startDate.toLocaleDateString('en-US', options),
      end: endDate.toLocaleDateString('en-US', options)
    };
  }

  /**
   * Generates a landscape A4 Completion Certificate PDF and returns it as a Buffer
   * @param {Object} applicationData - The application details
   * @returns {Promise<Buffer>}
   */
  async generateCertificate(applicationData) {
    return new Promise(async (resolve, reject) => {
      try {
        // A4 page is 595.28 x 841.89 pt. Landscape size will be 841.89 x 595.28.
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        const width = 841.89;
        const height = 595.28;

        const templatePath = path.join(__dirname, '../assets/certificate_template.jpg');
        const signaturePath = path.join(__dirname, '../assets/signature.png');

        // 1. Draw the high-fidelity premium blank template background
        try {
          doc.image(templatePath, 0, 0, { width, height });
        } catch (err) {
          logger.error(`Failed to load certificate template background: ${err.message}`);
          // Fallback to solid background if image fails
          doc.rect(0, 0, width, height).fill('#FCFBF7');
        }

        // 2. Student Name (Charcoal black, centered at y = 245, size 38)
        const fullNameStr = (applicationData.fullName || 'INTERN NAME').toUpperCase();
        doc.y = 245;
        doc.fillColor('#1A1A1A')
           .fontSize(38)
           .font('Times-Bold')
           .text(fullNameStr, { align: 'center' });

        // 3. Certificate Description Text (Serif Times-Roman, matching mockup spacing & casing)
        const domainStr = applicationData.domain || 'Software Internship';
        const dates = this.getBatchDates(applicationData.internshipBatch);
        
        doc.y = 350;
        const certText = `for outstanding performance and successful completion of the 1-month internship program in ${domainStr} at NextGenZ Tech from ${dates.start} to ${dates.end}.`;
        
        doc.fillColor('#222222')
           .fontSize(14.5)
           .font('Times-Roman')
           .lineGap(8)
           .text(certText, 100, doc.y, {
             width: width - 200,
             align: 'center'
           });

        // 4. Bottom Footer section
        const footerY = 465;

        // --- Left Column: Issue Date ---
        doc.moveTo(80, footerY + 15)
           .lineTo(220, footerY + 15)
           .lineWidth(0.8)
           .strokeColor('#DDDDDD')
           .stroke();

        const issueDateStr = new Date(applicationData.verificationDate || Date.now()).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });

        doc.fillColor('#1A1A1A')
           .fontSize(11)
           .font('Times-Bold')
           .text(issueDateStr, 80, footerY - 5, { width: 140, align: 'center' });

        doc.fillColor('#666666')
           .fontSize(9)
           .font('Times-Roman')
           .text('Issue Date', 80, footerY + 23, { width: 140, align: 'center' });

        // --- Center Column: Verification ID & QR Code (Shifted left to avoid gold seal) ---
        const certId = `CERT-NGZ-${applicationData.applicationId || '2026-0001'}`;
        const verificationUrl = `https://nextgenztech.online/verify.html?id=${applicationData.applicationId || 'NGZ-2026-0001'}`;
        
        // Text shifted left to x = 250
        doc.fillColor('#666666')
           .fontSize(8)
           .font('Times-Roman')
           .text('Certificate verification ID', 250, footerY + 3, { width: 180, align: 'right' });

        doc.fillColor('#1A1A1A')
           .fontSize(10)
           .font('Times-Bold')
           .text(certId, 250, footerY + 15, { width: 180, align: 'right' });

        // QR Code shifted left to x = 440 (giving 50+ pt gap to gold seal ribbon)
        try {
          const qrResponse = await axios.get(
            `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verificationUrl)}`,
            { responseType: 'arraybuffer', timeout: 5000 }
          );
          const qrBuffer = Buffer.from(qrResponse.data, 'binary');
          doc.image(qrBuffer, 440, footerY - 12, { height: 55 });
        } catch (qrErr) {
          logger.warn(`QR Code generation failed: ${qrErr.message}. Drawing placeholder.`);
          doc.rect(440, footerY - 12, 55, 55).lineWidth(0.5).strokeColor('#CCCCCC').stroke();
        }

        // --- Right Column: CEO Signature ---
        doc.moveTo(width - 220, footerY + 15)
           .lineTo(width - 80, footerY + 15)
           .lineWidth(0.8)
           .strokeColor('#DDDDDD')
           .stroke();

        try {
          doc.image(signaturePath, width - 170, footerY - 35, { height: 45 });
        } catch (err) {
          logger.warn(`Missing signature image for certificate: ${err.message}`);
        }

        doc.fillColor('#1A1A1A')
           .fontSize(11)
           .font('Times-Bold')
           .text('Patel Arya', width - 220, footerY - 5, { width: 140, align: 'center' });

        doc.fillColor('#666666')
           .fontSize(9)
           .font('Times-Roman')
           .text('CEO & Founder', width - 220, footerY + 23, { width: 140, align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new CertificateService();
