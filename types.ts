
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

export interface ContextSummary {
  mode: 'exam' | 'latenight' | 'workout' | 'meeting' | 'default';
  icon: string;
  title: string;
  understanding: string;
}

export interface DefaultAnalysisResult {
  mode?: 'none' | 'exam' | 'latenight' | 'workout' | 'meeting';
  context_summary?: ContextSummary;
  detected_foods: ConfidentItem[];
  health_impact_level: 'Low' | 'Moderate' | 'High';
  nutritional_risks: ConfidentItem[];
  actionable_guidance: ActionableGuidance;
  brief_supportive_comment: string;
  after_effect_timeline: TimelineCheckpoint[];
  thinking_process?: string[];
}

export interface ExamAnalysisResult {
  mode: 'exam';
  exam_collision_alert: {
    risk_level: string; // 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'
    alert_message: string;
    exam_time: string;
    predicted_crash_time: string;
  };
  exam_survival_strategy: {
    time: string;
    priority: string; // 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    action: string;
    reasoning: string;
  }[];
  cognitive_impact_summary: {
    focus_impact: string;
    brain_fog_risk: string;
    overall_prediction: string;
  };
  after_effect_timeline: TimelineCheckpoint[]; // Added to ensure access in all modes
  thinking_process?: string[];
}

export interface MeetingAnalysisResult {
  mode: 'meeting';
  professional_performance_alert: {
    readiness_score: number;
    risk_level: string; // 'OPTIMAL' | 'RISKY' | 'BAD'
    main_concerns: string[];
  };
  social_performance_metrics: {
    breath_freshness: string;
    bloating_risk: string;
    visible_fatigue: string;
  };
  professional_image_rescue: {
    time: string;
    action: string;
    impact: string;
  }[];
  after_effect_timeline: TimelineCheckpoint[]; // Added to ensure access in all modes
  thinking_process?: string[];
}

export interface WorkoutAnalysisResult {
  mode: 'workout';
  workout_readiness_assessment: {
    readiness_score: number;
    main_issue: string;
    fuel_timing_verdict: string;
  };
  energy_availability_window: {
    carb_availability: string;
    fat_digestion_status: string;
  };
  performance_optimization: {
    best_option: string;
    intensity_adjustment?: string;
  };
  after_effect_timeline: TimelineCheckpoint[]; // Added to ensure access in all modes
  thinking_process?: string[];
}

export type AnalysisResult = DefaultAnalysisResult | ExamAnalysisResult | MeetingAnalysisResult | WorkoutAnalysisResult;

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: AnalysisResult | null;
  imagePreview: string | null;
}

export type HealthGoal = 
  | 'General Wellness'
  | 'Reduce Fatigue'
  | 'Avoid Bloating'
  | 'Improve Sleep'
  | 'Maintain Energy';

// Reverted Simulation Types
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

// --- SMART CANTEEN & LIVE SCAN TYPES ---

export type CanteenGoal = 
  | 'Sustain Energy' 
  | 'Maximum Focus' 
  | 'Light & Recovery' 
  | 'Balanced & Healthy' 
  | 'Comfort & Variety';

export type KitchenAccess = 'Yes' | 'Limited' | 'No';
export type TimeAvailable = string; // e.g., "~10 min"
export type EnergyLevel = 'High' | 'Okay' | 'Low';

export interface ScannedItem {
  name: string;
  category: 'Meal' | 'Snack' | 'Drink' | 'Packaged' | 'Other';
  price_estimate?: string;
  confidence: ConfidenceLevel;
  seen_count?: number; // Internal tracking
  id?: string; // Internal key
}

export interface FinalCanteenDecision {
  final_choice: {
    name: string;
    emoji: string;
    price: string;
    description: string;
    type: 'Single' | 'Combo';
  };
  reasoning: string;
  nutrition_highlights: string[];
  rejected_alternatives: {
    name: string;
    price_estimate: string;
    reason: string;
  }[];
}

export interface CookAtHomeResult {
  dish_name: string;
  why_it_fits: string;
  instructions: string[];
}

export interface MissionBrief {
  seek: string[];
  avoid: string[];
}
