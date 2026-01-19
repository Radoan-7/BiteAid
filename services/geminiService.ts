import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, HealthGoal } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeMealImage = async (
  base64Image: string, 
  mimeType: string, 
  goal: HealthGoal
): Promise<AnalysisResult> => {
  
  const model = "gemini-3-flash-preview";

  const systemPrompt = `
    You are BiteAid, a supportive, privacy-first nutrition assistant. 
    Analyze the food image provided. 
    Do not calculate calories. 
    Focus on qualitative impact and harm reduction.
    The user's specific wellness goal is: ${goal}.
    
    Output JSON ONLY based on the schema provided.
    
    Guidance on fields:
    - detected_foods: List visible items.
    - health_impact_level: "Low" (Healthy/Safe), "Moderate" (Okay occasionally), "High" (Potential adverse effects if consumed often/large quantity).
    - nutritional_risks: E.g., "High Sodium", "Added Sugar", "Low Fiber", "Deep Fried".
    - actionable_guidance: Short, punchy tips. 
      - "do_this": Constructive addition (e.g., "Drink water with this").
      - "avoid_this": What to skip or limit *right now* (e.g., "Skip the sauce").
      - "consider_balancing": Next meal advice (e.g., "Eat a salad next").
    - brief_supportive_comment: A 1-sentence non-judgmental observation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          {
            text: systemPrompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected_foods: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            health_impact_level: {
              type: Type.STRING,
              enum: ["Low", "Moderate", "High"]
            },
            nutritional_risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            actionable_guidance: {
              type: Type.OBJECT,
              properties: {
                do_this: { type: Type.ARRAY, items: { type: Type.STRING } },
                avoid_this: { type: Type.ARRAY, items: { type: Type.STRING } },
                consider_balancing: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["do_this", "avoid_this", "consider_balancing"]
            },
            brief_supportive_comment: { type: Type.STRING }
          },
          required: ["detected_foods", "health_impact_level", "nutritional_risks", "actionable_guidance", "brief_supportive_comment"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(response.text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
};
