import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

// ---------- Multer configuration with limits ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max upload
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type'), false);
    }
    cb(null, true);
  },
});

app.use(cors());
// Lower this if you don’t need huge JSON bodies
app.use(express.json({ limit: '10mb' }));

// ---------- Static file serving ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../public')));

// ---------- AI clients ----------
const perplexityClient = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
});

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------- Helpers ----------
function safeParseJson(content) {
  if (!content || typeof content !== 'string') return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function looksLikeRecipe(text) {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 200) return false;
  const hasIngredients = /ingredients/i.test(trimmed);
  const hasInstructions = /instructions|directions/i.test(trimmed);
  return hasIngredients && hasInstructions;
}

// ---------- Health endpoint ----------
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

// ---------- Main recipe parsing endpoint ----------
app.post('/api/parse-recipe', upload.single('image'), async (req, res) => {
  try {
    let textInput = req.body.textInput || '';
    let source = 'text';
    let rawAiContent = null;

    if (req.file) {
      const mimeType = req.file.mimetype;
      const base64File = req.file.buffer.toString('base64');

      if (mimeType === 'application/pdf') {
        source = 'pdf-text';
        // 1) Try text extraction first
        const pdfData = await pdfParse(req.file.buffer);
        textInput = pdfData.text || '';

        // If the extracted text already looks like a recipe, skip Vision
        if (looksLikeRecipe(textInput)) {
          // fall through to Perplexity text-based extraction below
        } else {
          // 2) Fallback to Vision on the cleaned PDF
          try {
            const pdfDoc = await PDFDocument.load(req.file.buffer);
            const cleanPdfBytes = await pdfDoc.save();
            const base64Pdf = Buffer.from(cleanPdfBytes).toString('base64');

            const completion = await openaiClient.chat.completions.create({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text:
                        'Extract the recipe from this PDF document. ' +
                        'Include title, description, ingredients, instructions, servings, prep time, and cook time. ' +
                        'Return as JSON.',
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:application/pdf;base64,${base64Pdf}`,
                        detail: 'high',
                      },
                    },
                  ],
                },
              ],
              response_format: { type: 'json_object' },
            });

            rawAiContent = completion.choices[0]?.message?.content;
            const recipe = safeParseJson(rawAiContent);

            if (!recipe) {
              return res.status(502).json({
                error: 'Vision returned invalid JSON',
                raw: rawAiContent,
              });
            }

            return res.json({ recipe, source: 'pdf-vision' });
          } catch (visionError) {
            console.error('PDF Vision API Error:', visionError);
            // Fall through to use whatever text was extracted (even if weak)
          }
        }
      } else if (mimeType.startsWith('image/')) {
        // Image-based recipes with Vision
        source = 'image-vision';
        try {
          const completion = await openaiClient.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text:
                      'Extract the recipe from this image. ' +
                      'Include title, description, ingredients, instructions, servings, prep time, and cook time. ' +
                      'Return as JSON.',
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType};base64,${base64File}`,
                      detail: 'high',
                    },
                  },
                ],
              },
            ],
            response_format: { type: 'json_object' },
          });

          rawAiContent = completion.choices[0]?.message?.content;
          const recipe = safeParseJson(rawAiContent);

          if (!recipe) {
            return res.status(502).json({
              error: 'Vision returned invalid JSON',
              raw: rawAiContent,
            });
          }

          return res.json({ recipe, source: 'image-vision' });
        } catch (visionError) {
          console.error('Image Vision API Error:', visionError);
          return res.status(500).json({
            error: 'Failed to process image',
            details: visionError.message,
          });
        }
      }
    }

    if (!textInput) {
      return res
        .status(400)
        .json({ error: 'No recipe text or image provided' });
    }

    // ---------- Perplexity for text-based recipe extraction ----------
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

    rawAiContent = response.choices[0]?.message?.content;
    const recipe = safeParseJson(rawAiContent);

    if (!recipe) {
      return res.status(502).json({
        error: 'Perplexity returned invalid JSON',
        raw: rawAiContent,
      });
    }

    return res.json({ recipe, source });
  } catch (error) {
    console.error('Error parsing recipe:', error);
    return res.status(500).json({
      error: 'Failed to parse recipe',
      details: error.message,
    });
  }
});

// ---------- Multer / general error handler ----------
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  if (err.message === 'Unsupported file type') {
    return res.status(400).json({ error: 'Unsupported file type' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

// ---------- SPA fallback ----------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
