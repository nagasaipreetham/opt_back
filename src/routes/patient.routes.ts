import { Router } from 'express';
import {
  getAllPatients,
  getPatientById,
  getMyProfile,
  createPatient,
  updatePatient,
  deletePatient,
  uploadDocument
} from '../controllers/patient.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/patients', authenticate, authorizeAdmin, getAllPatients);
router.get('/patient/me', authenticate, getMyProfile);
router.get('/patients/:id', authenticate, getPatientById);
router.post('/patients', authenticate, authorizeAdmin, createPatient);
router.put('/patients/:id', authenticate, authorizeAdmin, updatePatient);
router.delete('/patients/:id', authenticate, authorizeAdmin, deletePatient);
router.post('/upload-document', authenticate, upload.single('document'), uploadDocument);

export default router;
