import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { GoalSelector } from './components/GoalSelector';
import { AnalysisView } from './components/AnalysisView';
import { AnalysisResult, HealthGoal } from './types';
import { analyzeMealImage, fileToGenerativePart } from './services/geminiService';
import { Info, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentGoal, setCurrentGoal] = useState<HealthGoal>('General Wellness');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Track the current analysis ID to handle cancellation/race conditions
  const analysisIdRef = useRef<number>(0);

  const handleImageSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Increment request ID
    const currentId = analysisIdRef.current + 1;
    analysisIdRef.current = currentId;

    try {
      const base64Data = await fileToGenerativePart(file);
      
      // Check if cancelled during file processing
      if (analysisIdRef.current !== currentId) return;

      const data = await analyzeMealImage(base64Data, file.type, currentGoal);
      
      // Check if cancelled during API call
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
    // Increment ID to invalidate any pending requests
    analysisIdRef.current += 1;
    setIsLoading(false);
    // Note: We keep the imagePreview in case they want to retry, or we could clear it.
    // Given "user might get it wrong", clearing it to allow new selection is better.
    setImagePreview(null);
    setError(null);
  };

  const handleReset = () => {
    setResult(null);
    setImagePreview(null);
    setError(null);
    // Revoke object URL to avoid memory leaks
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        {!result ? (
          // Analysis Input View
          <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in zoom-in duration-500">
            
            <div className="text-center space-y-4 pt-8">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                What's on your plate?
              </h2>
              <p className="text-lg text-slate-600 max-w-xl mx-auto">
                Get instant, non-judgmental guidance. Snap a photo to check hidden risks and get practical tips.
              </p>
            </div>

            <div className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <GoalSelector 
                selectedGoal={currentGoal} 
                onSelect={setCurrentGoal} 
              />
              <div className="border-t border-slate-100 pt-8">
                 <UploadZone 
                    onImageSelected={handleImageSelect} 
                    isLoading={isLoading} 
                    onCancel={handleCancelAnalysis}
                 />
              </div>
            </div>

             {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="text-center">
               <p className="text-xs text-slate-400 max-w-md mx-auto flex items-center justify-center gap-1.5">
                 <Info className="w-3 h-3" />
                 BiteAid does not provide medical advice. Consult a doctor for health concerns.
               </p>
            </div>
          </div>
        ) : (
          // Analysis Result View
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

export default App;