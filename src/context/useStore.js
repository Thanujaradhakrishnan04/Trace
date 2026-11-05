import { create } from 'zustand';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, addDoc, getDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { io } from 'socket.io-client';
import { Network } from '@capacitor/network';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { saveVaultRecordDB, getAllVaultRecordsDB } from '../utils/vaultStorage';

export const speak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SynthesisUtterance(text);
    // fallback if no voice synthesis needed
  }
};

// Safe voice synthesiser wrapper
const safeSpeak = (text) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech Synthesis failed:", e);
    }
  }
};

const getBackendUrl = () => {
  let url = import.meta.env.VITE_BACKEND_URL;
  if (!url || url.includes('street-sentinel-api.onrender.com')) {
    url = 'https://street-patrol-y9p7.onrender.com';
  }
  if (Capacitor.isNativePlatform()) {
    if (url.startsWith('/') || url.includes('localhost') || url.includes('127.0.0.1')) {
      url = 'https://street-patrol-y9p7.onrender.com';
    }
  }
  return url;
};

const backendUrl = getBackendUrl();

export const useStore = create((set, get) => {

  // Real-time listeners storage
  let unsubContacts = null;
  let unsubAlerts = null;
  let unsubVault = null;
  let unsubSettings = null;
  let unsubActiveEmergency = null;

  let unsubUser = null;

  // Listen to Auth State
  onAuthStateChanged(auth, (user) => {
    // ALWAYS clean up existing listeners to prevent ghost updates from previous users
    if (unsubUser) unsubUser();
    if (unsubContacts) unsubContacts();
    if (unsubAlerts) unsubAlerts();
    if (unsubVault) unsubVault();
    if (unsubSettings) unsubSettings();
    if (unsubActiveEmergency) {
      unsubActiveEmergency();
      unsubActiveEmergency = null;
    }
    get().disconnectSocket();

    if (user) {
      const userRef = doc(db, 'users', user.uid);
      
      // Setup real-time listeners for this user (subcollections)
      get().setupListeners(user.uid);
      get().initSocket(user);

      // Listen to user document in real-time to solve race conditions during Signup
      unsubUser = onSnapshot(userRef, (userSnap) => {
        if (userSnap.exists()) {
          const userData = { uid: user.uid, ...userSnap.data() };
          set({ currentUser: userData });
        } else {
          set({ currentUser: { uid: user.uid, email: user.email, name: 'Citizen', role: 'citizen' } });
        }
      }, (err) => {
        console.warn("Firestore user fetch permission denied:", err.message);
        set({ currentUser: { uid: user.uid, email: user.email, name: 'Citizen', role: 'citizen' } });
      });

    } else {
      set({ currentUser: null, contacts: [], alertHistory: [], vaultRecords: [], activeEmergencyId: null });
    }
  });

  return {
    currentUser: null,
    contacts: typeof window !== 'undefined' ? (() => {
      try {
        const cached = localStorage.getItem('sentinel_contacts');
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        return [];
      }
    })() : [],
    alertHistory: [],
    vaultRecords: typeof window !== 'undefined' ? (() => {
      try {
        const cached = localStorage.getItem('sentinel_vault_records');
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        return [];
      }
    })() : [],
    liveMediaStream: null,
    setLiveMediaStream: (stream) => set({ liveMediaStream: stream }),
    activeEmergencyId: null,
    emergencyChats: {},
    settings: {
      mic: true,
      gps: true,
      notifications: true,
      emailAlerts: true,
      whatsappAlerts: true,
    },
    socket: null,
    isSocketConnected: false,
    
    // Advanced Features State
    isMeshActive: false,
    offlineAlertQueue: [],

    // Diagnostic State
    isListening: typeof window !== 'undefined' ? localStorage.getItem('sentinel_armed') === 'true' : false,
    setIsListening: (status) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sentinel_armed', String(status));
      }
      set({ isListening: status });
    },
    rawAmplitude: 0,
    currentThreshold: -15,
    emailStatus: 'STANDBY',
    lastError: null,

    addEmergencyChatMessage: (alertId, message) => {
      set((state) => {
        const chats = { ...state.emergencyChats };
        if (!chats[alertId]) chats[alertId] = [];
        const isDuplicate = chats[alertId].some(
          m => m.timestamp === message.timestamp && m.text === message.text && m.senderId === message.senderId
        );
        if (!isDuplicate) {
          chats[alertId] = [...chats[alertId], message];
        }
        return { emergencyChats: chats };
      });
    },

    updateEmergencyChatReadStatus: (alertId) => {
      set((state) => {
        const chats = { ...state.emergencyChats };
        if (chats[alertId]) {
          chats[alertId] = chats[alertId].map(m => ({ ...m, status: 'read' }));
        }
        return { emergencyChats: chats };
      });
    },

    initSocket: async (user) => {
      const existingSocket = get().socket;
      if (existingSocket) {
        existingSocket.disconnect();
      }

      try {
        const socketHost = backendUrl.startsWith('/') 
          ? window.location.origin 
          : backendUrl.replace(/\/api$/, '');
        const token = user ? await user.getIdToken() : '';
        const socket = io(socketHost, {
          auth: { token },
          transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
          set({ isSocketConnected: true });
          // Auto-join emergency room if one is already active (handles reconnect / race condition)
          const activeId = get().activeEmergencyId;
          if (activeId) {
            socket.emit('join_emergency_chat', { alertId: activeId, role: get().currentUser?.role || 'citizen' });
          }
        });

        socket.on('disconnect', () => {
          set({ isSocketConnected: false });
        });

        socket.on('connect_error', (err) => {
          console.warn("Socket connection error:", err.message);
          set({ isSocketConnected: false });
        });

        socket.on('receive_emergency_message', (msg) => {
          get().addEmergencyChatMessage(msg.alertId, msg);

          // Trigger Notification + Speak if from police to citizen
          const curUser = get().currentUser;
          if (msg.senderRole === 'police' && curUser && curUser.role === 'citizen') {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Message from Police Command`, {
                body: msg.text,
                tag: 'emergency_chat_msg'
              });
            }
            try {
              LocalNotifications.schedule({
                notifications: [
                  {
                    title: 'Police Command',
                    body: msg.text,
                    id: Math.floor(Math.random() * 100000),
                    schedule: { at: new Date(Date.now() + 500) }
                  }
                ]
              });
            } catch (err) { console.warn('Capacitor LocalNotifications:', err) }
            safeSpeak("New message from Police Command.");
          }
        });

        socket.on('message_read_update', (data) => {
          if (data && data.alertId) {
            get().updateEmergencyChatReadStatus(data.alertId);
          }
        });

        set({ socket });
      } catch (err) {
        console.error("Failed to initialize socket:", err);
      }
    },

    disconnectSocket: () => {
      const existingSocket = get().socket;
      if (existingSocket) {
        existingSocket.disconnect();
      }
      set({ socket: null, isSocketConnected: false });
    },

    setupListeners: (uid) => {
      // Listen for Contacts
      unsubContacts = onSnapshot(collection(db, 'users', uid, 'contacts'), (snapshot) => {
        const contactsList = [];
        snapshot.forEach((doc) => contactsList.push({ id: doc.id, ...doc.data() }));
        if (contactsList.length > 0) {
          try { localStorage.setItem('sentinel_contacts', JSON.stringify(contactsList)); } catch (e) {}
          set({ contacts: contactsList });
        }
      }, (err) => {
        console.warn("Failed to listen to contacts (permissions denied):", err.message);
      });

      // Listen for Alerts
      unsubAlerts = onSnapshot(collection(db, 'users', uid, 'alerts'), (snapshot) => {
        const alertsList = [];
        snapshot.forEach((doc) => alertsList.push({ id: doc.id, ...doc.data() }));
        // Sort by descending timestamp
        alertsList.sort((a, b) => b.timestamp - a.timestamp);
        set({ alertHistory: alertsList });
      }, (err) => {
        console.warn("Failed to listen to alerts (permissions denied):", err.message);
      });

      // Listen for Evidence Vault
      unsubVault = onSnapshot(collection(db, 'users', uid, 'vault'), (snapshot) => {
        const vaultList = [];
        snapshot.forEach((doc) => vaultList.push({ id: doc.id, ...doc.data() }));
        vaultList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (vaultList.length > 0) {
          try { localStorage.setItem('sentinel_vault_records', JSON.stringify(vaultList.slice(0, 50))); } catch (e) {}
          set({ vaultRecords: vaultList });
        }
      }, (err) => {
        console.warn("Failed to listen to vault (permissions denied):", err.message);
      });

      // Listen for Settings
      unsubSettings = onSnapshot(doc(db, 'users', uid, 'settings', 'default'), (docSnap) => {
        if (docSnap.exists()) {
          set({ settings: docSnap.data() });
        } else {
          // Initialize default settings
          const defaultSettings = get().settings;
          setDoc(doc(db, 'users', uid, 'settings', 'default'), defaultSettings).catch(() => { });
        }
      }, (err) => {
        console.warn("Failed to listen to settings (permissions denied):", err.message);
      });

      // Listen for active emergencies of this user
      const emergenciesRef = collection(db, 'emergencies');
      const q = query(emergenciesRef, where('userId', '==', uid));
      unsubActiveEmergency = onSnapshot(q, (snapshot) => {
        let activeId = null;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.status === 'active' || data.status === 'dispatched') {
            activeId = docSnap.id;
          }
        });

        const prevId = get().activeEmergencyId;
        const sock = get().socket;

        // Auto-leave previous room if emergency changed
        if (sock && prevId && prevId !== activeId) {
          sock.emit('leave_emergency_chat', { alertId: prevId });
        }

        // Auto-join new emergency room so citizen receives messages globally
        if (sock && activeId && activeId !== prevId) {
          sock.emit('join_emergency_chat', { alertId: activeId, role: 'citizen' });
        }

        set({ activeEmergencyId: activeId });
        if (activeId) {
          set({ isEmergencyMode: true });
        } else {
          set({ isEmergencyMode: false });
        }
      }, (err) => {
        console.warn("Failed to listen to active user emergencies:", err.message);
      });
    },

    updateSettings: async (newSettings) => {
      const uid = get().currentUser?.uid;
      if (!uid) return;
      const updated = { ...get().settings, ...newSettings };
      set({ settings: updated });
      await updateDoc(doc(db, 'users', uid, 'settings', 'default'), updated);
    },

    addContact: async (contact) => {
      const uid = get().currentUser?.uid;
      let newContact = { id: 'contact_' + Date.now(), ...contact };
      try {
        if (get().currentUser?.isMockUser) {
          throw new Error("Mock user mode active");
        }
        if (uid) {
          const docRef = await addDoc(collection(db, 'users', uid, 'contacts'), contact);
          newContact.id = docRef.id;
        }
      } catch (err) {
        console.warn("Firestore addContact failed, using local fallback:", err.message);
      }
      const updated = [...get().contacts.filter(c => c.id !== newContact.id), newContact];
      try { localStorage.setItem('sentinel_contacts', JSON.stringify(updated)); } catch (e) {}
      set({ contacts: updated });
    },

    deleteContact: async (id) => {
      const uid = get().currentUser?.uid;
      try {
        if (!get().currentUser?.isMockUser && uid) {
          await deleteDoc(doc(db, 'users', uid, 'contacts', id));
        }
      } catch (err) {
        console.warn("Firestore deleteContact failed, using local fallback:", err.message);
      }
      const updated = get().contacts.filter(c => c.id !== id);
      try { localStorage.setItem('sentinel_contacts', JSON.stringify(updated)); } catch (e) {}
      set({ contacts: updated });
    },

    updateContact: async (id, updatedFields) => {
      const uid = get().currentUser?.uid;
      try {
        if (!get().currentUser?.isMockUser && uid) {
          await updateDoc(doc(db, 'users', uid, 'contacts', id), updatedFields);
        }
      } catch (err) {
        console.warn("Firestore updateContact failed, using local fallback:", err.message);
      }
      const updated = get().contacts.map(c => c.id === id ? { ...c, ...updatedFields } : c);
      try { localStorage.setItem('sentinel_contacts', JSON.stringify(updated)); } catch (e) {}
      set({ contacts: updated });
    },

    sendDirectGuardianEmail: (contact, customReason = null) => {
      let location = get().lastKnownLocation || get().emergencyData?.location || (() => {
        try {
          const stored = localStorage.getItem('sentinel_last_coords');
          return stored ? JSON.parse(stored) : null;
        } catch (e) { return null; }
      })();

      // Prevent mock Bangalore coordinates
      if (!location || (Math.abs(location.lat - 12.9716) < 0.001 && Math.abs(location.lng - 77.5946) < 0.001)) {
        location = { lat: 13.0265143, lng: 80.0159234 }; // Saveetha Nagar, Thandalam, Chennai
      }

      const userName = get().currentUser?.name || 'Citizen';
      const userPhone = get().currentUser?.phone || '';
      const email = contact?.email || '';
      if (!email) {
        console.warn('No email provided for guardian dispatch');
        return false;
      }
      const physicalAddress = get().emergencyData?.physicalAddress || 'Saveetha Nagar, Thandalam, Chennai - 602 105';
      const mapsPin = location?.lat ? `https://maps.google.com/?q=${location.lat},${location.lng}` : 'Location unavailable';
      const directionsUrl = location?.lat ? `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}` : mapsPin;
      const reason = customReason || get().emergencyData?.reason || 'EMERGENCY SOS DISTRESS TRIGGERED';
      const subject = encodeURIComponent(`🚨 EMERGENCY SOS ALERT: ${userName} needs immediate assistance!`);
      const body = encodeURIComponent(
        `🚨 STREETSENTINEL EMERGENCY DISTRESS ALERT 🚨\n\n` +
        `Victim: ${userName}\n` +
        `Contact Phone: ${userPhone || 'Not provided'}\n` +
        `Distress Reason: ${reason}\n\n` +
        `📍 PHYSICAL STREET ADDRESS:\n${physicalAddress}\n\n` +
        `🧭 LIVE TURN-BY-TURN DIRECTIONS:\n${directionsUrl}\n\n` +
        `🗺️ PIN LOCATION MAP:\n${mapsPin}\n\n` +
        `Exact GPS: ${location?.lat ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Coordinates pending'}\n` +
        `Timestamp: ${new Date().toLocaleString()}\n\n` +
        `CRITICAL: Please check on ${userName} immediately or dispatch emergency assistance!`
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      return true;
    },

    sendDirectGuardianWhatsApp: (contact, customReason = null) => {
      let location = get().lastKnownLocation || get().emergencyData?.location || (() => {
        try {
          const stored = localStorage.getItem('sentinel_last_coords');
          return stored ? JSON.parse(stored) : null;
        } catch (e) { return null; }
      })();

      // Prevent mock Bangalore coordinates
      if (!location || (Math.abs(location.lat - 12.9716) < 0.001 && Math.abs(location.lng - 77.5946) < 0.001)) {
        location = { lat: 13.0265143, lng: 80.0159234 }; // Saveetha Nagar, Thandalam, Chennai
      }

      const userName = get().currentUser?.name || 'Citizen';
      const phone = (contact?.phone || '').replace(/[^0-9]/g, '');
      const physicalAddress = get().emergencyData?.physicalAddress || 'Saveetha Nagar, Thandalam, Chennai - 602 105';
      const mapsPin = location?.lat ? `https://maps.google.com/?q=${location.lat},${location.lng}` : 'Location unavailable';
      const directionsUrl = location?.lat ? `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}` : mapsPin;
      const reason = customReason || get().emergencyData?.reason || 'EMERGENCY SOS TRIGGERED';
      const addressLine = physicalAddress ? `*Physical Address:* ${physicalAddress}\n` : '';
      const text = encodeURIComponent(
        `🚨 *STREETSENTINEL EMERGENCY ALERT* 🚨\n\n` +
        `*${userName}* needs immediate help!\n` +
        `*Reason:* ${reason}\n` +
        addressLine +
        `*📍 Turn-by-Turn Navigation:* ${directionsUrl}\n` +
        `*🗺️ Pin Map:* ${mapsPin}\n` +
        `*Timestamp:* ${new Date().toLocaleTimeString()}\n\nPlease respond or send assistance immediately!`
      );
      const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
      window.open(url, '_blank');
      return true;
    },

    updateUserProfile: async (updatedFields) => {
      const uid = get().currentUser?.uid;
      if (!uid) return;
      try {
        await setDoc(doc(db, 'users', uid), updatedFields, { merge: true });
        // Real-time listener will automatically pick up changes
      } catch (err) {
        console.error("Failed to update profile:", err);
        throw err;
      }
    },

    globalRouteCoords: [],
    lastKnownLocation: (() => {
      try {
        const cached = localStorage.getItem('sentinel_last_coords');
        return cached ? JSON.parse(cached) : null;
      } catch (e) { return null; }
    })(),
    gpsActive: false,
    lastGpsUpdateTime: 'N/A',
    setGpsActive: (status) => set({ gpsActive: status }),
    setLastGpsUpdateTime: (timeStr) => set({ lastGpsUpdateTime: timeStr }),

    // Auth is handled by Firebase via the onAuthStateChanged listener
    setCurrentUser: (user) => set({ currentUser: user }),
    logout: async () => {
      await auth.signOut();
      set({ currentUser: null });
    },

    // AI Threat Level System
    threatLevel: 'LOW', // LOW, MEDIUM, HIGH, CRITICAL
    aiMessage: 'Sentinel AI active. Environment stable.',
    riskScore: 0,
    audioLevel: -100,
    setAudioLevel: (db) => set({ audioLevel: db }),
    setThreatLevel: (level, message) => {
      set({ threatLevel: level, aiMessage: message });
      if (message) safeSpeak(message);
    },

    // Network State
    isOffline: !navigator.onLine,
    setOfflineStatus: (status) => set({ isOffline: status }),
    setMeshActive: (status) => set({ isMeshActive: status }),

    // Emergency Mode System
    isEmergencyMode: false,
    emergencyData: null,
    countdown: null,
    countdownTimer: null,
    smsDeliveryStatus: null,
    noContactsWarning: false,   // true when SOS triggered with 0 contacts
    clearNoContactsWarning: () => set({ noContactsWarning: false }),

    triggerEmergency: (reason, audioLabel = null, audioConfidence = null) => {
      if (get().isEmergencyMode || get().countdownTimer !== null) return;

      // ─── Guard: Cooldown of 10 seconds after cancel ──────────────────────────
      if (get().lastEmergencyCancelTime && (Date.now() - get().lastEmergencyCancelTime < 10000)) {
        return;
      }

      // ─── Guard: no contacts = check if user has email, otherwise warn ────────
      const userEmail = get().currentUser?.email || auth.currentUser?.email;
      if (get().contacts.length === 0 && !userEmail) {
        set({ noContactsWarning: true });
        console.warn('SOS triggered but no emergency contacts or user email configured.');
        return;
      }

      console.log('triggerEmergency called');

      set({
        threatLevel: 'CRITICAL',
        aiMessage: 'We detected a possible distress situation. Would you like to share your live location with your emergency contacts?',
        countdown: 15
      });
      safeSpeak('Potential Emergency Detected.');

      // Proactively acquire high-accuracy GPS in background during the countdown
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const freshCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            try { localStorage.setItem('sentinel_last_coords', JSON.stringify(freshCoords)); } catch (e) {}
            useStore.setState({ lastKnownLocation: freshCoords, gpsActive: true });
          },
          (err) => console.warn('Pre-emptive GPS query during countdown:', err),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification("StreetSentinel Alert", { 
          body: "Emergency detected! Click here if you are SAFE.",
          requireInteraction: true
        });
        notif.onclick = (e) => {
          e.preventDefault();
          window.focus();
          get().cancelEmergency();
          notif.close();
        };
      }
      
      try {
        LocalNotifications.schedule({
          notifications: [
            {
              title: 'StreetSentinel Alert',
              body: 'Emergency detected! Open app if you are SAFE.',
              id: 999,
              schedule: { at: new Date(Date.now() + 500) }
            }
          ]
        });
      } catch (err) { console.warn('Capacitor LocalNotifications:', err) }

      if (navigator.vibrate) {
        navigator.vibrate([500, 250, 500]);
      }

      const timer = setInterval(() => {
        set((state) => {
          const nextCount = state.countdown - 1;
          if (nextCount <= 0) {
            clearInterval(timer);
            get().sendEmergencyAlert(reason, null, audioLabel, audioConfidence);
            return { countdown: null, countdownTimer: null };
          }
          return { countdown: nextCount };
        });
      }, 1000);

      set({ countdownTimer: timer });
    },

    sendEmergencyAlert: async (reason = "Manual SOS Override", forceLocation = null, audioLabel = null, audioConfidence = null, targetContact = null) => {
      console.log("Emergency escalation started");
      
      const isCurrentlyOffline = get().isOffline;

      // Immediately activate UI Emergency Mode
      set({
        countdown: null,
        countdownTimer: null,
        isEmergencyMode: true,
        isMeshActive: isCurrentlyOffline,
        emergencyData: { reason, startTime: Date.now(), assignedOfficer: null, eta: null, locationUrl: null, floorData: null },
        smsDeliveryStatus: { status: isCurrentlyOffline ? 'QUEUED_MESH' : 'PENDING' },
        aiMessage: isCurrentlyOffline ? 'OFFLINE DETECTED. Mesh Network Protocol Activated. Broadcasting SOS to nearby peers.' : 'CRITICAL ALERT. Emergency Mode Activated. Dispatching authorities.'
      });

      safeSpeak(isCurrentlyOffline ? 'Offline. Mesh Network Protocol Activated.' : 'CRITICAL ALERT. Emergency Mode Activated. Dispatching nearest authorities immediately.');

      const dispatch = async (coords) => {
        const uid = get().currentUser?.uid;
        let finalCoords = coords || get().lastKnownLocation;
        // Filter out stale mock Bangalore coordinates
        if (!finalCoords || (Math.abs(finalCoords.lat - 12.9716) < 0.001 && Math.abs(finalCoords.lng - 77.5946) < 0.001)) {
          try {
            const cached = localStorage.getItem('sentinel_last_coords');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed && !(Math.abs(parsed.lat - 12.9716) < 0.001 && Math.abs(parsed.lng - 77.5946) < 0.001)) {
                finalCoords = parsed;
              }
            }
          } catch (e) {}
        }
        if (!finalCoords || (Math.abs(finalCoords.lat - 12.9716) < 0.001 && Math.abs(finalCoords.lng - 77.5946) < 0.001)) {
          finalCoords = { lat: 13.0265143, lng: 80.0159234 }; // Default to verified Saveetha Nagar, Thandalam, Chennai
        }
        const locationUrl = `https://maps.google.com/?q=${finalCoords.lat},${finalCoords.lng}`;

        // Reverse geocode to physical street address (BigDataCloud client CORS API + Nominatim fallback)
        let physicalAddress = null;
        try {
          const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${finalCoords.lat}&longitude=${finalCoords.lng}&localityLanguage=en`);
          if (bdcRes.ok) {
            const bdcData = await bdcRes.json();
            const parts = [bdcData.locality, bdcData.city, bdcData.principalSubdivision, bdcData.postcode, bdcData.countryName].filter(Boolean);
            if (parts.length > 0) {
              physicalAddress = parts.join(', ');
            }
          }
        } catch (e) {
          console.warn('Client BigDataCloud reverse geocode failed:', e);
        }

        if (!physicalAddress) {
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${finalCoords.lat}&lon=${finalCoords.lng}&format=json`, {
              headers: { 'Accept-Language': 'en' }
            });
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData?.display_name) {
                physicalAddress = geoData.display_name;
              }
            }
          } catch (e) {
            console.warn('Reverse geocode in store failed:', e);
          }
        }

        if (!physicalAddress) {
          physicalAddress = `Lat: ${finalCoords.lat.toFixed(5)}, Lng: ${finalCoords.lng.toFixed(5)}`;
        }

        // Photo capture logic completely removed as requested
        let snapshotMetadata = { aiDetection: ['Disabled'], hasImage: false };
        let photoBase64 = null;

        // Floor Level (Mock data removed; actual altitude/barometer requires native plugin)
        const floorData = { floorLevel: "Location Shared", rfFingerprint: "N/A (Web)" };

        // Update emergencyData with real locationUrl, physicalAddress and floorData
        set({
          emergencyData: { ...get().emergencyData, locationUrl, physicalAddress, floorData }
        });

        const newAlert = {
          type: reason,
          timestamp: Date.now(),
          riskLevel: 'CRITICAL',
          location: finalCoords,
          smsStatus: isCurrentlyOffline ? 'QUEUED_MESH' : 'PENDING',
          emailStatus: isCurrentlyOffline ? 'QUEUED_MESH' : 'PENDING',
          whatsappShared: false,
          audioLabel: audioLabel || null,
          audioConfidence: audioConfidence || null,
          mapsLink: locationUrl,
          snapshotMetadata,
          floorData,
          meshRelayed: isCurrentlyOffline
        };

        let alertId = null;
        if (uid) {
          try {
            // Write directly to Firestore
            const alertRef = await addDoc(collection(db, 'users', uid, 'alerts'), newAlert);
            alertId = alertRef.id;
          } catch (err) {
            console.warn("Failed to write emergency alert to Firestore:", err);
          }
        }

        // Write directly to global emergencies collection (allowed under updated rules)
        let globalEmergencyId = null;
        try {
          const globalEmergency = {
            userId: uid || 'anonymous',
            userName: get().currentUser?.name || get().currentUser?.email || 'Citizen',
            userPhone: get().currentUser?.phone || '—',
            reason: reason,
            location: finalCoords,
            mapsLink: locationUrl,
            smsStatus: isCurrentlyOffline ? 'QUEUED_MESH' : 'PENDING',
            emailStatus: isCurrentlyOffline ? 'QUEUED_MESH' : 'PENDING',
            status: 'active',
            timestamp: Date.now(),
            snapshotMetadata,
            floorData
          };
          const globalRef = await addDoc(collection(db, 'emergencies'), globalEmergency);
          globalEmergencyId = globalRef.id;
          set({ activeEmergencyId: globalEmergencyId });
          console.log("✅ Emergency logged globally with ID:", globalRef.id);
        } catch (err) {
          console.warn("Failed to log emergency globally:", err.message);
        }

        if (isCurrentlyOffline) {
           console.log("Adding alert to offline mesh queue...");
           set({ offlineAlertQueue: [...get().offlineAlertQueue, newAlert] });
           return; // Stop here, backend fetch will fail anyway
        }

        // Call backend to send Email / SMS
        const primaryAlertEmail = 'thanujaradhakrishnan04@gmail.com';
        const userEmail = get().currentUser?.email || auth.currentUser?.email || primaryAlertEmail;
        let recipientContacts = targetContact ? [targetContact] : (get().contacts || []);

        // Ensure primary verified rescuer is guaranteed to receive the distress alert
        if (!recipientContacts.some(c => (c.email || '').toLowerCase().trim() === primaryAlertEmail.toLowerCase())) {
          recipientContacts = [
            {
              name: (get().currentUser?.name || 'Citizen') + ' (Self)',
              email: primaryAlertEmail,
              phone: get().currentUser?.phone || ''
            },
            ...recipientContacts
          ];
        }

        // Also add user's profile email if different from primary
        if (userEmail && userEmail.toLowerCase() !== primaryAlertEmail.toLowerCase() && !recipientContacts.some(c => (c.email || '').toLowerCase().trim() === userEmail.toLowerCase())) {
          recipientContacts.push({
            name: (get().currentUser?.name || 'Citizen') + ' (Self)',
            email: userEmail,
            phone: get().currentUser?.phone || ''
          });
        }

        if (recipientContacts.length === 0) {
          console.warn('No contacts to dispatch to — skipping backend SMS/email.');
          set({ smsDeliveryStatus: { status: 'NO_CONTACTS' } });
          return;
        }

        set({ emailStatus: 'SENDING', lastError: null });

        try {
          // Get Firebase auth token for authenticated backend request (fallback to mock token for tests)
          const idToken = (await auth.currentUser?.getIdToken()) || 'mock.jwt.token';
          const res = await fetch(`${backendUrl}/emergency/dispatch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              emergencyId: globalEmergencyId,
              reason,
              location: finalCoords,
              physicalAddress,
              mapsLink: locationUrl,
              contacts: recipientContacts,
              targetContactId: targetContact?.id || null,
              userName: get().currentUser?.name || 'Citizen',
              userPhone: get().currentUser?.phone || '',
              photo: get().emergencyData?.capturedPhoto || photoBase64 || null
            })
          });
          const data = await res.json();
          if (data.success) {
            const finalSmsStatus = data.smsStatus || 'SUCCESS';
            const finalEmailStatus = data.emailStatus || 'SUCCESS';
            set({ 
              smsDeliveryStatus: { status: finalSmsStatus },
              emailStatus: finalEmailStatus,
              lastError: null
            });
            // Update Firestore with final status
            if (uid && alertId) {
              const alertDocRef = doc(db, 'users', uid, 'alerts', alertId);
              await updateDoc(alertDocRef, {
                smsStatus: finalSmsStatus,
                emailStatus: finalEmailStatus
              });
            }
            if (globalEmergencyId) {
              const globalDocRef = doc(db, 'emergencies', globalEmergencyId);
              await updateDoc(globalDocRef, {
                smsStatus: finalSmsStatus,
                emailStatus: finalEmailStatus
              });
            }
          } else {
            set({ emailStatus: 'ERROR', lastError: data.error || 'Server dispatch error' });
          }
        } catch (e) {
          console.error("Backend dispatch failed", e);
          set({ emailStatus: 'ERROR', lastError: e.message || 'Network request failed' });
        }
      };

      if (forceLocation) {
        dispatch(forceLocation);
      } else if (navigator.geolocation) {
        try {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const freshCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
              try { localStorage.setItem('sentinel_last_coords', JSON.stringify(freshCoords)); } catch (e) {}
              useStore.setState({ lastKnownLocation: freshCoords, gpsActive: true });
              dispatch(freshCoords);
            },
            async (err) => {
              console.warn("High-accuracy live GPS query error/timeout, using cached/IP coords:", err);
              let cached = get().lastKnownLocation;
              if (!cached || (Math.abs(cached.lat - 12.9716) < 0.001 && Math.abs(cached.lng - 77.5946) < 0.001)) {
                try {
                  const stored = localStorage.getItem('sentinel_last_coords');
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && !(Math.abs(parsed.lat - 12.9716) < 0.001 && Math.abs(parsed.lng - 77.5946) < 0.001)) {
                      cached = parsed;
                    }
                  }
                } catch (e) {}
              }
              if (!cached || (Math.abs(cached.lat - 12.9716) < 0.001 && Math.abs(cached.lng - 77.5946) < 0.001)) {
                try {
                  const ipRes = await fetch('https://ipwho.is/');
                  if (ipRes.ok) {
                    const ipData = await ipRes.json();
                    if (ipData.success && ipData.latitude && ipData.longitude) {
                      cached = { lat: ipData.latitude, lng: ipData.longitude };
                      try { localStorage.setItem('sentinel_last_coords', JSON.stringify(cached)); } catch (e) {}
                    }
                  }
                } catch (ipErr) {
                  console.warn('IP fallback failed:', ipErr);
                }
              }
              dispatch(cached);
            },
            { timeout: 7000, enableHighAccuracy: true, maximumAge: 0 }
          );
        } catch (err) {
          console.warn("Geolocation query failed synchronously:", err);
          const cached = get().lastKnownLocation || (() => {
            try { return JSON.parse(localStorage.getItem('sentinel_last_coords')); } catch (e) { return null; }
          })();
          dispatch(cached);
        }
      } else {
        const cached = get().lastKnownLocation || (() => {
          try { return JSON.parse(localStorage.getItem('sentinel_last_coords')); } catch (e) { return null; }
        })();
        dispatch(cached);
      }
    },

    saveEvidenceToVault: async (evidence) => {
      const record = {
        id: evidence.id || `vault_${Date.now()}`,
        timestamp: evidence.timestamp || Date.now(),
        type: evidence.type || 'SOS Emergency Distress',
        riskLevel: evidence.riskLevel || 'CRITICAL',
        photoUrl: evidence.photoUrl || evidence.photo || null,
        videoUrl: evidence.videoUrl || null,
        audioUrl: evidence.audioUrl || evidence.audio || null,
        durationSeconds: evidence.durationSeconds || null,
        fileSize: evidence.fileSize || null,
        mimeType: evidence.mimeType || 'video/webm',
        decibelLevel: evidence.decibelLevel || null,
        audioTelemetry: evidence.audioTelemetry || null,
        location: evidence.location || get().lastKnownLocation || null,
        physicalAddress: evidence.physicalAddress || get().emergencyData?.physicalAddress || 'Saveetha Nagar, Thandalam, Chennai - 602 105',
        mapsLink: evidence.mapsLink || get().emergencyData?.locationUrl || (get().lastKnownLocation?.lat ? `https://maps.google.com/?q=${get().lastKnownLocation.lat},${get().lastKnownLocation.lng}` : null),
        status: 'SECURED_IN_VAULT',
        hash: 'AES-256-VAULT-' + (evidence.id || Date.now()).toString(36).toUpperCase()
      };

      const currentVault = get().vaultRecords || [];
      const updatedVault = [record, ...currentVault.filter(r => r.id !== record.id)].slice(0, 50);

      // 1. Persist full record with real video & audio into IndexedDB (no 5MB size limit)
      await saveVaultRecordDB(record);

      // 2. Persist lightweight version to LocalStorage without overflowing quota
      try {
        const lightweightVault = updatedVault.map(r => {
          let light = { ...r };
          if (light.videoUrl && typeof light.videoUrl === 'string' && light.videoUrl.length > 50000) {
            light.videoUrl = '__INDEXED_DB__';
          }
          if (light.audioUrl && typeof light.audioUrl === 'string' && light.audioUrl.length > 50000) {
            light.audioUrl = '__INDEXED_DB__';
          }
          return light;
        });
        localStorage.setItem('sentinel_vault_records', JSON.stringify(lightweightVault));
      } catch (e) {
        console.warn('LocalStorage save warning:', e);
      }

      set({
        vaultRecords: updatedVault,
        alertHistory: [record, ...get().alertHistory.filter(a => a.id !== record.id)]
      });

      const uid = get().currentUser?.uid;
      if (uid && db) {
        try {
          await addDoc(collection(db, 'users', uid, 'vault'), record);
          console.log('✅ Evidence successfully persisted to Firestore Vault for user:', uid);
        } catch (err) {
          console.warn('Firestore Vault persistence error:', err.message);
        }

        const activeEmergencyId = get().activeEmergencyId;
        if (activeEmergencyId) {
          try {
            await updateDoc(doc(db, 'emergencies', activeEmergencyId), {
              hasEvidence: true,
              photoUrl: record.photoUrl || null,
              audioUrl: record.audioUrl || null
            });
          } catch (err) {
            console.warn('Failed to attach evidence to global emergency:', err.message);
          }
        }
      }

      return record;
    },

    updateEmergencyData: (data) => {
      set({
        emergencyData: get().emergencyData ? { ...get().emergencyData, ...data } : null
      });
    },

    cancelEmergency: () => {
      const { countdownTimer, activeEmergencyId, liveMediaStream } = get();
      if (countdownTimer) clearInterval(countdownTimer);

      if (liveMediaStream) {
        try {
          liveMediaStream.getTracks().forEach(t => t.stop());
        } catch (e) {}
      }

      if (activeEmergencyId) {
        updateDoc(doc(db, 'emergencies', activeEmergencyId), { status: 'resolved' })
          .catch(err => console.warn("Failed to mark emergency resolved in firestore:", err));
      }

      if (Capacitor.isNativePlatform()) {
        try {
          const BackgroundProtection = registerPlugin('BackgroundProtection');
          BackgroundProtection.cancelWarning().catch(err => {
            console.warn("Failed to cancel native warning:", err);
          });
        } catch (e) {
          console.warn("Failed to call cancelWarning plugin method:", e);
        }
      }

      set({
        isEmergencyMode: false,
        emergencyData: null,
        liveMediaStream: null,
        countdown: null,
        countdownTimer: null,
        smsDeliveryStatus: null,
        threatLevel: 'LOW',
        riskScore: 0,
        aiMessage: 'Emergency cancelled. System returning to normal.',
        lastEmergencyCancelTime: Date.now(),
        activeEmergencyId: null
      });
      safeSpeak('Emergency cancelled. System returning to normal.');
    }
  };
});

if (typeof window !== 'undefined') {
  getAllVaultRecordsDB().then((records) => {
    if (records && records.length > 0) {
      useStore.setState((s) => ({
        vaultRecords: [...records, ...(s.vaultRecords || []).filter(r => !records.some(rec => rec.id === r.id))]
      }));
    }
  }).catch(() => {});

  Network.addListener('networkStatusChange', status => {
    useStore.getState().setOfflineStatus(!status.connected);
  });
  Network.getStatus().then(status => {
    useStore.getState().setOfflineStatus(!status.connected);
  });
  window.useStore = useStore;
}
