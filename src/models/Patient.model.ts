import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IPatient extends Document {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  diagnosis: string;
  precautions: string;
  username: string;
  password: string;
  role: 'admin' | 'patient';
  documents: string[];
  created_at: Date;
  updated_at: Date;
  comparePassword(password: string): Promise<boolean>;
}

const PatientSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    diagnosis: { type: String, default: '' },
    precautions: { type: String, default: '' },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'patient'], default: 'patient' },
    documents: [{ type: String }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Hash password before saving
PatientSchema.pre<IPatient>('save', async function () {
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

// Method to compare passwords
PatientSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const PatientModel = mongoose.model<IPatient>('Patient', PatientSchema);

// Export as Patient to maintain compatibility with existing controller imports
export class Patient {
  static async create(patientData: any): Promise<any> {
    const patient = new PatientModel(patientData);
    const savedPatient = await patient.save();
    return savedPatient._id; // Return _id as string for compatibility
  }

  static async findByUsername(username: string): Promise<any | null> {
    return await PatientModel.findOne({ username });
  }

  static async findById(id: string | number): Promise<any | null> {
    return await PatientModel.findById(id);
  }

  static async findAll(): Promise<any[]> {
    return await PatientModel.find().sort({ created_at: -1 });
  }

  static async update(id: string | number, patientData: any): Promise<boolean> {
    if (patientData.password) {
      const salt = await bcrypt.genSalt(10);
      patientData.password = await bcrypt.hash(patientData.password, salt);
    }

    const result = await PatientModel.findByIdAndUpdate(id, patientData, { new: true });
    return !!result;
  }

  static async delete(id: string | number): Promise<boolean> {
    const patient = await PatientModel.findById(id);
    if (!patient) throw new Error('Patient not found');
    if (patient.role === 'admin') throw new Error('Cannot delete admin user');
    
    const result = await PatientModel.findByIdAndDelete(id);
    return !!result;
  }

  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async addDocument(patientId: string | number, filename: string): Promise<void> {
    await PatientModel.findByIdAndUpdate(patientId, {
      $push: { documents: filename }
    });
  }

  static async getDocuments(patientId: string | number): Promise<string[]> {
    const patient = await PatientModel.findById(patientId);
    return patient ? patient.documents : [];
  }
}
