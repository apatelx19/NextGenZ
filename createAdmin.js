require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./server/models/Admin');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@nextgenz.tech';
    const password = 'NextGenZAdmin2026';

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists.');
      process.exit(0);
    }

    const admin = new Admin({ email, password });
    await admin.save();
    console.log(`Admin created successfully! Email: ${email}, Password: ${password}`);
    
    // In production, we'd delete this script after running it.
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
