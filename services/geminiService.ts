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
    
    CRITICAL CONTEXT:
    The user's specific wellness goal is: "${goal}".
    Tailor all advice, especially "do_this" and "avoid_this", to directly support "${goal}".

    Output JSON ONLY based on the schema provided.
    
    Guidance on fields:
    - detected_foods: List visible items.
    - health_impact_level: "Low" (Healthy/Safe), "Moderate" (Okay occasionally), "High" (Potential adverse effects if consumed often/large quantity).
    - nutritional_risks: E.g., "High Sodium", "Added Sugar", "Low Fiber", "Deep Fried", "Blood Sugar Spike Risk".
    
    - actionable_guidance: Provide 2-3 distinct, specific, and practical tips per category.
      - "do_this": Immediate positive actions during this meal. 
        * Examples: "Drink a full glass of water first", "Eat the protein/veggies first to reduce glucose spike", "Add lemon juice to lower glycemic response".
      - "avoid_this": What to skip, limit, or remove *right now*. 
        * Examples: "Skip the extra sauce", "Leave the crust", "Eat only half the portion of rice", "Avoid sugary drinks with this".
      - "consider_balancing": Post-meal or next-meal adjustments.
        * Examples: "Take a 10-minute walk after eating to aid digestion/blood sugar", "Ensure next meal is fiber-rich", "Wait 3-4 hours before eating again".

    - brief_supportive_comment: A 1-sentence non-judgmental observation that acknowledges the food's appeal while subtly nudging towards the goal.
    
    SPECIAL INSTRUCTION FOR 'HIGH' IMPACT:
    If the meal is High impact (e.g., fast food, heavy fried food, high sugar):
    - Focus heavily on "harm reduction" (e.g., portion control, hydration, order of eating).
    - Suggest movement (e.g., walking) in "consider_balancing" to mitigate metabolic impact.
    - Be realistic—don't just say "don't eat it" if it's on their plate, say "eat slowly" or "save half".
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