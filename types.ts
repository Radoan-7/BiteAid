export interface AdviceItem {
  action: string;
  why_it_helps: string;
}

export interface ActionableTimeline {
  right_now: AdviceItem[];
  later_today: AdviceItem[];
  next_meal: AdviceItem[];
}

export interface Risk {
  name: string;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface DetectedFoods {
  primary_items: string[];
  secondary_ingredients: string[];
}

export interface AnalysisResult {
  detected_foods: DetectedFoods;
  health_impact_level: 'Low' | 'Moderate' | 'High';
  main_concern_summary: string;
  nutritional_risks: Risk[];
  actionable_guidance: ActionableTimeline;
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