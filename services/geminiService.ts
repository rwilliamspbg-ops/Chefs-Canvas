
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "../types";

// Helper to get fresh AI instance (crucial for Veo key updates)
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses a fast model to generate a highly descriptive prompt for image/video models.
 * This analyzes the recipe to determine the best visual style, lighting, and composition.
 */
const craftArtisticPrompt = async (recipe: Recipe, target: 'image' | 'video'): Promise<string> => {
  const ai = getAI();
  const systemInstruction = `You are an expert food stylist and professional commercial photographer/videographer. 
  Your goal is to write a single-paragraph prompt for an AI ${target === 'image' ? 'image' : 'video'} generation model.
  
  Consider the dish's origin, texture, and colors. 
  - For rustic dishes: use warm, natural, side-lit, slightly moody settings.
  - For modern/fine dining: use clean, minimalist, bright, high-key photography.
  - For vibrant/spicy/tropical: use high-contrast, colorful, saturated palettes.
  
  Focus on sensory details: textures (crunchy, silky, steaming), colors, and composition (macro, overhead, 45-degree).
  Do not use buzzwords like "photorealistic", instead describe the lighting and camera lens.
  Keep it under 75 words.`;

  const userPrompt = `Recipe: ${recipe.title}. 
  Description: ${recipe.description}. 
  Ingredients: ${recipe.ingredients.slice(0, 5).join(', ')}.
  
  Create a professional ${target === 'image' ? 'photography' : 'cinematic video'} prompt for this dish.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction,
      temperature: 0.8,
    }
  });

  return response.text || `Professional ${target} of ${recipe.title}`;
};

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
  
  // Phase 1: Craft the perfect artistic prompt
  const enhancedPrompt = await craftArtisticPrompt(recipe, 'image');
  console.log("Image Generation Prompt:", enhancedPrompt);

  // Phase 2: Generate the image
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: enhancedPrompt }],
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

  // Phase 1: Craft the perfect cinematic prompt
  const enhancedPrompt = await craftArtisticPrompt(recipe, 'video');
  console.log("Video Generation Prompt:", enhancedPrompt);

  // Phase 2: Generate the video
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: enhancedPrompt,
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

  return `${downloadLink}&key=${process.env.API_KEY}`;
};
