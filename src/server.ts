import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import axios from 'axios';
import { connectDB } from './config/database';
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import chatRoutes from './routes/chat.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// List available models
app.get('/api/list-models', async (req, res) => {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.json({ status: 'ERROR', message: 'No API key found' });
    }

    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${geminiApiKey}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const models = response.data.models.map((model: any) => ({
      name: model.name,
      displayName: model.displayName,
      supportedGenerationMethods: model.supportedGenerationMethods
    }));

    res.json({ 
      status: 'SUCCESS', 
      message: 'Available models',
      models: models
    });
  } catch (error: any) {
    res.json({ 
      status: 'ERROR', 
      message: error.response?.data?.error?.message || error.message 
    });
  }
});

// Test Gemini API endpoint
app.get('/api/test-gemini', async (req, res) => {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.json({ status: 'ERROR', message: 'No API key found' });
    }

    const model = 'models/gemini-2.5-flash';
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/${model}:generateContent?key=${geminiApiKey}`,
      {
        contents: [{ parts: [{ text: 'Hello, respond with just "API working!"' }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    res.json({
      status: 'SUCCESS',
      model: model,
      response: response.data.candidates[0].content.parts[0].text
    });
  } catch (error: any) {
    res.json({
      status: 'ERROR',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', patientRoutes);
app.use('/api', chatRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
