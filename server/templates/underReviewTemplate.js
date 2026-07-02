module.exports = (data) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #050505; color: #ffffff; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background-color: #111111; border-radius: 12px; overflow: hidden; border: 1px solid #333; }
      .header { background: linear-gradient(135deg, #1e90ff 0%, #00bfff 100%); padding: 30px; text-align: center; }
      .header h1 { margin: 0; color: #ffffff; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
      .content { padding: 40px 30px; line-height: 1.6; }
      .content h2 { color: #1e90ff; margin-top: 0; }
      .content p { color: #cccccc; font-size: 16px; }
      .details { background-color: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #1e90ff; }
      .details p { margin: 5px 0; color: #ffffff; }
      .footer { text-align: center; padding: 20px; background-color: #0a0a0a; color: #666666; font-size: 12px; border-top: 1px solid #222; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Application Under Review</h1>
      </div>
      <div class="content">
        <h2>Hi ${data.fullName},</h2>
        <p>Great news! Your application is currently under review by our recruitment team.</p>
        <div class="details">
          <p><strong>Application ID:</strong> ${data.applicationId || 'N/A'}</p>
          <p><strong>Domain:</strong> ${data.domain}</p>
        </div>
        <p>We are carefully evaluating your profile and resume. We appreciate your patience during this process.</p>
        <p>Best Regards,<br>The NextGenZ Tech Team</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} NextGenZ Tech. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};
