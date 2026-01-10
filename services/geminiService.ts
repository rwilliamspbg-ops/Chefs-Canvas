import OpenAI from "openai";
import { Recipe } from "../types";

// Initialize Perplexity client using OpenAI SDK
const getClient = () => new OpenAI({
  apiKey: (window as any).PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
});

/**
 * Uses Perplexity to generate a descriptive prompt for recipe visualization
 */
const craftArtisticPrompt = async (recipe: Recipe, target: 'image' | 'video'): Promise<string> => {
  const client = getClient();
  
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

  const response = await client.chat.completions.create({
    model: "llama-3.1-sonar-small-128k-online",
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
  });

  return response.choices[0]?.message?.content || `Professional ${target} of ${recipe.title}`;
};

export const parseRecipe = async (
  textInput: string,
  imageBase64?: string,
  mimeType: string = "image/png"
): Promise<Recipe> => {
  const client = getClient();
  
  // Perplexity doesn't support image input in the same way as Gemini
  // For image-based recipe extraction, we'll need to use the text description
  // or implement a separate vision API if needed
  
  const prompt = `Extract a structured recipe from the following input.
Provide the response as valid JSON with these exact fields: title, description, ingredients (array), instructions (array), servings, prepTime, cookTime.

Recipe Text:
${textInput}

Ensure all fields are filled. If specific times or servings are missing, make a reasonable estimate based on the recipe type.`;

  const response = await client.chat.completions.create({
    model: "llama-3.1-sonar-large-128k-online",
    messages: [
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  if (!response.choices[0]?.message?.content) {
    throw new Error("Failed to extract recipe.");
  }

  return JSON.parse(response.choices[0].message.content) as Recipe;
};

export const generateRecipeImage = async (recipe: Recipe): Promise<string> => {
  // Note: Perplexity doesn't have native image generation capabilities
  // You would need to integrate with a separate image generation service
  // like DALL-E, Stable Diffusion, or Midjourney
  
  // For now, we'll create a placeholder that explains this limitation
  console.warn("Image generation requires integration with a separate service like DALL-E or Stable Diffusion");
  
  // Example: You could integrate OpenAI's DALL-E here
  const enhancedPrompt = await craftArtisticPrompt(recipe, 'image');
  console.log("Image Generation Prompt:", enhancedPrompt);
  
  // Placeholder return - integrate with your image generation service
  throw new Error("Image generation not yet implemented. Please integrate with DALL-E, Stable Diffusion, or similar service.");
};

export const generateRecipeVideo = async (recipe: Recipe): Promise<string> => {
  // Note: Perplexity doesn't have native video generation capabilities
  // You would need to integrate with a separate video generation service
  
  console.warn("Video generation requires integration with a separate service");
  
  const enhancedPrompt = await craftArtisticPrompt(recipe, 'video');
  console.log("Video Generation Prompt:", enhancedPrompt);
  
  // Placeholder return - integrate with your video generation service
  throw new Error("Video generation not yet implemented. Please integrate with a video generation service.");
};
