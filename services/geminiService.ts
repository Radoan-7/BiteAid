import { GoogleGenAI, Type } from "@google/genai";
import { 
  AnalysisResult, 
  HealthGoal, 
  SimulationResult, 
  CanteenGoal, 
  CanteenAnalysisResult,
  KitchenAccess,
  TimeAvailable,
  EnergyLevel,
  CookAtHomeResult
} from "../types";

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
      - feeling_indicators: 2-3 VERY SIMPLE, common words (e.g., "Good Energy", "Sleepy", "Full", "Thirsty"). Avoid medical terms.
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
    3. Metric Analysis: For EACH metric, provide a specific 1-sentence "impact_analysis" explaining EXACTLY why that metric changes.
    4. Explanation: A general summary sentence.
    5. Confidence: How certain is this biological impact?
    6. Swap: One realistic, easy swap (e.g. for a campus canteen or home fridge).

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
                  trend: { type: Type.STRING, enum: ["increase", "decrease", "neutral"] },
                  impact_analysis: { type: Type.STRING }
                },
                required: ["label", "trend", "impact_analysis"]
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
  
  parts.push({
    inlineData: {
      data: foodImageBase64,
      mimeType: "image/jpeg" 
    }
  });

  if (menuImageBase64) {
    parts.push({
      inlineData: {
        data: menuImageBase64,
        mimeType: "image/jpeg"
      }
    });
  }

  const prompt = `
    You are a structured decision engine for a canteen/cafeteria setting.
    You are NOT a chatbot. You are a filter.
    
    INPUT DATA:
    1. Image of food counter (visual evidence of options).
    2. Image of menu/price list (optional - use for budget checks).
    3. User Goal: "${goal}"
    4. User Budget: "${budget ? budget : "No Limit / Not Provided"}"

    TASK:
    Analyze available options and select ONE single "Today's Bite" that best fits the goal and budget.

    CRITICAL RULES FOR BUDGET:
    - If a budget is provided, you MUST compare prices extracted from the menu image.
    - If ALL options are strictly more expensive than the budget, select the CHEAPEST/BEST RELATIVE option, but you MUST set 'trigger_fallback' to true and 'budget_fit' to 0.
    - Do NOT fabricate a lower price to make it fit. If it costs 15 and budget is 1, budget_fit is 0.

    CRITICAL RULES FOR FALLBACK:
    - Set 'trigger_fallback' to true if:
      1. No options fit the budget (Strictly).
      2. No options reasonably support the goal (e.g. User wants "Healthy" but only "Deep Fried" exists).
      3. Image quality is too poor to be confident.
    
    OUTPUT SCHEMA RULES:
    - final_choice: The winner.
      - short_justification: 6-8 words max. Punchy. E.g. "High protein for focus, fits budget perfectly."
    - decision_factors:
      - goal_match: 0-100 score.
      - budget_fit: 0-100 score (100 = fits budget, 0 = clearly over budget).
      - visual_clarity: 0-100 score.
    - rejected_alternatives: List 2-3 other visible items.
      - reason: Brief reason for rejection.
    - confidence_scores:
      - recommendation: 0-100.
      - price: 0-100.
    - trigger_fallback: boolean.

    Output JSON ONLY.
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
            final_choice: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                short_justification: { type: Type.STRING },
                price_estimate: { type: Type.STRING }
              },
              required: ["name", "short_justification"]
            },
            decision_factors: {
              type: Type.OBJECT,
              properties: {
                goal_match: { type: Type.INTEGER },
                budget_fit: { type: Type.INTEGER },
                visual_clarity: { type: Type.INTEGER }
              },
              required: ["goal_match", "budget_fit", "visual_clarity"]
            },
            rejected_alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  price_estimate: { type: Type.STRING }
                },
                required: ["name", "reason"]
              }
            },
            confidence_scores: {
              type: Type.OBJECT,
              properties: {
                recommendation: { type: Type.INTEGER },
                price: { type: Type.INTEGER }
              },
              required: ["recommendation", "price"]
            },
            trigger_fallback: { type: Type.BOOLEAN }
          },
          required: ["final_choice", "decision_factors", "rejected_alternatives", "confidence_scores", "trigger_fallback"]
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

export const generateCookAtHomeIdea = async (
  goal: CanteenGoal,
  kitchen: KitchenAccess,
  time: TimeAvailable,
  energy: EnergyLevel
): Promise<CookAtHomeResult> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are a student-friendly cooking assistant.
    User Context:
    - Goal: ${goal}
    - Kitchen Access: ${kitchen}
    - Time Available: ${time}
    - Energy Level: ${energy}

    Task:
    Generate ONE single cook-at-home dish idea that fits these constraints perfectly.
    
    Constraints:
    - If Kitchen is "No" or "Limited" (e.g. dorm), suggest no-cook or microwave-only meals.
    - If Energy is "Low", keep ingredients and steps minimal (assembly only).
    - Tone: Practical, encouraging, non-judgmental. No nutritional lecturing.

    Output JSON ONLY:
    {
      "dish_name": "string",
      "why_it_fits": "One sentence explaining why it fits their goal/state.",
      "instructions": ["Step 1", "Step 2", ...],
      "substitutions": "Optional string: 'Use x if you don't have y'"
    }
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
            dish_name: { type: Type.STRING },
            why_it_fits: { type: Type.STRING },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            substitutions: { type: Type.STRING }
          },
          required: ["dish_name", "why_it_fits", "instructions"]
        }
      }
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text) as CookAtHomeResult;

  } catch (error) {
    console.error("Cook Fallback Error:", error);
    throw new Error("Could not generate recipe.");
  }
};