require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./server/models/Admin');

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'admin@nextgenz.tech';
    const password = 'NextGenZAdmin2026!';
    
    // Delete existing admin
    await Admin.deleteMany({ email });
    console.log('Deleted old admin records');

    // Create new admin
    const admin = new Admin({ email, password });
    await admin.save();
    console.log(`Admin reset successfully! Email: ${email}, Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetAdmin();
