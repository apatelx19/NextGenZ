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
   * Draws a vector gold verification seal with ribbon tails
   * @param {Object} doc - PDFDocument instance
   * @param {number} x - center x
   * @param {number} y - center y
   * @param {number} radius - inner circle radius
   */
  drawGoldSeal(doc, x, y, radius) {
    doc.save();
    
    // 1. Draw ribbon tails (behind seal)
    doc.fillColor('#B8860B'); // Dark gold
    
    // Left ribbon
    doc.moveTo(x - 10, y + 10)
       .lineTo(x - 22, y + 45)
       .lineTo(x - 10, y + 38)
       .lineTo(x - 2, y + 45)
       .lineTo(x - 4, y + 10)
       .closePath()
       .fill();
       
    // Right ribbon
    doc.moveTo(x + 4, y + 10)
       .lineTo(x + 2, y + 45)
       .lineTo(x + 10, y + 38)
       .lineTo(x + 22, y + 45)
       .lineTo(x + 10, y + 10)
       .closePath()
       .fill();
       
    // 2. Draw outer scalloped circular border
    doc.fillColor('#D4AF37'); // Shiny gold
    doc.circle(x, y, radius + 3).fill();
    
    // 3. Draw inner shiny gold circle
    doc.fillColor('#FFDF00'); // Light shiny gold
    doc.circle(x, y, radius).fill();
    
    // 4. Draw thin dark gold ring
    doc.strokeColor('#B8860B').lineWidth(0.8);
    doc.circle(x, y, radius - 3).stroke();
    
    // 5. Draw "NGZ" text in center
    doc.fillColor('#8B6508') // Bronze text
       .font('Times-Bold')
       .fontSize(9)
       .text('NGZ', x - 15, y - 4, { width: 30, align: 'center' });
       
    doc.restore();
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
          // Fallback to vector borders if background fails to load
          doc.rect(0, 0, width, height).fill('#FCFBF7');
          doc.rect(20, 20, width - 40, height - 40).lineWidth(3.5).strokeColor('#1A1A1A').stroke();
          doc.rect(27, 27, width - 54, height - 54).lineWidth(1).strokeColor('#C5A059').stroke();
        }

        // 2. Certificate Headers (Times Serif)
        doc.y = 150;
        doc.fillColor('#1A1A1A')
           .fontSize(34)
           .font('Times-Bold')
           .text('CERTIFICATE OF COMPLETION', { align: 'center' });

        doc.moveDown(0.4);

        doc.fillColor('#555555')
           .fontSize(15)
           .font('Times-Italic')
           .text('This is proudly presented to', { align: 'center' });

        doc.moveDown(0.6);

        // 3. Student Name (Charcoal black to match the mockup exactly!)
        const fullNameStr = (applicationData.fullName || 'INTERN NAME').toUpperCase();
        doc.fillColor('#1A1A1A')
           .fontSize(28)
           .font('Times-Bold')
           .text(fullNameStr, { align: 'center' });

        // Double gold line under name
        const lineY = doc.y + 8;
        doc.moveTo((width - 320) / 2, lineY)
           .lineTo((width + 320) / 2, lineY)
           .lineWidth(1)
           .strokeColor('#C5A059')
           .stroke();

        doc.moveTo((width - 280) / 2, lineY + 3)
           .lineTo((width + 280) / 2, lineY + 3)
           .lineWidth(0.5)
           .strokeColor('#C5A059')
           .stroke();

        doc.moveDown(1.5);

        // 4. Certificate Description Text
        const domainStr = applicationData.domain || 'Software Internship';
        const dates = this.getBatchDates(applicationData.internshipBatch);
        
        doc.y = 325;
        const certText = `for outstanding performance and successful completion of the 1-Month Internship Program in the domain of ${domainStr} at NextGenZ Tech from ${dates.start} to ${dates.end}.`;
        
        doc.fillColor('#333333')
           .fontSize(14)
           .font('Times-Roman')
           .lineGap(6)
           .text(certText, 80, doc.y, {
             width: width - 160,
             align: 'center'
           });

        // 5. Bottom Footer section
        const footerY = 465;

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
           .font('Times-Bold')
           .text(issueDateStr, 70, footerY - 5, { width: 140, align: 'center' });

        doc.fillColor('#666666')
           .fontSize(9)
           .font('Times-Roman')
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
           .font('Times-Bold')
           .text(certId, (width - 200) / 2, footerY + 45, { width: 200, align: 'center' });

        doc.fillColor('#666666')
           .fontSize(8)
           .font('Times-Roman')
           .text('Verification Code', (width - 200) / 2, footerY + 58, { width: 200, align: 'center' });

        // --- Right: CEO Signature & Gold Seal ---
        // Vector gold seal placed next to signature
        this.drawGoldSeal(doc, width - 260, footerY + 10, 20);

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
           .font('Times-Bold')
           .text('Patel Arya', width - 210, footerY - 5, { width: 140, align: 'center' });

        doc.fillColor('#666666')
           .fontSize(9)
           .font('Times-Roman')
           .text('CEO & Founder', width - 210, footerY + 23, { width: 140, align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new CertificateService();
