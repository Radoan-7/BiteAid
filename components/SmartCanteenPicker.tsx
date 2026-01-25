import React, { useState, useRef, useEffect } from 'react';
import { Header } from './Header';
import { 
  CanteenGoal, 
  CanteenAnalysisResult, 
  KitchenAccess, 
  TimeAvailable, 
  EnergyLevel, 
  CookAtHomeResult 
} from '../types';
import { 
  analyzeCanteenSelection, 
  fileToGenerativePart, 
  generateCookAtHomeIdea 
} from '../services/geminiService';
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
  AlertTriangle,
  ChevronRight,
  RefreshCw, 
  Plus, 
  Trophy, 
  Ban, 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  Home, 
  Clock, 
  Battery 
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
  const [showDetails, setShowDetails] = useState(false);

  // Fallback State
  const [showFallbackQuestions, setShowFallbackQuestions] = useState(false);
  const [fallbackKitchen, setFallbackKitchen] = useState<KitchenAccess | null>(null);
  const [fallbackTime, setFallbackTime] = useState<TimeAvailable | null>(null);
  const [fallbackEnergy, setFallbackEnergy] = useState<EnergyLevel | null>(null);
  const [fallbackResult, setFallbackResult] = useState<CookAtHomeResult | null>(null);
  const [isGeneratingFallback, setIsGeneratingFallback] = useState(false);

  const fileInputFoodRef = useRef<HTMLInputElement>(null);
  const fileInputMenuRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(false);

  // 1. Force instant scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    isMounted.current = true;
  }, []);

  // 2. Smooth scroll to top when step changes
  useEffect(() => {
    if (isMounted.current) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleGoalSelect = (selected: CanteenGoal) => {
    setGoal(selected);
    setStep('BUDGET');
  };

  const handleBudgetNext = () => {
    setStep('CAPTURE');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'food' | 'menu') => {
    setError(null);
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
    
    // Constraint Logic: Budget requires Price List
    if (budget && !menuImage) {
      setError("To optimize for your budget, I need prices too.");
      return;
    }

    setStep('ANALYZING');
    setError(null);
    setFallbackResult(null);
    setShowFallbackQuestions(false);

    try {
      const foodBase64 = await fileToGenerativePart(foodImage);
      const menuBase64 = menuImage ? await fileToGenerativePart(menuImage) : null;
      
      const data = await analyzeCanteenSelection(foodBase64, menuBase64, goal, budget);
      setResult(data);
      setStep('RESULTS');
    } catch (err) {
      console.error(err);
      setError("We couldn't analyze the options properly. Please try again.");
      setStep('CAPTURE');
    }
  };

  const handleGenerateFallback = async () => {
    if (!goal) return;
    setIsGeneratingFallback(true);
    try {
      // Defaults if skipped
      const k = fallbackKitchen || 'Limited';
      const t = fallbackTime || '~10 min';
      const e = fallbackEnergy || 'Low';
      
      const recipe = await generateCookAtHomeIdea(goal, k, t, e);
      setFallbackResult(recipe);
    } catch (e) {
      console.error(e);
      // Fail silently or show minor error? Just stay on questions.
    } finally {
      setIsGeneratingFallback(false);
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
    setShowDetails(false);
    
    setShowFallbackQuestions(false);
    setFallbackKitchen(null);
    setFallbackTime(null);
    setFallbackEnergy(null);
    setFallbackResult(null);
  };

  // --- Render Functions for Steps ---

  const renderGoalStep = () => (
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

  const renderBudgetStep = () => (
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

  const renderCaptureStep = () => (
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

        {/* Menu Input (Optional/Required based on budget) */}
        <div 
          onClick={() => fileInputMenuRef.current?.click()}
          className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all relative overflow-hidden
            ${menuPreview ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
            ${!menuPreview && budget ? 'border-rose-200 bg-rose-50/10' : ''} 
          `}
        >
          {menuPreview ? (
            <img src={menuPreview} alt="Menu" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <DollarSign className={`w-8 h-8 mb-2 ${budget ? 'text-rose-400' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-slate-600">
                Price List<br/>
                <span className={budget ? "text-rose-500" : "text-slate-400"}>
                  {budget ? "(Required)" : "(Optional)"}
                </span>
              </span>
            </>
          )}
           {menuPreview && <div className="absolute bottom-2 right-2 bg-emerald-500 text-white p-1 rounded-full"><CheckCircle2 className="w-4 h-4"/></div>}
        </div>
        <input type="file" ref={fileInputMenuRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'menu')} />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!foodImage}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
      >
        Get Today’s Bite
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderAnalyzingStep = () => (
    <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-500 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
        <div className="bg-white p-6 rounded-full shadow-lg border border-blue-100 relative z-10">
          <Brain className="w-12 h-12 text-blue-600 animate-pulse" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Selecting Today’s Bite...</h3>
      <div className="space-y-2 text-sm text-slate-500">
        <p className="flex items-center gap-2 justify-center"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Scanning menu options</p>
        <p className="flex items-center gap-2 justify-center animate-pulse delay-75"><Loader2 className="w-3 h-3 animate-spin text-blue-500" /> Comparing against budget</p>
        <p className="flex items-center gap-2 justify-center animate-pulse delay-150"><Loader2 className="w-3 h-3 animate-spin text-indigo-500" /> Optimizing for {goal}</p>
      </div>
    </div>
  );

  const renderFallbackFlow = () => {
    if (fallbackResult) {
      return (
        <div className="mt-8 pt-8 border-t border-slate-200 animate-in slide-in-from-bottom-8 duration-500">
           <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-xl shadow-blue-500/5">
              <div className="flex items-center gap-2 mb-4 text-amber-600">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Home className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">Quick Home Alternative</h3>
              </div>
              
              <h4 className="text-xl font-bold text-slate-900 mb-2">{fallbackResult.dish_name}</h4>
              <p className="text-slate-600 text-sm italic mb-6">"{fallbackResult.why_it_fits}"</p>
              
              <div className="space-y-4">
                 <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Steps</h5>
                 {fallbackResult.instructions.map((step, i) => (
                   <div key={i} className="flex gap-3 text-sm text-slate-700">
                     <span className="font-bold text-amber-500 shrink-0">{i+1}.</span>
                     <p>{step}</p>
                   </div>
                 ))}
                 
                 {fallbackResult.substitutions && (
                   <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-800 border border-amber-100">
                     <strong>Substitutions:</strong> {fallbackResult.substitutions}
                   </div>
                 )}
              </div>
           </div>
        </div>
      );
    }

    return (
      <div className="mt-8 pt-8 border-t border-slate-200 animate-in slide-in-from-bottom-4 duration-300">
         <h3 className="text-center font-bold text-slate-800 mb-6">Let's find a simple match</h3>
         
         <div className="space-y-6">
            {/* Kitchen */}
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Kitchen Access?</label>
               <div className="flex justify-center gap-2">
                 {(['Yes', 'Limited', 'No'] as KitchenAccess[]).map(k => (
                   <button 
                     key={k} 
                     onClick={() => setFallbackKitchen(k)}
                     className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${fallbackKitchen === k ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                   >
                     {k}
                   </button>
                 ))}
               </div>
            </div>

            {/* Time */}
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Time?</label>
               <div className="flex justify-center gap-2">
                 {(['~10 min', '~20 min', 'No rush'] as TimeAvailable[]).map(t => (
                   <button 
                     key={t} 
                     onClick={() => setFallbackTime(t)}
                     className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${fallbackTime === t ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                   >
                     {t}
                   </button>
                 ))}
               </div>
            </div>

            {/* Energy */}
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Energy Level?</label>
               <div className="flex justify-center gap-2">
                 {(['Low', 'Okay', 'High'] as EnergyLevel[]).map(e => (
                   <button 
                     key={e} 
                     onClick={() => setFallbackEnergy(e)}
                     className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${fallbackEnergy === e ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                   >
                     {e}
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={handleGenerateFallback}
                disabled={isGeneratingFallback}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingFallback ? <Loader2 className="w-4 h-4 animate-spin" /> : <Home className="w-4 h-4" />}
                Get Cooking Idea
              </button>
            </div>
         </div>
      </div>
    );
  };

  const renderResultStep = () => {
    if (!result) return null;

    // Logic to determine appearance based on budget fit
    // If budget_fit is low (e.g. < 50), we might want to warn or not show "Within Budget"
    const isWithinBudget = budget && result.decision_factors.budget_fit > 75;

    // Decisive "Confirmed" Styles (Emerald/Green)
    const cardBorderColor = 'border-emerald-500';
    const cardShadow = 'shadow-2xl shadow-emerald-500/20';
    const accentGradient = 'from-emerald-500 to-green-600';

    return (
      <div className="space-y-8 pb-24 animate-in slide-in-from-bottom-8 duration-500">
        
        {/* ONE-GLANCE RECOMMENDATION CARD */}
        <div className={`relative bg-white rounded-[2rem] ${cardShadow} border-2 ${cardBorderColor} overflow-hidden transform transition-all duration-500`}>
          
          {/* Top Accent Bar */}
          <div className={`h-3 w-full bg-gradient-to-r ${accentGradient}`}></div>
          
          <div className="p-7">
            {/* Header Label */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                <Trophy className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  ⭐ Today’s Bite
                </span>
              </div>
              
              {result.final_choice.price_estimate && budget && (
                <div className="text-right">
                  <span className="block text-lg font-bold text-slate-900 leading-none">{result.final_choice.price_estimate}</span>
                  {isWithinBudget ? (
                     <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 rounded">Within Budget</span>
                  ) : (
                     <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 rounded">Over Budget</span>
                  )}
                </div>
              )}
            </div>

            {/* Food Name */}
            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
              {result.final_choice.name}
            </h2>
            <p className="text-sm text-slate-500 mt-2 mb-6 font-medium leading-relaxed">
              {result.final_choice.short_justification}
            </p>

            {/* Short Action Checkmark */}
            <div className="flex items-center gap-3">
               <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 bg-emerald-500 border-emerald-500 text-white">
                 <CheckCircle2 className="w-3.5 h-3.5" />
               </div>
               <span className="text-sm font-bold text-emerald-700">
                 Best match for {goal}
               </span>
            </div>

          </div>
        </div>

        {/* Why this pick? Toggle */}
        <div className="px-2">
           <button 
             onClick={() => setShowDetails(!showDetails)}
             className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
           >
             <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                 <BarChart3 className="w-5 h-5" />
               </div>
               <span className="font-bold text-slate-700">Why this pick?</span>
             </div>
             {showDetails ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
           </button>
           
           {showDetails && (
             <div className="mt-4 space-y-6 animate-in slide-in-from-top-4 duration-300">
               
               {/* Decision Factors */}
               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Decision Factors</h4>
                 <div className="space-y-4">
                    {/* Goal Match */}
                    <div>
                      <div className="flex justify-between text-sm font-medium mb-1.5">
                        <span className="text-slate-700">Goal Match</span>
                        <span className="text-slate-900">{result.decision_factors.goal_match}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${result.decision_factors.goal_match}%` }}></div>
                      </div>
                    </div>
                    {/* Budget Fit */}
                    <div>
                      <div className="flex justify-between text-sm font-medium mb-1.5">
                        <span className="text-slate-700">Budget Fit</span>
                        <span className="text-slate-900">{result.decision_factors.budget_fit}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${result.decision_factors.budget_fit > 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${result.decision_factors.budget_fit}%` }}></div>
                      </div>
                    </div>
                    {/* Visual Clarity */}
                    <div>
                      <div className="flex justify-between text-sm font-medium mb-1.5">
                        <span className="text-slate-700">Visual Clarity</span>
                        <span className="text-slate-900">{result.decision_factors.visual_clarity}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${result.decision_factors.visual_clarity}%` }}></div>
                      </div>
                    </div>
                 </div>
               </div>

               {/* Rejected Alternatives */}
               {result.rejected_alternatives.length > 0 && (
                 <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Other Options Considered</h4>
                    {result.rejected_alternatives.map((alt, i) => (
                      <div key={i} className="flex items-start justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm opacity-75">
                         <div>
                           <h5 className="font-bold text-slate-700">{alt.name}</h5>
                           {alt.price_estimate && budget && <p className="text-xs text-slate-400">{alt.price_estimate}</p>}
                         </div>
                         <div className="bg-rose-50 text-rose-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border border-rose-100 max-w-[50%] text-right">
                           {alt.reason}
                         </div>
                      </div>
                    ))}
                 </div>
               )}

               {/* Technical Confidence */}
               <div className="flex gap-4 text-xs text-slate-400 justify-center pt-2">
                 <span>Recommendation Confidence: {result.confidence_scores.recommendation}%</span>
                 {budget && <span>Price Certainty: {result.confidence_scores.price}%</span>}
               </div>

             </div>
           )}
        </div>

        {/* Fallback Entry Point */}
        {result.trigger_fallback && !showFallbackQuestions && (
           <div className="text-center pt-4 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-slate-500 text-sm mb-3">If none of these feel right, there’s another option.</p>
              <button 
                onClick={() => setShowFallbackQuestions(true)}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-amber-600 bg-white hover:bg-amber-50 px-5 py-2.5 rounded-full border border-slate-200 hover:border-amber-200 shadow-sm hover:shadow-md transition-all"
              >
                 <Home className="w-4 h-4" />
                 Try a quick cook-at-home idea instead
              </button>
           </div>
        )}

        {/* Fallback Question Flow & Result */}
        {showFallbackQuestions && renderFallbackFlow()}

        {/* Reset Button (Only show if not deep in fallback flow to avoid clutter) */}
        {!showFallbackQuestions && (
          <div className="flex justify-center pt-8">
             <button onClick={handleReset} className="group flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-medium px-6 py-3 rounded-full hover:bg-white hover:shadow-md transition-all">
               <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
               Start Over
             </button>
          </div>
        )}
        
        {/* If in fallback flow, show reset at bottom too */}
        {showFallbackQuestions && (
           <div className="flex justify-center pt-12">
             <button onClick={handleReset} className="text-xs text-slate-400 hover:text-slate-600">Start Over</button>
           </div>
        )}

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 animate-in fade-in slide-in-from-right-4 duration-500">
      <Header 
        subtitle={<strong className="block text-slate-700">Today’s Bite</strong>} 
        onHome={onHome} 
      />
      
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

        {step === 'GOAL' && renderGoalStep()}
        {step === 'BUDGET' && renderBudgetStep()}
        {step === 'CAPTURE' && renderCaptureStep()}
        {step === 'ANALYZING' && renderAnalyzingStep()}
        {step === 'RESULTS' && renderResultStep()}

      </main>
    </div>
  );
};