
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  AnalysisResult, 
  SimulationResult, 
  DefaultAnalysisResult,
  ExamAnalysisResult,
  MeetingAnalysisResult,
  WorkoutAnalysisResult,
  TimelineCheckpoint
} from '../types';
import { simulateImpact } from '../services/geminiService';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Loader2, 
  X, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDown, 
  Brain,
  Zap,
  ChevronDown,
  ChevronUp,
  XCircle,
  Briefcase,
  Dumbbell,
  Clock,
  Siren,
  Wind,
  Flame,
  BatteryCharging,
  Activity,
  ArrowRight,
  RefreshCw,
  Info
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

// --- TIMELINE WIDGET (REUSABLE) ---
const TimelineWidget: React.FC<{ timeline: TimelineCheckpoint[]; quickFix?: string }> = ({ timeline, quickFix }) => {
  const t0 = timeline?.[0]; 
  const t1 = timeline?.[1];
  const t2 = timeline?.[2];

  if (!t0 || !t1 || !t2) return null;

  return (
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
  );
};

// --- RICH CONTEXT COMPONENT: EXAM MODE ---
const ExamView: React.FC<{ data: ExamAnalysisResult }> = ({ data }) => {
  const isCritical = data.exam_collision_alert.risk_level === 'CRITICAL' || data.exam_collision_alert.risk_level === 'HIGH';
  
  // Simulated Graph Data for Exam Mode (Focus vs Energy)
  const graphData = [
    { hour: 0, focus: 80, energy: 90 },
    { hour: 0.5, focus: 85, energy: 85 },
    { hour: 1, focus: 90, energy: 70 },
    { hour: 1.5, focus: 75, energy: 60 },
    { hour: 2, focus: 60, energy: 50 }, // Crash point
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. HERO ALERT CARD */}
      <div className={`p-6 rounded-3xl border-2 shadow-lg relative overflow-hidden ${isCritical ? 'bg-rose-50 border-rose-200 shadow-rose-100' : 'bg-emerald-50 border-emerald-200 shadow-emerald-100'}`}>
         {/* Background Decoration */}
         <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 ${isCritical ? 'bg-rose-200' : 'bg-emerald-200'}`}></div>
         
         <div className="relative z-10">
             <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-2xl shadow-sm ${isCritical ? 'bg-white text-rose-600' : 'bg-white text-emerald-600'}`}>
                   {isCritical ? <Siren className="w-8 h-8 animate-pulse" /> : <CheckCircle2 className="w-8 h-8" />}
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${isCritical ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {data.exam_collision_alert.risk_level} RISK
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collision Detection</span>
                   </div>
                   <h2 className={`text-xl font-bold leading-tight ${isCritical ? 'text-rose-900' : 'text-emerald-900'}`}>
                     {data.exam_collision_alert.alert_message}
                   </h2>
                </div>
             </div>

             {/* Time Collision Timeline */}
             <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm border border-white/50 flex items-center justify-between gap-2">
                 <div className="text-center">
                    <span className="block text-xs font-bold text-slate-400 uppercase">Now</span>
                    <span className="block text-lg font-bold text-slate-700">Meal</span>
                 </div>
                 <div className="flex-1 h-1 bg-slate-200 rounded-full relative mx-2">
                    <div className={`absolute top-1/2 left-[70%] -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${isCritical ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                 </div>
                 <div className="text-center">
                    <span className="block text-xs font-bold text-rose-500 uppercase">Crash @</span>
                    <span className="block text-lg font-bold text-rose-600">{data.exam_collision_alert.predicted_crash_time}</span>
                 </div>
                 <div className="flex-1 h-1 bg-slate-200 rounded-full relative mx-2"></div>
                 <div className="text-center">
                    <span className="block text-xs font-bold text-indigo-500 uppercase">Exam</span>
                    <span className="block text-lg font-bold text-indigo-600">{data.exam_collision_alert.exam_time}</span>
                 </div>
             </div>
         </div>
      </div>

      {/* 2. COGNITIVE DASHBOARD */}
      <div className="grid grid-cols-2 gap-4">
         {/* Focus Gauge */}
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-start mb-2">
                <Brain className="w-5 h-5 text-indigo-500" />
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">BRAIN</span>
             </div>
             <div className="text-2xl font-bold text-slate-900 mb-1">Focus</div>
             <div className="text-sm font-medium text-slate-500 leading-tight">
               {data.cognitive_impact_summary.focus_impact}
             </div>
             {/* Tiny Graph */}
             <div className="mt-4 flex items-end gap-1 h-8">
                {graphData.map((d, i) => (
                   <div key={i} style={{ height: `${d.focus}%` }} className="flex-1 bg-indigo-100 rounded-t-sm relative group">
                      <div className="absolute bottom-0 w-full bg-indigo-500 transition-all" style={{ height: '100%', opacity: i/5 + 0.2 }}></div>
                   </div>
                ))}
             </div>
         </div>

         {/* Brain Fog Indicator */}
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-start mb-2">
                <Wind className="w-5 h-5 text-amber-500" />
                <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">CLARITY</span>
             </div>
             <div className="text-2xl font-bold text-slate-900 mb-1">Fog Risk</div>
             <div className="text-sm font-medium text-slate-500 leading-tight">
               {data.cognitive_impact_summary.brain_fog_risk}
             </div>
             <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-amber-400 w-[60%] rounded-full"></div>
             </div>
         </div>
      </div>

      {/* 3. STRATEGY TIMELINE (Enhanced) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
               <Clock className="w-5 h-5 text-blue-500" /> Exam Survival Strategy
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">2 HOUR PLAN</span>
         </div>
         <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-slate-100"></div>
            
            <div className="divide-y divide-slate-50">
               {data.exam_survival_strategy.map((item, i) => (
                  <div key={i} className="p-5 flex gap-5 relative group hover:bg-slate-50 transition-colors">
                     {/* Time Bubble */}
                     <div className="z-10 w-14 shrink-0 flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm mb-1 ${item.priority === 'CRITICAL' ? 'bg-rose-500' : 'bg-blue-400'}`}></div>
                        <span className="text-xs font-bold text-slate-400 font-mono">{item.time}</span>
                     </div>
                     
                     {/* Content */}
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                           {item.priority === 'CRITICAL' && <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded">MUST DO</span>}
                           <h4 className={`font-bold text-sm ${item.priority === 'CRITICAL' ? 'text-rose-900' : 'text-slate-900'}`}>{item.action}</h4>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{item.reasoning}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

// --- RICH CONTEXT COMPONENT: MEETING MODE ---
const MeetingView: React.FC<{ data: MeetingAnalysisResult }> = ({ data }) => {
  const readiness = data.professional_performance_alert.readiness_score;
  const isRisky = data.professional_performance_alert.risk_level !== 'OPTIMAL';

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. PROFESSIONAL SCORECARD */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/10 relative overflow-hidden">
         {/* Abstract BG */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
         
         <div className="relative z-10 flex items-center justify-between mb-8">
            <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Professional Readiness</h3>
               <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">{readiness}</span>
                  <span className="text-slate-500 font-medium">/100</span>
               </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${isRisky ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
               {data.professional_performance_alert.risk_level}
            </div>
         </div>

         {/* Concerns List */}
         <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/10">
            {data.professional_performance_alert.main_concerns.map((concern, i) => (
               <div key={i} className="flex items-center gap-3 text-sm text-slate-200">
                  <div className="p-1 rounded bg-amber-500/20 text-amber-400">
                     <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  {concern}
               </div>
            ))}
         </div>
      </div>

      {/* 2. SOCIAL VITALS GRID */}
      <div className="grid grid-cols-3 gap-3">
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-2 bg-blue-50 text-blue-500 rounded-xl mb-2">
               <Wind className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Breath</div>
            <div className="font-bold text-slate-800 text-sm leading-tight">{data.social_performance_metrics.breath_freshness}</div>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-2 bg-purple-50 text-purple-500 rounded-xl mb-2">
               <Activity className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bloating</div>
            <div className="font-bold text-slate-800 text-sm leading-tight">{data.social_performance_metrics.bloating_risk}</div>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-2 bg-orange-50 text-orange-500 rounded-xl mb-2">
               <BatteryCharging className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Energy</div>
            <div className="font-bold text-slate-800 text-sm leading-tight">{data.social_performance_metrics.visible_fatigue}</div>
         </div>
      </div>

      {/* 3. RESCUE PLAN TIMELINE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" /> Image Rescue Plan
         </div>
         <div className="relative p-5">
             {/* Dashed Line */}
             <div className="absolute left-[29px] top-6 bottom-6 w-0.5 border-l-2 border-dashed border-slate-200"></div>

             <div className="space-y-6">
                {data.professional_image_rescue.map((step, i) => (
                   <div key={i} className="flex gap-4 relative">
                      {/* Dot */}
                      <div className="z-10 w-2.5 h-2.5 mt-1.5 rounded-full bg-blue-500 border-2 border-white shadow-sm shrink-0 ml-[18px]"></div>
                      
                      <div className="flex-1">
                         <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-slate-900 text-sm">{step.action}</h4>
                            <span className="text-xs font-mono font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">{step.time}</span>
                         </div>
                         <p className="text-xs text-slate-500">{step.impact}</p>
                      </div>
                   </div>
                ))}
             </div>
         </div>
      </div>
    </div>
  );
};

// --- RICH CONTEXT COMPONENT: WORKOUT MODE ---
const WorkoutView: React.FC<{ data: WorkoutAnalysisResult }> = ({ data }) => {
  const readiness = data.workout_readiness_assessment.readiness_score;
  const color = readiness >= 8 ? 'text-emerald-500' : readiness >= 5 ? 'text-amber-500' : 'text-rose-500';
  const strokeColor = readiness >= 8 ? '#10b981' : readiness >= 5 ? '#f59e0b' : '#f43f5e';
  
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
       {/* 1. READINESS METER */}
       <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex items-center gap-8 relative overflow-hidden">
          {/* Decorative BG */}
          <div className="absolute right-0 top-0 w-32 h-full bg-slate-50 skew-x-12 -mr-8"></div>

          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
             <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="42" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="48" cy="48" r="42" 
                  stroke={strokeColor} 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={`${readiness * 26.4} 264`} 
                  strokeLinecap="round"
                />
             </svg>
             <div className="absolute flex flex-col items-center">
                <span className={`text-3xl font-black ${color}`}>{readiness}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">SCORE</span>
             </div>
          </div>
          
          <div className="relative z-10 flex-1">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Analysis
                </span>
             </div>
             <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2">
               {data.workout_readiness_assessment.main_issue}
             </h3>
             <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                <Clock className="w-4 h-4 text-slate-400" />
                Verdict: <span className="text-slate-900 font-bold">{data.workout_readiness_assessment.fuel_timing_verdict}</span>
             </div>
          </div>
       </div>

       {/* 2. FUEL GAUGE CARD */}
       <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-slate-900/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="flex items-center gap-2 mb-6 text-emerald-400">
             <Flame className="w-5 h-5 fill-emerald-500/20" />
             <span className="text-xs font-bold uppercase tracking-widest">Fuel Tank Analysis</span>
          </div>

          <div className="grid grid-cols-2 gap-8 relative z-10">
             <div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Carb Availability</span>
                <div className="text-lg font-bold text-white mb-1">{data.energy_availability_window.carb_availability}</div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[70%] rounded-full"></div>
                </div>
             </div>
             <div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Digestion Status</span>
                <div className="text-lg font-bold text-white mb-1">{data.energy_availability_window.fat_digestion_status}</div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-amber-500 w-[40%] rounded-full"></div>
                </div>
             </div>
          </div>
       </div>

       {/* 3. OPTIMIZATION STRATEGY */}
       <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
          
          <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
             <Dumbbell className="w-5 h-5 text-emerald-500" /> Performance Optimization
          </h3>
          
          <div className="space-y-4">
             <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-sm">1</div>
                <div>
                   <h4 className="font-bold text-slate-800 text-sm mb-1">Best Strategy</h4>
                   <p className="text-sm text-slate-600 leading-relaxed">{data.performance_optimization.best_option}</p>
                </div>
             </div>
             
             {data.performance_optimization.intensity_adjustment && (
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 font-bold text-sm">2</div>
                   <div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">Intensity Check</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{data.performance_optimization.intensity_adjustment}</p>
                   </div>
                </div>
             )}
          </div>
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
  
  // -- NEW STATE FOR TABBED SIMULATION MODAL --
  const [activeTab, setActiveTab] = useState<'impact' | 'explanation' | 'swap'>('impact');

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
    setActiveTab('impact');
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

  // Helper to get Badge Text
  const getBadgeText = (res: AnalysisResult) => {
    // 1. Prefer Context Summary from AI (New Flow)
    if ('context_summary' in res && res.context_summary) {
       const { mode, icon, title } = res.context_summary;
       if (mode !== 'default') {
          return `${icon} ${title}`;
       }
    }
    
    // 2. Fallback for Legacy Modes or Default
    switch (res.mode) {
      case 'exam': return "📚 EXAM FOCUS";
      case 'latenight': return "🌙 LATE NIGHT";
      case 'workout': return "💪 PRE-WORKOUT";
      case 'meeting': return "💼 MEETING PREP";
      default: return "ANALYSIS COMPLETE";
    }
  };

  // --- RENDER DEFAULT VIEW (Updated Logic) ---
  const renderDefaultView = (data: DefaultAnalysisResult) => {
    return (
      <div className="space-y-6">
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
      </div>
    );
  };

  // Determine if we should use the legacy special views (hardcoded types) or the unified default view
  // The new context flow uses DefaultAnalysisResult structure but with specific modes.
  // The existing hardcoded components (ExamView, MeetingView) expect strict types.
  // We will prioritize the new Default-based structure if the fields match, falling back to legacy if necessary.
  
  const isContextMode = result.mode && ['exam', 'latenight', 'workout', 'meeting', 'default'].includes(result.mode) && 'detected_foods' in result;
  
  // Safe Access to Timeline (which is present in all schemas implicitly)
  // @ts-ignore
  const timelineData: TimelineCheckpoint[] = result.after_effect_timeline || [];
  // @ts-ignore
  const quickFixData = (result as DefaultAnalysisResult).actionable_guidance?.consider_balancing?.[0]?.text;

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
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow-sm">
                       {getBadgeText(result)}
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

        {/* --- GLOBAL TIMELINE (Added for ALL modes) --- */}
        {timelineData.length > 0 && (
            <TimelineWidget timeline={timelineData} quickFix={quickFixData} />
        )}

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

      {/* REVERTED TABBED SIMULATION MODAL */}
      {simulationResult && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSimulationResult(null)} />
          
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-6 pb-2 shrink-0">
               <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulation</span>
                  <button onClick={() => setSimulationResult(null)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                     <X className="w-5 h-5 text-slate-400" />
                  </button>
               </div>
               <h2 className="text-xl font-bold text-slate-900">{simulationResult.title}</h2>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-slate-100 flex gap-6 shrink-0">
               {(['impact', 'explanation', 'swap'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-bold capitalize transition-colors relative ${activeTab === tab ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full"></div>}
                  </button>
               ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-[200px]">
               {activeTab === 'impact' && (
                  <div className="space-y-4">
                     {simulationResult.metrics.map((metric, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-700 text-sm">{metric.label}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${metric.trend === 'decrease' ? 'bg-emerald-100 text-emerald-700' : metric.trend === 'increase' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                                 {metric.trend.toUpperCase()}
                              </span>
                           </div>
                           <p className="text-sm font-medium text-slate-600">{metric.impact_analysis}</p>
                        </div>
                     ))}
                  </div>
               )}

               {activeTab === 'explanation' && (
                  <div className="space-y-4">
                     <p className="text-slate-600 leading-relaxed font-medium">
                        {simulationResult.explanation}
                     </p>
                     <div className="flex items-center gap-2 mt-4 text-xs font-bold text-slate-400">
                        <Info className="w-4 h-4" />
                        Confidence: {simulationResult.explanation_confidence}
                     </div>
                  </div>
               )}

               {activeTab === 'swap' && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                     <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-2xl">
                        🥗
                     </div>
                     <h3 className="font-bold text-emerald-900 mb-2">Smart Swap</h3>
                     <p className="text-emerald-800 leading-relaxed">
                        {simulationResult.swap_suggestion}
                     </p>
                  </div>
               )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
               <button onClick={() => setSimulationResult(null)} className="px-5 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-xl transition-colors">
                  Close
               </button>
               <button onClick={() => setSimulationResult(null)} className="px-5 py-2.5 bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 rounded-xl transition-colors shadow-lg shadow-slate-900/10">
                  Got it
               </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
