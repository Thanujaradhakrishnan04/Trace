import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map as MapIcon, Shield, AlertTriangle, Radio,
  Filter, CheckCircle, Navigation, Activity, Plus
} from 'lucide-react';
import LiveMap from '../../components/map/LiveMap';
import { useSimulation } from '../../context/SimulationContext';
import { useStore } from '../../context/useStore';

const AdminHeatmap = () => {
  const { incidents = [], triggerSOS, dispatchOfficer } = useSimulation();
  const { lastKnownLocation } = useStore();

  const [activeZoneFilter, setActiveZoneFilter] = useState('ALL'); // 'ALL' | 'POLICE' | 'HOSPITAL' | 'SHELTER'
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Safe zones in city
  const citySafeZones = [
    { id: 'sz-1', name: 'Central Police Station (HQ)', type: 'police', lat: 13.0827, lng: 80.2707, phone: '044-25361234' },
    { id: 'sz-2', name: 'Kilpauk Police Station', type: 'police', lat: 13.0784, lng: 80.2412, phone: '044-26412345' },
    { id: 'sz-3', name: 'Government General Hospital', type: 'hospital', lat: 13.0805, lng: 80.2795, phone: '044-25305000' },
    { id: 'sz-4', name: 'Apollo Emergency Centre', type: 'hospital', lat: 13.0601, lng: 80.2505, phone: '044-28290200' },
    { id: 'sz-5', name: 'Women Welfare Emergency Shelter', type: 'womens_shelter', lat: 13.0520, lng: 80.2600, phone: '1091' },
    { id: 'sz-6', name: '24/7 MedPlus Pharmacy Safe Point', type: 'pharmacy', lat: 13.0720, lng: 80.2550, phone: '044-42000000' },
  ];

  // Active threat locations
  const [threatIncidents, setThreatIncidents] = useState([
    { id: 'th-1', name: 'Distress Signal - Sector 3', type: 'emergency', lat: 13.0750, lng: 80.2620, risk: 'CRITICAL', details: 'Acoustic scream & rapid movement alert' },
    { id: 'th-2', name: 'Unverified Deviation - Sector 7', type: 'emergency', lat: 13.0480, lng: 80.2380, risk: 'HIGH', details: 'SafeWalk route timed out without PIN check-in' },
  ]);

  const allMapMarkers = [
    ...citySafeZones.filter(z => {
      if (activeZoneFilter === 'ALL') return true;
      if (activeZoneFilter === 'POLICE') return z.type === 'police';
      if (activeZoneFilter === 'HOSPITAL') return z.type === 'hospital';
      if (activeZoneFilter === 'SHELTER') return z.type === 'womens_shelter' || z.type === 'pharmacy';
      return true;
    }),
    ...threatIncidents,
    ...incidents.map((inc, i) => ({
      id: inc.id || `sim-${i}`,
      name: `SOS Call #${i + 1}`,
      type: 'emergency',
      lat: inc.lat || 13.0827,
      lng: inc.lng || 80.2707,
      risk: 'CRITICAL',
      details: inc.type || 'Manual SOS Trigger'
    }))
  ];

  const handleDispatch = (threat) => {
    showToast(`Patrol Unit Dispatched to ${threat.name}!`);
    setSelectedIncident(null);
  };

  const handleSimulateSOS = () => {
    const randomOffsetLat = (Math.random() - 0.5) * 0.02;
    const randomOffsetLng = (Math.random() - 0.5) * 0.02;
    const newThreat = {
      id: `th-${Date.now().toString().slice(-4)}`,
      name: `Live Distress Alert (Sector ${Math.floor(Math.random() * 8) + 1})`,
      type: 'emergency',
      lat: (lastKnownLocation?.lat || 13.0827) + randomOffsetLat,
      lng: (lastKnownLocation?.lng || 80.2707) + randomOffsetLng,
      risk: 'CRITICAL',
      details: 'Instant victim SOS button activated'
    };
    setThreatIncidents([newThreat, ...threatIncidents]);
    triggerSOS({ lat: newThreat.lat, lng: newThreat.lng });
    showToast('Simulated SOS distress pinned on map!');
  };

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700"
          >
            <CheckCircle size={18} className="text-emerald-400" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <MapIcon className="text-blue-600" size={22} />
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Tactical City Overwatch Heatmap</h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Geospatial threat indexing, safe havens, hospital corridors, and dynamic patrol coverage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {[
              { id: 'ALL', label: 'All Markers' },
              { id: 'POLICE', label: 'Police' },
              { id: 'HOSPITAL', label: 'Hospitals' },
              { id: 'SHELTER', label: 'Safe Shelters' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveZoneFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeZoneFilter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSimulateSOS}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Inject Test SOS</span>
          </button>
        </div>
      </div>

      {/* Map Body */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <LiveMap
          center={[13.0827, 80.2707]}
          zoom={14}
          userLocation={lastKnownLocation || { lat: 13.0827, lng: 80.2707 }}
          markers={allMapMarkers}
          interactive={true}
          onMapClick={(latlng) => {
            console.log('Map tapped at:', latlng);
          }}
        />

        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg z-[400] max-w-xs text-xs space-y-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Heatmap Legend</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
            <span className="font-bold text-slate-700">Active SOS Distress Pin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="font-bold text-slate-700">Police Stations & Responders</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="font-bold text-slate-700">Hospitals & Trauma Units</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span className="font-bold text-slate-700">Safe Haven & Women Shelters</span>
          </div>
        </div>

        {/* Bottom Stats Floating Bar */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg z-[400] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase">Active Threat Points</span>
              <p className="text-base font-black text-rose-600">{threatIncidents.length + incidents.length}</p>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase">City Safe Havens</span>
              <p className="text-base font-black text-emerald-600">{citySafeZones.length}</p>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase">Coverage Radius</span>
              <p className="text-base font-black text-slate-800">18.5 km (High Density)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Quick Dispatch Nearest:</span>
            {threatIncidents.slice(0, 2).map((t) => (
              <button
                key={t.id}
                onClick={() => handleDispatch(t)}
                className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1"
              >
                <Radio size={12} />
                <span>{t.name.split('-')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHeatmap;

