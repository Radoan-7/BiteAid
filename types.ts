
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface ConfidentItem {
  text: string;
  confidence: ConfidenceLevel;
}

export interface ActionableGuidance {
  do_this: ConfidentItem[];
  avoid_this: ConfidentItem[];
  consider_balancing: ConfidentItem[];
}

export interface RecoveryTip {
  text: string;
  trigger_reason: string;
  confidence: ConfidenceLevel;
}

export interface TimelineCheckpoint {
  time_window: string;      // Display label (e.g. "30 mins")
  hour_offset: number;      // Numeric value for graph (0.5, 1, 2, etc)
  energy_score: number;     // 0-100
  focus_score: number;      // 0-100
  digestion_score: number;  // 0-100
  feeling_indicators: string[];
  description: string;
  confidence: ConfidenceLevel;
  recovery_tip?: RecoveryTip; // Optional tip if score is low
}

export interface AnalysisResult {
  detected_foods: ConfidentItem[];
  health_impact_level: 'Low' | 'Moderate' | 'High';
  nutritional_risks: ConfidentItem[];
  actionable_guidance: ActionableGuidance;
  brief_supportive_comment: string;
  after_effect_timeline: TimelineCheckpoint[];
}

export type HealthGoal = 
  | 'General Wellness'
  | 'Reduce Fatigue'
  | 'Avoid Bloating'
  | 'Improve Sleep'
  | 'Maintain Energy';

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: AnalysisResult | null;
  imagePreview: string | null;
}

export interface ImpactMetric {
  label: string;
  trend: 'increase' | 'decrease' | 'neutral';
  impact_analysis: string;
}

export interface SimulationResult {
  title: string;
  metrics: ImpactMetric[];
  explanation: string;
  explanation_confidence: ConfidenceLevel;
  swap_suggestion: string;
}

export interface PointExplanation {
  insight: string;
  biological_reasoning: string;
  practical_advice: string;
}

// --- Smart Canteen Picker Types ---

export type CanteenGoal = 
  | 'Sustain Energy' 
  | 'Maximum Focus' 
  | 'Light & Recovery' 
  | 'Balanced & Healthy' 
  | 'Comfort & Variety';

export interface DecisionFactors {
  goal_match: number;       // 0-100
  budget_fit: number;       // 0-100
  visual_clarity: number;   // 0-100
}

export interface RejectedAlternative {
  name: string;
  reason: string;
  price_estimate?: string;
}

// NEW: Live Scan Types
export interface ScannedItem {
  id: string; // unique internal id
  name: string;
  description: string;
  score: number; // 1-5 stars based on goal
  emoji: string; // 🟢 🟡 🔴
  category: 'Meal' | 'Snack' | 'Drink' | 'Packaged' | 'Other';
  price_estimate?: string;
  seen_count: number;
  confidence?: ConfidenceLevel;
}

export interface LiveFrameResult {
  items: ScannedItem[];
  detected_currency?: string; // e.g. "$", "₹", "€", "Tk"
  feedback_message: string; // e.g. "Pan right for more options"
}

export interface FinalCanteenDecision {
  final_choice: {
    name: string;
    description: string;
    price: string;
    emoji: string;
    type: 'Single' | 'Combo'; // Identify if it's a pairing
  };
  reasoning: string; // "High protein for focus, fits budget."
  nutrition_highlights: string[]; // ["Low Oil", "High Fiber"]
  rejected_alternatives: RejectedAlternative[];
  detected_currency: string;
  single_option_note?: string; // e.g. "No other options found matching your filter."
}

// --- Fallback Journey Types ---

export type KitchenAccess = 'Yes' | 'Limited' | 'No';
export type TimeAvailable = '~10 min' | '~20 min' | 'No rush';
export type EnergyLevel = 'Low' | 'Okay' | 'High';

export interface CookAtHomeResult {
  dish_name: string;
  why_it_fits: string;
  instructions: string[];
  substitutions?: string;
}