import React, { useRef, useState } from 'react';
import { AnalysisResult } from '../types';
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
  Loader2
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

export const AnalysisView: React.FC<AnalysisViewProps> = ({ result, imagePreview, onReset }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      // Small delay to ensure any layout shifts are settled
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Improve quality
        useCORS: true, // Handle cross-origin images if necessary
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // If content is longer than one page, add more pages
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
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Report Container - This is what gets printed to PDF */}
      <div ref={reportRef} className="space-y-6 p-4 bg-slate-50 rounded-xl">
        {/* Top Section: Image & Summary */}
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
                <h2 className="text-xl font-bold text-slate-900 mb-2">Analysis Complete</h2>
                <p className="text-slate-600 italic">"{result.brief_supportive_comment}"</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detected Items</h3>
                <div className="flex flex-wrap gap-2">
                  {result.detected_foods.map((food, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-sm font-medium">
                      {food}
                    </span>
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
                        {risk}
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
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 hover:border-emerald-200 transition-colors animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
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
                  <span>{item}</span>
                </li>
              ))}
              {result.actionable_guidance.do_this.length === 0 && (
                <li className="text-sm text-slate-400 italic">No specific actions needed.</li>
              )}
            </ul>
          </div>

          {/* AVOID THIS */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100 hover:border-rose-200 transition-colors animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
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
                  <span>{item}</span>
                </li>
              ))}
              {result.actionable_guidance.avoid_this.length === 0 && (
                <li className="text-sm text-slate-400 italic">Looks good as is!</li>
              )}
            </ul>
          </div>

          {/* BALANCE */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 hover:border-indigo-200 transition-colors animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
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
                  <span>{item}</span>
                </li>
              ))}
              {result.actionable_guidance.consider_balancing.length === 0 && (
                <li className="text-sm text-slate-400 italic">Meal is well balanced.</li>
              )}
            </ul>
          </div>
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