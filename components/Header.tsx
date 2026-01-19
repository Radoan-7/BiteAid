import React from 'react';
import { Heart, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-2 rounded-xl">
            <Heart className="w-6 h-6 text-emerald-600" fill="currentColor" fillOpacity={0.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">BiteAid</h1>
            <p className="text-xs text-slate-500 font-medium">eat now, fix later</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-semibold">No Data Stored</span>
        </div>
      </div>
    </header>
  );
};