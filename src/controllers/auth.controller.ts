import { Request, Response } from 'express';
import { Patient } from '../models/Patient.model';
import { generateToken } from '../utils/jwt.util';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, age, gender, username, password, diagnosis, precautions } = req.body;

    // Check if username already exists
    const existingPatient = await Patient.findByUsername(username);
    if (existingPatient) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new patient
    const patientId = await Patient.create({
      name,
      age,
      gender,
      username,
      password,
      diagnosis: diagnosis || '',
      precautions: precautions || '',
      role: 'patient'
    });

    // Handle prescription file uploads
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        await Patient.addDocument(patientId, file.filename);
      }
    }

    const patient = await Patient.findById(patientId);

    res.status(201).json({
      message: 'Patient registered successfully',
      patient: {
        id: patient?._id,
        name: patient?.name,
        username: patient?.username,
        role: patient?.role
      }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;

    // Find patient
    const patient = await Patient.findByUsername(username);
    if (!patient) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await Patient.comparePassword(password, patient.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      id: patient._id.toString(),
      username: patient.username,
      role: patient.role
    });

    res.json({
      token,
      user: {
        id: patient._id,
        name: patient.name,
        username: patient.username,
        role: patient.role
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};
