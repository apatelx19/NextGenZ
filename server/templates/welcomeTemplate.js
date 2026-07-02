module.exports = (data) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #050505; color: #ffffff; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background-color: #111111; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 40px rgba(108, 99, 255, 0.3); }
      .header { background: url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop') center/cover; padding: 60px 20px; text-align: center; position: relative; }
      .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(0,212,255,0.8), rgba(108,99,255,0.9)); }
      .header h1 { margin: 0; color: #ffffff; font-size: 32px; position: relative; z-index: 1; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
      .content { padding: 40px 30px; }
      .content h2 { color: #00d4ff; font-size: 24px; margin-top: 0; text-align: center; }
      .content p { color: #d0d0d0; line-height: 1.7; font-size: 16px; }
      .highlight-box { background: linear-gradient(135deg, rgba(108,99,255,0.1), rgba(0,212,255,0.1)); border: 1px solid rgba(108,99,255,0.3); padding: 25px; margin: 30px 0; border-radius: 12px; text-align: center; }
      .highlight-box h3 { color: #fff; margin-top: 0; }
      .instructions { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; }
      .instructions ul { padding-left: 20px; color: #d0d0d0; line-height: 1.6; }
      .btn-container { text-align: center; margin-top: 40px; display: flex; justify-content: center; gap: 15px; }
      .btn-primary { background: linear-gradient(135deg, #00d4ff, #6c63ff); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 50px; font-weight: bold; }
      .btn-secondary { background: transparent; border: 2px solid #6c63ff; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: bold; }
      .footer { background-color: #0a0a0a; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
      .footer p { color: #666666; font-size: 12px; margin: 5px 0; }
      .social-links a { color: #00d4ff; text-decoration: none; margin: 0 10px; font-size: 12px; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to NextGenZ Tech!</h1>
      </div>
      <div class="content">
        <h2>Congratulations, ${data.fullName}! 🎉</h2>
        <p>We are absolutely thrilled to inform you that you have been <strong>Selected</strong> for the internship program at NextGenZ Tech.</p>
        
        <div class="highlight-box">
          <h3>Your Internship Details</h3>
          <p style="margin: 5px 0; color: #00d4ff; font-size: 18px; font-weight: bold;">${data.domain} Domain</p>
          <p style="margin: 0; color: #8f8f8f;">Batch: Upcoming Cohort</p>
        </div>

        <p>You stood out among a highly competitive pool of applicants, and we believe your skills and passion perfectly align with our company's vision of empowering the next generation of tech leaders.</p>

        <div class="instructions">
          <h4 style="margin-top:0; color: #fff;">Next Steps & Joining Instructions:</h4>
          <ul>
            <li>You will receive your official Offer Letter in a separate email within the next 48 hours.</li>
            <li>Please ensure your LinkedIn profile is fully updated.</li>
            <li>Follow our official channels to stay updated on orientation schedules.</li>
          </ul>
        </div>

        <div class="btn-container">
          <a href="https://nextgenztech.netlify.app/" class="btn-primary">Visit Website</a>
          <a href="https://www.linkedin.com/company/nextgenztech/" class="btn-secondary">Join LinkedIn</a>
        </div>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="https://nextgenztech.netlify.app/">Website</a> | 
          <a href="https://www.linkedin.com/company/nextgenztech/">LinkedIn</a> | 
          <a href="https://www.instagram.com/nextgenz_tech/">Instagram</a>
        </div>
        <p>&copy; ${new Date().getFullYear()} NextGenZ Tech. Welcome to the family!</p>
      </div>
    </div>
  </body>
  </html>
  `;
};
