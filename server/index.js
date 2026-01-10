import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from public directory
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../public')));

// Perplexity for text processing
const perplexityClient = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
});

// OpenAI for vision
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/parse-recipe', upload.single('image'), async (req, res) => {
  try {
    let textInput = req.body.textInput || '';
    
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      
      if (mimeType === 'application/pdf') {
        // Try text extraction first
        const pdfData = await pdfParse(req.file.buffer);
        textInput = pdfData.text;
        
        // If text extraction yields insufficient data, use OpenAI Vision API
        if (!textInput || textInput.trim().length < 50) {
          try {
            // Load and validate PDF with pdf-lib
            const pdfDoc = await PDFDocument.load(req.file.buffer);
            const cleanPdfBytes = await pdfDoc.save();
            
            // Convert to Base64 for OpenAI
            const base64Pdf = Buffer.from(cleanPdfBytes).toString('base64');
            
            const completion = await openaiClient.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "user",
                  content: [
                    { 
                      type: "text", 
                      text: "Extract the recipe from this PDF document. Include title, description, ingredients, instructions, servings, prep time, and cook time. Return as JSON." 
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:application/pdf;base64,${base64Pdf}`,
                        detail: "high"
                      }
                    }
                  ]
                }
              ],
              response_format: { type: "json_object" }
            });
            
            const recipe = JSON.parse(completion.choices[0].message.content);
            return res.json(recipe);
          } catch (visionError) {
            console.error('PDF Vision API Error:', visionError);
            // Fall through to use whatever text was extracted
          }
        }
      } else if (mimeType.startsWith('image/')) {
        // Handle image-based recipes with OpenAI Vision
        try {
          const completion = await openaiClient.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  { 
                    type: "text", 
                    text: "Extract the recipe from this image. Include title, description, ingredients, instructions, servings, prep time, and cook time. Return as JSON." 
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${base64Image}`,
                      detail: "high"
                    }
                  }
                ]
              }
            ],
            response_format: { type: "json_object" }
          });
          
          const recipe = JSON.parse(completion.choices[0].message.content);
          return res.json(recipe);
        } catch (visionError) {
          console.error('Image Vision API Error:', visionError);
          return res.status(500).json({ error: 'Failed to process image', details: visionError.message });
        }
      }
    }
    
    if (!textInput) {
      return res.status(400).json({ error: 'No recipe text or image provided' });
    }
    
    // Use Perplexity for text-based recipe extraction
    const prompt = `Extract a structured recipe from the following input.
Provide valid JSON with these exact fields: title, description, ingredients (array), instructions (array), servings, prepTime, cookTime.
Recipe Text:
${textInput}
Ensure all fields are filled.`;

    const response = await perplexityClient.chat.completions.create({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    
    const recipe = JSON.parse(response.choices[0].message.content);
    res.json(recipe);
  } catch (error) {
    console.error('Error parsing recipe:', error);
    res.status(500).json({ error: 'Failed to parse recipe', details: error.message });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
