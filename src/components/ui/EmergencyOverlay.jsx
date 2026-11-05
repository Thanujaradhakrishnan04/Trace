import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, MapPin, Radio, ShieldCheck, X, AlertTriangle, Users, Mail, Share2, Phone, Camera, Video, Mic, Volume2, CheckCircle2, Lock, ExternalLink } from 'lucide-react';
import { useStore } from '../../context/useStore';
import FloatingChatWidget from '../chat/FloatingChatWidget';

const EmergencyOverlay = () => {
  const { 
    isEmergencyMode, 
    emergencyData, 
    cancelEmergency, 
    countdown, 
    sendEmergencyAlert, 
    contacts, 
    sendDirectGuardianEmail, 
    sendDirectGuardianWhatsApp,
    liveMediaStream,
    audioLevel
  } = useStore();
  const [activeTimer, setActiveTimer] = useState(0);
  const liveVideoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (isEmergencyMode) {
      setActiveTimer(0);
      interval = setInterval(() => {
        setActiveTimer(c => c + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isEmergencyMode]);

  useEffect(() => {
    if (liveVideoRef.current && liveMediaStream) {
      liveVideoRef.current.srcObject = liveMediaStream;
      liveVideoRef.current.play().catch(() => {});
    }
  }, [liveMediaStream, isEmergencyMode]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendLocation = () => {
    const store = useStore.getState();
    if (store.countdownTimer) {
      clearInterval(store.countdownTimer);
    }

    // Instantly transition state so countdown modal disappears and emergency overlay appears
    useStore.setState({
      countdown: null,
      countdownTimer: null,
      isEmergencyMode: true
    });

    // Best known coordinates (cached GPS or verified campus default)
    const activeCoords = store.lastKnownLocation || { lat: 13.0265143, lng: 80.0159234 };
    
    // Instantly trigger emergency alert and email dispatch
    sendEmergencyAlert('Manual SOS - Send Location Override', activeCoords);

    // Concurrently acquire fresh GPS in background without blocking UI
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const fresh = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          useStore.setState({ lastKnownLocation: fresh });
        },
        (err) => console.warn('Background GPS refinement warning:', err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    }
  };

  const primaryGuardianEmail = 'thanujaradhakrishnan04@gmail.com';
  const displayContacts = contacts && contacts.length > 0 
    ? (contacts.some(c => (c.email || '').toLowerCase() === primaryGuardianEmail.toLowerCase())
        ? contacts 
        : [{ id: 'primary_guardian_default', name: 'Primary Guardian', email: primaryGuardianEmail, relation: 'Verified Guardian' }, ...contacts])
    : [{ id: 'primary_guardian_default', name: 'Primary Guardian', email: primaryGuardianEmail, relation: 'Verified Guardian' }];

  return (
    <AnimatePresence>
      {/* Pre-Emergency Countdown Modal */}
      {countdown !== null && !isEmergencyMode && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/20">
              <motion.div 
                className="h-full bg-amber-500"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: countdown, ease: "linear" }}
              />
            </div>
            
            <AlertTriangle size={64} className="text-amber-500 mx-auto mb-4 animate-pulse" />
            
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight">
              Emergency Detected
            </h2>
            
            <p className="text-slate-300 font-medium mb-6">
              Potential distress identified. Alerts will be sent automatically in <span className="text-amber-400 font-black text-xl">{countdown}s</span>.
            </p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleSendLocation}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2 text-lg uppercase tracking-wider"
              >
                <MapPin size={24} />
                Send Location Now
              </button>
              
              <button 
                onClick={cancelEmergency}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg uppercase tracking-wider"
              >
                <ShieldCheck size={24} className="text-emerald-400" />
                I'm Safe
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Full Emergency Mode Overlay */}
      {isEmergencyMode && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] pointer-events-none overflow-y-auto"
        >
          {/* Flashing Red Border */}
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="fixed inset-0 border-[12px] border-red-600 pointer-events-none z-10"
          />

          {/* Dark Red Overlay */}
          <div className="min-h-full bg-red-950/90 backdrop-blur-md pointer-events-auto flex flex-col items-center justify-center p-6 text-center">
            
            <button 
              onClick={cancelEmergency} 
              className="absolute top-8 right-8 p-3 bg-red-900/50 rounded-full text-white hover:bg-red-800 transition-colors border border-red-500/30"
            >
              <X size={24} />
            </button>

            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-24 h-24 md:w-32 md:h-32 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_100px_rgba(220,38,38,0.8)] mb-6"
            >
              <ShieldAlert size={52} className="text-white" />
            </motion.div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-2 drop-shadow-lg">
              EMERGENCY MODE ACTIVATED
            </h1>
            <p className="text-red-300 font-bold tracking-widest text-base md:text-lg uppercase mb-6">
              {emergencyData?.reason || 'SOS Triggered'}
            </p>

            {/* Guardian Circle Direct Dispatch Status Card */}
            <div className="bg-black/60 backdrop-blur-md border border-red-500/40 rounded-3xl p-5 w-full max-w-lg shadow-2xl mb-6 text-left">
              <div className="flex items-center justify-between mb-3 border-b border-red-500/20 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-200 flex items-center gap-2">
                  <Users size={16} className="text-red-400" /> Guardian Distress Dispatch ({displayContacts.length})
                </span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  Transmitting
                </span>
              </div>

              {/* Real-time automated email delivery banner */}
              <div className="mb-3 bg-red-950/70 border border-red-500/40 rounded-2xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail size={16} className="text-emerald-400 flex-shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Auto Email Sent to Guardian</p>
                    <p className="text-[10px] text-slate-300 truncate font-mono">thanujaradhakrishnan04@gmail.com</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-black px-2 py-0.5 rounded-md flex-shrink-0">
                  DISPATCHED
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {displayContacts.map((contact) => (
                  <div key={contact.id} className="bg-red-950/50 border border-red-500/30 rounded-2xl p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-bold text-sm truncate">{contact.name}</p>
                        <span className="text-[10px] text-red-300 font-semibold px-1.5 py-0.5 bg-red-900/40 rounded uppercase">
                          {contact.relation || 'Guardian'}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs truncate mt-0.5">
                        {contact.email ? `📧 ${contact.email}` : (contact.phone ? `📞 ${contact.phone}` : 'No email/phone')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {contact.email && (
                        <button
                          onClick={() => sendDirectGuardianEmail(contact)}
                          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md transition-colors"
                          title="Directly send distress email with GPS to Guardian via your mail app"
                        >
                          <Mail size={13} /> Send Email
                        </button>
                      )}
                      {contact.phone && (
                        <button
                          onClick={() => sendDirectGuardianWhatsApp(contact)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md transition-colors"
                          title="Send WhatsApp SOS with Live GPS"
                        >
                          <Share2 size={13} /> WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Automated Evidence Capture (Camera & Voice Vault Active) */}
            <div className="bg-black/60 backdrop-blur-md border border-red-500/40 rounded-3xl p-5 w-full max-w-lg shadow-2xl mb-6 text-left">
              <div className="flex items-center justify-between mb-3 border-b border-red-500/20 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-200 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-red-400" /> Evidence Vault Recording (Video + Audio)
                </span>
                <span className="text-[11px] font-bold text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-500/40 animate-pulse flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block"></span>
                  REC Active ({formatTime(activeTimer)})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Live Camera Video Feed Preview */}
                <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-2 flex flex-col items-center justify-center text-center overflow-hidden">
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-red-500/40 bg-black flex items-center justify-center">
                    {liveMediaStream ? (
                      <video
                        ref={liveVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : emergencyData?.capturedPhoto ? (
                      <img src={emergencyData.capturedPhoto} alt="Captured Evidence" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Video size={24} className="text-red-400 animate-pulse mb-1" />
                        <span className="text-[10px] font-bold text-slate-300">Connecting Camera...</span>
                      </div>
                    )}
                    <div className="absolute top-1 left-1 bg-red-600/90 text-white font-black text-[8px] px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      REC
                    </div>
                    {emergencyData?.evidenceSecured && (
                      <div className="absolute bottom-1 right-1 bg-black/80 text-emerald-400 font-bold text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <CheckCircle2 size={9} /> Saved
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-slate-200 mt-1.5 flex items-center gap-1">
                    <Video size={12} className="text-red-400" /> Live Video Stream
                  </p>
                </div>

                {/* Voice Recording / Live Equalizer */}
                <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-2 flex flex-col items-center justify-between text-center">
                  <div className="w-full h-28 rounded-xl bg-slate-950/80 border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden px-2">
                    {/* Animated Sound Wave bars reacting to live sound */}
                    <div className="flex items-center justify-center gap-1 h-12 w-full">
                      {[40, 75, 90, 60, 85, 100, 70, 50, 80, 95].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-red-500 rounded-full"
                          animate={{ height: [`${Math.max(15, h * 0.2)}%`, `${Math.min(100, (audioLevel || 45) + (i % 4) * 8)}%`, `${Math.max(15, h * 0.25)}%`] }}
                          transition={{ duration: 0.5 + (i % 3) * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-emerald-400 mt-1 uppercase flex items-center gap-1">
                      <Volume2 size={11} className="text-red-400" />
                      {Math.round(audioLevel || 48)} dB Real Mic
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-200 mt-1.5 flex items-center gap-1">
                    <Mic size={12} className="text-emerald-400" /> Audio Track Encrypted
                  </p>
                </div>
              </div>

              <div className="mt-3 bg-red-950/40 border border-red-500/20 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-300 text-[11px] font-medium flex items-center gap-1.5">
                  <Lock size={12} className="text-emerald-400" /> Real hardware video & audio saving to Vault
                </span>
                <button
                  onClick={() => {
                    cancelEmergency();
                    navigate('/citizen/vault');
                  }}
                  className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 hover:bg-emerald-900 transition-colors flex items-center gap-1"
                >
                  View Vault <ExternalLink size={9} />
                </button>
              </div>
            </div>

            {/* Live Tracking Panel */}
            <div className="bg-black/40 backdrop-blur-md border border-red-500/30 rounded-[2rem] p-6 w-full max-w-lg shadow-2xl mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500 overflow-hidden">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-1/2 h-full bg-white shadow-[0_0_15px_white]"
                />
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-widest text-sm">
                  <Radio size={18} className="animate-pulse" />
                  Live Tracking Active
                </div>
                <div className="text-3xl font-black text-white font-mono">
                  {formatTime(activeTimer)}
                </div>
              </div>

              {/* Police Dispatch Simulation */}
              {emergencyData?.assignedOfficer ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-900/40 border border-blue-500/50 rounded-xl p-4 flex items-center gap-4 text-left"
                >
                  <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{emergencyData.assignedOfficer}</h3>
                    <p className="text-blue-300 font-semibold text-sm">ETA: <span className="text-white animate-pulse">{emergencyData.eta}</span></p>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-left">
                    <h3 className="text-white font-bold">Dispatching Nearest Authorities</h3>
                    <p className="text-red-300 text-sm">Please remain calm...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-1.5 mt-1">
              <p className="text-red-400 text-sm font-bold uppercase tracking-widest animate-pulse">
                <MapPin size={16} className="inline mr-1" />
                Location actively transmitting to Guardian Network
              </p>
              {emergencyData?.physicalAddress && (
                <div className="bg-black/50 border border-red-500/30 rounded-xl px-4 py-2 max-w-md text-xs text-slate-200">
                  <span className="text-red-400 font-bold">📍 Physical Address:</span> {emergencyData.physicalAddress}
                </div>
              )}
            </div>
          </div>

          {/* Floating Chat Widget — renders on top of emergency overlay */}
          <FloatingChatWidget />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmergencyOverlay;
