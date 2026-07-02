module.exports = (data) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
      .header { background-color: #1a1a1a; padding: 20px; text-align: center; color: white; border-bottom: 4px solid #6c63ff; }
      .header h2 { margin: 0; font-size: 20px; }
      .content { padding: 30px; }
      .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #eeeeee; }
      .table th { color: #666666; font-size: 13px; text-transform: uppercase; width: 40%; }
      .table td { color: #333333; font-weight: bold; }
      .btn { display: inline-block; background-color: #6c63ff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 25px; font-weight: bold; }
      .footer { background-color: #f9f9f9; padding: 15px; text-align: center; color: #888888; font-size: 12px; border-top: 1px solid #eeeeee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>New Internship Application 🚀</h2>
      </div>
      <div class="content">
        <p style="color: #444;">A new student has just successfully applied and completed their payment.</p>
        
        <table class="table">
          <tr><th>Full Name</th><td>${data.fullName}</td></tr>
          <tr><th>Email</th><td>${data.email}</td></tr>
          <tr><th>Phone</th><td>${data.phone}</td></tr>
          <tr><th>College</th><td>${data.college}</td></tr>
          <tr><th>Course</th><td>${data.course} (Year ${data.year})</td></tr>
          <tr><th>Domain</th><td>${data.domain}</td></tr>
          <tr><th>Plan Selected</th><td>${data.plan === '199' ? '₹199 / month' : data.plan === '499' ? '₹499 / 3 months' : data.plan}</td></tr>
          <tr><th>Payment ID</th><td style="font-family: monospace; color: #6c63ff;">${data.paymentId}</td></tr>
        </table>

        <div style="text-align: center;">
          <a href="http://localhost:3000/admin/" class="btn">View in Dashboard</a>
        </div>
      </div>
      <div class="footer">
        This is an automated administrative notification from NextGenZ Tech System.
      </div>
    </div>
  </body>
  </html>
  `;
};
