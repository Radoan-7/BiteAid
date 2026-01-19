import React, { useRef, useState } from 'react';
import { AnalysisResult } from '../types';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Download,
  Loader2,
  Clock,
  Moon,
  UtensilsCrossed,
  Activity,
  Layers
} from 'lucide-react';

interface AnalysisViewProps {
  result: AnalysisResult;
  imagePreview: string | null;
  onReset: () => void;
}

// Helper to determine styling based on impact level
const getImpactStyles = (level: string) => {
  switch(level) {
    case 'Low':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-900',
        accent: 'text-emerald-600',
        icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      };
    case 'Moderate':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-900',
        accent: 'text-amber-600',
        icon: <Info className="w-8 h-8 text-amber-500" />
      };
    case 'High':
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-900',
        accent: 'text-rose-600',
        icon: <Activity className="w-8 h-8 text-rose-500" />
      };
    default:
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-900',
        accent: 'text-slate-600',
        icon: <Info className="w-8 h-8 text-slate-500" />
      };
  }
};

export const AnalysisView: React.FC<AnalysisViewProps> = ({ result, imagePreview, onReset }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const impactStyle = getImpactStyles(result.health_impact_level);

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
      alert("Could not generate PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Report Container */}
      <div ref={reportRef} className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        {/* 1. Health Signal Card (Top) */}
        <div className={`flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl border-2 ${impactStyle.bg} ${impactStyle.border} mb-8`}>
          <div className="shrink-0 p-4 bg-white rounded-full shadow-sm">
            {impactStyle.icon}
          </div>
          <div className="flex-grow text-center md:text-left">
            <div className="uppercase tracking-wider text-xs font-bold mb-1 opacity-70 text-slate-600">
              Overall Health Signal
            </div>
            <h2 className={`text-3xl font-bold ${impactStyle.text} mb-1`}>
              {result.health_impact_level} Impact
            </h2>
            <p className={`text-lg font-medium ${impactStyle.accent}`}>
              {result.main_concern_summary}
            </p>
          </div>
          {imagePreview && (
            <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 border-white shadow-sm">
              <img src={imagePreview} alt="Meal" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* 2. Intelligent Breakdown Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          
          {/* Left: Food Components */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wide">
              <Layers className="w-4 h-4" /> Detected Components
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-500 mb-1 block pl-1">Primary</span>
                <div className="flex flex-wrap gap-2">
                  {result.detected_foods.primary_items.map((item, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-sm font-semibold border border-slate-200">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              {result.detected_foods.secondary_ingredients.length > 0 && (
                <div>
                   <span className="text-xs font-semibold text-slate-400 mb-1 block pl-1">Secondary / Sides</span>
                   <div className="flex flex-wrap gap-2">
                    {result.detected_foods.secondary_ingredients.map((item, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-50 text-slate-500 rounded-md text-xs font-medium border border-slate-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Risk Radar */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wide">
              <Activity className="w-4 h-4" /> Risk Factors
            </h3>
            <div className="space-y-2">
              {result.nutritional_risks.length === 0 ? (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4"/> No significant risks detected.
                </div>
              ) : (
                result.nutritional_risks.map((risk, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${risk.severity === 'high' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                    <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${risk.severity === 'high' ? 'text-amber-500' : 'text-slate-400'}`} />
                    <div>
                      <div className={`text-sm font-bold ${risk.severity === 'high' ? 'text-amber-900' : 'text-slate-700'}`}>
                        {risk.name}
                      </div>
                      <div className="text-xs text-slate-500 leading-relaxed">
                        {risk.explanation}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 3. The Smart Plan (Time-Based) */}
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            Harm Reduction Plan
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connecting Line (Desktop Only) */}
            <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-slate-100 -z-10"></div>

            {/* Column 1: Right Now */}
            <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
              <div className="w-12 h-12 bg-white border-2 border-emerald-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm z-10 relative group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-emerald-500" />
              </div>
              <h4 className="font-bold text-slate-900 mb-3">Right Now</h4>
              <ul className="space-y-4">
                {result.actionable_guidance.right_now.map((item, i) => (
                  <li key={i} className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <p className="font-semibold text-slate-800 text-sm mb-1">{item.action}</p>
                    <p className="text-xs text-emerald-700 leading-snug opacity-80">
                      Why: {item.why_it_helps}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Later Today */}
            <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
              <div className="w-12 h-12 bg-white border-2 border-indigo-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm z-10 relative group-hover:scale-110 transition-transform">
                <Moon className="w-6 h-6 text-indigo-500" />
              </div>
              <h4 className="font-bold text-slate-900 mb-3">Later Today</h4>
               <ul className="space-y-4">
                {result.actionable_guidance.later_today.map((item, i) => (
                  <li key={i} className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <p className="font-semibold text-slate-800 text-sm mb-1">{item.action}</p>
                    <p className="text-xs text-indigo-700 leading-snug opacity-80">
                      Why: {item.why_it_helps}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Next Meal */}
            <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
              <div className="w-12 h-12 bg-white border-2 border-purple-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm z-10 relative group-hover:scale-110 transition-transform">
                <UtensilsCrossed className="w-6 h-6 text-purple-500" />
              </div>
              <h4 className="font-bold text-slate-900 mb-3">Next Meal</h4>
               <ul className="space-y-4">
                {result.actionable_guidance.next_meal.map((item, i) => (
                  <li key={i} className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                    <p className="font-semibold text-slate-800 text-sm mb-1">{item.action}</p>
                    <p className="text-xs text-purple-700 leading-snug opacity-80">
                      Why: {item.why_it_helps}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 italic text-sm">"{result.brief_supportive_comment}"</p>
        </div>
      </div>

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

    </div>
  );
};