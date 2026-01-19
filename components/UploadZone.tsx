import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, ScanLine, X } from 'lucide-react';

interface UploadZoneProps {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
  onCancel?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected, isLoading, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndPass(e.target.files[0]);
    }
  };

  const validateAndPass = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    onImageSelected(file);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCancel) onCancel();
  };

  return (
    <div 
      className={`
        relative group w-full max-w-lg mx-auto h-64 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden
        ${isDragOver ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'}
        ${isLoading ? 'border-emerald-200 bg-emerald-50/10' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isLoading && fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept="image/*"
        onChange={handleChange}
      />
      
      {/* Idle State Content */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="mb-4 p-4 bg-emerald-100 text-emerald-600 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
          <Camera className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          Snap or Upload Meal
        </h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Drag & drop a photo, or tap to browse your gallery.
        </p>
        
        <div className="mt-6 flex items-center gap-4 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3"/> JPG, PNG, WEBP</span>
        </div>
      </div>

      {/* Loading/Processing State Content */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] z-10 animate-in fade-in duration-300 cursor-default">
           
           {/* Cancel Button */}
           <button 
             onClick={handleCancel}
             className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors z-20"
             title="Cancel Upload"
           >
             <X className="w-5 h-5" />
           </button>

           {/* Animated Icon */}
           <div className="relative mb-6">
             <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
             <div className="relative bg-white p-4 rounded-full shadow-sm border border-emerald-100">
                <ScanLine className="w-8 h-8 text-emerald-500 animate-pulse" />
             </div>
           </div>

           <h3 className="text-lg font-bold text-slate-800 mb-2">Analyzing Meal...</h3>
           
           {/* Indeterminate Progress Bar */}
           <div className="w-48 h-1.5 bg-emerald-100 rounded-full overflow-hidden relative">
             <div className="absolute inset-y-0 bg-emerald-500 h-full rounded-full animate-[progress-slide_1.5s_infinite_ease-in-out]"></div>
           </div>
           
           {/* Keyframes for the custom progress animation */}
           <style>{`
             @keyframes progress-slide {
               0% { left: -40%; width: 20%; }
               50% { left: 30%; width: 60%; }
               100% { left: 100%; width: 20%; }
             }
           `}</style>

           <p className="text-xs text-slate-500 mt-3 animate-pulse font-medium">Identifying nutrients & risks</p>
        </div>
      )}
    </div>
  );
};