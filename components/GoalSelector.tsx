import React from 'react';
import { HealthGoal } from '../types';
import { Sparkles, Zap, Moon, Activity, Leaf } from 'lucide-react';

interface GoalSelectorProps {
  selectedGoal: HealthGoal;
  onSelect: (goal: HealthGoal) => void;
}

const goals: { id: HealthGoal; icon: React.ReactNode }[] = [
  { id: 'General Wellness', icon: <Leaf className="w-4 h-4" /> },
  { id: 'Maintain Energy', icon: <Zap className="w-4 h-4" /> },
  { id: 'Reduce Fatigue', icon: <Activity className="w-4 h-4" /> },
  { id: 'Avoid Bloating', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'Improve Sleep', icon: <Moon className="w-4 h-4" /> },
];

export const GoalSelector: React.FC<GoalSelectorProps> = ({ selectedGoal, onSelect }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
        What's your focus for this meal?
      </label>
      <div className="flex flex-wrap justify-center gap-2">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => onSelect(goal.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              border 
              ${selectedGoal === goal.id 
                ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }
            `}
          >
            {goal.icon}
            {goal.id}
          </button>
        ))}
      </div>
    </div>
  );
};