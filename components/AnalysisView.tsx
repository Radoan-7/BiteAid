import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  AnalysisResult, 
  ConfidenceLevel, 
  SimulationResult, 
  TimelineCheckpoint, 
  PointExplanation,
  DefaultAnalysisResult,
  ExamAnalysisResult,
  MeetingAnalysisResult,
  WorkoutAnalysisResult
} from '../types';
import { simulateImpact, explainTimelinePoint } from '../services/geminiService';
import { AnalysisGraph } from './AnalysisGraph';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Download, 
  Loader2, 
  HelpCircle, 
  X, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowDown, 
  Minus, 
  Activity, 
  Brain,
  Zap,
  ChevronDown,
  ChevronUp,
  XCircle,
  Briefcase,
  Dumbbell,
  Clock,
  Siren
} from 'lucide-react';

// --- SUB-COMPONENTS FOR NEW MODES ---

const ThinkingProcess: React.FC<{ steps: string[] }> = ({ steps }) => {
  const [expanded, setExpanded] = useState(false);
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors"
      >
        <span className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> Extended Thinking Process</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {expanded && (
        <div className="p-4 space-y-2">
           {steps.map((step, i) => (
             <div key={i} className="flex gap-2 text-xs text-slate-600">
               <span className="text-slate-400 font-mono">{i+1}.</span>
               <p>{step}</p>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

const ExamView: React.FC<{ data: ExamAnalysisResult }> = ({ data }) => {
  const isCritical = data.exam_collision_alert.risk_level === 'CRITICAL' || data.exam_collision_alert.risk_level === 'HIGH';
  
  return (
    <div className="space-y-6">
      {/* 1. Collision Alert */}
      <div className={`p-6 rounded-2xl border-2 ${isCritical ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
         <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${isCritical ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
               {isCritical ? <Siren className="w-8 h-8 animate-pulse" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>
            <div>
               <h3 className={`text-sm font-bold uppercase tracking-widest mb-1 ${isCritical ? 'text-rose-600' : 'text-emerald-600'}`}>
                 Risk Level: {data.exam_collision_alert.risk_level}
               </h3>
               <h2 className="text-xl font-bold text-slate-900 mb-2">{data.exam_collision_alert.alert_message}</h2>
               <div className="flex items-center gap-4 text-sm font-mono text-slate-600">
                  <span>Exam: {data.exam_collision_alert.exam_time}</span>
                  <span>Crash: {data.exam_collision_alert.predicted_crash_time}</span>
               </div>
            </div>
         </div>
      </div>

      {/* 2. Strategy Timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Exam Survival Strategy
         </div>
         <div className="divide-y divide-slate-100">
            {data.exam_survival_strategy.map((item, i) => (
               <div key={i} className="p-4 flex gap-4">
                  <div className="w-16 shrink-0 text-sm font-bold text-slate-500 pt-1">{item.time}</div>
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${item.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                           {item.priority}
                        </span>
                        <h4 className="font-bold text-slate-900">{item.action}</h4>
                     </div>
                     <p className="text-sm text-slate-600">{item.reasoning}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* 3. Brain Performance */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Focus Impact</div>
            <div className="text-lg font-bold text-indigo-900 leading-snug">{data.cognitive_impact_summary.focus_impact}</div>
         </div>
         <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">Brain Fog Risk</div>
            <div className="text-lg font-bold text-amber-900">{data.cognitive_impact_summary.brain_fog_risk}</div>
         </div>
      </div>
    </div>
  );
};

const MeetingView: React.FC<{ data: MeetingAnalysisResult }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* 1. Professional Alert */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
         <div className="flex justify-between items-start mb-4">
            <div>
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Meeting Readiness</h3>
               <div className="text-3xl font-bold text-slate-900">{data.professional_performance_alert.readiness_score}/100</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${data.professional_performance_alert.risk_level === 'OPTIMAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
               {data.professional_performance_alert.risk_level}
            </div>
         </div>
         <div className="space-y-2">
            {data.professional_performance_alert.main_concerns.map((concern, i) => (
               <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  {concern}
               </div>
            ))}
         </div>
      </div>

      {/* 2. Social Metrics */}
      <div className="grid grid-cols-3 gap-3">
         <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Breath</div>
            <div className="font-bold text-slate-800">{data.social_performance_metrics.breath_freshness}</div>
         </div>
         <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Bloating</div>
            <div className="font-bold text-slate-800">{data.social_performance_metrics.bloating_risk}</div>
         </div>
         <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Fatigue</div>
            <div className="font-bold text-slate-800">{data.social_performance_metrics.visible_fatigue}</div>
         </div>
      </div>

      {/* 3. Rescue Plan */}
      <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-5">
         <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Image Rescue Plan
         </h3>
         <div className="space-y-3">
            {data.professional_image_rescue.map((step, i) => (
               <div key={i} className="flex gap-3 text-sm">
                  <span className="font-mono text-blue-500 font-bold w-12 shrink-0">{step.time}</span>
                  <div>
                     <p className="font-bold text-slate-800">{step.action}</p>
                     <p className="text-slate-500 text-xs">{step.impact}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const WorkoutView: React.FC<{ data: WorkoutAnalysisResult }> = ({ data }) => {
  const readiness = data.workout_readiness_assessment.readiness_score;
  const color = readiness >= 8 ? 'text-emerald-600' : readiness >= 5 ? 'text-amber-600' : 'text-rose-600';
  
  return (
    <div className="space-y-6">
       {/* 1. Readiness Score */}
       <div className="flex items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
             <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={`${readiness * 22.6} 226`} className={color} />
             </svg>
             <span className={`absolute text-2xl font-bold ${color}`}>{readiness}</span>
          </div>
          <div>
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Workout Readiness</h3>
             <p className="font-bold text-slate-900 text-lg leading-tight">{data.workout_readiness_assessment.main_issue}</p>
             <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Verdict: {data.workout_readiness_assessment.fuel_timing_verdict}
             </span>
          </div>
       </div>

       {/* 2. Fuel Status */}
       <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             <Zap className="w-4 h-4" /> Fuel Tank Analysis
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
             <div>
                <span className="text-slate-500 block text-xs mb-1">Carbs (Quick Energy)</span>
                <span className="font-bold text-white">{data.energy_availability_window.carb_availability}</span>
             </div>
             <div>
                <span className="text-slate-500 block text-xs mb-1">Digestion Status</span>
                <span className="font-bold text-white">{data.energy_availability_window.fat_digestion_status}</span>
             </div>
          </div>
       </div>

       {/* 3. Optimization */}
       <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
          <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
             <Dumbbell className="w-4 h-4" /> Optimization
          </h3>
          <p className="text-sm text-emerald-800 mb-3">{data.performance_optimization.best_option}</p>
          {data.performance_optimization.intensity_adjustment && (
             <div className="text-xs bg-white/50 p-2 rounded text-emerald-700 font-medium">
                Suggestion: {data.performance_optimization.intensity_adjustment}
             </div>
          )}
       </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

interface AnalysisViewProps {
  result: AnalysisResult;
  imagePreview: string | null;
  onReset: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ result, imagePreview, onReset }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // -- EXISTING STATE FOR DEFAULT VIEW --
  const [simulatingItem, setSimulatingItem] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [selectedMetricIndex, setSelectedMetricIndex] = useState<number | null>(null);
  const [explainingPoint, setExplainingPoint] = useState<TimelineCheckpoint | null>(null);
  const [explanationResult, setExplanationResult] = useState<PointExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState(false);

  // Helper for Default View
  const handleSimulate = async (item: string) => {
    // Note: The original check "if (result.mode && result.mode !== 'none') return;" might prevent default view logic 
    // from running if we reuse DefaultAnalysisResult for new modes. 
    // We'll relax this check for the new context modes which reuse the Default layout.
    // However, if we are in Legacy Special Modes (ExamView, etc with separate UI), we might skip.
    // For now, let's allow simulation if detected_foods exists.
    if (!('detected_foods' in result)) return;

    if (simulatingItem) return;
    setSimulatingItem(item);
    setSimulationResult(null);
    setSelectedMetricIndex(null);
    try {
      const simData = await simulateImpact(result as DefaultAnalysisResult, item);
      setSimulationResult(simData);
    } catch (e) {
      console.error(e);
      alert("Failed to simulate impact. Please try again.");
    } finally {
      setSimulatingItem(null);
    }
  };

  const handlePointClick = async (point: TimelineCheckpoint) => {
    // Similar check relaxation for point click explanation
    if (!('detected_foods' in result)) return;

    setExplainingPoint(point);
    setExplanationResult(null);
    setIsExplaining(true);
    try {
      const detectedFoods = (result as DefaultAnalysisResult).detected_foods.map(f => f.text);
      const explanation = await explainTimelinePoint(point, detectedFoods);
      setExplanationResult(explanation);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
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
    } finally {
      setIsExporting(false);
    }
  };

  // --- RENDER DEFAULT VIEW (Updated Logic) ---
  const renderDefaultView = (data: DefaultAnalysisResult) => {
    const t0 = data.after_effect_timeline?.[0]; 
    const t1 = data.after_effect_timeline?.[1];
    const t2 = data.after_effect_timeline?.[2];
    const hasTimelineData = t0 && t1 && t2;
    const quickFix = data.actionable_guidance.consider_balancing[0]?.text;
    
    // Determine timeline duration label based on data length or offsets
    const maxHour = Math.max(...data.after_effect_timeline.map(d => d.hour_offset), 6);
    const timelineTitle = maxHour <= 2 ? "2-Hour Exam Timeline" : maxHour <= 4 ? "4-Hour Timeline" : "Full 6-Hour Timeline";

    return (
      <div className="space-y-6">
        {/* NEW: Context Confirmation Card */}
        {data.context_summary && data.context_summary.mode !== 'default' && (
           <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3 mb-2">
                 <span className="text-2xl">{data.context_summary.icon}</span>
                 <h3 className="font-bold text-sm tracking-widest uppercase text-emerald-400">
                    {data.context_summary.title}
                 </h3>
              </div>
              <p className="text-slate-300 text-sm italic">
                 "{data.context_summary.understanding}"
              </p>
           </div>
        )}

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-4">
           <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 fill-emerald-100" /> Do This
              </h3>
              <ul className="space-y-3">
                {data.actionable_guidance.do_this.slice(0, 2).map((item, i) => (
                   <li key={i} className="flex items-start gap-3">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                      <span className="text-sm font-medium text-slate-800 leading-snug">{item.text}</span>
                   </li>
                ))}
              </ul>
           </div>
           
           <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 fill-rose-100" /> Skip This
              </h3>
              <ul className="space-y-3">
                {data.actionable_guidance.avoid_this.slice(0, 2).map((item, i) => (
                   <li key={i} className="flex items-start gap-3">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></span>
                      <span className="text-sm font-medium text-slate-800 leading-snug">{item.text}</span>
                   </li>
                ))}
              </ul>
           </div>
        </div>

        {/* Timeline Summary */}
        {hasTimelineData && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-amber-500" /> WHAT HAPPENS NEXT
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm font-bold text-slate-500">Current</span>
                    <span className="text-sm font-bold text-slate-900">Energy {t0.energy_score}%</span>
                 </div>
                 <div className="flex items-center justify-between p-2">
                    <span className="text-sm font-medium text-slate-500">+{t1.hour_offset}h ({t1.time_window})</span>
                    <div className="flex items-center gap-2">
                       {t1.energy_score < t0.energy_score ? <ArrowDown className="w-4 h-4 text-rose-500" /> : <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                       <span className="text-sm font-bold text-slate-900">{t1.energy_score}%</span>
                    </div>
                 </div>
                 <div className="flex items-center justify-between p-2 border-t border-slate-100">
                    <span className="text-sm font-medium text-slate-500">+{t2.hour_offset}h ({t2.time_window})</span>
                    <div className="flex items-center gap-2">
                       {t2.energy_score < t1.energy_score ? <ArrowDown className="w-4 h-4 text-rose-500" /> : <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                       <span className="text-sm font-bold text-slate-900">{t2.energy_score}%</span>
                    </div>
                 </div>
              </div>
              {quickFix && (
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100/50 flex flex-col justify-center h-full">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">💊 Quick Fix</span>
                  <p className="text-sm text-blue-900 font-bold leading-snug">{quickFix}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsible Full Graph */}
        <div className="space-y-3">
           <div className="border border-slate-200 rounded-2xl bg-white transition-all shadow-sm">
             <button 
               onClick={() => setExpandedTimeline(!expandedTimeline)}
               className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors group rounded-2xl"
             >
               <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="font-bold text-slate-700">{timelineTitle}</span>
               </div>
               {expandedTimeline ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
             </button>
             
             {expandedTimeline && (
               <div className="p-6 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                  <div className="h-64 sm:h-72 w-full mb-6">
                     <AnalysisGraph data={data.after_effect_timeline} onPointClick={handlePointClick} />
                  </div>
               </div>
             )}
           </div>
        </div>
      </div>
    );
  };

  // Determine if we should use the legacy special views (hardcoded types) or the unified default view
  // The new context flow uses DefaultAnalysisResult structure but with specific modes.
  // The existing hardcoded components (ExamView, MeetingView) expect strict types.
  // We will prioritize the new Default-based structure if the fields match, falling back to legacy if necessary.
  
  const isContextMode = result.mode && ['exam', 'latenight', 'workout', 'meeting', 'default'].includes(result.mode) && 'detected_foods' in result;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-32">
      
      <div ref={reportRef} className="space-y-6">
        
        {/* Header - Image & Summary */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex flex-col md:flex-row items-stretch">
             {imagePreview && (
                <div className="w-full md:w-[45%] p-3 md:p-4 shrink-0">
                  <div className="relative h-64 md:h-full w-full rounded-2xl overflow-hidden bg-slate-50 shadow-sm border border-slate-100">
                    <img src={imagePreview} alt="Analyzed meal" className="absolute inset-0 w-full h-full object-cover" />
                    {/* Badge */}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                       {result.mode === 'none' ? 'General' : result.mode} Analysis
                    </div>
                  </div>
                </div>
             )}
             
             <div className="flex-1 p-6 md:p-8 flex flex-col justify-start">
                 <div className="mb-6">
                     <h2 className="text-2xl font-bold text-slate-900 mb-4">
                       {/* Handle both legacy and new titles */}
                       {!isContextMode && result.mode === 'exam' && "Exam Readiness Check"}
                       {!isContextMode && result.mode === 'meeting' && "Professional Image Check"}
                       {!isContextMode && result.mode === 'workout' && "Workout Fuel Check"}
                       {(isContextMode || !result.mode || result.mode === 'none') && "Analysis Complete"}
                     </h2>
                     
                     {/* Show different summary based on mode/type */}
                     {!isContextMode && result.mode === 'exam' && <p className="text-lg text-slate-700 leading-relaxed">{(result as ExamAnalysisResult).cognitive_impact_summary.overall_prediction}</p>}
                     {!isContextMode && result.mode === 'workout' && <p className="text-lg text-slate-700 leading-relaxed">{(result as WorkoutAnalysisResult).workout_readiness_assessment.main_issue}</p>}
                     
                     {(isContextMode || !result.mode || result.mode === 'none') && (
                        <p className="text-lg text-slate-700 leading-relaxed">{(result as DefaultAnalysisResult).brief_supportive_comment}</p>
                     )}
                 </div>

                 {/* DETECTED ITEMS & FLAGS MOVED HERE (Only for Default Mode OR New Context Modes) */}
                 {(isContextMode || !result.mode || result.mode === 'none') && (
                   <div className="space-y-6 border-t border-slate-100 pt-6 mt-auto">
                      
                      {/* Detected Items */}
                      <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detected Items</span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded-full">(Tap to Simulate)</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(result as DefaultAnalysisResult).detected_foods.map((food, i) => (
                              <button
                                key={i}
                                onClick={() => handleSimulate(food.text)}
                                disabled={!!simulatingItem}
                                className={`
                                  group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all border
                                  ${simulatingItem === food.text 
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 ring-2 ring-emerald-500 ring-offset-1' 
                                    : 'bg-emerald-50/50 text-emerald-900 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200'}
                                `}
                              >
                                <span className="flex items-center gap-2 mr-3">
                                  {simulatingItem === food.text ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
                                  {food.text}
                                </span>
                                {/* Confidence Bars Decoration */}
                                <div className="flex items-end gap-0.5 h-3">
                                    <div className="w-1 h-1.5 bg-emerald-400 rounded-full"></div>
                                    <div className="w-1 h-2 bg-emerald-400 rounded-full"></div>
                                    <div className="w-1 h-3 bg-emerald-400 rounded-full"></div>
                                </div>
                              </button>
                            ))}
                          </div>
                       </div>

                       {/* Nutritional Flags */}
                       {(result as DefaultAnalysisResult).nutritional_risks && (result as DefaultAnalysisResult).nutritional_risks.length > 0 && (
                         <div className="space-y-3">
                            <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">Nutritional Flags</div>
                            <div className="flex flex-wrap gap-2">
                              {(result as DefaultAnalysisResult).nutritional_risks.map((risk, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium bg-amber-50 border border-amber-100 text-amber-900 cursor-default"
                                >
                                  <span className="flex items-center gap-2 mr-3">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                    {risk.text}
                                  </span>
                                  {/* Confidence Bars Decoration */}
                                  <div className="flex items-end gap-0.5 h-3 opacity-60">
                                      <div className="w-1 h-1.5 bg-amber-400 rounded-full"></div>
                                      <div className="w-1 h-2 bg-amber-400 rounded-full"></div>
                                      <div className="w-1 h-3 bg-amber-400 rounded-full"></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                         </div>
                       )}
                   </div>
                 )}
             </div>
          </div>
        </div>

        {/* --- DYNAMIC MODE RENDERER --- */}
        {'thinking_process' in result && <ThinkingProcess steps={result.thinking_process} />}
        
        {/* Render legacy views only if not using the new context flow */}
        {!isContextMode && result.mode === 'exam' && <ExamView data={result as ExamAnalysisResult} />}
        {!isContextMode && result.mode === 'meeting' && <MeetingView data={result as MeetingAnalysisResult} />}
        {!isContextMode && result.mode === 'workout' && <WorkoutView data={result as WorkoutAnalysisResult} />}
        
        {/* Render Default View for 'none', 'default', OR the new context modes */}
        {(isContextMode || !result.mode || result.mode === 'none') && renderDefaultView(result as DefaultAnalysisResult)}

      </div>

      {/* Footer Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-12">
        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-full transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export Report
        </button>

        <button 
          onClick={onReset}
          className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-xl transform active:scale-95 text-sm"
        >
          Analyze Another
        </button>
      </div>

      {/* --- MODALS (Only for Default/Context Mode) --- */}
      {/* Explanation Modal */}
      {explainingPoint && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 h-[100dvh] w-screen">
           <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-3xl transition-opacity" onClick={() => setExplainingPoint(null)} />
           <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative animate-in zoom-in-95 duration-300 z-10 m-auto">
              <div className="p-6 pb-2 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                 <div>
                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                       <Brain className="w-3 h-3" /> Quick Insight
                    </h3>
                    <h2 className="text-xl font-bold text-slate-900">
                       T+{explainingPoint.hour_offset}h Check
                    </h2>
                 </div>
                 <button onClick={() => setExplainingPoint(null)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-6 min-h-[160px]">
                 {isExplaining || !explanationResult ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-4">
                       <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                       <p className="text-sm font-medium text-slate-500 animate-pulse">Thinking...</p>
                    </div>
                 ) : (
                    <div className="space-y-5">
                       <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                          <p className="text-indigo-900 font-bold text-lg leading-tight text-center">"{explanationResult.insight}"</p>
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Why?</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{explanationResult.biological_reasoning}</p>
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Fix</h4>
                          <div className="flex items-center gap-3 text-sm font-medium text-slate-800 bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                             <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                             {explanationResult.practical_advice}
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>,
        document.body
      )}

      {/* Impact Simulation Modal */}
      {simulationResult && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 h-[100dvh] w-screen">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setSimulationResult(null)} />
          <div className="w-full max-w-lg bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/50 relative overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-300 mx-auto">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
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
            <div className="overflow-y-auto p-6 pt-4 relative z-10 custom-scrollbar">
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
                            {m.trend === 'increase' && <ArrowUpRight className="w-4 h-4 text-rose-400" />}
                            {m.trend === 'decrease' && <ArrowDownRight className="w-4 h-4 text-emerald-400" />}
                            {m.trend === 'neutral' && <Minus className="w-4 h-4 text-slate-400" />}
                            <span className={`text-sm font-bold ${m.trend === 'decrease' ? 'text-emerald-300' : m.trend === 'increase' ? 'text-rose-300' : 'text-slate-300'}`}>
                               {m.trend === 'neutral' ? 'Flat' : m.trend.charAt(0).toUpperCase() + m.trend.slice(1)}
                            </span>
                         </div>
                      </button>
                    );
                  })}
               </div>
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

    </div>
  );
};
