module.exports = (data) => {
  let statusColor = '#00d4ff';
  let message = '';
  let headline = 'Application Update';

  switch (data.status) {
    case 'Under Review':
      statusColor = '#6c63ff';
      headline = 'Your Application is Under Review';
      message = 'Your application has passed the initial screening and is currently being reviewed by our selection committee. We will notify you once a decision has been made.';
      break;
    case 'Shortlisted':
      statusColor = '#2ea043';
      headline = 'Congratulations! You are Shortlisted';
      message = 'Great news! You have been shortlisted for the internship. Our team will contact you shortly regarding the next steps or interview rounds.';
      break;
    case 'Rejected':
      statusColor = '#f85149';
      headline = 'Application Update';
      message = 'Thank you for taking the time to apply. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time. We encourage you to apply again in the future.';
      break;
    default:
      message = `Your application status has been updated to: ${data.status}`;
  }

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #050505; color: #ffffff; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background-color: #111111; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .header { background: linear-gradient(135deg, #00d4ff, #6c63ff); padding: 30px 20px; text-align: center; }
      .header h1 { margin: 0; color: #ffffff; font-size: 28px; }
      .content { padding: 40px 30px; }
      .content h2 { color: ${statusColor}; font-size: 22px; margin-top: 0; }
      .content p { color: #d0d0d0; line-height: 1.6; font-size: 16px; }
      .status-box { background: rgba(255,255,255,0.05); border-left: 4px solid ${statusColor}; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0; }
      .btn-container { text-align: center; margin-top: 40px; }
      .btn { background: transparent; border: 2px solid #00d4ff; color: #00d4ff; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; display: inline-block; transition: 0.3s; }
      .footer { background-color: #0a0a0a; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
      .footer p { color: #666666; font-size: 12px; margin: 5px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>NextGenZ Tech</h1>
      </div>
      <div class="content">
        <h2>${headline}</h2>
        <p>Hi <strong>${data.fullName}</strong>,</p>
        
        <div class="status-box">
          <p style="margin:0; color: #fff;"><strong>Domain:</strong> ${data.domain}</p>
          <p style="margin:10px 0 0 0;">${message}</p>
        </div>

        <p>You can check your detailed status online using our application tracker.</p>

        <div class="btn-container">
          <a href="https://nextgenztech.netlify.app/track.html" class="btn">Track Status</a>
        </div>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} NextGenZ Tech. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};
