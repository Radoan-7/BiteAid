import React, { useRef, useState } from 'react';
import { Upload, Camera, Image as ImageIcon } from 'lucide-react';

interface UploadZoneProps {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected, isLoading }) => {
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

  return (
    <div 
      className={`
        relative group w-full max-w-lg mx-auto h-64 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden
        ${isDragOver ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'}
        ${isLoading ? 'pointer-events-none opacity-50' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept="image/*"
        onChange={handleChange}
      />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 p-4 bg-emerald-100 text-emerald-600 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
          <Camera className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          {isLoading ? 'Analyzing...' : 'Snap or Upload Meal'}
        </h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          {isLoading ? 'Consulting nutrition logic...' : 'Drag & drop a photo, or tap to browse your gallery.'}
        </p>
        
        {!isLoading && (
           <div className="mt-6 flex items-center gap-4 text-xs font-medium text-slate-400">
             <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3"/> JPG, PNG, WEBP</span>
           </div>
        )}
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
           <div className="flex flex-col items-center">
             <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3"></div>
           </div>
        </div>
      )}
    </div>
  );
};