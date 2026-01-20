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

export interface TimelineCheckpoint {
  time_window: string;
  feeling_indicators: string[];
  description: string;
  confidence: ConfidenceLevel;
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
}

export interface SimulationResult {
  title: string;
  metrics: ImpactMetric[];
  explanation: string;
  explanation_confidence: ConfidenceLevel;
  swap_suggestion: string;
}

// --- Smart Canteen Picker Types ---

export type CanteenGoal = 
  | 'Sustain Energy' 
  | 'Maximum Focus' 
  | 'Light & Recovery' 
  | 'Balanced & Healthy' 
  | 'Comfort & Variety';

export interface CanteenBestPick {
  name: string;
  price_estimate?: string;
  match_percentage: number;
  reason_chips: string[];
}

export interface RejectedOption {
  name: string;
  price_estimate?: string;
  reason_for_rejection: string;
}

export interface CanteenAnalysisResult {
  best_pick: CanteenBestPick;
  rejected_options: RejectedOption[];
  pair_with?: string;
  confidence: ConfidenceLevel;
}