import React, { useRef, useState } from 'react';
import { AnalysisResult, ConfidenceLevel, SimulationResult } from '../types';
import { simulateImpact } from '../services/geminiService';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Droplets, 
  Utensils,
  MinusCircle,
  Scale,
  Download,
  Loader2,
  HelpCircle,
  X,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw
} from 'lucide-react';

interface AnalysisViewProps {
  result: AnalysisResult;
  imagePreview: string | null;
  onReset: () => void;
}

const ImpactBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors = {
    Low: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Moderate: "bg-amber-100 text-amber-800 border-amber-200",
    High: "bg-rose-100 text-rose-800 border-rose-200",
  };
  
  const icons = {
    Low: <CheckCircle2 className="w-4 h-4" />,
    Moderate: <Info className="w-4 h-4" />,
    High: <AlertTriangle className="w-4 h-4" />,
  };

  const style = colors[level as keyof typeof colors] || colors.Moderate;
  const icon = icons[level as keyof typeof icons] || icons.Moderate;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${style}`}>
      {icon}
      <span>{level} Impact</span>
    </div>
  );
};

const ConfidenceIndicator: React.FC<{ level: ConfidenceLevel, tooltip: string, isLight?: boolean }> = ({ level, tooltip, isLight }) => {
  const dots = {
    High: [true, true, true],
    Medium: [true, true, false],
    Low: [true, false, false],
  };

  const activeColor = isLight ? 'bg-white' : 'bg-slate-400';
  const inactiveColor = isLight ? 'bg-white/30' : 'bg-slate-200';

  return (
    <div className="group relative inline-flex items-center ml-2 cursor-help" title={tooltip}>
      <div className="flex gap-0.5">
        {dots[level].map((filled, i) => (
          <div 
            key={i} 
            className={`w-1.5 h-1.5 rounded-full ${filled ? activeColor : inactiveColor}`} 
          />
        ))}
      </div>
    </div>
  );
};

export const AnalysisView: React.FC<AnalysisViewProps> = ({ result, imagePreview, onReset }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);
  
  // Simulation State
  const [simulatingItem, setSimulatingItem] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const handleSimulate = async (item: string) => {
    if (simulatingItem) return; // Prevent multiple clicks
    setSimulatingItem(item);
    setSimulationResult(null);
    try {
      const simData = await simulateImpact(result, item);
      setSimulationResult(simData);
    } catch (e) {
      console.error(e);
      alert("Failed to simulate impact. Please try again.");
    } finally {
      setSimulatingItem(null);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`biteaid-report-${dateStr}.pdf`);
    } catch (error) {
      console.error("PDF Export failed", error);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-32">
      
      {/* Report Container */}
      <div ref={reportRef} className="space-y-6 p-4 bg-slate-50 rounded-xl">
        {/* Top Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="md:flex">
            {imagePreview && (
              <div className="md:w-1/3 h-48 md:h-auto bg-slate-50 relative">
                <img 
                  src={imagePreview} 
                  alt="Analyzed meal" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <ImpactBadge level={result.health_impact_level} />
                </div>
              </div>
            )}
            
            <div className="p-6 md:w-2/3 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-slate-900">Analysis Complete</h2>
                  <button 
                    onClick={() => setShowConfidenceModal(true)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 px-2 py-0.5 rounded-full transition-colors border border-slate-100"
                  >
                    <HelpCircle className="w-3 h-3" />
                    How confidence works
                  </button>
                </div>
                <p className="text-slate-600 italic">"{result.brief_supportive_comment}"</p>
              </div>

              {/* Detected Items - Now Interactive */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detected Items (Tap to Simulate)</h3>
                  {simulatingItem && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.detected_foods.map((food, i) => (
                    <button
                      key={i}
                      onClick={() => handleSimulate(food.text)}
                      disabled={!!simulatingItem}
                      className={`
                        group relative flex items-center px-2.5 py-1 rounded-md text-sm font-medium transition-all
                        ${simulatingItem === food.text ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 ring-offset-1' : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm active:scale-95 cursor-pointer'}
                      `}
                    >
                      <span className="flex items-center gap-1.5">
                        {simulatingItem === food.text ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />}
                        {food.text}
                      </span>
                      <ConfidenceIndicator level={food.confidence} tooltip="Confidence reflects how clearly this item can be identified from the image alone." />
                    </button>
                  ))}
                </div>
              </div>

              {result.nutritional_risks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Potential Flags</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.nutritional_risks.map((risk, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-md text-sm">
                        <AlertTriangle className="w-3 h-3" />
                        {risk.text}
                        <ConfidenceIndicator level={risk.confidence} tooltip="Some health flags are inferred based on common preparation methods, not lab data." />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* DO THIS */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-2 mb-4 text-emerald-700">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Utensils className="w-5 h-5" />
              </div>
              <h3 className="font-bold">Do This</h3>
            </div>
            <ul className="space-y-3">
              {result.actionable_guidance.do_this.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="flex-1">{item.text}</span>
                  <ConfidenceIndicator level={item.confidence} tooltip="Recommendations vary in certainty depending on visible ingredients and general nutrition science." />
                </li>
              ))}
              {result.actionable_guidance.do_this.length === 0 && (
                <li className="text-sm text-slate-400 italic">No specific actions needed.</li>
              )}
            </ul>
          </div>

          {/* AVOID THIS */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100 hover:border-rose-200 transition-colors">
            <div className="flex items-center gap-2 mb-4 text-rose-700">
              <div className="p-2 bg-rose-100 rounded-lg">
                <MinusCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold">Avoid / Limit</h3>
            </div>
            <ul className="space-y-3">
              {result.actionable_guidance.avoid_this.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <ArrowRight className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                  <span className="flex-1">{item.text}</span>
                  <ConfidenceIndicator level={item.confidence} tooltip="Recommendations vary in certainty depending on visible ingredients and general nutrition science." />
                </li>
              ))}
              {result.actionable_guidance.avoid_this.length === 0 && (
                <li className="text-sm text-slate-400 italic">Looks good as is!</li>
              )}
            </ul>
          </div>

          {/* BALANCE */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-2 mb-4 text-indigo-700">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="font-bold">Balance It</h3>
            </div>
            <ul className="space-y-3">
              {result.actionable_guidance.consider_balancing.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <Droplets className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <span className="flex-1">{item.text}</span>
                  <ConfidenceIndicator level={item.confidence} tooltip="Recommendations vary in certainty depending on visible ingredients and general nutrition science." />
                </li>
              ))}
              {result.actionable_guidance.consider_balancing.length === 0 && (
                <li className="text-sm text-slate-400 italic">Meal is well balanced.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Buttons: Export & Reset */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-12">
        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-full transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isExporting ? 'Generating PDF...' : 'Download Report PDF'}
        </button>

        <button 
          onClick={onReset}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-full transition-all shadow-lg hover:shadow-xl transform active:scale-95"
        >
          Analyze Another Meal
        </button>
      </div>

      {/* Impact Simulation Panel (Bottom Sheet) */}
      {simulationResult && (
        <div className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-4 sm:right-4 z-50 flex justify-center items-end sm:items-center animate-in slide-in-from-bottom-10 duration-500">
          <div className="w-full max-w-4xl bg-slate-900 text-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-md relative overflow-hidden max-h-[85vh] flex flex-col">
            
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            {/* Close Button - Fixed position within the flex container to ensure visibility */}
            <div className="absolute top-3 right-3 z-20">
              <button 
                onClick={() => setSimulationResult(null)}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors border border-slate-700/50 backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Wrapper */}
            <div className="overflow-y-auto p-6 pt-12 sm:p-8 relative z-10 custom-scrollbar">
              <div className="flex flex-col md:flex-row gap-6 md:items-start">
                
                <div className="flex-1 space-y-4">
                  <div>
                     <h3 className="text-emerald-400 font-semibold text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                       <Sparkles className="w-3 h-3" /> Simulation Result
                     </h3>
                     <h2 className="text-xl font-bold pr-8">{simulationResult.title}</h2>
                  </div>

                  <div className="flex flex-wrap gap-3">
                     {simulationResult.metrics.map((m, i) => (
                       <div key={i} className="bg-slate-800/50 rounded-lg px-3 py-2 flex flex-col items-start border border-slate-700 flex-1 min-w-[100px]">
                          <span className="text-[10px] text-slate-400 uppercase truncate w-full" title={m.label}>{m.label}</span>
                          <div className="flex items-center gap-1 font-medium text-sm mt-0.5">
                             {m.trend === 'increase' && <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />}
                             {m.trend === 'decrease' && <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />}
                             {m.trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
                             <span className={m.trend === 'decrease' ? 'text-emerald-300' : m.trend === 'increase' ? 'text-rose-300' : 'text-slate-300'}>
                               {m.trend}
                             </span>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>

                <div className="flex-1 space-y-3 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {simulationResult.explanation}
                    <ConfidenceIndicator level={simulationResult.explanation_confidence} tooltip="Based on general nutritional science." isLight={true} />
                  </p>
                  <div className="flex items-start gap-2 text-sm text-emerald-300 bg-emerald-900/20 p-2.5 rounded-lg border border-emerald-500/20">
                    <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-emerald-200 block text-xs uppercase mb-0.5">Smart Swap</strong>
                      {simulationResult.swap_suggestion}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confidence Modal */}
      {showConfidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowConfidenceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-100 p-2 rounded-full">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">How BiteAid Uses Confidence</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              BiteAid analyzes food using visual cues and general nutrition knowledge. Confidence indicators show how certain the system is about each insight, helping you decide what to trust and what to treat as guidance.
            </p>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowConfidenceModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};