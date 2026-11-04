import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Shield, UserCheck, Search, Plus, Radio,
  Phone, Mail, MapPin, Battery, Check, X, AlertCircle
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

const AdminUsers = () => {
  const { officers = [], dispatchOfficer } = useSimulation();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'police' | 'citizens' | 'guardians'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // New responder form state
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    badge: '',
    role: 'Patrol Officer',
    sector: 'Sector 3 (Central)',
    phone: '',
    email: ''
  });

  // Base personnel list with full interactive capabilities
  const [personnelList, setPersonnelList] = useState([
    {
      id: 'unit-101',
      name: 'Inspector Rajesh Kumar',
      role: 'Police (Tactical Lead)',
      category: 'police',
      badge: 'TN-POL-4412',
      sector: 'Sector 3 (Central)',
      phone: '+91 94440 12345',
      email: 'rajesh.kumar@tnpolice.gov.in',
      status: 'On Duty',
      battery: '94%',
      coords: '13.0827, 80.2707',
    },
    {
      id: 'unit-102',
      name: 'Sub-Inspector Priya Sundar',
      role: 'Police (Rapid Response)',
      category: 'police',
      badge: 'TN-POL-8821',
      sector: 'Sector 7 (South)',
      phone: '+91 94440 67890',
      email: 'priya.s@tnpolice.gov.in',
      status: 'Available',
      battery: '88%',
      coords: '13.0418, 80.2341',
    },
    {
      id: 'unit-103',
      name: 'Officer Arun Prakash',
      role: 'Police (SafeWalk Escort)',
      category: 'police',
      badge: 'TN-POL-2309',
      sector: 'Sector 1 (North)',
      phone: '+91 94440 55432',
      email: 'arun.prakash@tnpolice.gov.in',
      status: 'Available',
      battery: '76%',
      coords: '13.1145, 80.2872',
    },
    {
      id: 'cit-201',
      name: 'Thanujaradhakrishnan',
      role: 'Citizen (Verified Account)',
      category: 'citizens',
      badge: 'CIT-TN-9921',
      sector: 'Sector 7 (South)',
      phone: '+91 98401 23456',
      email: 'thanujaradhakrishnan04@gmail.com',
      status: 'Active',
      battery: '91%',
      coords: '13.0827, 80.2707',
    },
    {
      id: 'cit-202',
      name: 'Roshini Elumalai',
      role: 'Citizen (Verified Account)',
      category: 'citizens',
      badge: 'CIT-TN-4102',
      sector: 'Sector 3 (Central)',
      phone: '+91 98402 34567',
      email: 'roshinielumalai12@gmail.com',
      status: 'Active',
      battery: '85%',
      coords: '13.0650, 80.2450',
    },
    {
      id: 'grd-301',
      name: 'Kavitha Radhakrishnan',
      role: 'Guardian (Emergency Contact)',
      category: 'guardians',
      badge: 'GRD-9021',
      sector: 'Sector 7 (South)',
      phone: '+91 98405 11223',
      email: 'thanujaradhakrishnan04@gmail.com',
      status: 'Active',
      battery: '100%',
      coords: '13.0827, 80.2707',
    }
  ]);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleStatus = (id) => {
    setPersonnelList(prev => prev.map(p => {
      if (p.id !== id) return p;
      const nextStatus = p.status === 'Available' ? 'On Duty' : p.status === 'On Duty' ? 'Standby' : 'Available';
      return { ...p, status: nextStatus };
    }));
    showToast('Updated personnel status');
  };

  const handleDeployUnit = (unit) => {
    setPersonnelList(prev => prev.map(p => p.id === unit.id ? { ...p, status: 'Dispatched (Priority)' } : p));
    showToast(`Unit ${unit.badge} (${unit.name}) dispatched to live sector!`);
  };

  const handleCreateResponder = (e) => {
    e.preventDefault();
    if (!newOfficer.name || !newOfficer.badge) return;

    const created = {
      id: `unit-${Date.now().toString().slice(-4)}`,
      name: newOfficer.name,
      role: newOfficer.role,
      category: 'police',
      badge: newOfficer.badge,
      sector: newOfficer.sector,
      phone: newOfficer.phone || '+91 94440 00000',
      email: newOfficer.email || 'dispatch@tnpolice.gov.in',
      status: 'Available',
      battery: '100%',
      coords: '13.0827, 80.2707',
    };

    setPersonnelList([created, ...personnelList]);
    setShowAddModal(false);
    setNewOfficer({ name: '', badge: '', role: 'Patrol Officer', sector: 'Sector 3 (Central)', phone: '', email: '' });
    showToast(`New tactical unit ${created.badge} registered successfully!`);
  };

  const filteredUsers = personnelList.filter(user => {
    const matchesTab = activeTab === 'all' || user.category === activeTab;
    const matchesQuery = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.sector.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700"
          >
            <Check size={18} className="text-emerald-400" />
            <span className="text-xs font-bold">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Personnel & Citizen Overwatch</h1>
          </div>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Manage law enforcement units, verified citizens, emergency responders, and guardians.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus size={16} />
          <span>Add Tactical Unit</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Users', count: personnelList.length },
            { id: 'police', label: 'Police Responders', count: personnelList.filter(p => p.category === 'police').length },
            { id: 'citizens', label: 'Citizens', count: personnelList.filter(p => p.category === 'citizens').length },
            { id: 'guardians', label: 'Guardians', count: personnelList.filter(p => p.category === 'guardians').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, badge, email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => (
          <motion.div
            key={user.id}
            layout
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                    user.category === 'police' ? 'bg-blue-100 text-blue-700' :
                    user.category === 'citizens' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 leading-snug">{user.name}</h2>
                    <span className="text-[11px] font-bold text-slate-400">{user.badge}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleStatus(user.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                    user.status === 'On Duty' ? 'bg-emerald-100 text-emerald-700' :
                    user.status === 'Available' ? 'bg-blue-100 text-blue-700' :
                    user.status.includes('Dispatched') ? 'bg-rose-100 text-rose-700 animate-pulse' :
                    'bg-slate-100 text-slate-600'
                  }`}
                  title="Click to cycle status"
                >
                  {user.status}
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-slate-400" />
                  <span className="font-semibold">{user.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400" />
                  <span className="font-medium text-slate-500">{user.sector}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400" />
                  <span className="font-medium text-slate-500">{user.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-400" />
                  <span className="font-medium text-slate-500 truncate">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <Battery size={13} className="text-emerald-500" />
                <span>{user.battery}</span>
              </div>

              {user.category === 'police' && (
                <button
                  onClick={() => handleDeployUnit(user)}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <Radio size={12} />
                  <span>Deploy</span>
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Responder Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-slate-900">Add Tactical Law Enforcement Unit</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateResponder} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Officer Name</label>
                  <input
                    required
                    type="text"
                    value={newOfficer.name}
                    onChange={e => setNewOfficer({ ...newOfficer, name: e.target.value })}
                    placeholder="e.g. Officer K. Vasanth"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Badge ID</label>
                  <input
                    required
                    type="text"
                    value={newOfficer.badge}
                    onChange={e => setNewOfficer({ ...newOfficer, badge: e.target.value })}
                    placeholder="e.g. TN-POL-9932"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Role & Specialization</label>
                  <select
                    value={newOfficer.role}
                    onChange={e => setNewOfficer({ ...newOfficer, role: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                  >
                    <option value="Police (Tactical Lead)">Police (Tactical Lead)</option>
                    <option value="Police (Rapid Response)">Police (Rapid Response)</option>
                    <option value="Police (SafeWalk Escort)">Police (SafeWalk Escort)</option>
                    <option value="SWAT Specialist">SWAT Specialist</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Assigned Patrol Sector</label>
                  <select
                    value={newOfficer.sector}
                    onChange={e => setNewOfficer({ ...newOfficer, sector: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                  >
                    <option value="Sector 1 (North)">Sector 1 (North)</option>
                    <option value="Sector 2 (East)">Sector 2 (East)</option>
                    <option value="Sector 3 (Central)">Sector 3 (Central)</option>
                    <option value="Sector 4 (Harbor)">Sector 4 (Harbor)</option>
                    <option value="Sector 7 (South)">Sector 7 (South)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Phone</label>
                    <input
                      type="text"
                      value={newOfficer.phone}
                      onChange={e => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                      placeholder="+91 94440..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Email</label>
                    <input
                      type="email"
                      value={newOfficer.email}
                      onChange={e => setNewOfficer({ ...newOfficer, email: e.target.value })}
                      placeholder="officer@tnpolice.gov.in"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    Create Unit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
