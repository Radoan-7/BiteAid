import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Zap } from 'lucide-react';
import { analyzeLiveFrame } from '../services/geminiService';
import { CanteenGoal, ScannedItem, ConfidenceLevel } from '../types';

interface LiveScanViewProps {
  goal: CanteenGoal;
  onDone: (items: ScannedItem[]) => void;
  onCancel: () => void;
}

// Minimal Confidence Indicator for the raw UI
const MinimalConfidence: React.FC<{ level?: ConfidenceLevel }> = ({ level = 'Medium' }) => {
  const color = level === 'High' ? 'text-emerald-400' : level === 'Medium' ? 'text-amber-400' : 'text-slate-400';
  const val = level === 'High' ? 'HI' : level === 'Medium' ? 'MED' : 'LO';
  return <span className={`text-[10px] font-bold ${color} ml-2 tracking-tighter`}>[{val}]</span>;
}

export const LiveScanView: React.FC<LiveScanViewProps> = ({ goal, onDone, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("INITIALIZING...");
  const [latestItem, setLatestItem] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Ref to track if an API call is currently in progress
  const isAnalyzingFrame = useRef(false);

  // Buffer for items to avoid duplicates in the UI
  const itemsMapRef = useRef<Map<string, ScannedItem>>(new Map());

  // --- CAMERA SETUP ---
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
             setHasPermission(true);
             setFeedback("READY TO SCAN");
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // --- SCANNING LOGIC ---
  const captureAndAnalyze = useCallback(async (): Promise<boolean> => {
    if (isAnalyzingFrame.current) return false;
    if (!videoRef.current || !canvasRef.current) return false;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState !== video.HAVE_ENOUGH_DATA || !ctx) return false;
    
    // Sync dimensions
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Capture
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

    // Analyze
    isAnalyzingFrame.current = true;
    setFeedback("SCANNING...");
    
    let isRateLimited = false;

    try {
      const result = await analyzeLiveFrame(base64Image, goal);
      
      if (result.feedback_message.includes("Cooling down") || result.feedback_message.includes("Rate Limit")) {
          setFeedback("COOLING DOWN...");
          isRateLimited = true;
      } else if (result.items.length > 0) {
        const newest = result.items[0].name;
        setLatestItem(newest);
        setFeedback(`FOUND: ${newest.toUpperCase()}`);
      } else {
        setFeedback("SEARCHING...");
      }
      
      if (result.detected_currency) setDetectedCurrency(result.detected_currency);

      result.items.forEach(newItem => {
        const key = newItem.name.toLowerCase().trim();
        const existing = itemsMapRef.current.get(key);
        
        if (existing) {
          itemsMapRef.current.set(key, {
            ...existing,
            seen_count: existing.seen_count + 1,
            price_estimate: newItem.price_estimate || existing.price_estimate,
            confidence: newItem.confidence || existing.confidence
          });
        } else {
          itemsMapRef.current.set(key, newItem);
        }
      });

      setItems(Array.from(itemsMapRef.current.values()));

    } catch (e) {
      console.error(e);
      setFeedback("RETRYING..."); 
    } finally {
      isAnalyzingFrame.current = false;
    }
    
    return isRateLimited;
  }, [goal]);

  // --- INTERVAL CONTROL ---
  useEffect(() => {
    if (!isScanning || !hasPermission) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const runLoop = async () => {
        const isRateLimited = await captureAndAnalyze();
        if (!isMounted) return;

        // Adaptive Backoff:
        // Normal: 4s interval
        // Rate Limited: 10s backoff
        const delay = isRateLimited ? 10000 : 4000;
        
        timeoutId = setTimeout(runLoop, delay);
    };

    // Initial start
    timeoutId = setTimeout(runLoop, 1000);

    return () => {
        isMounted = false;
        clearTimeout(timeoutId);
    };
  }, [isScanning, hasPermission, captureAndAnalyze]);

  const handleFinish = () => {
    setIsScanning(false);
    onDone(items);
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-6 text-center text-white font-mono">
        <div className="border border-white/20 p-6 max-w-sm">
          <h3 className="text-xl font-bold mb-4">CAMERA_ERROR</h3>
          <p className="mb-6 text-sm">ACCESS_DENIED. CHECK PERMISSIONS.</p>
          <button onClick={onCancel} className="w-full py-3 bg-white text-black font-bold">EXIT</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col font-mono">
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewport */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
          
          {/* Top Bar */}
          <div className="flex justify-between items-start z-10">
             <div className="bg-black/80 text-white px-2 py-1 text-[10px] border border-white/20">
                MODE: LIVE_SCAN // GOAL: {goal.toUpperCase()}
             </div>
             <button onClick={onCancel} className="pointer-events-auto p-2 bg-black/80 text-white hover:text-red-500 border border-white/20">
               <X className="w-5 h-5" />
             </button>
          </div>

          {/* Center Target Box */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className={`
                relative w-64 h-64 border-[1px] transition-all duration-200
                ${isAnalyzingFrame.current ? 'border-white animate-pulse' : latestItem ? 'border-emerald-500' : 'border-white/40'}
             `}>
                {/* Crosshairs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-2 bg-white/50"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[1px] h-2 bg-white/50"></div>
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-[1px] bg-white/50"></div>
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-[1px] bg-white/50"></div>

                {/* Status Text on Target */}
                <div className="absolute -top-6 left-0 text-xs font-bold text-white bg-black/50 px-1">
                   {feedback}
                </div>

                {/* Found Item Tag */}
                {latestItem && !isAnalyzingFrame.current && (
                   <div className="absolute -bottom-8 left-0 right-0 text-center">
                      <span className="bg-emerald-600 text-white text-xs px-2 py-1 font-bold tracking-wide shadow-lg">
                        DETECTED: {latestItem}
                      </span>
                   </div>
                )}
             </div>
          </div>

          {/* Bottom Controls & List */}
          <div className="mt-auto pointer-events-auto z-10 w-full max-w-md mx-auto">
             
             {/* Log List */}
             <div className="bg-black/80 border border-white/10 p-3 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center border-b border-white/20 pb-1 mb-2">
                   <span className="text-[10px] text-slate-400">ITEM_LOG ({items.length})</span>
                   {detectedCurrency && <span className="text-[10px] text-slate-400">CUR: {detectedCurrency}</span>}
                </div>
                {items.length === 0 ? (
                   <div className="text-center py-4 text-slate-600 text-xs">
                      > WAITING_FOR_INPUT...
                   </div>
                ) : (
                  <div className="space-y-1">
                    {items.slice().reverse().map((item) => (
                       <div key={item.id} className="flex items-center justify-between text-xs text-slate-200">
                          <div className="truncate flex-1">
                             <span className="text-emerald-500 mr-2">✓</span>
                             {item.name.toUpperCase()}
                             <MinimalConfidence level={item.confidence} />
                          </div>
                          <span className="ml-2 opacity-70">{item.price_estimate || '---'}</span>
                       </div>
                    ))}
                  </div>
                )}
             </div>

             {/* Action Buttons */}
             <div className="flex gap-2">
                <button 
                  onClick={() => captureAndAnalyze()}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-3 h-3" />
                  SCAN
                </button>
                <button 
                  onClick={handleFinish}
                  className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold active:scale-95 transition-all shadow-[0_0_15px_rgba(5,150,105,0.4)]"
                >
                  COMPLETE CHECK ({items.length})
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};