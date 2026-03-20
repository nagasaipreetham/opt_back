import { Response } from 'express';
import { Patient } from '../models/Patient.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllPatients = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const patients = await Patient.findAll();
    
    // Remove password from response
    const sanitizedPatients = patients.map(p => {
      const patientObj = p.toObject ? p.toObject() : p;
      const { password, ...rest } = patientObj;
      return { ...rest, id: patientObj._id };
    });

    res.json(sanitizedPatients);
  } catch (error: any) {
    console.error('Get all patients error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getPatientById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patientObj = patient.toObject ? patient.toObject() : patient;
    const { password, ...sanitizedPatient } = patientObj;
    res.json({ ...sanitizedPatient, id: patientObj._id });
  } catch (error: any) {
    console.error('Get patient by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const patient = await Patient.findById(req.user?.id || '');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patientObj = patient.toObject ? patient.toObject() : patient;
    const { password, ...sanitizedPatient } = patientObj;
    res.json({ ...sanitizedPatient, id: patientObj._id });
  } catch (error: any) {
    console.error('Get my profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createPatient = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, age, gender, username, password, diagnosis, precautions } = req.body;

    const existingPatient = await Patient.findByUsername(username);
    if (existingPatient) {
      return res.status(400).json({ message: 'Username already exists' });
    }

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

    const patient = await Patient.findById(patientId);
    const patientObj = patient.toObject ? patient.toObject() : patient;
    const { password: _, ...sanitizedPatient } = patientObj!;

    res.status(201).json({
      message: 'Patient created successfully',
      patient: { ...sanitizedPatient, id: patientObj._id }
    });
  } catch (error: any) {
    console.error('Create patient error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updatePatient = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, age, gender, diagnosis, precautions, password } = req.body;
    
    const updated = await Patient.update(req.params.id, {
      name,
      age,
      gender,
      diagnosis,
      precautions,
      password
    });

    if (!updated) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patient = await Patient.findById(req.params.id);
    const patientObj = patient.toObject ? patient.toObject() : patient;
    const { password: _, ...sanitizedPatient } = patientObj!;

    res.json({
      message: 'Patient updated successfully',
      patient: { ...sanitizedPatient, id: patientObj._id }
    });
  } catch (error: any) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deletePatient = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const patientId = req.params.id;
    
    if (!patientId) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const deleted = await Patient.delete(patientId);
    if (!deleted) {
      return res.status(404).json({ message: 'Patient not found or could not be deleted' });
    }
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error: any) {
    console.error('Delete patient error:', error);
    
    if (error.message === 'Cannot delete admin user') {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }
    
    if (error.message === 'Patient not found') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.status(500).json({ message: 'Error deleting patient' });
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const patientId = req.body.patientId || req.user?.id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    await Patient.addDocument(patientId, req.file.filename);
    const documents = await Patient.getDocuments(patientId);

    res.json({
      message: 'Document uploaded successfully',
      filename: req.file.filename,
      documents
    });
  } catch (error: any) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: error.message });
  }
};
