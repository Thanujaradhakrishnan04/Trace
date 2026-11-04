import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Phone, Mail, UserPlus, ShieldAlert, Trash2, CheckCircle2, Pencil, MapPin, AlertTriangle, Share2, Send } from 'lucide-react';
import { useStore } from '../../context/useStore';

// Normalise phone numbers for comparison (strip spaces, dashes, country codes)
const normalisePhone = (p) => p?.replace(/[\s\-().+]/g, '').replace(/^(91|0)/, '') || '';

const Contacts = () => {
  const { 
    contacts, 
    addContact, 
    deleteContact, 
    updateContact, 
    triggerEmergency, 
    sendEmergencyAlert, 
    currentUser,
    sendDirectGuardianEmail,
    sendDirectGuardianWhatsApp
  } = useStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', relation: '' });
  const [error, setError] = useState('');
  const [testSentMsg, setTestSentMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and Phone are required.');
      return;
    }

    if (!form.email || !form.email.includes('@')) {
      setError('A valid Guardian Email address is required so they receive distress emails during SOS.');
      return;
    }

    // ─── Prevent saving own phone as emergency contact ──────────────────────
    const ownPhone = normalisePhone(currentUser?.phone);
    const contactPhone = normalisePhone(form.phone);
    if (ownPhone && contactPhone && ownPhone === contactPhone) {
      setError('This is your registered number. Emergency contacts must be a different person.');
      return;
    }

    // ─── Prevent duplicate contacts ──────────────────────────────────────────
    const duplicate = contacts.find(
      c => c.id !== editingId && normalisePhone(c.phone) === contactPhone
    );
    if (duplicate) {
      setError(`This number is already saved as "${duplicate.name}".`);
      return;
    }

    try {
      if (editingId) {
        await updateContact(editingId, form);
      } else {
        await addContact(form);
      }
      setForm({ name: '', phone: '', email: '', relation: '' });
      setShowForm(false);
      setEditingId(null);
      setError('');
    } catch (err) {
      setError('Failed to save contact details.');
      console.error(err);
    }
  };

  const handleStartEdit = (contact) => {
    setForm({
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      relation: contact.relation || ''
    });
    setEditingId(contact.id);
    setShowForm(true);
    setError('');
  };

  const handleTestEmail = (contact) => {
    const success = sendDirectGuardianEmail(contact, 'Guardian Alert Verification Test — StreetSentinel');
    if (success) {
      setTestSentMsg(`Opening email app for ${contact.name} (${contact.email}). Tap Send in your mail client.`);
      setTimeout(() => setTestSentMsg(''), 6000);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 pt-8 pb-10 px-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={20} className="text-blue-400" />
              <span className="text-blue-400 text-xs font-black uppercase tracking-widest">Guardian Circle</span>
            </div>
            <h1 className="text-3xl font-black text-white">Contacts</h1>
            <p className="text-slate-400 text-sm mt-1">{contacts.length} guardian{contacts.length !== 1 ? 's' : ''} configured</p>
          </div>
          <button onClick={() => {
            if (showForm && editingId) {
              setForm({ name: '', phone: '', email: '', relation: '' });
              setEditingId(null);
            } else {
              setForm({ name: '', phone: '', email: '', relation: '' });
              setEditingId(null);
              setShowForm(!showForm);
            }
            setError('');
          }}
            className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40"
            title="Add New Contact">
            <UserPlus size={20} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Network Status */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 size={20} className="text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 text-sm">Guardian Network Active</p>
            <p className="text-slate-500 text-xs">{contacts.length} contact{contacts.length !== 1 ? 's' : ''} will receive distress emails & SMS in emergencies</p>
          </div>
        </div>

        {testSentMsg && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
            <Send size={15} className="text-blue-600 flex-shrink-0" />
            <span>{testSentMsg}</span>
          </div>
        )}

        {/* Add/Edit Contact Form */}
        {showForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 border border-blue-100 shadow-md space-y-3">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              {editingId ? (
                <>
                  <Pencil size={18} className="text-blue-500" /> Edit Emergency Contact
                </>
              ) : (
                <>
                  <UserPlus size={18} className="text-blue-500" /> New Emergency Contact
                </>
              )}
            </h3>
            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
            
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name *</label>
              <input required type="text" placeholder="Guardian Full Name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Phone Number * (e.g. +91 98765 43210)</label>
              <input required type="tel" placeholder="+91 98765 43210" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Guardian Email Address * <span className="text-blue-600">(Required for SOS Email Alerts)</span>
              </label>
              <input required type="email" placeholder="guardian@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <p className="text-[11px] text-slate-400 mt-1">Distress coordinates and emergency SOS notifications will be sent to this email.</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Relation (e.g. Father, Mother, Friend)</label>
              <input type="text" placeholder="Relation (e.g. Father, Sister)" value={form.relation}
                onChange={e => setForm({ ...form, relation: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ name: '', phone: '', email: '', relation: '' }); setError(''); }}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">Cancel</button>
              <button type="submit"
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-400/30">
                {editingId ? 'Update Contact' : 'Save Contact'}
              </button>
            </div>
          </motion.form>
        )}

        {/* Contact List */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Trusted Guardians</h2>

          {contacts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
              <Users size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">No contacts added yet</p>
              <p className="text-slate-400 text-sm mt-1">Add emergency contacts to enable SOS distress email alerts</p>
              <button onClick={() => setShowForm(true)}
                className="mt-4 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-md">
                Add First Guardian Contact
              </button>
            </div>
          ) : (
            contacts.map((contact) => (
              <motion.div key={contact.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl" />
                <div className="pl-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-600 text-lg">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800">{contact.name}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md uppercase">
                            {contact.relation || 'Guardian'}
                          </span>
                        </div>
                        {contact.email ? (
                          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 size={12} /> SOS Email Alerts Configured
                          </p>
                        ) : (
                          <p className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle size={12} /> No Email Configured — SOS email inactive
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleStartEdit(contact)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                        title="Edit Contact">
                        <Pencil size={17} />
                      </button>
                      <button onClick={() => deleteContact(contact.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Contact">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`}
                        className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl flex-1 border border-slate-100">
                        <Phone size={13} className="text-blue-500" /> {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl flex-1 border border-slate-100 truncate">
                        <Mail size={13} className="text-purple-500" /> {contact.email}
                      </a>
                    )}
                  </div>

                  {/* 1-Click Verification & Dispatch Actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                    {contact.email ? (
                      <button
                        onClick={() => handleTestEmail(contact)}
                        className="py-2 px-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        title="Send a pre-filled test distress alert email to this guardian"
                      >
                        <Mail size={13} /> Test Email
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(contact)}
                        className="py-2 px-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Mail size={13} /> + Add Email
                      </button>
                    )}

                    <button
                      onClick={() => sendDirectGuardianWhatsApp(contact, 'StreetSentinel Guardian Verification Test')}
                      className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      title="Send Live GPS Distress Beacon via WhatsApp"
                    >
                      <Share2 size={13} /> WhatsApp
                    </button>

                    <button onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            sendEmergencyAlert(`Manual SOS — Shared Location with ${contact.name}`, { lat: pos.coords.latitude, lng: pos.coords.longitude }, null, null, contact);
                          }, () => {
                            sendEmergencyAlert(`Manual SOS — Shared Location with ${contact.name}`, null, null, null, contact);
                          });
                        } else {
                          sendEmergencyAlert(`Manual SOS — Shared Location with ${contact.name}`, null, null, null, contact);
                        }
                      }}
                      className="py-2 px-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors">
                      <MapPin size={13} /> Send GPS
                    </button>

                    <button onClick={() => triggerEmergency(`Distress SOS Alert for ${contact.name}`)}
                      className="py-2 px-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors">
                      <ShieldAlert size={13} /> SOS Alert
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Contacts;
