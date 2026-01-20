import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, HealthGoal, SimulationResult, CanteenGoal, CanteenAnalysisResult } from "../types";

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
    - detected_foods: List visible items. Provide confidence level ('High', 'Medium', 'Low') based on visual clarity.
    - health_impact_level: "Low" (Healthy/Safe), "Moderate" (Okay occasionally), "High" (Potential adverse effects if consumed often/large quantity).
    - nutritional_risks: E.g., "High Sodium", "Added Sugar", "Low Fiber", "Deep Fried", "Blood Sugar Spike Risk". Provide confidence level.
    
    - actionable_guidance: Provide 2-3 distinct, specific, and practical tips per category. Include confidence level.
      - "do_this": Immediate positive actions during this meal. 
      - "avoid_this": What to skip, limit, or remove *right now*. 
      - "consider_balancing": Post-meal or next-meal adjustments.

    - after_effect_timeline: Generate a projected timeline of how this meal might affect the user's body.
      Create exactly 3 checkpoints: "30-60 mins", "2-3 hours", "4-5 hours".
      - feeling_indicators: 2-3 short, 1-2 word qualitative tags (e.g., "Stable Energy", "Sugar Crash", "Full", "Hungry", "Thirsty").
      - description: A single plain-language sentence explaining the physiological reason (e.g. "Fiber from the veggies slows digestion, keeping you full.").
      - confidence: Certainty level based on food composition.

    Confidence Level Guidelines:
    - High: Clearly visible, scientifically well-established, or direct observation.
    - Medium: Likely true based on context, common preparation methods, or general nutritional patterns.
    - Low: Educated guess, depends heavily on unknown ingredients (e.g., specific oils used), or less clear visual.

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
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                },
                required: ["text", "confidence"]
              }
            },
            health_impact_level: {
              type: Type.STRING,
              enum: ["Low", "Moderate", "High"]
            },
            nutritional_risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                },
                required: ["text", "confidence"]
              }
            },
            actionable_guidance: {
              type: Type.OBJECT,
              properties: {
                do_this: {
                   type: Type.ARRAY,
                   items: {
                     type: Type.OBJECT,
                     properties: {
                       text: { type: Type.STRING },
                       confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                     },
                     required: ["text", "confidence"]
                   }
                },
                avoid_this: {
                   type: Type.ARRAY,
                   items: {
                     type: Type.OBJECT,
                     properties: {
                       text: { type: Type.STRING },
                       confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                     },
                     required: ["text", "confidence"]
                   }
                },
                consider_balancing: {
                   type: Type.ARRAY,
                   items: {
                     type: Type.OBJECT,
                     properties: {
                       text: { type: Type.STRING },
                       confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                     },
                     required: ["text", "confidence"]
                   }
                }
              },
              required: ["do_this", "avoid_this", "consider_balancing"]
            },
            after_effect_timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time_window: { type: Type.STRING },
                  feeling_indicators: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  description: { type: Type.STRING },
                  confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                },
                required: ["time_window", "feeling_indicators", "description", "confidence"]
              }
            },
            brief_supportive_comment: { type: Type.STRING }
          },
          required: ["detected_foods", "health_impact_level", "nutritional_risks", "actionable_guidance", "brief_supportive_comment", "after_effect_timeline"]
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

export const simulateImpact = async (
  currentAnalysis: AnalysisResult,
  targetItem: string
): Promise<SimulationResult> => {
  const model = "gemini-3-flash-preview";
  
  // We use the JSON context of the meal instead of the image to save bandwidth/latency for this follow-up task
  const prompt = `
    You are a nutritional simulation engine.
    
    Context:
    The user is eating a meal containing these items: ${currentAnalysis.detected_foods.map(f => f.text).join(', ')}.
    Existing risks identified: ${currentAnalysis.nutritional_risks.map(r => r.text).join(', ')}.
    
    Task:
    Simulate the nutritional impact if the user decides to significantly REDUCE, REMOVE, or SWAP the item: "${targetItem}".
    
    Requirements:
    1. Title: Short status (e.g., "Impact if ${targetItem} is reduced").
    2. Metrics: Provide 3 qualitative indicators (e.g., Glycemic Load, Satiety, Sodium, Energy Crash Risk) and whether they increase/decrease/stay neutral.
    3. Explanation: A 1-2 sentence plain language reasoning.
    4. Confidence: How certain is this biological impact?
    5. Swap: One realistic, easy swap (e.g. for a campus canteen or home fridge).

    Output JSON ONLY.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  trend: { type: Type.STRING, enum: ["increase", "decrease", "neutral"] }
                },
                required: ["label", "trend"]
              }
            },
            explanation: { type: Type.STRING },
            explanation_confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
            swap_suggestion: { type: Type.STRING }
          },
          required: ["title", "metrics", "explanation", "explanation_confidence", "swap_suggestion"]
        }
      }
    });

    if (!response.text) throw new Error("No simulation response");
    return JSON.parse(response.text) as SimulationResult;
  } catch (error) {
    console.error("Simulation Error:", error);
    throw new Error("Could not simulate impact.");
  }
};

export const analyzeCanteenSelection = async (
  foodImageBase64: string,
  menuImageBase64: string | null,
  goal: CanteenGoal,
  budget: string
): Promise<CanteenAnalysisResult> => {
  const model = "gemini-3-flash-preview";

  const parts = [];
  
  // Primary Part: Food Image
  parts.push({
    inlineData: {
      data: foodImageBase64,
      mimeType: "image/jpeg" 
    }
  });

  // Secondary Part: Menu Image (if present)
  if (menuImageBase64) {
    parts.push({
      inlineData: {
        data: menuImageBase64,
        mimeType: "image/jpeg"
      }
    });
  }

  // System Instruction Part
  const prompt = `
    You are BiteAid's Canteen Picker Assistant.
    
    CONTEXT:
    The user is at a canteen or cafeteria.
    - Image 1: The food display/counter showing available options.
    - Image 2 (optional): The menu or price board.
    
    USER GOAL: "${goal}"
    USER BUDGET: "${budget || "Flexible/Not specified"}"

    TASK:
    Identify the available food options.
    Be DECISIVE. Select the single absolute BEST option that maximizes the user's goal.
    
    OUTPUT REQUIREMENTS:
    1. best_pick: The winner.
       - match_percentage: Integer (0-100). How well does this fit the goal?
       - reason_chips: 3-4 short, punchy phrases explaining why (e.g. "High Protein", "No Sugar Crash", "Fits Budget").
    
    2. rejected_options: List other visible items and why they were skipped.
       - reason_for_rejection: Short, direct explanation of the trade-off (e.g. "Too much sodium", "Will cause fatigue", "Over budget").

    CONSTRAINTS:
    - Do NOT count calories.
    - Be authoritative. Don't be wishy-washy.
    - If budget is tight, prioritize value/filling options.

    OUTPUT JSON ONLY.
  `;

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            best_pick: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price_estimate: { type: Type.STRING },
                match_percentage: { type: Type.INTEGER },
                reason_chips: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "match_percentage", "reason_chips"]
            },
            rejected_options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price_estimate: { type: Type.STRING },
                  reason_for_rejection: { type: Type.STRING },
                },
                required: ["name", "reason_for_rejection"]
              }
            },
            pair_with: { type: Type.STRING },
            confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
          },
          required: ["best_pick", "rejected_options", "confidence"]
        }
      }
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text) as CanteenAnalysisResult;

  } catch (error) {
    console.error("Canteen Analysis Error:", error);
    throw new Error("Failed to pick a meal. Please try again.");
  }
};