import React, { useRef, useState } from 'react';
import { TimelineCheckpoint } from '../types';
import { Zap, Brain, Leaf, MousePointerClick } from 'lucide-react';

interface AnalysisGraphProps {
  data: TimelineCheckpoint[];
  onPointClick: (point: TimelineCheckpoint) => void;
}

export const AnalysisGraph: React.FC<AnalysisGraphProps> = ({ data, onPointClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Graph Dimensions
  const width = 100; 
  const height = 65; 
  
  // Margins within the coordinate system
  const graphMarginX = 6; 
  const graphWidth = width - (graphMarginX * 2);

  // Dynamic X-Axis Scaling
  const maxHour = Math.max(6, ...data.map(d => d.hour_offset));
  const getX = (hour: number) => graphMarginX + (hour / maxHour) * graphWidth;
  
  // Y-Axis Configuration
  const topMargin = 18; 
  const bottomMargin = 8;
  const effectiveGraphHeight = height - topMargin - bottomMargin;
  
  const getY = (score: number) => topMargin + effectiveGraphHeight - (score / 100) * effectiveGraphHeight;

  const generatePath = (key: 'energy_score' | 'focus_score' | 'digestion_score') => {
    if (data.length === 0) return '';
    return 'M ' + data.map(p => `${getX(p.hour_offset)},${getY(p[key])}`).join(' L ');
  };

  const handleInteraction = (clientX: number) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // 1. Calculate relative X position (0 to 1) within the container
    let relativeX = (clientX - rect.left) / rect.width;
    
    // Clamp between 0 and 1 to prevent out-of-bounds errors
    relativeX = Math.max(0, Math.min(1, relativeX));

    // 2. Map this 0-1 ratio directly to the nearest data index
    // This creates "zones" so you don't have to hover exactly on the point.
    const index = Math.round(relativeX * (data.length - 1));

    setActiveIndex(index);
  };

  const activePoint = activeIndex !== null ? data[activeIndex] : null;

  // Smart Tooltip Positioning
  const getTooltipStyles = () => {
    if (activeIndex === null) return {};

    // Standard positioning
    let style: React.CSSProperties = { top: '55%' };
    let classes = "absolute z-30 bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 pointer-events-none transition-all duration-75";

    if (activeIndex === 0) {
      // First point: Align Left
      style.left = '0%';
      style.transform = 'translate(0, 0)'; // No centering
      classes += " ml-2"; // Tiny margin from edge
    } else if (activeIndex === data.length - 1) {
      // Last point: Align Right
      style.right = '0%';
      style.left = 'auto'; // Override default
      style.transform = 'translate(0, 0)';
      classes += " mr-2";
    } else {
      // Middle points: Center
      // Calculate exact percentage based on the SVG coordinate system
      const percent = (getX(data[activeIndex].hour_offset) / width) * 100;
      style.left = `${percent}%`;
      style.transform = 'translate(-50%, 0)';
    }

    return { style, classes };
  };

  const { style: tooltipStyle, classes: tooltipClasses } = getTooltipStyles();

  return (
    <div 
      ref={containerRef}
      // Removed overflow-hidden so tooltip can bleed out if necessary, relying on container clipping if needed
      className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm relative select-none cursor-crosshair group h-64 sm:h-72 touch-none"
      onMouseMove={(e) => handleInteraction(e.clientX)}
      onTouchMove={(e) => handleInteraction(e.touches[0].clientX)}
      onMouseLeave={() => setActiveIndex(null)}
      onClick={() => activePoint && onPointClick(activePoint)}
    >
      
      {/* Legend */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
         <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-amber-500 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-amber-100">
              <Zap className="w-3 h-3 fill-current" /> 
              <span className="text-[10px] font-bold uppercase tracking-wider">Energy</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-500 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-indigo-100">
              <Brain className="w-3 h-3 fill-current" /> 
              <span className="text-[10px] font-bold uppercase tracking-wider">Focus</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-500 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-emerald-100">
              <Leaf className="w-3 h-3 fill-current" /> 
              <span className="text-[10px] font-bold uppercase tracking-wider">Digestion</span>
            </div>
         </div>
         <div className="hidden sm:flex items-center gap-1 text-slate-400 text-[10px] font-medium bg-slate-50 px-2 py-1 rounded-full">
            <MousePointerClick className="w-3 h-3" /> Tap point to explain
         </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d">
        {/* Grid Lines */}
        <line x1={graphMarginX} y1={topMargin} x2={width-graphMarginX} y2={topMargin} stroke="#f1f5f9" strokeWidth="0.5" />
        <line x1={graphMarginX} y1={topMargin + effectiveGraphHeight/2} x2={width-graphMarginX} y2={topMargin + effectiveGraphHeight/2} stroke="#f1f5f9" strokeWidth="0.5" />
        <line x1={graphMarginX} y1={height-bottomMargin} x2={width-graphMarginX} y2={height-bottomMargin} stroke="#f1f5f9" strokeWidth="0.5" />

        {/* Lines */}
        <path d={generatePath('digestion_score')} fill="none" stroke="#10b981" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="opacity-30" />
        <path d={generatePath('focus_score')} fill="none" stroke="#6366f1" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="opacity-30" />
        <path d={generatePath('energy_score')} fill="none" stroke="#f59e0b" strokeWidth="2.375" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {data.map((p, i) => (
           <g key={i}>
              <circle cx={getX(p.hour_offset)} cy={getY(p.energy_score)} r={activeIndex === i ? 2 : 1} fill="#fff" stroke="#f59e0b" strokeWidth="0.5" />
           </g>
        ))}
        
        {/* Active Indicator Line */}
        {activePoint && (
           <line 
             x1={getX(activePoint.hour_offset)} 
             y1={topMargin} 
             x2={getX(activePoint.hour_offset)} 
             y2={height-bottomMargin} 
             stroke="#94a3b8" 
             strokeWidth="0.5" 
             strokeDasharray="1,1" 
           />
        )}
      </svg>

      {/* Active Point Tooltip Overlay */}
      {activePoint && (
         <div 
           className={tooltipClasses}
           style={tooltipStyle}
         >
            <div className="text-xs font-bold text-slate-400 mb-1">{activePoint.time_window}</div>
            <div className="text-sm font-bold whitespace-nowrap mb-2">{activePoint.feeling_indicators.join(', ')}</div>
            
            <div className="space-y-1 text-xs">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  <span className="text-slate-300">Energy:</span> 
                  <span className="font-mono">{activePoint.energy_score}</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  <span className="text-slate-300">Focus:</span> 
                  <span className="font-mono">{activePoint.focus_score}</span>
               </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-emerald-400 font-bold uppercase tracking-wide">
               Tap for explanation →
            </div>
         </div>
      )}

      {/* X Axis Labels */}
      <div className="absolute bottom-1 left-0 w-full flex justify-between px-[6%] text-[9px] text-slate-400 font-medium pointer-events-none">
         {data.map((p, i) => (
            <span key={i} style={{ left: `${(getX(p.hour_offset) / width) * 100}%`, transform: 'translateX(-50%)', position: 'absolute' }}>
               {p.hour_offset}h
            </span>
         ))}
      </div>
    </div>
  );
};
