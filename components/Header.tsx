import React from 'react';
import { Heart, ShieldCheck, Home } from 'lucide-react';

interface HeaderProps {
  subtitle?: React.ReactNode;
  onHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ subtitle = "eat now, fix later", onHome }) => {
  return (
    <header className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div 
          className={`flex items-center gap-2 ${onHome ? 'cursor-pointer group' : ''}`} 
          onClick={onHome}
        >
          <div className="bg-emerald-100 p-2 rounded-xl group-hover:bg-emerald-200 transition-colors">
            <Heart className="w-6 h-6 text-emerald-600" fill="currentColor" fillOpacity={0.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">BiteAid</h1>
            <div className="text-xs text-slate-500 font-medium leading-tight">{subtitle}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {onHome && (
            <button 
              onClick={onHome}
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors md:hidden"
              aria-label="Go Home"
            >
              <Home className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold hidden sm:inline">No Data Stored</span>
            <span className="font-semibold sm:hidden">Private</span>
          </div>
        </div>
      </div>
    </header>
  );
};