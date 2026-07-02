module.exports = (data) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        background-color: #050505;
        color: #ffffff;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #111111;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }
      .header {
        background: linear-gradient(135deg, #00d4ff, #6c63ff);
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        color: #ffffff;
        font-size: 28px;
        letter-spacing: 1px;
      }
      .header p {
        margin: 10px 0 0 0;
        color: rgba(255,255,255,0.9);
        font-size: 14px;
      }
      .content {
        padding: 40px 30px;
      }
      .content h2 {
        color: #00d4ff;
        font-size: 22px;
        margin-top: 0;
      }
      .content p {
        color: #d0d0d0;
        line-height: 1.6;
        font-size: 16px;
      }
      .details-box {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 20px;
        margin: 30px 0;
      }
      .detail-row {
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
      }
      .detail-row:last-child {
        margin-bottom: 0;
      }
      .detail-label {
        color: #8f8f8f;
        font-size: 14px;
        font-weight: bold;
      }
      .detail-value {
        color: #ffffff;
        font-size: 15px;
        text-align: right;
      }
      .btn-container {
        text-align: center;
        margin-top: 40px;
      }
      .btn {
        background: linear-gradient(135deg, #00d4ff, #6c63ff);
        color: #ffffff;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 50px;
        font-weight: bold;
        display: inline-block;
      }
      .footer {
        background-color: #0a0a0a;
        padding: 20px;
        text-align: center;
        border-top: 1px solid rgba(255,255,255,0.05);
      }
      .footer p {
        color: #666666;
        font-size: 12px;
        margin: 5px 0;
      }
      .social-links {
        margin-top: 15px;
      }
      .social-links a {
        color: #00d4ff;
        text-decoration: none;
        margin: 0 10px;
        font-size: 12px;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>NextGenZ Tech</h1>
        <p>Empowering the Next Generation</p>
      </div>
      <div class="content">
        <h2>Application Received Successfully!</h2>
        <p>Hi <strong>${data.fullName}</strong>,</p>
        <p>Thank you for applying to NextGenZ Tech. We have successfully received your internship application and your payment has been confirmed.</p>
        
        <div class="details-box">
          <div class="detail-row">
            <div class="detail-label">Full Name</div>
            <div class="detail-value">${data.fullName}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Domain</div>
            <div class="detail-value">${data.domain}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Email</div>
            <div class="detail-value">${data.email}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Payment ID</div>
            <div class="detail-value" style="font-family: monospace;">${data.paymentId}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date</div>
            <div class="detail-value">${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <p>Our team will review your application and get back to you with the next steps shortly. You can track your application status anytime using your email and phone number on our website.</p>

        <div class="btn-container">
          <a href="https://nextgenztech.netlify.app/track.html" class="btn">Track Application</a>
        </div>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="https://nextgenztech.netlify.app/">Website</a> | 
          <a href="https://www.linkedin.com/company/nextgenztech/">LinkedIn</a> | 
          <a href="https://www.instagram.com/nextgenz_tech/">Instagram</a>
        </div>
        <p>&copy; ${new Date().getFullYear()} NextGenZ Tech. All rights reserved.</p>
        <p>Need help? Contact us at support@nextgenz.tech</p>
      </div>
    </div>
  </body>
  </html>
  `;
};
