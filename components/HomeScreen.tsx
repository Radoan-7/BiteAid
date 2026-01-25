import React from 'react';
import { Camera, Utensils, ArrowRight, Heart } from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (mode: 'eat-now' | 'canteen') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-3xl pointer-events-none mix-blend-multiply opacity-70"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl pointer-events-none mix-blend-multiply opacity-70"></div>

      <div className="w-full max-w-md space-y-12 relative z-10 animate-in fade-in zoom-in duration-700">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="bg-emerald-100 p-2.5 rounded-xl shadow-sm border border-emerald-200/50">
              <Heart className="w-6 h-6 text-emerald-600" fill="currentColor" fillOpacity={0.2} />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">BiteAid</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Choose your path</h1>
          <p className="text-slate-600">Your privacy-first AI food companion.</p>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          
          {/* Eat Now Card */}
          <button 
            onClick={() => onNavigate('eat-now')}
            className="w-full group bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all text-left flex items-center gap-5 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            
            <div className="relative w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner border border-emerald-100/50">
              <Camera className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="relative flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">Eat Now, Fix Later</h3>
              <p className="text-sm text-slate-500 leading-snug">Analyze your meal and get instant harm-reduction tips.</p>
            </div>
            <ArrowRight className="relative w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Today's Bite Card (formerly Canteen Picker) */}
          <button 
            onClick={() => onNavigate('canteen')}
            className="w-full group bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-left flex items-center gap-5 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

            <div className="relative w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner border border-blue-100/50">
              <Utensils className="w-8 h-8 text-blue-600" />
            </div>
            <div className="relative flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">Today’s Bite</h3>
              <p className="text-sm text-slate-500 leading-snug">One smart pick. Zero overthinking.</p>
            </div>
            <ArrowRight className="relative w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </button>

        </div>

        <p className="text-center text-xs text-slate-400 font-medium">Privacy First • No Data Stored</p>
      </div>
    </div>
  );
};