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
    You are BiteAid, a sophisticated, privacy-first nutrition assistant. 
    Analyze the food image provided. 
    Do not calculate calories. 
    Focus on qualitative impact, metabolic health, and actionable harm reduction.
    
    CRITICAL CONTEXT:
    The user's specific wellness goal is: "${goal}".
    Tailor all advice to directly support "${goal}".

    Output JSON ONLY based on the schema provided.
    
    Guidance on fields:
    
    1. **detected_foods**:
       - "primary_items": The main components (e.g., "Grilled Salmon", "Cheeseburger", "Bowl of Rice").
       - "secondary_ingredients": Sides, sauces, or smaller visible ingredients (e.g., "Ketchup", "Sesame seeds", "Side Salad").

    2. **health_impact_level**: 
       - "Low" (Nutrient dense, balanced), "Moderate" (Okay occasional), "High" (Metabolically taxing, processed, or unbalanced).
    
    3. **main_concern_summary**: 
       - A short, punchy 5-7 word summary of the *primary* reason for the impact level. E.g., "High glycemic load and sodium", "Excellent fiber and protein balance".

    4. **nutritional_risks**: 
       - Identify up to 3 specific risks.
       - "severity": 'high' (main concern) or 'medium'/'low' (minor note).
       - "explanation": Very short context (e.g. "May cause bloating").

    5. **actionable_guidance** (The "Smart Plan"):
       - **right_now**: What to do *during* this meal to reduce harm. (e.g., "Eat the veggies first", "Drink water", "Leave the crust").
       - **later_today**: How to compensate in the next 4-6 hours. (e.g., "Take a 15min walk", "Hydrate extra").
       - **next_meal**: What to prioritize next time to rebalance. (e.g., "Focus on lean protein", "Skip refined carbs").
       - *Crucial*: For every action, provide a "why_it_helps" (short scientific rationale, e.g., "Reduces glucose spike").

    6. **brief_supportive_comment**: 
       - A sophisticated, non-judgmental closing remark.

    Ensure the tone is professional, intelligent, yet warm.
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
              type: Type.OBJECT,
              properties: {
                primary_items: { type: Type.ARRAY, items: { type: Type.STRING } },
                secondary_ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["primary_items", "secondary_ingredients"]
            },
            health_impact_level: {
              type: Type.STRING,
              enum: ["Low", "Moderate", "High"]
            },
            main_concern_summary: { type: Type.STRING },
            nutritional_risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  explanation: { type: Type.STRING }
                },
                required: ["name", "severity", "explanation"]
              }
            },
            actionable_guidance: {
              type: Type.OBJECT,
              properties: {
                right_now: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { action: {type: Type.STRING}, why_it_helps: {type: Type.STRING} },
                    required: ["action", "why_it_helps"]
                  } 
                },
                later_today: { 
                   type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { action: {type: Type.STRING}, why_it_helps: {type: Type.STRING} },
                    required: ["action", "why_it_helps"]
                  } 
                },
                next_meal: { 
                   type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { action: {type: Type.STRING}, why_it_helps: {type: Type.STRING} },
                    required: ["action", "why_it_helps"]
                  } 
                }
              },
              required: ["right_now", "later_today", "next_meal"]
            },
            brief_supportive_comment: { type: Type.STRING }
          },
          required: ["detected_foods", "health_impact_level", "main_concern_summary", "nutritional_risks", "actionable_guidance", "brief_supportive_comment"]
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