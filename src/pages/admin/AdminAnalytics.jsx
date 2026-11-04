import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, TrendingUp, AlertTriangle, CheckCircle, Clock,
  Download, Filter, Shield, Activity, Users, Calendar
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

const AdminAnalytics = () => {
  const { incidents = [], officers = [], cityThreatLevel = 'Normal' } = useSimulation();
  const [timeRange, setTimeRange] = useState('7d');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  // Realistic baseline data augmented with live simulation data
  const baseIncidents = [
    { id: 'inc-01', sector: 'Sector 3 (Central)', type: 'SOS Alert', severity: 'CRITICAL', status: 'Resolved', time: '12 mins ago', duration: '3.2m' },
    { id: 'inc-02', sector: 'Sector 7 (South)', type: 'Audio Screaming Detect', severity: 'HIGH', status: 'Resolved', time: '45 mins ago', duration: '2.1m' },
    { id: 'inc-03', sector: 'Sector 1 (North)', type: 'SafeWalk Auto-Escalate', severity: 'CRITICAL', status: 'Active', time: '1 hour ago', duration: '4.8m' },
    { id: 'inc-04', sector: 'Sector 5 (West)', type: 'Fall & Shock Detection', severity: 'MODERATE', status: 'Resolved', time: '3 hours ago', duration: '1.9m' },
    { id: 'inc-05', sector: 'Sector 2 (East)', type: 'Manual SOS Pin', severity: 'CRITICAL', status: 'Resolved', time: '5 hours ago', duration: '2.5m' },
    { id: 'inc-06', sector: 'Sector 4 (Central East)', type: 'Unusual Route Deviation', severity: 'LOW', status: 'Resolved', time: '8 hours ago', duration: '1.4m' },
    { id: 'inc-07', sector: 'Sector 8 (Tech Hub)', type: 'Acoustic Glass Shatter', severity: 'HIGH', status: 'Resolved', time: '12 hours ago', duration: '2.8m' },
  ];

  const allIncidents = [
    ...incidents.map((inc, i) => ({
      id: inc.id || `live-${i}`,
      sector: 'Sector 7 (Active Patrol)',
      type: inc.type || 'Manual SOS',
      severity: 'CRITICAL',
      status: inc.status === 'dispatched' ? 'In Progress' : 'Active',
      time: 'Just now',
      duration: '1.2m'
    })),
    ...baseIncidents
  ];

  const filteredIncidents = allIncidents.filter(inc => {
    if (filterSeverity === 'ALL') return true;
    return inc.severity === filterSeverity;
  });

  const totalIncidentsCount = allIncidents.length + (timeRange === '30d' ? 68 : timeRange === '24h' ? 3 : 24);
  const avgResponseTime = '2.3 min';
  const resolutionRate = '97.6%';
  const guardianEmailDeliveryRate = '99.8%';

  const sectorDistribution = [
    { name: 'Sector 1 (North)', count: 18, color: 'bg-blue-500' },
    { name: 'Sector 2 (East)', count: 24, color: 'bg-emerald-500' },
    { name: 'Sector 3 (Central Hub)', count: 42, color: 'bg-rose-500' },
    { name: 'Sector 4 (Harbor)', count: 15, color: 'bg-indigo-500' },
    { name: 'Sector 5 (Southwest)', count: 12, color: 'bg-amber-500' },
    { name: 'Sector 7 (South)', count: 31, color: 'bg-purple-500' },
  ];

  const handleExportCSV = () => {
    const headers = ['Incident ID,Sector,Type,Severity,Status,Time,Response Duration\n'];
    const rows = filteredIncidents.map(i => `"${i.id}","${i.sector}","${i.type}","${i.severity}","${i.status}","${i.time}","${i.duration}"\n`);
    const blob = new Blob([headers.concat(rows).join('')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `StreetSentinel_Analytics_${timeRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="text-blue-600" size={24} />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Safety & Threat Analytics</h1>
          </div>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Real-time urban telemetry, emergency response performance, and automated dispatch KPIs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {['24h', '7d', '30d', 'all'].map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  timeRange === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Distress Incidents</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><AlertTriangle size={18} /></div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">{totalIncidentsCount}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
            <TrendingUp size={13} />
            <span>+4.2% verified response rate</span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Mean Response Time</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Clock size={18} /></div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">{avgResponseTime}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-blue-600">
            <Activity size={13} />
            <span>0.4 min faster than city baseline</span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Resolution Rate</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={18} /></div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">{resolutionRate}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
            <span>98.2% victim confirmed safe</span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Guardian Alert Delivery</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Shield size={18} /></div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">{guardianEmailDeliveryRate}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-purple-600">
            <span>Direct Resend & SMTP Pipeline</span>
          </div>
        </motion.div>
      </div>

      {/* Analytics Breakdown & Sector Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sector Distribution */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-black text-slate-900 mb-1">Sector Threat Load</h2>
          <p className="text-xs font-semibold text-slate-500 mb-4">Incidents logged across patrol sectors</p>
          <div className="space-y-4">
            {sectorDistribution.map((sector, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">{sector.name}</span>
                  <span className="text-slate-900 font-extrabold">{sector.count} calls</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`${sector.color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${(sector.count / 45) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Incident Log Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Emergency Incident History</h2>
                <p className="text-xs font-semibold text-slate-500">Live feed with response duration timestamps</p>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5">
                <Filter size={13} className="text-slate-400" />
                <select
                  value={filterSeverity}
                  onChange={e => setFilterSeverity(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MODERATE">Moderate</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Sector</th>
                    <th className="pb-3">Severity</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredIncidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-bold text-slate-800">{inc.type}</td>
                      <td className="py-3 text-slate-600">{inc.sector}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          inc.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                          inc.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          inc.status === 'Resolved' ? 'text-emerald-600' : 'text-blue-600 animate-pulse'
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-700">{inc.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <span className="text-[11px] font-bold text-slate-400">Showing {filteredIncidents.length} recorded incident logs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

