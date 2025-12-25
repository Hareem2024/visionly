
import { GoogleGenAI } from "@google/genai";

/**
 * Generates a short, cozy, and powerful lofi-style affirmation using Gemini 3 Flash.
 * Adheres to the latest @google/genai SDK best practices.
 */
export const generateAffirmationSpark = async (topic: string): Promise<string> => {
  // Always initialize GoogleGenAI with the API key from process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a single, short, cozy, and powerful lofi-style affirmation for someone dreaming about: ${topic}. Max 10 words.`,
      // Removed maxOutputTokens to avoid potential blocks without thinkingBudget.
    });

    // The .text property is used directly to extract the generated string.
    return response.text?.trim() || "My dreams are coming true.";
  } catch (error) {
    console.error("Error generating affirmation:", error);
    return "I am capable of achieving my goals.";
  }
};

/**
 * Generates an aesthetic "vibe name" for a vision board based on its content.
 * Returns 1-3 word lowercase aesthetic titles like "soft discipline", "quiet glow up", "healing era"
 */
export const generateVibeName = async (boardContent: string): Promise<{ title: string; affirmation: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this vision board content: "${boardContent}"
      
Generate an aesthetic vibe name and affirmation in this exact JSON format:
{"title": "soft discipline", "affirmation": "consistency looks good on you"}

Rules for the title:
- Must be 1-3 words, all lowercase
- Should feel like a Pinterest aesthetic or Tumblr era name
- Examples: "soft discipline", "quiet glow up", "healing era", "slow success", "rich in peace", "main character", "calm life"
- Make it emotionally resonant and shareable

Rules for the affirmation:
- Should be a gentle, powerful one-liner
- Max 8 words
- Feels like a whisper of encouragement

Return ONLY the JSON, nothing else.`,
    });

    const text = response.text?.trim() || '';
    try {
      const parsed = JSON.parse(text);
      return {
        title: parsed.title || 'your vision',
        affirmation: parsed.affirmation || 'this is who you\'re becoming'
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        title: 'your vision',
        affirmation: 'this is who you\'re becoming'
      };
    }
  } catch (error) {
    console.error("Error generating vibe name:", error);
    return {
      title: 'your vision',
      affirmation: 'this is who you\'re becoming'
    };
  }
};

/**
 * Generates a vision board from a text description.
 * Returns suggested images, colors, and layout ideas.
 */
export const generateVisionFromText = async (description: string): Promise<{
  suggestions: string[];
  colors: string[];
  vibe: string;
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this vision: "${description}"

Generate a JSON response with:
1. "suggestions": array of 5 short search terms for finding images (like "cozy home office", "morning coffee ritual")
2. "colors": array of 4 hex color codes that match this vibe
3. "vibe": a 2-3 word aesthetic name for this vision

Return ONLY valid JSON like:
{"suggestions": ["term1", "term2", "term3", "term4", "term5"], "colors": ["#fff", "#eee", "#ddd", "#ccc"], "vibe": "soft focus"}`,
    });

    const text = response.text?.trim() || '';
    try {
      return JSON.parse(text);
    } catch {
      return {
        suggestions: ['peaceful life', 'cozy moments', 'growth mindset', 'self care', 'dream life'],
        colors: ['#fafafa', '#f5f5f5', '#efefef', '#e8e8e8'],
        vibe: 'your vision'
      };
    }
  } catch (error) {
    console.error("Error generating vision:", error);
    return {
      suggestions: ['peaceful life', 'cozy moments', 'growth mindset', 'self care', 'dream life'],
      colors: ['#fafafa', '#f5f5f5', '#efefef', '#e8e8e8'],
      vibe: 'your vision'
    };
  }
};
