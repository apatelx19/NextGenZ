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

        const logoPath = path.join(__dirname, '../assets/brand_logo.png');
        const msmePath = path.join(__dirname, '../assets/msme_logo.png');
        const signaturePath = path.join(__dirname, '../assets/signature.png');

        // 1. Draw solid premium off-white background
        doc.rect(0, 0, width, height).fill('#FCFBF7');

        // 2. Draw subtle guilloche-like background lines (Watermark texture)
        doc.save();
        doc.strokeColor('#FF4D00').lineWidth(0.3).opacity(0.04);
        for (let r = 200; r < 500; r += 20) {
          doc.circle(width - 50, height - 50, r).stroke();
        }
        for (let r = 150; r < 400; r += 20) {
          doc.circle(50, 50, r).stroke();
        }
        doc.restore();

        // 3. Draw dual border
        // Outer dark grey border
        doc.rect(20, 20, width - 40, height - 40)
           .lineWidth(4)
           .strokeColor('#1A1A1A')
           .stroke();

        // Inner orange brand border
        doc.rect(28, 28, width - 56, height - 56)
           .lineWidth(1.5)
           .strokeColor('#FF4D00')
           .stroke();

        // 4. Draw elegant decorative corner lines (mimicking the gold scroll corners)
        doc.save();
        doc.strokeColor('#FF4D00').lineWidth(1).opacity(0.8);
        const bracketSize = 30;
        const offset = 38;
        // Top-left
        doc.moveTo(offset, offset + bracketSize).lineTo(offset, offset).lineTo(offset + bracketSize, offset).stroke();
        // Top-right
        doc.moveTo(width - offset, offset + bracketSize).lineTo(width - offset, offset).lineTo(width - offset - bracketSize, offset).stroke();
        // Bottom-left
        doc.moveTo(offset, height - offset - bracketSize).lineTo(offset, height - offset).lineTo(offset + bracketSize, height - offset).stroke();
        // Bottom-right
        doc.moveTo(width - offset, height - offset - bracketSize).lineTo(width - offset, height - offset).lineTo(width - offset - bracketSize, height - offset).stroke();
        doc.restore();

        // 5. Header Section (Logos & Brand names)
        // Left Company Logo
        try {
          doc.image(logoPath, 55, 45, { height: 45 });
        } catch (err) {
          logger.warn(`Missing brand logo for certificate: ${err.message}`);
        }

        // Right MSME Government Seal
        try {
          doc.image(msmePath, width - 55 - 90, 42, { height: 50 });
        } catch (err) {
          logger.warn(`Missing MSME logo for certificate: ${err.message}`);
        }

        // 6. Certificate Headers
        doc.y = 130;
        doc.fillColor('#1A1A1A')
           .fontSize(38)
           .font('Helvetica-Bold')
           .text('CERTIFICATE OF COMPLETION', { align: 'center' });

        doc.moveDown(0.4);

        doc.fillColor('#555555')
           .fontSize(14)
           .font('Helvetica-Oblique')
           .text('This is proudly presented to', { align: 'center' });

        doc.moveDown(0.6);

        // 7. Student Name
        const fullNameStr = (applicationData.fullName || 'INTERN NAME').toUpperCase();
        doc.fillColor('#FF4D00')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text(fullNameStr, { align: 'center' });

        // Centered line under name
        const lineY = doc.y + 8;
        doc.moveTo((width - 320) / 2, lineY)
           .lineTo((width + 320) / 2, lineY)
           .lineWidth(1)
           .strokeColor('#FF4D00')
           .stroke();

        doc.moveDown(1.5);

        // 8. Certificate Description Text
        const domainStr = applicationData.domain || 'Software Internship';
        const dates = this.getBatchDates(applicationData.internshipBatch);
        
        doc.y = 310;
        const certText = `for outstanding performance and successful completion of the 1-Month Internship Program in the domain of ${domainStr} at NextGenZ Tech from ${dates.start} to ${dates.end}.`;
        
        doc.fillColor('#444444')
           .fontSize(14)
           .font('Helvetica')
           .lineGap(6)
           .text(certText, 80, doc.y, {
             width: width - 160,
             align: 'center'
           });

        // 9. Bottom Footer section
        const footerY = 460;

        // --- Left: Issue Date ---
        doc.moveTo(70, footerY + 15)
           .lineTo(210, footerY + 15)
           .lineWidth(0.8)
           .strokeColor('#DDDDDD')
           .stroke();

        const issueDateStr = new Date(applicationData.verificationDate || Date.now()).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });

        doc.fillColor('#1A1A1A')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text(issueDateStr, 70, footerY - 5, { width: 140, align: 'center' });

        doc.fillColor('#666666')
           .fontSize(9)
           .font('Helvetica')
           .text('Date of Issue', 70, footerY + 23, { width: 140, align: 'center' });

        // --- Center: Verification ID & QR Code ---
        const certId = `CERT-NGZ-${applicationData.applicationId || '2026-0001'}`;
        const verificationUrl = `https://nextgenztech.online/verify.html?id=${applicationData.applicationId || 'NGZ-2026-0001'}`;
        
        // Fetch and embed QR Code
        try {
          const qrResponse = await axios.get(
            `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`,
            { responseType: 'arraybuffer', timeout: 5000 }
          );
          const qrBuffer = Buffer.from(qrResponse.data, 'binary');
          doc.image(qrBuffer, (width - 70) / 2, footerY - 35, { height: 70 });
        } catch (qrErr) {
          logger.warn(`QR Code generation failed: ${qrErr.message}. Embedding text instead.`);
          doc.rect((width - 70) / 2, footerY - 35, 70, 70).lineWidth(0.5).strokeColor('#CCCCCC').stroke();
          doc.fillColor('#999999').fontSize(7).text('Scan to Verify', (width - 70) / 2, footerY - 5, { width: 70, align: 'center' });
        }

        doc.fillColor('#1A1A1A')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(certId, (width - 200) / 2, footerY + 45, { width: 200, align: 'center' });

        doc.fillColor('#666666')
           .fontSize(8)
           .font('Helvetica')
           .text('Verification Code', (width - 200) / 2, footerY + 58, { width: 200, align: 'center' });

        // --- Right: CEO Signature ---
        doc.moveTo(width - 210, footerY + 15)
           .lineTo(width - 70, footerY + 15)
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
           .font('Helvetica-Bold')
           .text('Patel Arya', width - 210, footerY - 5, { width: 140, align: 'center' });

        doc.fillColor('#666666')
           .fontSize(9)
           .font('Helvetica')
           .text('CEO & Founder', width - 210, footerY + 23, { width: 140, align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new CertificateService();
