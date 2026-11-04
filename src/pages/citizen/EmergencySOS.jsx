import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Phone, PhoneCall, MapPin, Share2, AlertCircle, Mail, Users } from 'lucide-react';
import { useStore } from '../../context/useStore';
import { useNavigate } from 'react-router-dom';

const EmergencySOS = () => {
  const { 
    triggerEmergency, 
    sendEmergencyAlert, 
    isEmergencyMode, 
    cancelEmergency, 
    contacts,
    sendDirectGuardianEmail,
    sendDirectGuardianWhatsApp
  } = useStore();
  const [pressed, setPressed] = useState(false);
  const navigate = useNavigate();

  const handleSOS = () => {
    setPressed(true);
    triggerEmergency('Manual SOS — Emergency Button');
    setTimeout(() => setPressed(false), 2000);
  };

  const handleCallPolice = () => {
    window.location.href = 'tel:100';
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        navigator.share?.({ title: 'My Location', url }) ?? window.open(url, '_blank');
        
        // Instantly fire the emergency dispatch bypassing any countdown
        sendEmergencyAlert('Manual SOS — Shared Location', { lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => {
        // Fallback if GPS fails
        sendEmergencyAlert('Manual SOS — Shared Location (GPS Unavailable)');
      });
    } else {
      sendEmergencyAlert('Manual SOS — Shared Location (GPS Disabled)');
    }
  };

  return (
    <div className="min-h-full bg-slate-900 text-white pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-red-600 to-red-900 px-6 pt-8 pb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          <span className="text-red-200 text-xs font-black uppercase tracking-widest">Emergency Protocol</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">SOS CENTER</h1>
        <p className="text-red-200 text-sm mt-2">Immediate distress alert to guardians & emergency response</p>
      </div>

      <div className="px-5 -mt-6 space-y-4">
        {/* Big SOS Button */}
        <motion.div className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl">
          <p className="text-slate-500 text-sm font-bold mb-6 uppercase tracking-widest">Hold to activate emergency</p>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onTouchStart={handleSOS}
            onClick={handleSOS}
            className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all ${
              pressed || isEmergencyMode
                ? 'bg-red-500 shadow-red-400/60'
                : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-400/40'
            }`}
          >
            <div className="absolute inset-0 rounded-full border-4 border-red-300/40 animate-ping" />
            <ShieldAlert size={52} className="text-white" />
            <span className="text-white font-black text-lg tracking-widest">SOS</span>
          </motion.button>
          <p className="text-slate-400 text-xs mt-6 text-center">
            {isEmergencyMode ? '🔴 Emergency mode active — contacts alerted' : 'This will alert all your emergency contacts immediately'}
          </p>
          {isEmergencyMode && (
            <div className="flex flex-col items-center gap-3 mt-4 w-full">
              <button onClick={() => navigate('/citizen/chat')}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 animate-pulse">
                💬 Open Police Chat
              </button>
              <button onClick={cancelEmergency}
                className="w-full px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm">
                Cancel Emergency
              </button>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleCallPolice}
            className="bg-slate-800 rounded-2xl p-5 flex flex-col items-center gap-3 border border-slate-700">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Phone size={22} className="text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm">Call Police</p>
              <p className="text-slate-500 text-xs">Dial 100</p>
            </div>
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }} onClick={handleShareLocation}
            className="bg-slate-800 rounded-2xl p-5 flex flex-col items-center gap-3 border border-slate-700">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <MapPin size={22} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm">Share Location</p>
              <p className="text-slate-500 text-xs">Send live GPS</p>
            </div>
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/citizen/contacts')}
            className="bg-slate-800 rounded-2xl p-5 flex flex-col items-center gap-3 border border-slate-700">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <PhoneCall size={22} className="text-purple-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm">Guardians</p>
              <p className="text-slate-500 text-xs">{contacts.length} saved</p>
            </div>
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                  const msg = `🚨 EMERGENCY — I need help! My live location: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                });
              } else {
                window.open(`https://wa.me/?text=${encodeURIComponent('🚨 EMERGENCY — I need help immediately!')}`, '_blank');
              }
            }}
            className="bg-slate-800 rounded-2xl p-5 flex flex-col items-center gap-3 border border-slate-700">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <Share2 size={22} className="text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm">WhatsApp SOS</p>
              <p className="text-slate-500 text-xs">Broadcast GPS</p>
            </div>
          </motion.button>
        </div>

        {/* Emergency contacts list with direct 1-click dispatch */}
        {contacts.length > 0 && (
          <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <Users size={16} className="text-blue-400" /> Emergency Guardians ({contacts.length})
              </h3>
              <button onClick={() => navigate('/citizen/contacts')} className="text-xs text-blue-400 font-bold hover:underline">
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {contacts.map((c) => (
                <div key={c.id} className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white font-black flex-shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{c.name}</p>
                      <p className="text-slate-400 text-xs truncate">
                        {c.email || c.phone || c.relation || 'Emergency Contact'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {c.email && (
                      <button
                        onClick={() => sendDirectGuardianEmail(c)}
                        className="px-2.5 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                        title="Directly send emergency distress email with GPS to Guardian"
                      >
                        <Mail size={13} /> Email
                      </button>
                    )}

                    {c.phone && (
                      <button
                        onClick={() => sendDirectGuardianWhatsApp(c)}
                        className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                        title="Send WhatsApp SOS with GPS"
                      >
                        <Share2 size={13} /> WhatsApp
                      </button>
                    )}

                    <button onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            sendEmergencyAlert(`Manual SOS — Shared Location with ${c.name}`, { lat: pos.coords.latitude, lng: pos.coords.longitude });
                          });
                        }
                      }}
                      className="w-8 h-8 bg-blue-500/20 hover:bg-blue-500/40 rounded-xl flex items-center justify-center transition-colors" 
                      title="Send GPS Beacon">
                      <MapPin size={15} className="text-blue-400" />
                    </button>

                    {c.phone && (
                      <a href={`tel:${c.phone}`}
                        className="w-8 h-8 bg-emerald-500/20 hover:bg-emerald-500/40 rounded-xl flex items-center justify-center transition-colors"
                        title="Call Guardian">
                        <Phone size={15} className="text-emerald-400" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {contacts.length === 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
            <div className="text-left">
              <p className="text-amber-300 text-sm font-semibold">No emergency contacts saved.</p>
              <button onClick={() => navigate('/citizen/contacts')} className="text-xs text-amber-400 font-bold underline mt-0.5 block">
                Add emergency contacts now to enable email distress alerts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencySOS;
