export interface ActionableGuidance {
  do_this: string[];
  avoid_this: string[];
  consider_balancing: string[];
}

export interface AnalysisResult {
  detected_foods: string[];
  health_impact_level: 'Low' | 'Moderate' | 'High';
  nutritional_risks: string[];
  actionable_guidance: ActionableGuidance;
  brief_supportive_comment: string;
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
