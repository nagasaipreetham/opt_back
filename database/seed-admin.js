const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Define Patient Schema (Simplified for seeding)
const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'patient'], default: 'patient' },
  diagnosis: { type: String, default: '' },
  precautions: { type: String, default: '' },
  documents: [{ type: String }],
});

const Patient = mongoose.model('Patient', PatientSchema);

async function seedAdmin() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/optometry_db';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB database');

    // Hash the admin password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Check if admin exists
    const existingAdmin = await Patient.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
    } else {
      // Insert admin user
      const admin = new Patient({
        name: 'Admin User',
        age: 30,
        gender: 'Male',
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        diagnosis: '',
        precautions: ''
      });
      await admin.save();
    }

    console.log('Admin user created/updated successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
