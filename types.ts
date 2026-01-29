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

export interface CanteenAnalysisResult {
  final_choice: {
    name: string;
    short_justification: string;
    price_estimate?: string;
  };
  decision_factors: DecisionFactors;
  rejected_alternatives: RejectedAlternative[];
  confidence_scores: {
    recommendation: number; // 0-100
    price: number;          // 0-100
  };
  trigger_fallback: boolean; // Indicates if the recommendation is weak/over-budget
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