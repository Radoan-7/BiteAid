import { GoogleGenAI, Type } from "@google/genai";
import { 
  AnalysisResult, 
  HealthGoal, 
  SimulationResult, 
  CanteenGoal, 
  KitchenAccess,
  TimeAvailable,
  EnergyLevel, 
  CookAtHomeResult,
  PointExplanation,
  TimelineCheckpoint,
  LiveFrameResult,
  FinalCanteenDecision,
  ScannedItem
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
  
  // Upgrade to Pro for Extended Thinking
  const model = "gemini-3-pro-preview";

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
    
    - actionable_guidance: Provide 2-3 distinct, specific, and practical tips per category.
      - "do_this": Immediate positive actions. 
      - "avoid_this": What to skip or remove *right now*. 
      - "consider_balancing": Post-meal adjustments.

    - after_effect_timeline: Generate a granular 6-point timeline (0.5h, 1h, 2h, 3h, 4h, 6h).
      For each point, provide:
      - hour_offset: The numeric hour (e.g., 0.5, 1, 2).
      - scores (0-100): Estimate 'energy_score', 'focus_score', 'digestion_score'.
        - 100 = Peak/Perfect, 0 = Crash/Distress.
        - Curves should reflect biological reality (e.g., blood sugar spikes then drops).
      - feeling_indicators: 1-2 words (e.g., "Alert", "Heavy").
      - description: 1 sentence on the physiology.
      - recovery_tip: IF scores drop below 60, provide a specific fix (e.g., "Drink water", "Walk") and a confidence level ('High', 'Medium', 'Low').

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
        // Enable Extended Thinking
        thinkingConfig: { thinkingBudget: 2048 }, 
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
                  hour_offset: { type: Type.NUMBER },
                  energy_score: { type: Type.INTEGER },
                  focus_score: { type: Type.INTEGER },
                  digestion_score: { type: Type.INTEGER },
                  feeling_indicators: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  description: { type: Type.STRING },
                  confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  recovery_tip: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      trigger_reason: { type: Type.STRING },
                      confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                    },
                    required: ["text", "trigger_reason", "confidence"]
                  }
                },
                required: ["time_window", "hour_offset", "energy_score", "focus_score", "digestion_score", "feeling_indicators", "description", "confidence"]
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

export const explainTimelinePoint = async (
  checkpoint: TimelineCheckpoint,
  detectedFoods: string[]
): Promise<PointExplanation> => {
  const model = "gemini-3-pro-preview";

  const prompt = `
    You are a friendly nutrition buddy explaining things to a 12-year-old.
    
    Context:
    User ate: ${detectedFoods.join(', ')}.
    Time passed: ${checkpoint.hour_offset} hours.
    State: Energy ${checkpoint.energy_score}/100, Focus ${checkpoint.focus_score}/100.

    Task:
    Explain WHY they feel this way right now. 
    
    CRITICAL RULES:
    1. EXTREMELY SIMPLE WORDS. No medical jargon (like "glycemic index", "insulin spike"). Use words like "sugar rush", "crash", "fuel".
    2. VERY SHORT. 
    - "insight": Max 8 words. Punchy summary.
    - "biological_reasoning": Max 2 short sentences. Simple cause and effect.
    - "practical_advice": 1 simple action.

    Output JSON ONLY:
    {
      "insight": "Sugar crash starting now.",
      "biological_reasoning": "The quick energy from the bread is gone, making you tired.",
      "practical_advice": "Drink a glass of water."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Enable thinking for reasoning
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING },
            biological_reasoning: { type: Type.STRING },
            practical_advice: { type: Type.STRING }
          },
          required: ["insight", "biological_reasoning", "practical_advice"]
        }
      }
    });

    if (!response.text) throw new Error("No explanation generated");
    return JSON.parse(response.text) as PointExplanation;
  } catch (error) {
    console.error("Explanation Error:", error);
    throw new Error("Could not explain point.");
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

// --- NEW LIVE CANTEEN FUNCTIONS ---

export const analyzeLiveFrame = async (
  base64Image: string,
  goal: CanteenGoal
): Promise<LiveFrameResult> => {
  const model = "gemini-3-flash-preview"; // Use Flash for speed

  const prompt = `
    You are a real-time canteen scanner.
    Goal: "${goal}".
    
    Task:
    1. Identify all food/drink items in this frame.
    2. Score them 1-5 stars based on the goal.
    3. Assign an emoji: 🟢 (Good fit), 🟡 (Okay), 🔴 (Avoid/Poor fit).
    4. Categorize: 'Meal', 'Snack', 'Drink', 'Packaged'.
    5. Look for price tags/currency symbols ($, ₹, €, Tk).
    6. Provide a short feedback message to guide the user (e.g. "Pan right", "Hold still", "Good salad options").
    7. Provide a confidence level ('High', 'Medium', 'Low') for the identification.

    Output JSON ONLY.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  score: { type: Type.INTEGER },
                  emoji: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ['Meal', 'Snack', 'Drink', 'Packaged', 'Other'] },
                  price_estimate: { type: Type.STRING },
                  confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                },
                required: ["name", "score", "emoji", "category", "confidence"]
              }
            },
            detected_currency: { type: Type.STRING },
            feedback_message: { type: Type.STRING }
          },
          required: ["items", "feedback_message"]
        }
      }
    });

    if (!response.text) throw new Error("No response");
    
    // Post-process to add IDs and seen_count for client-side tracking
    const rawResult = JSON.parse(response.text);
    return {
      ...rawResult,
      items: rawResult.items.map((item: any) => ({
        ...item,
        id: item.name.toLowerCase().replace(/\s+/g, '-'),
        seen_count: 1
      }))
    };

  } catch (error: any) {
    // Check for Rate Limits (429) in various formats
    const isRateLimit = 
      error.status === 429 || 
      error.code === 429 || 
      (error.message && (error.message.includes("429") || error.message.includes("quota"))) ||
      (error.toString() && error.toString().includes("429"));

    if (isRateLimit) {
       console.warn("Gemini Rate Limit Hit. Backing off.");
       return { items: [], feedback_message: "Cooling down... (Rate Limit)" };
    }

    console.error("Live Frame Analysis Error:", error);
    // Return empty result on other errors to prevent app crash loop
    return { items: [], feedback_message: "Scanning..." };
  }
};

export const makeFinalCanteenDecision = async (
  scannedItems: ScannedItem[],
  menuImageBase64: string | null,
  goal: CanteenGoal,
  budget: string,
  userCurrency: string
): Promise<FinalCanteenDecision> => {
  const model = "gemini-3-flash-preview";

  const parts = [];
  
  // Create a text summary of all scanned items
  const itemsContext = scannedItems.map(i => 
    `- ${i.name} (${i.category}): ${i.emoji} Score ${i.score}/5. Price: ${i.price_estimate || 'Unknown'}`
  ).join('\n');

  const prompt = `
    You are the "Today's Bite" decision engine.
    
    User Context:
    - Goal: "${goal}"
    - User's Currency: "${userCurrency}" (CRITICAL: All price estimations must use this currency)
    - Budget: "${budget || "No strict limit"}"
    - Scanned Items History: 
    ${itemsContext}

    ${menuImageBase64 ? "A menu image is also provided for price verification." : "No separate menu image provided. Estimate prices based on the item type and User's Currency context."}

    Task:
    1. Identify the BEST SELECTION. This can be:
       - An OPTIMIZED PAIR/COMBO (e.g., Main + Drink, Snack + Fruit) if the combination provides better balance for the goal AND fits within the budget.
       - A SINGLE ITEM if it's the strongest standalone option or if budget is tight.
    2. If a pair is chosen:
       - Set 'final_choice.type' to 'Combo'.
       - Set 'final_choice.name' to "Item A + Item B".
       - Set 'final_choice.price' to the combined total (Formatted with ${userCurrency}).
    3. If only ONE item was detected or suitable:
       - Set 'final_choice.type' to 'Single'.
       - IMPORTANT: Set 'single_option_note' to "No other suitable options found."
    4. Detect currency from input data (should match User's Currency).
    5. List rejected alternatives.

    Output JSON ONLY.
  `;

  if (menuImageBase64) {
    parts.push({ inlineData: { data: menuImageBase64, mimeType: "image/jpeg" } });
  }
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
                description: { type: Type.STRING },
                price: { type: Type.STRING },
                emoji: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['Single', 'Combo'] }
              },
              required: ["name", "description", "price", "emoji", "type"]
            },
            reasoning: { type: Type.STRING },
            nutrition_highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
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
            detected_currency: { type: Type.STRING },
            single_option_note: { type: Type.STRING }
          },
          required: ["final_choice", "reasoning", "rejected_alternatives", "detected_currency"]
        }
      }
    });

    if (!response.text) throw new Error("No decision made");
    return JSON.parse(response.text) as FinalCanteenDecision;

  } catch (error) {
    console.error("Final Decision Error:", error);
    throw new Error("Failed to make a final decision.");
  }
};

export const generateCookAtHomeIdea = async (
  goal: CanteenGoal,
  kitchen: KitchenAccess,
  time: TimeAvailable,
  energy: EnergyLevel,
  ingredients: string
): Promise<CookAtHomeResult> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are a student-friendly cooking assistant.
    User Context:
    - Goal: ${goal}
    - Kitchen Access: ${kitchen}
    - Time Available: ${time}
    - Energy Level: ${energy}
    - User's Exact Ingredients: "${ingredients ? ingredients : 'None provided'}"

    Task:
    Generate ONE single cook-at-home dish idea based STRICTLY on the "User's Exact Ingredients".
    
    CRITICAL INGREDIENT RULES:
    1. Do NOT include any main ingredients that are not listed in "User's Exact Ingredients".
    2. You CAN assume basic seasonings (Salt, Pepper, Water, Oil/Butter) are available.
    3. If the user only provides one item (e.g. "Potato"), give a recipe for just that item (e.g. "Microwave Baked Potato"). Do NOT add cheese, sour cream, or bacon unless listed.
    4. If no ingredients are provided, suggest a very simple "survival meal" assuming basic staples but clearly state what is needed.

    Constraints:
    - If Kitchen is "No" or "Limited" (e.g. dorm), suggest no-cook or microwave-only meals.
    - If Energy is "Low", keep ingredients and steps minimal (assembly only).
    - Tone: Practical, encouraging, non-judgmental. No nutritional lecturing.

    Output JSON ONLY:
    {
      "dish_name": "string",
      "why_it_fits": "One sentence explaining why it fits their goal/state.",
      "instructions": ["Step 1", "Step 2", ...],
      "substitutions": "Optional string: 'If you have X, you could add it.'"
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