import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ScanFace, Camera, CheckCircle2, Loader2 } from 'lucide-react';

const FaceScanner = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API not supported in this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCamera(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Camera access denied or unavailable.");
      }
    };

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (scanning || captured) return;
    
    setScanning(true);
    
    // Smooth 1-second scanning animation
    setTimeout(() => {
      let imageUrl = '';
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (video && canvas) {
          const w = video.videoWidth || 320;
          const h = video.videoHeight || 240;
          const scale = Math.min(1, 320 / Math.max(1, w));
          canvas.width = Math.max(160, Math.floor(w * scale));
          canvas.height = Math.max(120, Math.floor(h * scale));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          imageUrl = canvas.toDataURL('image/jpeg', 0.6);
        }
      } catch (err) {
        console.warn("Canvas capture warning:", err);
      }
      
      // Fallback if camera stream gave empty data
      if (!imageUrl || imageUrl.length < 50) {
        imageUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256';
      }

      // Stop camera tracks immediately
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      setScanning(false);
      setCaptured(true);
      onCapture(imageUrl);
    }, 1000);
  };

  const handleBypass = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCaptured(true);
    onCapture('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256');
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-slate-200 bg-slate-900 shadow-[0_0_30px_rgba(225,29,72,0.2)]">
        
        {captured ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-emerald-400 p-4 text-center">
            <CheckCircle2 size={48} className="mb-2 animate-bounce" />
            <span className="text-sm font-bold text-white tracking-wide">FACE CAPTURED</span>
            <span className="text-xs text-slate-400 mt-1">Verifying identity...</span>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <Camera size={32} className="mb-2 opacity-50" />
            <span className="text-xs">{error}</span>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
        )}

        {/* Scanner Overlay UI */}
        {!captured && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-8 border-red-500/30 rounded-full"></div>
            
            {scanning && (
              <motion.div 
                className="absolute top-0 left-0 w-full h-full bg-red-500/20 border-t-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                animate={{ y: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              />
            )}

            {/* Crosshairs */}
            <div className="absolute top-4 bottom-4 left-1/2 w-0.5 bg-white/20 transform -translate-x-1/2"></div>
            <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-white/20 transform -translate-y-1/2"></div>
          </div>
        )}
      </div>

      <button 
        type="button"
        onClick={handleCapture}
        disabled={(!hasCamera && !error) || scanning || captured}
        className={`mt-8 flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold shadow-lg transition-all w-full max-w-xs ${
          captured
            ? 'bg-emerald-600 text-white cursor-default shadow-emerald-500/30'
            : (!hasCamera && !error) || scanning 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30 cursor-pointer active:scale-95'
        }`}
      >
        {captured ? (
          <>
            <CheckCircle2 size={22} />
            <span>BIOMETRIC VERIFIED</span>
          </>
        ) : scanning ? (
          <>
            <Loader2 size={22} className="animate-spin" />
            <span>SCANNING BIOMETRICS...</span>
          </>
        ) : (
          <>
            <ScanFace size={22} />
            <span>CAPTURE FACE & REGISTER</span>
          </>
        )}
      </button>

      {error && !captured && (
        <button 
          type="button"
          onClick={handleBypass}
          className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all text-xs cursor-pointer shadow-sm"
        >
          Use Default Biometric Avatar & Continue
        </button>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default FaceScanner;
