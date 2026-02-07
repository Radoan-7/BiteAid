import React, { useState, useRef, useEffect } from 'react';
import { Header } from './Header';
import { UploadZone } from './UploadZone';
import { GoalSelector } from './GoalSelector';
import { AnalysisView } from './AnalysisView';
import { AnalysisResult, HealthGoal } from '../types';
import { analyzeMealImage, fileToGenerativePart } from '../services/geminiService';
import { Info, AlertCircle, Mic, MicOff, BookOpen, Moon, Dumbbell, Briefcase, Sparkles, CheckCircle2 } from 'lucide-react';

interface EatNowFlowProps {
  onHome: () => void;
}

export const EatNowFlow: React.FC<EatNowFlowProps> = ({ onHome }) => {
  const [currentGoal, setCurrentGoal] = useState<HealthGoal>('General Wellness');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileToAnalyze, setFileToAnalyze] = useState<File | null>(null);
  
  // Context Input State
  const [contextInput, setContextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  // Track the current analysis ID to handle cancellation/race conditions
  const analysisIdRef = useRef<number>(0);
  const isMounted = useRef(false);

  // 1. Force instant scroll to top on mount (navigation from Home)
  useEffect(() => {
    window.scrollTo(0, 0);
    isMounted.current = true;
  }, []);

  // 2. Smooth scroll to top when results appear or are reset
  useEffect(() => {
    if (isMounted.current) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleImageSelect = (file: File) => {
    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setFileToAnalyze(file);
    setError(null);
  };

  const handleContextOption = (text: string) => {
    setContextInput(text);
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

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setContextInput(prev => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.start();
  };

  const handleAnalyze = async () => {
    if (!fileToAnalyze) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    // Increment request ID
    const currentId = analysisIdRef.current + 1;
    analysisIdRef.current = currentId;

    try {
      const base64Data = await fileToGenerativePart(fileToAnalyze);
      
      if (analysisIdRef.current !== currentId) return;

      // Use contextInput if provided, otherwise undefined
      const contextToUse = contextInput.trim().length > 0 ? contextInput : undefined;
      const data = await analyzeMealImage(base64Data, fileToAnalyze.type, currentGoal, contextToUse);
      
      if (analysisIdRef.current === currentId) {
        setResult(data);
        setIsLoading(false);
      }
    } catch (err) {
      if (analysisIdRef.current === currentId) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setIsLoading(false);
      }
    }
  };

  const handleCancelAnalysis = () => {
    analysisIdRef.current += 1;
    setIsLoading(false);
    setImagePreview(null);
    setFileToAnalyze(null);
    setContextInput('');
    setError(null);
  };

  const handleReset = () => {
    setResult(null);
    setImagePreview(null);
    setFileToAnalyze(null);
    setContextInput('');
    setError(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 animate-in fade-in slide-in-from-right-4 duration-500">
      <Header onHome={onHome} />

      <main className="flex-grow container mx-auto px-4 py-8">
        {!result ? (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            
            <div className="text-center space-y-4 pt-8">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                What's on your plate?
              </h2>
              <p className="text-lg text-slate-600 max-w-xl mx-auto">
                Snap a photo to check hidden risks and get practical tips.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
              
              {/* 1. Upload Zone & Confirmation */}
              <div className="space-y-4">
                <UploadZone 
                  onImageSelected={handleImageSelect} 
                  isLoading={isLoading} 
                  onCancel={handleCancelAnalysis}
                />
                
                {/* Visual Confirmation of Upload */}
                {fileToAnalyze && !isLoading && (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-2 px-4 rounded-full w-fit mx-auto animate-in fade-in slide-in-from-top-2 border border-emerald-100 shadow-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-bold">Image uploaded</span>
                      <button onClick={handleCancelAnalysis} className="ml-2 text-xs underline text-emerald-500 hover:text-emerald-700">Change</button>
                  </div>
                )}
              </div>
              
              {/* 2. Context Input (Text + Voice + Quick Options) */}
              <div className="space-y-3">
                 <div className="text-center">
                    <label className="text-sm font-bold text-slate-700">Context <span className="text-slate-400 font-normal">- Optional</span></label>
                 </div>
                 
                 <div className="relative">
                    <textarea 
                       value={contextInput}
                       onChange={(e) => setContextInput(e.target.value)}
                       placeholder="What's happening? e.g., 'Exam in 2 hours', 'Late night study', 'Pre-workout'..."
                       className="w-full h-24 p-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none text-slate-700 text-sm"
                       maxLength={200}
                    />
                    <button 
                       onClick={toggleRecording}
                       className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${isRecording ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-white text-slate-400 hover:text-emerald-500 shadow-sm'}`}
                       title="Voice Input"
                    >
                       {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                 </div>

                 {/* Quick Options */}
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button onClick={() => handleContextOption("I have an exam coming up")} className="p-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-lg text-[10px] sm:text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-all">
                       <BookOpen className="w-3 h-3 text-indigo-500" /> Exam
                    </button>
                    <button onClick={() => handleContextOption("Late night study session")} className="p-2 bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 rounded-lg text-[10px] sm:text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-all">
                       <Moon className="w-3 h-3 text-violet-500" /> Late Night
                    </button>
                    <button onClick={() => handleContextOption("Going to gym soon")} className="p-2 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 rounded-lg text-[10px] sm:text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-all">
                       <Dumbbell className="w-3 h-3 text-amber-500" /> Workout
                    </button>
                    <button onClick={() => handleContextOption("Have a meeting/presentation soon")} className="p-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg text-[10px] sm:text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-all">
                       <Briefcase className="w-3 h-3 text-blue-500" /> Meeting
                    </button>
                 </div>
              </div>

              {/* 3. Goal Selector */}
              <div className="pt-2 border-t border-slate-100">
                <GoalSelector 
                  selectedGoal={currentGoal} 
                  onSelect={setCurrentGoal} 
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-700">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* 4. Single Analyze Button */}
              <button 
                onClick={handleAnalyze}
                disabled={!fileToAnalyze || isLoading}
                className={`
                  w-full sm:w-auto px-12 mx-auto py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                  ${!fileToAnalyze || isLoading
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20 transform active:scale-[0.98]'
                  }
                `}
              >
                {isLoading ? (
                  <>Analyzing...</>
                ) : (
                  <>
                    Analyze Meal <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
               <p className="text-xs text-slate-400 max-w-md mx-auto flex items-center justify-center gap-1.5">
                 <Info className="w-3 h-3" />
                 BiteAid does not provide medical advice. Consult a doctor for health concerns.
               </p>
            </div>
          </div>
        ) : (
          <AnalysisView 
            result={result} 
            imagePreview={imagePreview} 
            onReset={handleReset} 
          />
        )}
      </main>

      <footer className="py-6 text-center text-slate-400 text-sm bg-white border-t border-slate-100">
        <p>© {new Date().getFullYear()} BiteAid. Privacy First. No Cookies. No Tracking.</p>
      </footer>
    </div>
  );
};