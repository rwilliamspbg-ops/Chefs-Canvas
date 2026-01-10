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
      
      if (mimeType === '45
          ') {
        // Try text extraction first
        const pdfData = await pdfParse(req.file.buffer);
        textInput = pdfData.text;

    import { PDFDocument } from 'pdf-lib';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ... inside your API route handler (e.g., app.post('/parse-pdf', ...))

try {
  const pdfBuffer = req.file.buffer; // Assuming usage of multer or similar

  // Optional: Use pdf-lib to load and sanitize the PDF (verifies integrity)
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();
  
  // Optimization: If PDF is massive, you could split it here using pdf-lib
  // For now, we save it back to a clean buffer to ensure valid headers
  const cleanPdfBytes = await pdfDoc.save(); 
  
  // Convert to Base64 for OpenAI
  const base64Pdf = Buffer.from(cleanPdfBytes).toString('base64');

  const completion = await openai.chat.completions.create({
    model: "gpt-4o", // Use the latest model with Vision/PDF support
    messages: [
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: "Please analyze this PDF invoice. Extract the total amount, vendor name, and invoice date. Return JSON." 
          },
          {
            // Direct PDF ingestion (simpler than converting to images manually)
            type: "image_url",
            image_url: {
              url: `data:application/pdf;base64,${base64Pdf}`,
              detail: "high"
            }
          }
        ]
      }
    ],
    response_format: { type: "json_object" } // Ensures clean JSON output
  });

  const parsedData = JSON.parse(completion.choices[0].message.content);
  
  res.json({ success: true, data: parsedData, pages: pageCount });

} catch (error) {
  console.error('PDF Parsing Error:', error);
  res.status(500).json({ error: "Failed to parse PDF" });
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


// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {  console.log(`Server running on http://localhost:${PORT}`);
});
49
