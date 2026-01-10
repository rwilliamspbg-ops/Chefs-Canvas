import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
        const pdfData = await pdfParse(req.file.buffer);
        textInput = pdfData.text;
      } else {
        const visionResponse = await openaiClient.chat.completions.create({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Extract all recipe text from this image. Include title, ingredients, instructions, servings, prep time, and cook time.' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
            ],
          }],
          max_tokens: 1500,
        });
        textInput = visionResponse.choices[0]?.message?.content || '';
      }
    }
    
    if (!textInput) {
      return res.status(400).json({ error: 'No recipe text or image provided' });
    }
    
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
