const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const totp = require('../utils/totp');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      await AuditLog.create({ action: 'ADMIN_LOGIN_FAILED', adminEmail: email || 'Unknown', details: 'Invalid credentials - admin not found' });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check account lockout
    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((admin.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ 
        success: false, 
        message: `Account is temporarily locked. Try again in ${minutesLeft} minutes.` 
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      admin.loginAttempts += 1;
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
        admin.loginAttempts = 0; // Reset attempts after locking
        await admin.save();
        await AuditLog.create({ 
          action: 'ADMIN_ACCOUNT_LOCKED', 
          adminEmail: email, 
          details: 'Account locked for 15 minutes due to 5 failed attempts' 
        });
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid credentials. Account has been locked for 15 minutes.' 
        });
      }
      await admin.save();
      await AuditLog.create({ 
        action: 'ADMIN_LOGIN_FAILED', 
        adminEmail: email, 
        details: `Password mismatch. Attempt ${admin.loginAttempts}/5` 
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Reset failed login attempts on successful credentials match
    admin.loginAttempts = 0;
    admin.lockUntil = null;
    await admin.save();

    // Check if 2FA is enabled
    if (admin.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        adminId: admin._id
      });
    }

    // Standard login flow (2FA disabled)
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await AuditLog.create({ action: 'ADMIN_LOGIN_SUCCESS', adminEmail: email, details: 'Logged in successfully (2FA disabled)' });

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });

    res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.verify2FALogin = async (req, res, next) => {
  try {
    const { adminId, code } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid login session.' });
    }

    // Verify lockout state
    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((admin.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ 
        success: false, 
        message: `Account is locked. Try again in ${minutesLeft} minutes.` 
      });
    }

    const isValid = totp.verifyTOTP(admin.twoFactorSecret, code);
    if (!isValid) {
      admin.loginAttempts += 1;
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = Date.now() + 15 * 60 * 1000;
        admin.loginAttempts = 0;
        await admin.save();
        await AuditLog.create({ 
          action: 'ADMIN_ACCOUNT_LOCKED', 
          adminEmail: admin.email, 
          details: 'Account locked for 15 minutes due to 5 failed 2FA attempts' 
        });
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid 2FA code. Account has been locked for 15 minutes.' 
        });
      }
      await admin.save();
      return res.status(401).json({ success: false, message: 'Invalid 2FA code.' });
    }

    // Reset login attempts
    admin.loginAttempts = 0;
    admin.lockUntil = null;
    await admin.save();

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await AuditLog.create({ action: 'ADMIN_LOGIN_SUCCESS', adminEmail: admin.email, details: 'Logged in successfully with 2FA' });

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000
    });

    res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.setup2FA = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    const secret = totp.generateSecret();
    const otpauthUrl = `otpauth://totp/NextGenZ:${admin.email}?secret=${secret}&issuer=NextGenZ%20Tech`;

    res.status(200).json({
      success: true,
      secret,
      otpauthUrl
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyAndEnable2FA = async (req, res, next) => {
  try {
    const { secret, code } = req.body;

    const isValid = totp.verifyTOTP(secret, code);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA verification code.' });
    }

    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    admin.twoFactorSecret = secret;
    admin.twoFactorEnabled = true;
    await admin.save();

    await AuditLog.create({ action: 'ADMIN_2FA_ENABLED', adminEmail: admin.email, details: 'Two-Factor Authentication enabled' });

    res.status(200).json({ success: true, message: '2FA enabled successfully!' });
  } catch (error) {
    next(error);
  }
};

exports.disable2FA = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    admin.twoFactorSecret = null;
    admin.twoFactorEnabled = false;
    await admin.save();

    await AuditLog.create({ action: 'ADMIN_2FA_DISABLED', adminEmail: admin.email, details: 'Two-Factor Authentication disabled' });

    res.status(200).json({ success: true, message: '2FA disabled successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.clearCookie('adminToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
