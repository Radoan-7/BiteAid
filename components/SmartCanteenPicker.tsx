import React, { useState, useRef } from 'react';
import { Header } from './Header';
import { CanteenGoal, CanteenAnalysisResult } from '../types';
import { analyzeCanteenSelection, fileToGenerativePart } from '../services/geminiService';
import { 
  Zap, 
  Brain, 
  Coffee, 
  Leaf, 
  Smile, 
  Camera, 
  DollarSign, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Plus,
  Trophy,
  Ban
} from 'lucide-react';

interface SmartCanteenPickerProps {
  onHome: () => void;
}

type Step = 'GOAL' | 'BUDGET' | 'CAPTURE' | 'ANALYZING' | 'RESULTS';

const GOALS: { id: CanteenGoal; icon: React.ReactNode; desc: string }[] = [
  { id: 'Sustain Energy', icon: <Zap className="w-5 h-5 text-amber-500" />, desc: "Avoid the afternoon slump" },
  { id: 'Maximum Focus', icon: <Brain className="w-5 h-5 text-indigo-500" />, desc: "Sharp mind for studying" },
  { id: 'Light & Recovery', icon: <Coffee className="w-5 h-5 text-sky-500" />, desc: "Easy digestion, post-workout" },
  { id: 'Balanced & Healthy', icon: <Leaf className="w-5 h-5 text-emerald-500" />, desc: "Nutrient dense basics" },
  { id: 'Comfort & Variety', icon: <Smile className="w-5 h-5 text-rose-500" />, desc: "Treat yourself safely" },
];

export const SmartCanteenPicker: React.FC<SmartCanteenPickerProps> = ({ onHome }) => {
  const [step, setStep] = useState<Step>('GOAL');
  const [goal, setGoal] = useState<CanteenGoal | null>(null);
  const [budget, setBudget] = useState<string>('');
  
  const [foodImage, setFoodImage] = useState<File | null>(null);
  const [menuImage, setMenuImage] = useState<File | null>(null);
  const [foodPreview, setFoodPreview] = useState<string | null>(null);
  const [menuPreview, setMenuPreview] = useState<string | null>(null);

  const [result, setResult] = useState<CanteenAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputFoodRef = useRef<HTMLInputElement>(null);
  const fileInputMenuRef = useRef<HTMLInputElement>(null);

  const handleGoalSelect = (selected: CanteenGoal) => {
    setGoal(selected);
    setStep('BUDGET');
  };

  const handleBudgetNext = () => {
    setStep('CAPTURE');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'food' | 'menu') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      
      if (type === 'food') {
        setFoodImage(file);
        setFoodPreview(preview);
      } else {
        setMenuImage(file);
        setMenuPreview(preview);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!foodImage || !goal) return;
    
    setStep('ANALYZING');
    setError(null);

    try {
      const foodBase64 = await fileToGenerativePart(foodImage);
      const menuBase64 = menuImage ? await fileToGenerativePart(menuImage) : null;
      
      const data = await analyzeCanteenSelection(foodBase64, menuBase64, goal, budget);
      setResult(data);
      setStep('RESULTS');
    } catch (err) {
      setError("We couldn't analyze the options properly. Please try again.");
      setStep('CAPTURE');
    }
  };

  const handleReset = () => {
    setStep('GOAL');
    setGoal(null);
    setBudget('');
    setFoodImage(null);
    setMenuImage(null);
    setFoodPreview(null);
    setMenuPreview(null);
    setResult(null);
  };

  // --- Sub-components for Steps ---

  const GoalStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">What's the goal for lunch?</h2>
        <p className="text-slate-500">We'll filter the menu to match your needs.</p>
      </div>
      <div className="grid gap-3">
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => handleGoalSelect(g.id)}
            className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all text-left group"
          >
            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
              {g.icon}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{g.id}</h3>
              <p className="text-xs text-slate-500">{g.desc}</p>
            </div>
            <ChevronRight className="ml-auto w-5 h-5 text-slate-300 group-hover:text-blue-500" />
          </button>
        ))}
      </div>
    </div>
  );

  const BudgetStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Set a budget?</h2>
        <p className="text-slate-500">Optional. Leave blank if you're flexible.</p>
      </div>
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <DollarSign className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 15"
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-medium"
            onKeyDown={(e) => e.key === 'Enter' && handleBudgetNext()}
          />
        </div>
      </div>

      <button
        onClick={handleBudgetNext}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
      >
        {budget ? `Continue with Budget` : 'Skip Budget'}
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  const CaptureStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-slate-900">Show us the options</h2>
        <p className="text-slate-500">Snap the food counter. Menu is optional.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Food Input (Required) */}
        <div 
          onClick={() => fileInputFoodRef.current?.click()}
          className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all relative overflow-hidden
            ${foodPreview ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
          `}
        >
          {foodPreview ? (
            <img src={foodPreview} alt="Food" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <Camera className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-600">Food Options<br/><span className="text-rose-500">(Required)</span></span>
            </>
          )}
          {foodPreview && <div className="absolute bottom-2 right-2 bg-emerald-500 text-white p-1 rounded-full"><CheckCircle2 className="w-4 h-4"/></div>}
        </div>
        <input type="file" ref={fileInputFoodRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'food')} />

        {/* Menu Input (Optional) */}
        <div 
          onClick={() => fileInputMenuRef.current?.click()}
          className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all relative overflow-hidden
            ${menuPreview ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
          `}
        >
          {menuPreview ? (
            <img src={menuPreview} alt="Menu" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <DollarSign className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-600">Price List<br/><span className="text-slate-400">(Optional)</span></span>
            </>
          )}
           {menuPreview && <div className="absolute bottom-2 right-2 bg-emerald-500 text-white p-1 rounded-full"><CheckCircle2 className="w-4 h-4"/></div>}
        </div>
        <input type="file" ref={fileInputMenuRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'menu')} />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!foodImage}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
      >
        Find Best Meal
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  const AnalyzingStep = () => (
    <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-500 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
        <div className="bg-white p-6 rounded-full shadow-lg border border-blue-100 relative z-10">
          <Brain className="w-12 h-12 text-blue-600 animate-pulse" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Finding Your Winner...</h3>
      <div className="space-y-2 text-sm text-slate-500">
        <p className="flex items-center gap-2 justify-center"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Scanning menu options</p>
        <p className="flex items-center gap-2 justify-center animate-pulse delay-75"><Loader2 className="w-3 h-3 animate-spin text-blue-500" /> Comparing against budget</p>
        <p className="flex items-center gap-2 justify-center animate-pulse delay-150"><Loader2 className="w-3 h-3 animate-spin text-indigo-500" /> Optimizing for {goal}</p>
      </div>
    </div>
  );

  const ResultStep = () => {
    if (!result) return null;
    return (
      <div className="space-y-8 pb-24 animate-in slide-in-from-bottom-8 duration-500">
        
        {/* DOMINANT HERO CARD - Your Best Choice */}
        <div className="relative bg-white rounded-[2rem] shadow-xl shadow-blue-900/10 border border-slate-100 overflow-hidden transform transition-all hover:scale-[1.01]">
          {/* Top accent bar */}
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          
          <div className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-amber-100 text-amber-700 p-2 rounded-full">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Your Best Choice Today</span>
            </div>

            <h2 className="text-4xl font-extrabold text-slate-900 mb-2 leading-tight">
              {result.best_pick.name}
            </h2>

            {result.best_pick.price_estimate && (
              <p className="text-xl text-slate-500 font-medium mb-6">
                {result.best_pick.price_estimate}
              </p>
            )}

            {/* Match Score Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-blue-600">Match Score</span>
                <span className="text-2xl font-bold text-blue-600">{result.best_pick.match_percentage}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${result.best_pick.match_percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Reason Chips */}
            <div className="flex flex-wrap gap-2">
              {result.best_pick.reason_chips.map((chip, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-100">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {chip}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* REJECTED OPTIONS SECTION */}
        {result.rejected_options && result.rejected_options.length > 0 && (
          <div className="space-y-4 px-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Ban className="w-4 h-4" />
              Why we skipped these
            </h3>
            
            <div className="grid gap-3">
              {result.rejected_options.map((item, i) => (
                <div key={i} className="flex items-start justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 opacity-80 hover:opacity-100 transition-opacity">
                  <div>
                    <h4 className="font-bold text-slate-700 decoration-slate-400 decoration-2">{item.name}</h4>
                    {item.price_estimate && <p className="text-xs text-slate-400">{item.price_estimate}</p>}
                  </div>
                  <div className="bg-rose-50 text-rose-700 px-3 py-1 rounded-md text-xs font-medium border border-rose-100 max-w-[50%] text-right">
                    {item.reason_for_rejection}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OPTIONAL PAIR WITH */}
        {result.pair_with && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4 mx-2">
             <div className="p-3 bg-white rounded-full shadow-sm">
               <Plus className="w-5 h-5 text-emerald-600" />
             </div>
             <div>
               <h4 className="font-bold text-emerald-900 text-sm uppercase tracking-wide mb-0.5">Perfect Pairing</h4>
               <p className="font-medium text-emerald-700">{result.pair_with}</p>
             </div>
          </div>
        )}

        <div className="flex justify-center pt-8">
           <button onClick={handleReset} className="group flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-medium px-6 py-3 rounded-full hover:bg-white hover:shadow-md transition-all">
             <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
             Start Over
           </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 animate-in fade-in slide-in-from-right-4 duration-500">
      <Header subtitle="smart canteen picker" onHome={onHome} />
      
      <main className="flex-grow container mx-auto px-4 py-6 max-w-lg">
        {/* Progress Dots */}
        {step !== 'RESULTS' && step !== 'ANALYZING' && (
          <div className="flex justify-center gap-2 mb-8">
            {['GOAL', 'BUDGET', 'CAPTURE'].map((s, i) => {
               const isActive = s === step;
               const isPast = ['GOAL', 'BUDGET', 'CAPTURE'].indexOf(step) > i;
               return (
                 <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${isActive ? 'w-8 bg-blue-600' : isPast ? 'w-2 bg-blue-200' : 'w-2 bg-slate-200'}`} />
               );
            })}
          </div>
        )}

        {step === 'GOAL' && <GoalStep />}
        {step === 'BUDGET' && <BudgetStep />}
        {step === 'CAPTURE' && <CaptureStep />}
        {step === 'ANALYZING' && <AnalyzingStep />}
        {step === 'RESULTS' && <ResultStep />}

      </main>
    </div>
  );
};