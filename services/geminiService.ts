
import { GoogleGenAI, Type } from "@google/genai";
import { 
  AnalysisResult, 
  HealthGoal, 
  SimulationResult, 
  PointExplanation,
  TimelineCheckpoint,
  DefaultAnalysisResult,
  // New Imports
  CanteenGoal,
  ScannedItem,
  FinalCanteenDecision,
  CookAtHomeResult,
  KitchenAccess,
  TimeAvailable,
  EnergyLevel,
  MissionBrief
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
  goal: HealthGoal,
  context?: string
): Promise<AnalysisResult> => {
  
  // Upgrade to Pro for Extended Thinking
  const model = "gemini-3-pro-preview";

  const contextInstruction = context ? `
    USER CONTEXT: "${context}"
    
    CRITICAL: The user has provided context. You MUST interpret this to determine the "mode".
    
    Modes:
    - 'exam': if user mentions test, quiz, exam, studying. Timeline: 2 hours. Focus on alertness/crash.
    - 'latenight': if user mentions night, late, sleep, all-nighter. Timeline: 4 hours. Focus on digestion/sleep.
    - 'workout': if user mentions gym, exercise, run, sport. Timeline: 1 hour. Focus on fueling/bloating.
    - 'meeting': if user mentions meeting, presentation, work. Timeline: 3 hours. Focus on breath/focus/energy.
    - 'default': if context is generic or unclear. Timeline: 6 hours.
    
    ADAPTATIONS:
    - "context_summary": Fill this field based on your interpretation.
    - "actionable_guidance": "Do This" and "Skip This" MUST be tailored to the specific mode (e.g. for exam, avoid sugar crash).
    - "after_effect_timeline": Adjust the number of points and duration to match the Mode's timeline (e.g. Exam = 2h total).
    - "recovery_tip": Make recovery tips relevant to the context (e.g. "Take a breath before exam").
  ` : `
    Mode: 'default'
    Timeline: 6 hours.
  `;

  const systemPrompt = `
    You are BiteAid, a supportive, privacy-first nutrition assistant. 
    Analyze the food image provided. 
    Do not calculate calories. 
    Focus on qualitative impact and harm reduction.
    
    CRITICAL CONTEXT:
    The user's specific wellness goal is: "${goal}".
    Tailor all advice to directly support "${goal}".
    ${contextInstruction}

    Output JSON ONLY based on the schema provided.
    
    Guidance on fields:
    - detected_foods: List visible items. Provide confidence level.
    - health_impact_level: "Low", "Moderate", "High".
    - nutritional_risks: E.g., "High Sodium", "Added Sugar", "Blood Sugar Spike Risk".
    
    - actionable_guidance: Provide 2 distinct tips per category.
      - "do_this": Immediate positive actions to take NOW. 
      - "avoid_this": What to skip or remove *right now*. 
      - "consider_balancing": Post-meal adjustments.

    - after_effect_timeline: Generate a granular timeline.
      - hour_offset: Numeric (e.g. 0.5).
      - scores (0-100): 'energy_score', 'focus_score', 'digestion_score'.
      - feeling_indicators: 1-2 words.
      - description: 1 sentence on the physiology.
      - recovery_tip: Specific fix if scores are low.

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
            mode: { type: Type.STRING, enum: ['default', 'exam', 'latenight', 'workout', 'meeting'] },
            context_summary: {
              type: Type.OBJECT,
              properties: {
                mode: { type: Type.STRING, enum: ['default', 'exam', 'latenight', 'workout', 'meeting'] },
                icon: { type: Type.STRING },
                title: { type: Type.STRING },
                understanding: { type: Type.STRING }
              },
              required: ["mode", "icon", "title", "understanding"]
            },
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

    const result = JSON.parse(response.text) as DefaultAnalysisResult;
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
  } catch (error: any) {
    console.error("Explanation Error:", error);

    // Rate Limit or Quota Error Handling
    const isRateLimit = 
      error.status === 429 || 
      error.code === 429 || 
      (error.message && (
        error.message.includes("429") || 
        error.message.includes("quota") || 
        error.message.includes("RESOURCE_EXHAUSTED")
      ));

    if (isRateLimit) {
      return {
        insight: "High Traffic",
        biological_reasoning: "Our AI is currently experiencing high demand. Your timeline score likely indicates a natural physiological fluctuation.",
        practical_advice: "Take a deep breath and hydrate."
      };
    }
    
    // General Fallback
    return {
       insight: "System Busy",
       biological_reasoning: "We couldn't retrieve the detailed explanation right now.",
       practical_advice: "Follow the general timeline guidance."
    };
  }
};

export const simulateImpact = async (
  currentAnalysis: DefaultAnalysisResult,
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
  } catch (error: any) {
    console.error("Simulation Error:", error);

    // Fallback for simulation failure
    return {
      title: "Simulation Unavailable",
      metrics: [
        { label: "Energy", trend: "neutral", impact_analysis: "Data unavailable due to high traffic." },
        { label: "Focus", trend: "neutral", impact_analysis: "Data unavailable due to high traffic." },
        { label: "Digestion", trend: "neutral", impact_analysis: "Data unavailable due to high traffic." }
      ],
      explanation: "We couldn't simulate this change right now due to high server demand. Please try again later.",
      explanation_confidence: "Low",
      swap_suggestion: "Consider reducing portion size."
    };
  }
};

// --- NEW CANTEEN SERVICES ---

export const getMissionBrief = async (goal: CanteenGoal): Promise<MissionBrief> => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Generate a concise mission brief for a food scanner.
    User Goal: "${goal}"
    
    Return JSON:
    {
      "seek": ["item1", "item2", "item3"], // 3 visual cues to look for
      "avoid": ["item1", "item2"] // 2 visual cues to avoid
    }
    Keep items generic (e.g. "Grilled Chicken", "Bright Colors", "Fried Food"). Max 2 words per item.
  `;
  
  try {
     const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             seek: { type: Type.ARRAY, items: { type: Type.STRING } },
             avoid: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["seek", "avoid"]
        }
      }
    });
    const data = JSON.parse(response.text || '{}');
    return { goal, ...data };
  } catch (e) {
    // Fallback
    return { 
      goal, 
      seek: ["Healthy Proteins", "Veggies"], 
      avoid: ["Deep Fried", "Sugary"] 
    };
  }
};

export const analyzeLiveFrame = async (
  base64Image: string,
  goal: CanteenGoal
): Promise<{ items: ScannedItem[], detected_currency?: string, feedback_message: string }> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
    Analyze this canteen/food court frame.
    Goal: ${goal}.
    
    Identify visible food items or menu items.
    If you see currency symbols, detect the currency code (USD, EUR, INR, etc).
    
    Return JSON:
    {
      "items": [
        { "name": "Burger", "category": "Meal", "confidence": "High", "price_estimate": "$5" }
      ],
      "detected_currency": "USD",
      "feedback_message": "Found a burger."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
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
                   category: { type: Type.STRING, enum: ['Meal', 'Snack', 'Drink', 'Packaged', 'Other'] },
                   confidence: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                   price_estimate: { type: Type.STRING }
                 },
                 required: ["name", "confidence"]
               }
             },
             detected_currency: { type: Type.STRING },
             feedback_message: { type: Type.STRING }
          },
          required: ["items", "feedback_message"]
        }
      }
    });
    
    const result = JSON.parse(response.text || '{}');
    const itemsWithIds = (result.items || []).map((item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    return {
      items: itemsWithIds,
      detected_currency: result.detected_currency,
      feedback_message: result.feedback_message || "Scanning..."
    };

  } catch (error: any) {
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      return { items: [], feedback_message: "Rate Limit - Cooling down..." };
    }
    console.error(error);
    return { items: [], feedback_message: "Retrying..." };
  }
};

export const makeFinalCanteenDecision = async (
  scannedItems: ScannedItem[],
  menuImageBase64: string | null,
  goal: CanteenGoal,
  budget: string,
  currency: string
): Promise<FinalCanteenDecision> => {
  const model = "gemini-3-pro-preview";

  const scannedText = scannedItems.map(i => `${i.name} (${i.price_estimate || '?'})`).join(', ');
  
  const prompt = `
    You are an expert nutritionist helping a student/worker choose lunch.
    Goal: "${goal}".
    Budget: ${budget || 'Flexible'} ${currency}.
    
    Available Options (Scanned): ${scannedText}.
    ${menuImageBase64 ? "A menu image is also provided for more options and exact prices." : ""}
    
    Task:
    1. Select the BEST single item or a COMBO (e.g. Sandwich + Fruit) that fits the goal and budget.
    2. Explain why.
    3. List rejected alternatives and why (e.g. "Too heavy for focus").
    
    Output JSON.
  `;

  const parts: any[] = [{ text: prompt }];
  if (menuImageBase64) {
    parts.unshift({ inlineData: { data: menuImageBase64, mimeType: "image/jpeg" } });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      thinkingConfig: { thinkingBudget: 2048 },
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
              type: { type: Type.STRING, enum: ['Top Pick', 'Combo'] }
            },
            required: ['name', 'description', 'price', 'emoji', 'type']
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
          }
        },
        required: ['final_choice', 'reasoning', 'nutrition_highlights', 'rejected_alternatives']
      }
    }
  });
  
  if (!response.text) throw new Error("No decision generated");
  return JSON.parse(response.text) as FinalCanteenDecision;
};

export const generateCookAtHomeIdea = async (
  goal: CanteenGoal,
  kitchen: KitchenAccess,
  time: TimeAvailable,
  energy: EnergyLevel,
  userIngredients: string
): Promise<CookAtHomeResult> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
    User wants to skip the canteen and cook/assemble something at home/dorm.
    Goal: ${goal}.
    Kitchen Access: ${kitchen}.
    Time: ${time}.
    Energy Level: ${energy}.
    Ingredients on hand: ${userIngredients || "Nothing specified, assume basics like eggs, bread, pasta"}.
    
    Generate ONE simple recipe/assembly idea.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dish_name: { type: Type.STRING },
          why_it_fits: { type: Type.STRING },
          ingredients_needed: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
          time_estimate: { type: Type.STRING }
        },
        required: ['dish_name', 'why_it_fits', 'ingredients_needed', 'instructions', 'time_estimate']
      }
    }
  });

  if (!response.text) throw new Error("No recipe generated");
  return JSON.parse(response.text) as CookAtHomeResult;
};
