import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/register', authenticate, authorizeAdmin, upload.array('prescriptions', 5), register);
router.post('/login', login);

export default router;
