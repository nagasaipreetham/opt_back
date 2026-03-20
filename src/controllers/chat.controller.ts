import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import axios from 'axios';

const OPTOMETRY_FORMULAS = `
You are an expert optometry assistant with advanced calculation capabilities. You can help with:

**BASIC CALCULATIONS:**
1. Lens Power: F = 1 / f (where f is focal length in meters)
2. Vertex Distance Compensation: Fc = Fs / (1 - d × Fs) (where d is distance in meters, Fs is spectacle power)
3. Near Addition: Add = 1 / working_distance (working distance in meters)
4. Intermediate Rx: Typically half of the Add power
5. Lens Transposition: Converting between plus and minus cylinder forms

**INTERMEDIATE CALCULATIONS:**
6. Prentice's Rule: Prism = c × F (where c is decentration in cm, F is lens power in diopters)
7. Effective Diameter: ED = √(A² + B²) where A and B are horizontal and vertical dimensions
8. Lensmaker's Formula: 1/f = (n-1)[1/R1 - 1/R2 + (n-1)d/nR1R2]
9. RGP Over-Refraction: Calculating final prescription with contact lens adjustments

**ADVANCED CALCULATIONS:**
10. Vertical Imbalance: VI = h × ΔF (where h is vertical height in cm, ΔF is power difference)
11. JND (Just Noticeable Difference): Typically 0.25D for sphere, 0.50D for cylinder
12. Sheard's Criteria: Compensating convergence reserve should be at least 2× phoria
13. Back Vertex Power: BVP calculation for thick lenses
14. IOL Power (SRK Formula): P = A - 2.5L - 0.9K (where P is IOL power, L is axial length, K is keratometry)

**HOW TO USE:**
- Ask me to calculate any of these formulas
- Provide the required values
- I will show the formula, calculation steps, and final result
- Example: "Calculate lens power for focal length 0.5 meters"
- Example: "What is the vertex distance compensation for -10.00D at 12mm?"
- Example: "Calculate prism using Prentice's rule with 5mm decentration and +4.00D lens"

Always provide step-by-step calculations with units clearly labeled.
`;

const MEDICAL_DISCLAIMER = '\n\n**Medical Disclaimer**: This information is for educational purposes only and should not replace professional medical advice. Please consult with a qualified eye care professional for diagnosis and treatment.';

// Simple eye detection placeholder - in production, use OpenCV or MediaPipe
const validateEyeImage = async (imagePath: string): Promise<boolean> => {
  // TODO: Implement actual eye detection using OpenCV or MediaPipe
  // For now, return true as placeholder
  return true;
};

export const chat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({ message: 'Gemini API key not configured' });
    }

    // Retry logic for network issues
    let response;
    let lastError;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: `${OPTOMETRY_FORMULAS}

You are a helpful eye care assistant with expertise in optometry calculations. Provide information about eye health, common eye conditions, general eye care advice, and perform optometry calculations when requested.

When users ask for calculations:
1. Identify which formula to use
2. Show the formula clearly
3. Plug in the values provided
4. Show step-by-step calculation
5. Provide the final answer with proper units
6. Explain what the result means in practical terms

Always remind users to consult with a qualified eye care professional for medical advice.

User question: ${message}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048
            }
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          }
        );
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        console.log(`Attempt ${attempt} failed:`, error.code || error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (!response) {
      throw lastError;
    }

    const aiResponse = response.data.candidates[0].content.parts[0].text + MEDICAL_DISCLAIMER;

    res.json({
      response: aiResponse,
      conversationHistory: [
        ...(conversationHistory || []),
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      ]
    });
  } catch (error: any) {
    console.error('Chat error:', error.code || error.message);
    
    // Provide helpful error message based on error type
    let errorMessage = 'I\'m currently experiencing technical difficulties.';
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Unable to connect to AI service. Please check your internet connection.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timed out. Please try again.';
    }
    
    const fallbackResponse = `${errorMessage} Please consult with a qualified eye care professional for medical advice.${MEDICAL_DISCLAIMER}`;
    
    res.json({
      response: fallbackResponse,
      conversationHistory: [
        ...(req.body.conversationHistory || []),
        { role: 'user', content: req.body.message },
        { role: 'assistant', content: fallbackResponse }
      ]
    });
  }
};

export const analyzeEye = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Validate that the image contains an eye
    const isEyeImage = await validateEyeImage(req.file.path);
    
    if (!isEyeImage) {
      return res.status(400).json({ 
        message: 'This does not appear to be a valid eye image.' 
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({ message: 'Gemini API key not configured' });
    }

    const analysisPrompt = 'An eye image has been uploaded for analysis. Please provide general information about eye health and remind the user to consult an eye care professional for proper diagnosis.';

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: analysisPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text + MEDICAL_DISCLAIMER;

    res.json({
      response: aiResponse,
      imageUrl: `/uploads/${req.file.filename}`
    });
  } catch (error: any) {
    console.error('Eye analysis error:', error);
    
    // Fallback response
    const fallbackResponse = `Eye image received and validated. For detailed analysis, please consult with a qualified eye care professional.${MEDICAL_DISCLAIMER}`;
    
    res.json({
      response: fallbackResponse,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null
    });
  }
};
