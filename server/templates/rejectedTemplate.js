module.exports = (data) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #050505; color: #ffffff; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background-color: #111111; border-radius: 12px; overflow: hidden; border: 1px solid #333; }
      .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 30px; text-align: center; }
      .header h1 { margin: 0; color: #ffffff; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
      .content { padding: 40px 30px; line-height: 1.6; }
      .content h2 { color: #f44336; margin-top: 0; }
      .content p { color: #cccccc; font-size: 16px; }
      .details { background-color: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f44336; }
      .details p { margin: 5px 0; color: #ffffff; }
      .footer { text-align: center; padding: 20px; background-color: #0a0a0a; color: #666666; font-size: 12px; border-top: 1px solid #222; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Application Update</h1>
      </div>
      <div class="content">
        <h2>Hi ${data.fullName},</h2>
        <p>Thank you for applying for the <strong>${data.domain}</strong> internship at NextGenZ Tech and taking the time to share your profile with us.</p>
        <p>While your background is impressive, we have decided to move forward with other candidates who more closely match our current requirements for this particular batch.</p>
        <p>We appreciate your interest and wish you the best in your future endeavors!</p>
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
