import { Router } from 'express';
import { chat, analyzeEye } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/chat', authenticate, chat);
router.post('/analyze-eye', authenticate, upload.single('image'), analyzeEye);

export default router;
