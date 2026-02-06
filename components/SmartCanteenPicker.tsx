import React, { useState, useRef, useEffect } from 'react';
import { Header } from './Header';
import { 
  CanteenGoal, 
  KitchenAccess, 
  TimeAvailable, 
  EnergyLevel, 
  CookAtHomeResult,
  ScannedItem,
  FinalCanteenDecision
} from '../types';
import { 
  makeFinalCanteenDecision, 
  fileToGenerativePart, 
  generateCookAtHomeIdea 
} from '../services/geminiService';
import { LiveScanView } from './LiveScanView';
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
  Home,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Trophy,
  Mic,
  MicOff,
  ChefHat,
  Layers,
  Globe,
  Check
} from 'lucide-react';

interface SmartCanteenPickerProps {
  onHome: () => void;
}

type Step = 'GOAL' | 'SCAN_MODE' | 'BUDGET_MENU' | 'ANALYZING_FINAL' | 'RESULTS';

const GOALS: { id: CanteenGoal; icon: React.ReactNode; desc: string }[] = [
  { id: 'Sustain Energy', icon: <Zap className="w-5 h-5 text-amber-500" />, desc: "Avoid the afternoon slump" },
  { id: 'Maximum Focus', icon: <Brain className="w-5 h-5 text-indigo-500" />, desc: "Sharp mind for studying" },
  { id: 'Light & Recovery', icon: <Coffee className="w-5 h-5 text-sky-500" />, desc: "Easy digestion, post-workout" },
  { id: 'Balanced & Healthy', icon: <Leaf className="w-5 h-5 text-emerald-500" />, desc: "Nutrient dense basics" },
  { id: 'Comfort & Variety', icon: <Smile className="w-5 h-5 text-rose-500" />, desc: "Treat yourself safely" },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'BDT', symbol: 'Tk', label: 'BDT (Tk) - Bangladeshi Taka' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
];

export const SmartCanteenPicker: React.FC<SmartCanteenPickerProps> = ({ onHome }) => {
  const [step, setStep] = useState<Step>('GOAL');
  const [goal, setGoal] = useState<CanteenGoal | null>(null);
  const [budget, setBudget] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  
  // Data State
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [menuImage, setMenuImage] = useState<File | null>(null);
  const [menuPreview, setMenuPreview] = useState<string | null>(null);

  const [finalResult, setFinalResult] = useState<FinalCanteenDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fallback State
  const [showFallbackQuestions, setShowFallbackQuestions] = useState(false);
  const [fallbackKitchen, setFallbackKitchen] = useState<KitchenAccess | null>(null);
  const [fallbackTime, setFallbackTime] = useState<TimeAvailable | null>(null);
  const [fallbackEnergy, setFallbackEnergy] = useState<EnergyLevel | null>(null);
  const [fallbackResult, setFallbackResult] = useState<CookAtHomeResult | null>(null);
  const [isGeneratingFallback, setIsGeneratingFallback] = useState(false);
  
  // Fallback Interactive State
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // New Fallback Ingredient State
  const [userIngredients, setUserIngredients] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const fileInputMenuRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(false);

  // 1. Force instant scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    isMounted.current = true;
  }, []);

  // 2. Smooth scroll to top when step changes
  useEffect(() => {
    if (isMounted.current && step !== 'SCAN_MODE') {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleGoalSelect = (selected: CanteenGoal) => {
    setGoal(selected);
    setStep('SCAN_MODE');
  };

  const handleScanDone = (items: ScannedItem[]) => {
    setScannedItems(items);
    
    // Attempt to auto-detect currency from scanned symbols
    const foundSymbol = items.find(i => i.price_estimate?.match(/[$₹€£Tk¥]/))?.price_estimate?.charAt(0);
    if (foundSymbol) {
       const matched = CURRENCIES.find(c => c.symbol === foundSymbol || (foundSymbol === 'T' && c.code === 'BDT'));
       if (matched) setSelectedCurrency(matched.code);
    }
    
    setStep('BUDGET_MENU');
  };

  const handleMenuFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMenuImage(file);
      setMenuPreview(URL.createObjectURL(file));
    }
  };

  const handleFinalAnalyze = async () => {
    if (!goal) return;

    setStep('ANALYZING_FINAL');
    setError(null);

    try {
      const menuBase64 = menuImage ? await fileToGenerativePart(menuImage) : null;
      
      const decision = await makeFinalCanteenDecision(scannedItems, menuBase64, goal, budget, selectedCurrency);
      setFinalResult(decision);
      setStep('RESULTS');
    } catch (err) {
      console.error(err);
      setError("Failed to make a final decision. Please try again.");
      setStep('BUDGET_MENU');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    // @ts-ignore - SpeechRecognition types are tricky in TS without polyfill types
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserIngredients(prev => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.start();
  };

  const handleGenerateFallback = async () => {
    if (!goal) return;
    setIsGeneratingFallback(true);
    setCompletedSteps(new Set()); // Reset progress
    try {
      const k = fallbackKitchen || 'Limited';
      const t = fallbackTime || '~10 min';
      const e = fallbackEnergy || 'Low';
      // Pass the collected ingredients to the service
      const recipe = await generateCookAtHomeIdea(goal, k, t, e, userIngredients);
      setFallbackResult(recipe);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingFallback(false);
    }
  };

  const handleReset = () => {
    setStep('GOAL');
    setGoal(null);
    setBudget('');
    setScannedItems([]);
    setMenuImage(null);
    setMenuPreview(null);
    setFinalResult(null);
    setShowDetails(false);
    setShowFallbackQuestions(false);
    setFallbackResult(null);
    setCompletedSteps(new Set());
    setUserIngredients('');
    setSelectedCurrency('USD');
  };

  // --- Render Functions ---

  const renderGoalStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">What's the goal for lunch?</h2>
        <p className="text-slate-500">We'll scan for options that fit.</p>
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

  const renderBudgetMenuStep = () => {
    // Determine active currency object
    const activeCurrency = CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];
    
    // Generate preset budget chips based on currency
    const symbol = activeCurrency.symbol;
    const presets = selectedCurrency === 'INR' ? ['50', '100', '150', '200'] : 
                    selectedCurrency === 'BDT' ? ['100', '150', '200', '300'] :
                    selectedCurrency === 'JPY' ? ['500', '800', '1000', '1500'] :
                    ['5', '8', '10', '15']; // USD/EUR/GBP default

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Almost there!</h2>
          <p className="text-slate-500">Add constraints to refine the choice.</p>
        </div>

        {/* Scanned Summary */}
        <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between border border-blue-100">
           <div className="flex items-center gap-2 text-blue-800">
             <CheckCircle2 className="w-5 h-5" />
             <span className="font-medium">Scanned {scannedItems.length} items</span>
           </div>
           <button onClick={() => setStep('SCAN_MODE')} className="text-xs font-bold text-blue-600 underline">Rescan</button>
        </div>

        {/* Currency Selector - Mandatory */}
        <div className="space-y-3">
           <label className="block text-sm font-bold text-slate-700">Currency <span className="text-rose-500">*</span></label>
           <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">
                  <Globe className="w-5 h-5" />
              </span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-800 appearance-none"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-4 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
           </div>
        </div>

        {/* Budget Input */}
        <div className="space-y-3">
           <label className="block text-sm font-bold text-slate-700">Max Budget ({symbol}) <span className="font-normal text-slate-400">- Optional</span></label>
           <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-bold">{symbol}</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 10"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-lg"
              />
           </div>
           <div className="flex gap-2 justify-center">
              {presets.map(val => (
                <button 
                  key={val} 
                  onClick={() => setBudget(val)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-medium text-slate-600"
                >
                  Under {symbol}{val}
                </button>
              ))}
           </div>
        </div>

        {/* Menu Photo Optional */}
        <div className="space-y-3">
           <label className="block text-sm font-bold text-slate-700">Menu Photo <span className="font-normal text-slate-400">- Recommended for accurate prices</span></label>
           <div 
             onClick={() => fileInputMenuRef.current?.click()}
             className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative
               ${menuPreview ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
             `}
           >
             {menuPreview ? (
               <img src={menuPreview} alt="Menu" className="w-full h-full object-cover opacity-80" />
             ) : (
               <div className="text-center p-4">
                 <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                 <span className="text-xs text-slate-500">Tap to snap menu board</span>
               </div>
             )}
           </div>
           <input type="file" ref={fileInputMenuRef} className="hidden" accept="image/*" onChange={handleMenuFileChange} />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleFinalAnalyze}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-lg"
        >
          Decide for Me
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderAnalyzingFinal = () => (
    <div className="flex flex-col items-center justify-center py-24 animate-in fade-in zoom-in duration-500 text-center px-6">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
        <div className="bg-white p-6 rounded-full shadow-lg border border-blue-100 relative z-10">
          <Brain className="w-12 h-12 text-blue-600 animate-pulse" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing {scannedItems.length} items...</h3>
      <p className="text-slate-500 text-sm">Comparing nutrition, price, and your goal of "{goal}".</p>
    </div>
  );

  const renderResults = () => {
    if (!finalResult) return null;
    const isCombo = finalResult.final_choice.type === 'Combo';

    return (
      <div className="space-y-4 pb-24 animate-in slide-in-from-bottom-8 duration-500">
        
        {/* 1. Main Decision Card (Green Border) */}
        <div className="bg-white rounded-3xl shadow-xl shadow-emerald-500/10 border-2 border-emerald-500 p-6 sm:p-8 relative overflow-hidden">
            
            {/* Top Row: Badge & Price */}
            <div className="flex items-center justify-between mb-6">
               <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isCombo ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                 {isCombo ? <Layers className="w-3.5 h-3.5" /> : <Trophy className="w-3.5 h-3.5" />}
                 <span className="text-[10px] font-bold uppercase tracking-widest">{isCombo ? 'Optimized Combo' : 'Top Pick'}</span>
               </div>
               <span className="text-xl font-bold text-slate-900">{finalResult.final_choice.price}</span>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight mb-3">
              {finalResult.final_choice.emoji} {finalResult.final_choice.name}
            </h2>

            {/* Description */}
            <p className="text-slate-500 font-medium leading-relaxed mb-6">
              {finalResult.final_choice.description}
            </p>

            {/* Quote Box (Green) */}
            <div className="bg-emerald-50/80 border border-emerald-100 p-5 rounded-2xl relative mb-6">
               <p className="text-emerald-800 text-sm font-medium leading-relaxed italic">
                 "{finalResult.reasoning}"
               </p>
            </div>

            {/* Highlights Chips */}
            <div className="flex flex-wrap gap-2">
               {finalResult.nutrition_highlights.map((h, i) => (
                 <span key={i} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">
                   {h}
                 </span>
               ))}
            </div>
        </div>

        {/* 2. Alternatives Card (Separate) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <button 
             onClick={() => setShowDetails(!showDetails)}
             className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
           >
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <BarChart3 className="w-4 h-4" />
                 </div>
                 <span className="font-bold text-slate-700 text-sm">Alternatives considered</span>
              </div>
              {showDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
           </button>
           
           {showDetails && (
              <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
                 {finalResult.rejected_alternatives.length > 0 ? (
                    finalResult.rejected_alternatives.map((alt, i) => (
                       <div key={i} className="flex justify-between items-start text-sm bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                          <div>
                             <span className="font-bold text-slate-700 block">{alt.name}</span>
                             {alt.price_estimate && <span className="text-xs text-slate-400 block">{alt.price_estimate}</span>}
                          </div>
                          <span className="text-rose-500 text-xs font-medium text-right max-w-[50%]">{alt.reason}</span>
                       </div>
                    ))
                 ) : (
                    <div className="text-center text-xs text-slate-400 italic py-2">No other valid options found.</div>
                 )}
              </div>
           )}
        </div>

        {/* 3. Fallback Text Link */}
        <div className="text-center pt-4 pb-2">
           <button 
             onClick={() => setShowFallbackQuestions(true)}
             className="text-sm text-slate-400 underline hover:text-slate-600 transition-colors"
           >
             Nothing looks good? Cook at home instead.
           </button>
        </div>

        {/* Fallback Section (Expanded) */}
        {showFallbackQuestions && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                   <ChefHat className="w-5 h-5 text-emerald-600" />
                   Home Chef Mode
                </h3>
                
                {!fallbackResult ? (
                   <div className="space-y-4">
                      {/* Inputs */}
                      <div>
                         <label className="text-xs font-bold text-slate-500 block mb-1">Ingredients</label>
                         <div className="relative">
                            <input 
                               type="text" 
                               value={userIngredients}
                               onChange={(e) => setUserIngredients(e.target.value)}
                               className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                               placeholder="e.g. Pasta, Eggs..."
                            />
                            <button onClick={toggleRecording} className="absolute right-2 top-2 p-1 text-slate-400 hover:text-emerald-500">
                               {isRecording ? <Mic className="w-4 h-4 text-red-500 animate-pulse" /> : <Mic className="w-4 h-4" />}
                            </button>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Kitchen</label>
                            <div className="flex gap-1">
                               {(['Yes', 'Limited', 'No'] as KitchenAccess[]).map(k => (
                                  <button key={k} onClick={() => setFallbackKitchen(k)} className={`flex-1 py-2 text-[10px] font-bold border rounded-lg transition-colors ${fallbackKitchen === k ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>{k}</button>
                               ))}
                            </div>
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Energy</label>
                            <div className="flex gap-1">
                               {(['High', 'Okay', 'Low'] as EnergyLevel[]).map(e => (
                                  <button key={e} onClick={() => setFallbackEnergy(e)} className={`flex-1 py-2 text-[10px] font-bold border rounded-lg transition-colors ${fallbackEnergy === e ? 'bg-blue-100 border-blue-300 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>{e}</button>
                               ))}
                            </div>
                         </div>
                      </div>

                      <button 
                         onClick={handleGenerateFallback}
                         disabled={isGeneratingFallback}
                         className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-slate-500/20 transition-all"
                      >
                         {isGeneratingFallback ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Idea'}
                      </button>
                   </div>
                ) : (
                   <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                         <h4 className="font-bold text-slate-900 text-lg mb-1">{fallbackResult.dish_name}</h4>
                         <p className="text-slate-600 text-sm italic mb-4">"{fallbackResult.why_it_fits}"</p>
                         <ul className="list-disc pl-4 space-y-2">
                            {fallbackResult.instructions.map((step, i) => (
                               <li key={i} className="text-sm text-slate-700">{step}</li>
                            ))}
                         </ul>
                      </div>
                      <button 
                         onClick={() => { setFallbackResult(null); setCompletedSteps(new Set()); }}
                         className="w-full py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                      >
                         Try Another
                      </button>
                   </div>
                )}
            </div>
        )}

        {/* 4. Start Over */}
        <div className="pt-2 flex justify-center">
           <button onClick={handleReset} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm px-4 py-2 rounded-full hover:bg-slate-100 transition-colors">
              <RefreshCw className="w-4 h-4" /> Start Over
           </button>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {step === 'SCAN_MODE' && goal ? (
        <LiveScanView 
          goal={goal} 
          onDone={handleScanDone} 
          onCancel={() => setStep('GOAL')} 
        />
      ) : (
        <>
          <Header 
            subtitle={<strong className="block text-slate-700">Today’s Bite</strong>} 
            onHome={onHome} 
          />
          
          <main className="flex-grow container mx-auto px-4 py-6 max-w-lg">
            {step === 'GOAL' && renderGoalStep()}
            {step === 'BUDGET_MENU' && renderBudgetMenuStep()}
            {step === 'ANALYZING_FINAL' && renderAnalyzingFinal()}
            {step === 'RESULTS' && renderResults()}
          </main>
        </>
      )}

    </div>
  );
};