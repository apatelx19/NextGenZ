module.exports = (application) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background: #27ae60; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .content p { margin-bottom: 15px; font-size: 16px; }
        .highlight-box { background: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; border-top: 1px solid #eeeeee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Verified Successfully!</h1>
        </div>
        <div class="content">
            <p>Dear <strong>${application.fullName}</strong>,</p>
            
            <p>Great news! We have successfully received and verified your payment of <strong>₹${application.planAmount}</strong> for the <strong>${application.internshipDomain}</strong> internship.</p>
            
            <div class="highlight-box">
                <p style="margin:0;"><strong>What happens next?</strong><br>Your application has been moved to the next stage. Our team will now review your profile, and you will receive further instructions shortly.</p>
            </div>
            
            <p>Thank you for your patience and for choosing NextGenZ Tech. We are thrilled to have you onboard.</p>
            
            <p>Best Regards,<br><strong>NextGenZ Tech Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} NextGenZ Tech. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
