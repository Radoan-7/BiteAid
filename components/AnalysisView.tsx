import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnalysisResult, ConfidenceLevel, SimulationResult, ConfidentItem, TimelineCheckpoint } from '../types';
import { simulateImpact } from '../services/geminiService';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
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
  RefreshCw, 
  Clock, 
  Activity, 
  ChevronDown 
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
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide ${style}`}>
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
            className={`w-1 h-1 rounded-full ${filled ? activeColor : inactiveColor}`} 
          />
        ))}
      </div>
    </div>
  );
};

interface ActionCardProps {
  title: string;
  type: 'do' | 'avoid' | 'balance';
  items: ConfidentItem[];
}

const ActionCard: React.FC<ActionCardProps> = ({ title, type, items }) => {
  if (!items || items.length === 0) return null;

  const styles = {
    do: {
      border: 'border-emerald-100',
      bgHover: 'hover:border-emerald-200',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    avoid: {
      border: 'border-rose-100',
      bgHover: 'hover:border-rose-200',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-700',
      icon: <MinusCircle className="w-5 h-5" />,
    },
    balance: {
      border: 'border-indigo-100',
      bgHover: 'hover:border-indigo-200',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-700',
      icon: <Scale className="w-5 h-5" />,
    }
  };

  const style = styles[type];
  
  // Strictly limit to top 2 items
  const displayItems = items.slice(0, 2);

  return (
    <div 
      className={`
        bg-white rounded-2xl shadow-sm border ${style.border} ${style.bgHover} 
        transition-all p-5 h-full flex flex-col
      `}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${style.iconBg} ${style.iconColor}`}>
          {style.icon}
        </div>
        <h3 className={`font-bold ${style.iconColor}`}>{title}</h3>
      </div>
      
      <ul className="space-y-3 flex-1">
        {displayItems.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
            <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${style.iconColor.replace('text-', 'bg-')}`}></div>
            <span className="leading-relaxed">
              {item.text}
              <ConfidenceIndicator level={item.confidence} tooltip="Confidence based on visual evidence." />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const TimelineCard: React.FC<{ point: TimelineCheckpoint }> = ({ point }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`
        bg-white rounded-xl border border-slate-100 p-4 cursor-pointer transition-all duration-300
        ${isExpanded ? 'border-blue-300 shadow-md ring-1 ring-blue-500/10' : 'hover:border-blue-200 hover:shadow-sm'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{point.time_window}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} />
      </div>
      
      {/* Tags (Always visible) */}
      <div className="flex flex-wrap gap-1.5">
        {point.feeling_indicators.map((tag, i) => (
          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide rounded">
            {tag}
          </span>
        ))}
      </div>
      
      {/* Expandable Description */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr] mt-0'}`}>
        <div className="overflow-hidden">
          <p className="text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-50">
            {point.description}
            <ConfidenceIndicator level={point.confidence} tooltip="Projected physiological effect." />
          </p>
        </div>
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
  const [selectedMetricIndex, setSelectedMetricIndex] = useState<number | null>(null);

  const handleSimulate = async (item: string) => {
    if (simulatingItem) return;
    setSimulatingItem(item);
    setSimulationResult(null);
    setSelectedMetricIndex(null);
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
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
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
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-32">
      
      {/* Report Container */}
      <div ref={reportRef} className="space-y-8">
        
        {/* 1. Header & Data Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex flex-col md:flex-row items-stretch">
             {/* Image Side - Left Side with Padding - Decreased Width to 38% */}
             {imagePreview && (
                <div className="w-full md:w-[38%] p-3 md:p-4 shrink-0">
                  <div className="relative h-64 md:h-full w-full rounded-2xl overflow-hidden bg-slate-50 shadow-sm border border-slate-100">
                    <img src={imagePreview} alt="Analyzed meal" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                </div>
             )}
             
             {/* Content Side - Right Side */}
             <div className="flex-1 p-6 md:p-8 space-y-6">
                
                {/* Header Summary */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                     <h2 className="text-2xl font-bold text-slate-900">Analysis Complete</h2>
                     <ImpactBadge level={result.health_impact_level} />
                  </div>
                  
                  <p className="text-slate-700 leading-relaxed text-lg">
                    {result.brief_supportive_comment}
                  </p>
                </div>

                {/* Detected Items & Flags - Stacked Layout (Rows) */}
                <div className="pt-6 border-t border-slate-100 flex flex-col gap-6">
                   
                   {/* Row 1: Detected Items */}
                   <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Detected Items <span className="font-normal normal-case text-slate-300">(Tap to Simulate)</span></span>
                      <div className="flex flex-wrap gap-2">
                        {result.detected_foods.map((food, i) => (
                          <button
                            key={i}
                            onClick={() => handleSimulate(food.text)}
                            disabled={!!simulatingItem}
                            className={`
                              group relative flex items-center px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all
                              ${simulatingItem === food.text ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 ring-offset-1' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200'}
                            `}
                          >
                            <span className="flex items-center gap-1.5">
                              {simulatingItem === food.text ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />}
                              {food.text}
                            </span>
                            <ConfidenceIndicator level={food.confidence} tooltip="ID Confidence" />
                          </button>
                        ))}
                      </div>
                   </div>
                   
                   {/* Row 2: Nutritional Flags */}
                   <div className="space-y-3">
                     {result.nutritional_risks.length > 0 ? (
                       <>
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Nutritional Flags</span>
                          <div className="flex flex-wrap gap-2">
                            {result.nutritional_risks.map((risk, i) => (
                              <span key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-sm font-medium">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {risk.text}
                              </span>
                            ))}
                          </div>
                       </>
                     ) : (
                       <>
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Nutritional Flags</span>
                          <span className="text-xs text-slate-400 italic">No major risks flagged.</span>
                       </>
                     )}
                   </div>

                </div>
             </div>
          </div>
        </div>

        {/* 2. Action Cards Grid (Guidance) - Moved Above Timeline */}
        <div className="space-y-6">
           <div className="flex items-center gap-2 px-1">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900">Harm Reduction Guidance</h3>
           </div>

           {/* Updated grid to use 3 columns on medium screens */}
           <div className="grid md:grid-cols-3 gap-6 items-start">
              <ActionCard type="do" title="Do This Now" items={result.actionable_guidance.do_this} />
              <ActionCard type="avoid" title="Avoid / Limit" items={result.actionable_guidance.avoid_this} />
              <ActionCard type="balance" title="Balance It Later" items={result.actionable_guidance.consider_balancing} />
           </div>
        </div>

        {/* 3. Timeline Section (Projected Effects) - Moved Below Guidance */}
        {result.after_effect_timeline && result.after_effect_timeline.length > 0 && (
           <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <Activity className="w-5 h-5 text-blue-500" />
                 <h3 className="font-bold text-slate-900">Projected After-Effects</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                 {result.after_effect_timeline.map((point, i) => (
                    <TimelineCard key={i} point={point} />
                 ))}
              </div>
           </div>
        )}

      </div>

      {/* Buttons */}
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

      {/* Impact Simulation Panel (Centered Modal via Portal) */}
      {simulationResult && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 h-[100dvh] w-screen">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setSimulationResult(null)} />

          {/* Card - Always Centered */}
          <div className="w-full max-w-lg bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/50 relative overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-300 mx-auto">
            
            {/* Decorative BG */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

            {/* Header (Fixed) */}
            <div className="p-6 pb-2 shrink-0 relative z-20 flex justify-between items-start">
              <div>
                 <h3 className="text-emerald-400 font-semibold text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                   <Sparkles className="w-3 h-3" /> Simulation Result
                 </h3>
                 <h2 className="text-xl font-bold pr-2">{simulationResult.title}</h2>
              </div>
              <button 
                onClick={() => setSimulationResult(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors border border-slate-700/50 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 pt-4 relative z-10 custom-scrollbar">
               
               {/* Metrics Grid - Compact Cards */}
               <div className="grid grid-cols-3 gap-2 mb-6">
                  {simulationResult.metrics.map((m, i) => {
                    const isSelected = selectedMetricIndex === i;
                    return (
                      <button 
                        key={i}
                        onClick={() => setSelectedMetricIndex(i)}
                        className={`
                           flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200
                           ${isSelected 
                              ? 'bg-slate-800/90 border-emerald-500/50 ring-1 ring-emerald-500/20' 
                              : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800'
                           }
                        `}
                      >
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-center w-full truncate">{m.label}</span>
                         <div className="flex items-center gap-1.5">
                            {/* Trend Icon */}
                            {m.trend === 'increase' && <ArrowUpRight className="w-4 h-4 text-rose-400" />}
                            {m.trend === 'decrease' && <ArrowDownRight className="w-4 h-4 text-emerald-400" />}
                            {m.trend === 'neutral' && <Minus className="w-4 h-4 text-slate-400" />}
                            
                            <span className={`text-sm font-bold ${
                              m.trend === 'decrease' ? 'text-emerald-300' : 
                              m.trend === 'increase' ? 'text-rose-300' : 'text-slate-300'
                            }`}>
                               {m.trend === 'neutral' ? 'Flat' : m.trend.charAt(0).toUpperCase() + m.trend.slice(1)}
                            </span>
                         </div>
                      </button>
                    );
                  })}
               </div>

               {/* Explanation Area - Updates based on selection */}
               {selectedMetricIndex !== null ? (
                   <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 animate-in fade-in duration-300">
                       <div className="flex gap-3">
                          <div className="shrink-0 p-2 bg-blue-500/10 rounded-lg h-fit">
                             <Info className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-emerald-400 text-sm mb-1 uppercase tracking-wide">
                              {simulationResult.metrics[selectedMetricIndex].label} Impact
                            </h4>
                            <p className="text-sm text-slate-200 leading-relaxed">
                              {simulationResult.metrics[selectedMetricIndex].impact_analysis}
                            </p>
                          </div>
                       </div>
                   </div>
               ) : (
                   <div className="flex flex-col items-center justify-center py-6 text-slate-500 bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed animate-pulse">
                      <div className="bg-slate-800 p-2 rounded-full mb-2">
                        <Sparkles className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest">Tap a card to view impact details</span>
                   </div>
               )}

            </div>
          </div>
        </div>,
        document.body
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