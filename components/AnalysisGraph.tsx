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
  const height = 55;
  const paddingX = 0; // Edge to edge horizontally
  const paddingY = 12; // Room for labels at bottom/top
  
  // Margins within the coordinate system
  const graphMarginX = 6; 
  const graphWidth = width - (graphMarginX * 2);
  const graphHeight = height - paddingY; // Use more vertical space

  const maxHour = 6;
  const getX = (hour: number) => graphMarginX + (hour / maxHour) * graphWidth;
  // Invert Y: 0 score is bottom, 100 score is top
  // Top margin is (paddingY/2), bottom margin is (paddingY/2)
  const topMargin = 8;
  const effectiveGraphHeight = height - paddingY - 4; // Minus some extra for text
  const getY = (score: number) => topMargin + effectiveGraphHeight - (score / 100) * effectiveGraphHeight;

  // Generate Smooth Path (Catmull-Rom or simple Line)
  // Using simple Line with round join for robustness
  const generatePath = (key: 'energy_score' | 'focus_score' | 'digestion_score') => {
    if (data.length === 0) return '';
    return 'M ' + data.map(p => `${getX(p.hour_offset)},${getY(p[key])}`).join(' L ');
  };

  const handleInteraction = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const svgX = (x / rect.width) * width;

    // Find nearest point
    let minDist = Infinity;
    let nearestIdx = 0;

    data.forEach((p, i) => {
      const px = getX(p.hour_offset);
      const dist = Math.abs(svgX - px);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    });

    setActiveIndex(nearestIdx);
  };

  const activePoint = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div 
      ref={containerRef}
      className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm relative select-none overflow-hidden cursor-crosshair group"
      onMouseMove={(e) => handleInteraction(e.clientX)}
      onTouchMove={(e) => handleInteraction(e.touches[0].clientX)}
      onMouseLeave={() => setActiveIndex(null)}
      onClick={() => activePoint && onPointClick(activePoint)}
    >
      
      {/* Header / Legend Overlay */}
      <div className="absolute top-4 left-0 w-full px-6 flex justify-between items-center pointer-events-none z-10">
         <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-amber-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-amber-100">
              <Zap className="w-3 h-3 fill-current" /> 
              <span className="text-[10px] font-bold uppercase tracking-wider">Energy</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-indigo-100">
              <Brain className="w-3 h-3 fill-current" /> 
              <span className="text-[10px] font-bold uppercase tracking-wider">Focus</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-emerald-100">
              <Leaf className="w-3 h-3 fill-current" /> 
              <span className="text-[10px] font-bold uppercase tracking-wider">Digestion</span>
            </div>
         </div>

         {/* Hint Text - Moved to Top Right */}
         {activeIndex === null && (
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-100 shadow-sm animate-pulse">
               Tap graph to analyze
            </div>
         )}
      </div>

      <div className="relative w-full aspect-[16/9] sm:aspect-[2/1]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full block">
          
          <defs>
             {/* Glow Filters */}
             <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
               <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#f59e0b" floodOpacity="0.4" />
             </filter>
             <filter id="glow-indigo" x="-50%" y="-50%" width="200%" height="200%">
               <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#6366f1" floodOpacity="0.4" />
             </filter>
             <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
               <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#10b981" floodOpacity="0.4" />
             </filter>
          </defs>

          {/* Guidelines */}
          {[25, 50, 75].map(val => (
             <line 
               key={val} 
               x1={graphMarginX} 
               y1={getY(val)} 
               x2={width - graphMarginX} 
               y2={getY(val)} 
               stroke="#e2e8f0" 
               strokeWidth="0.2" 
               strokeDasharray="1 1"
             />
          ))}

          {/* Main Curves - Width reduced by ~5% (1.2 -> 1.14) */}
          <path d={generatePath('energy_score')} fill="none" stroke="#f59e0b" strokeWidth="1.14" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-amber)" className="transition-all duration-300" style={{ opacity: activeIndex !== null ? 0.4 : 1 }} />
          <path d={generatePath('focus_score')} fill="none" stroke="#6366f1" strokeWidth="1.14" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-indigo)" className="transition-all duration-300" style={{ opacity: activeIndex !== null ? 0.4 : 1 }} />
          <path d={generatePath('digestion_score')} fill="none" stroke="#10b981" strokeWidth="1.14" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-emerald)" className="transition-all duration-300" style={{ opacity: activeIndex !== null ? 0.4 : 1 }} />

          {/* Active State Highlight - Redraw active segments to be full opacity */}
          {activeIndex !== null && (
             <>
                {/* Vertical Cursor Line */}
                <line 
                  x1={getX(data[activeIndex].hour_offset)} 
                  y1={topMargin} 
                  x2={getX(data[activeIndex].hour_offset)} 
                  y2={height - 5} 
                  stroke="#94a3b8" 
                  strokeWidth="0.5" 
                  strokeDasharray="2 1"
                />

                {/* Highlighted Segments - Width reduced by ~5% (2 -> 1.9) */}
                <path d={generatePath('energy_score')} fill="none" stroke="#f59e0b" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                <path d={generatePath('focus_score')} fill="none" stroke="#6366f1" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                <path d={generatePath('digestion_score')} fill="none" stroke="#10b981" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />

                {/* Big Dots at Active Point */}
                <circle cx={getX(data[activeIndex].hour_offset)} cy={getY(data[activeIndex].energy_score)} r="2.5" className="fill-white stroke-amber-500 stroke-[2px]" />
                <circle cx={getX(data[activeIndex].hour_offset)} cy={getY(data[activeIndex].focus_score)} r="2.5" className="fill-white stroke-indigo-500 stroke-[2px]" />
                <circle cx={getX(data[activeIndex].hour_offset)} cy={getY(data[activeIndex].digestion_score)} r="2.5" className="fill-white stroke-emerald-500 stroke-[2px]" />
             </>
          )}

          {/* X Axis Labels */}
          {data.map((point, i) => (
             <text 
               key={i} 
               x={getX(point.hour_offset)} 
               y={height - 2} 
               textAnchor="middle" 
               className={`text-[3px] font-bold ${activeIndex === i ? 'fill-slate-800' : 'fill-slate-400'}`}
             >
               {point.hour_offset}h
             </text>
          ))}
        </svg>

        {/* Tooltip Card (Appears on Hover) */}
        {activePoint && (
           <div 
              className="absolute pointer-events-none flex flex-col items-center z-20"
              style={{ 
                 left: `${(getX(activePoint.hour_offset) / width) * 100}%`,
                 top: '15%',
                 transform: 'translateX(-50%)'
              }}
           >
              <div className="bg-slate-900/90 backdrop-blur text-white text-[10px] p-2 rounded-lg shadow-xl mb-2 min-w-[80px]">
                 <div className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-1 text-center">
                    T + {activePoint.hour_offset} hrs
                 </div>
                 <div className="space-y-1">
                    <div className="flex justify-between gap-3 text-amber-300"><span>Energy</span> <span>{activePoint.energy_score}</span></div>
                    <div className="flex justify-between gap-3 text-indigo-300"><span>Focus</span> <span>{activePoint.focus_score}</span></div>
                    <div className="flex justify-between gap-3 text-emerald-300"><span>Digestion</span> <span>{activePoint.digestion_score}</span></div>
                 </div>
                 <div className="mt-1.5 pt-1 border-t border-slate-700 text-center text-white font-bold flex items-center justify-center gap-1">
                    <MousePointerClick className="w-3 h-3" /> Tap for Why
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};