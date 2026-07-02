# NextGenZ Tech Platform

Empowering the Next Generation of Tech Leaders.
A full-stack, scalable, and secure application tracking portal designed for NextGenZ Tech's internship programs.

## 🚀 Features
- **Internship Application Portal**: Collect student data, filter candidates, and accept Razorpay payments.
- **Admin Dashboard**: Real-time analytics, Kanban-style application status tracking, and 1-click status updates.
- **Secure File Uploads**: Cloudinary-backed PDF resume uploads with strict validation.
- **Automated Emails**: Nodemailer integration to send automated HTML-branded status updates to students.
- **Comprehensive Security**: Helmet headers, Express Rate Limiting, Winston logging, and Mongo data sanitization.

## 📂 Project Structure
```
NextGenZ/
├── client/
│   ├── admin/       # Admin Dashboard UI
│   ├── assets/      # Static Images
│   └── website/     # Public Facing Portal
├── server/
│   ├── config/      # API configurations
│   ├── controllers/ # Request handling logic
│   ├── middleware/  # Auth, Validation, Errors
│   ├── models/      # Mongoose DB schemas
│   ├── routes/      # Express routing
│   ├── services/    # Business logic (Emails)
│   └── utils/       # Winston Logger, Crypto
├── logs/            # Auto-generated access logs
├── server.js        # Entry point
└── render.yaml      # IaC Deployment config
```

## 🛠 Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd NextGenZ
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and fill in your actual credentials (MongoDB, Razorpay, Cloudinary, Gmail App Password).

4. **Run the server:**
   ```bash
   npm run dev      # or node server.js
   ```

5. **Visit the app:**
   Open `http://localhost:3000` in your browser.

## 🌍 Final Deployment Guide (Render)

1. **MongoDB Atlas**:
   - Create a Cluster, whitelist IP `0.0.0.0/0` (or Render's specific outbound IPs).
   - Get the connection string and set it in Render as `MONGODB_URI`.

2. **Cloudinary**:
   - Create an account, fetch `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

3. **Razorpay Production**:
   - Switch Razorpay dashboard to "Live Mode".
   - Generate new API keys and set them in Render.

4. **Gmail SMTP Setup**:
   - Go to Google Account > Security > 2-Step Verification > App Passwords.
   - Generate a 16-letter password and set it as `EMAIL_PASS`.

5. **Render Deployment**:
   - Link your GitHub repo to Render as a Web Service.
   - Select Node.js environment.
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Navigate to "Environment" and securely enter all variables from `.env`.

6. **Custom Domain & SSL**:
   - In Render, go to your Web Service settings > Custom Domains.
   - Add `nextgenztech.com` and point your DNS A Record / CNAME as instructed. Render provisions a free TLS/SSL certificate automatically.

## 🩺 Monitoring
A `GET /health` endpoint is available to track uptime status. Connect this to tools like UptimeRobot or Datadog.

## 🛡 Security Notes
Stack traces are disabled in production, CORS is restricted to your specific domains, and inputs are validated using `express-validator`. Passwords use bcrypt with 12 salt rounds.
