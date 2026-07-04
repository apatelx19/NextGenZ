module.exports = (data) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #050505; color: #ffffff; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background-color: #111111; border-radius: 12px; overflow: hidden; border: 1px solid #333; }
      .header { background: linear-gradient(135deg, #FF4D00 0%, #FF8700 100%); padding: 35px; text-align: center; }
      .header h1 { margin: 0; color: #ffffff; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
      .content { padding: 40px 30px; line-height: 1.6; }
      .content h2 { color: #FF4D00; margin-top: 0; font-size: 20px; }
      .content p { color: #cccccc; font-size: 16px; margin-bottom: 20px; }
      .details { background-color: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #FF4D00; }
      .details p { margin: 8px 0; color: #ffffff; font-size: 15px; }
      .footer { text-align: center; padding: 25px; background-color: #0a0a0a; color: #666666; font-size: 12px; border-top: 1px solid #222; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Internship Completed!</h1>
      </div>
      <div class="content">
        <h2>Congratulations ${data.fullName},</h2>
        <p>We are absolutely thrilled to congratulate you on successfully completing your 1-month internship program in the domain of <strong>${data.domain}</strong> at NextGenZ Tech!</p>
        
        <p>Your hard work, commitment, and technical growth during this period have been commendable. We hope this experience helps accelerate your professional journey as a developer.</p>
        
        <div class="details">
          <p><strong>Application ID:</strong> ${data.applicationId || 'N/A'}</p>
          <p><strong>Internship Domain:</strong> ${data.domain}</p>
          <p><strong>Status:</strong> Completed & Certified</p>
          <p><strong>Certificate ID:</strong> CERT-NGZ-${data.applicationId || 'N/A'}</p>
        </div>
        
        <p>Your official **Certificate of Completion** has been generated and is attached to this email. You can also verify your certificate online using the QR code printed on it.</p>
        
        <p>We wish you the very best in your future career endeavors! Keep coding and scaling new heights.</p>
        
        <p>Warm regards,<br><strong>Patel Arya</strong><br>CEO & Founder, NextGenZ Tech</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} NextGenZ Tech. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};
