module.exports = (data) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #050505; color: #ffffff; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background-color: #111111; border-radius: 12px; overflow: hidden; border: 1px solid #333; }
      .header { background: linear-gradient(135deg, #8a2be2 0%, #da70d6 100%); padding: 30px; text-align: center; }
      .header h1 { margin: 0; color: #ffffff; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
      .content { padding: 40px 30px; line-height: 1.6; }
      .content h2 { color: #da70d6; margin-top: 0; }
      .content p { color: #cccccc; font-size: 16px; }
      .details { background-color: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #da70d6; }
      .details p { margin: 5px 0; color: #ffffff; }
      .footer { text-align: center; padding: 20px; background-color: #0a0a0a; color: #666666; font-size: 12px; border-top: 1px solid #222; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>You've been Shortlisted!</h1>
      </div>
      <div class="content">
        <h2>Congratulations ${data.fullName},</h2>
        <p>We are thrilled to inform you that you have been shortlisted for the <strong>${data.domain}</strong> internship!</p>
        <div class="details">
          <p><strong>Application ID:</strong> ${data.applicationId || 'N/A'}</p>
          <p><strong>Status:</strong> Shortlisted</p>
        </div>
        <p>Your profile stood out to our team. We will be reaching out soon with the next steps.</p>
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
