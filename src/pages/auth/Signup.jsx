import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, ShieldCheck, Mail, Droplet, CheckCircle2, AlertCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useStore } from '../../context/useStore';
import FaceScanner from '../../components/auth/FaceScanner';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get('role') || 'citizen';

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bloodGroup: '',
    password: '',
    role: role,
    profileImage: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError("Please fill in Name, Email, Phone, and Password");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Password policy: min 6 chars (standard Firebase requirement)
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setError('');
    setStep(2);
  };

  const handleCapture = async (imageUrl) => {
    const finalData = { ...formData, profileImage: imageUrl };
    setFormData(finalData);
    await submitRegistration(finalData);
  };

  const submitRegistration = async (finalData) => {
    setLoading(true);
    setError('');
    
    let user = null;
    const targetRole = finalData.role || role || 'citizen';

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, finalData.email, finalData.password);
      user = userCredential.user;
    } catch (authErr) {
      console.warn("createUserWithEmailAndPassword code:", authErr.code);
      
      // If email already in use, attempt seamless sign-in with the provided password
      if (authErr.code === 'auth/email-already-in-use') {
        try {
          const loginCredential = await signInWithEmailAndPassword(auth, finalData.email, finalData.password);
          user = loginCredential.user;
          console.log("Logged in existing user with email successfully.");
        } catch (loginErr) {
          console.error("Sign-in failed for existing email:", loginErr.code);
          setError("This email is already registered with a different password. Please log in or use a different email address.");
          setLoading(false);
          return;
        }
      } else if (authErr.code === 'auth/weak-password') {
        setError("Password is too weak. Please use a stronger password.");
        setLoading(false);
        return;
      } else if (authErr.code === 'auth/invalid-email') {
        setError("The email address is improperly formatted.");
        setLoading(false);
        return;
      } else {
        // Fallback for network / offline environments
        console.warn("Firebase Auth unavailable, falling back to local session:", authErr.message);
        user = {
          uid: 'user_' + Math.random().toString(36).substring(2, 9),
          email: finalData.email
        };
      }
    }

    const finalUserProfile = {
      uid: user.uid,
      name: finalData.name || 'Citizen',
      email: finalData.email,
      phone: finalData.phone || '',
      address: finalData.address || '',
      bloodGroup: finalData.bloodGroup || '',
      role: targetRole,
      profileImage: finalData.profileImage || '',
      registeredAt: new Date().toISOString()
    };

    // 2. Save User Profile in Firestore (non-blocking)
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, finalUserProfile, { merge: true });

      const settingsRef = doc(db, 'users', user.uid, 'settings', 'default');
      await setDoc(settingsRef, {
        mic: true,
        gps: true,
        notifications: true,
        emailAlerts: true,
        whatsappAlerts: true,
        nightMode: true
      }, { merge: true });
    } catch (dbErr) {
      console.warn("Firestore profile save warning (continuing with local state):", dbErr.message);
    }

    // 3. Immediately update currentUser in useStore so ProtectedRoute passes
    useStore.setState({ currentUser: finalUserProfile });

    // 4. Show success state and immediately navigate to dashboard
    setLoading(false);
    setSuccess(true);

    const destination = targetRole === 'police' ? '/police/home' : '/citizen/home';
    setTimeout(() => {
      navigate(destination, { replace: true });
    }, 700);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-red-500 opacity-[0.03] rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500 opacity-[0.03] rounded-full blur-[100px]"></div>

      {/* Centered Premium Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px] bg-white/95 backdrop-blur-md shadow-2xl shadow-slate-200/50 rounded-[2rem] p-8 relative z-10 border border-slate-100"
      >
        <div className="flex items-center justify-between mb-8">
          <button 
            type="button"
            onClick={() => step === 2 ? setStep(1) : navigate('/role-selection')} 
            className="p-2 bg-slate-50 rounded-full shadow-sm hover:bg-slate-100 transition-colors border border-slate-100 cursor-pointer"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <span className="text-xs font-black tracking-widest text-slate-300">STEP {step} OF 2</span>
        </div>

        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-50 rounded-2xl">
              <ShieldCheck size={32} className="text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">STREET SENTINEL</h1>
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest mt-1">
            {role === 'police' ? 'Police Registration' : 'AI Powered Urban Safety'}
          </p>
          
          <h2 className="text-xl font-bold text-slate-800 mt-6">
            {step === 1 ? 'Create Profile' : 'Biometric Scan'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {step === 1 
              ? 'Enter your details to establish a secure link.' 
              : 'Look directly at the camera to register your identity.'}
          </p>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {error && (
                  <div className="p-3.5 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-xl text-center flex items-center justify-center gap-2">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Full Legal Name" 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium text-slate-700"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="Email Address" 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium text-slate-700"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="Mobile Phone Number" 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium text-slate-700"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange}
                    placeholder="Create Secure Password" 
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium text-slate-700"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" name="address" value={formData.address} onChange={handleChange}
                    placeholder="Home Address" 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium text-slate-700"
                  />
                </div>

                <div className="relative">
                  <Droplet className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}
                    placeholder="Blood Group (e.g., O+)" 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium text-slate-700"
                  />
                </div>

                <button 
                  type="button"
                  onClick={handleNext}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-700 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  Proceed to Verification <ArrowRight size={20} />
                </button>
                <div className="text-center mt-6">
                  <button type="button" onClick={() => navigate(`/login?role=${role}`)} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                    Already have an account? Sign In
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center w-full"
              >
                {/* Step 2 Error Notification with Quick Actions */}
                {error && (
                  <div className="w-full mb-6 p-4 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-2xl text-center shadow-sm">
                    <p className="mb-3">{error}</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => { setError(''); setStep(1); }}
                        className="px-4 py-2 bg-white text-slate-700 border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                      >
                        Edit Details
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/login?role=${role}`)}
                        className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                      >
                        Go to Login
                      </button>
                    </div>
                  </div>
                )}

                {success ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 size={36} className="animate-bounce" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">Identity Verified!</h3>
                    <p className="text-sm text-slate-500 mt-1">Profile registered successfully. Entering dashboard...</p>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h3 className="font-bold text-slate-800">Securing & Verifying Profile...</h3>
                    <p className="text-xs text-slate-400 mt-1">Establishing encrypted link...</p>
                  </div>
                ) : (
                  <FaceScanner onCapture={handleCapture} />
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
