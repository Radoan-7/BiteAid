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
  const height = 65; // Increased height to allow more vertical spacing
  const paddingX = 0; 
  
  // Margins within the coordinate system
  const graphMarginX = 6; 
  const graphWidth = width - (graphMarginX * 2);

  const maxHour = 6;
  const getX = (hour: number) => graphMarginX + (hour / maxHour) * graphWidth;
  
  // Y-Axis Configuration
  // Increased topMargin to 18 to ensure badges (absolute positioned) don't overlap the graph lines on mobile
  const topMargin = 18; 
  const bottomMargin = 8;
  const effectiveGraphHeight = height - topMargin - bottomMargin;
  
  const getY = (score: number) => topMargin + effectiveGraphHeight - (score / 100) * effectiveGraphHeight;

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
      {/* Moved to top-2 to utilize space better */}
      <div className="absolute top-2 left-0 w-full px-4 sm:px-6 flex justify-between items-start pointer-events-none z-10">
         <div className="flex flex-wrap gap-2 sm:gap-4 max-w-[70%]">
            <div className="flex items-center gap-1.5 text-amber-500 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-amber-100">
              <Zap className="w-3 h-3 fill-current" /> 
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Energy</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-500 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-indigo-100">
              <Brain className="w-3 h-3 fill-current" /> 
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Focus</span>
            </div>
            <div className="flex items-