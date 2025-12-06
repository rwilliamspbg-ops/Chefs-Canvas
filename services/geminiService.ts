import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "../types";

// Helper to get fresh AI instance (crucial for Veo key updates)
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseRecipe = async (
  textInput: string,
  imageBase64?: string,
  mimeType: string = "image/png"
): Promise<Recipe> => {
  const ai = getAI();
  
  const prompt = `
    Extract a structured recipe from the provided input. 
    If it is an image, transcribe the recipe details. 
    If it is text, structure it accordingly.
    Ensure all fields are filled. If specific times or servings are missing, make a reasonable estimate based on the recipe type.
  `;

  const parts: any[] = [{ text: prompt }];
  
  if (textInput) {
    parts.push({ text: `Recipe Text:\n${textInput}` });
  }
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          ingredients: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          instructions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          servings: { type: Type.STRING },
          prepTime: { type: Type.STRING },
          cookTime: { type: Type.STRING },
        },
        required: ["title", "description", "ingredients", "instructions"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to extract recipe.");
  }

  return JSON.parse(response.text) as Recipe;
};

export const generateRecipeImage = async (recipe: Recipe): Promise<string> => {
  const ai = getAI();
  const prompt = `Professional food photography of ${recipe.title}. 
  ${recipe.description}. 
  High resolution, cookbook style, soft natural lighting, overhead or 45-degree angle, delicious, garnished.`;

  // Using generateContent for nano banana series as per guidelines
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "4:3",
        imageSize: "1K"
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated.");
};

export const generateRecipeVideo = async (recipe: Recipe): Promise<string> => {
  const ai = getAI();
  const prompt = `Cinematic slow motion video of ${recipe.title}. 
  Close up, steam rising, delicious texture, professional lighting, 4k resolution. 
  The food looks freshly prepared and appetizing.`;

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  
  if (!downloadLink) {
      throw new Error("Video generation failed or no URI returned.");
  }

  // The response.body contains the MP4 bytes. We must append an API key when fetching from the download link.
  // Note: We return the fetchable URL here.
  return `${downloadLink}&key=${process.env.API_KEY}`;
};
