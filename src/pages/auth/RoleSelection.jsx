import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield } from 'lucide-react';

const RoleSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get('type') || 'signup';

  const handleRoleSelect = (role) => {
    navigate(`/${type}?role=${role}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Select Access Level</h2>
        <p className="text-slate-500 font-medium">Identify your network clearance.</p>
      </motion.div>

      <div className="flex flex-col gap-4 w-full max-w-md">
        
        {/* Citizen Role */}
        <motion.div 
          className="glass-panel p-6 rounded-2xl flex items-center cursor-pointer border hover:border-slate-300 transition-colors bg-white shadow-sm"
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
          onClick={() => handleRoleSelect('citizen')}
        >
          <div className="bg-slate-100 p-4 rounded-full mr-5 text-slate-600">
            <User size={28} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Citizen Protocol</h3>
            <p className="text-slate-500 text-sm mt-1">Public safety network & AI monitoring</p>
          </div>
        </motion.div>

        {/* Police Role */}
        <motion.div 
          className="glass-panel p-6 rounded-2xl flex items-center cursor-pointer border-l-4 border-l-primary-red hover:border-r hover:border-y hover:border-slate-300 transition-colors bg-white shadow-sm"
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
          onClick={() => handleRoleSelect('police')}
        >
          <div className="bg-red-50 p-4 rounded-full mr-5 text-primary-red">
            <Shield size={28} />
          </div>
          <div>
            <h3 className="font-bold text-primary-red text-lg">Tactical Command</h3>
            <p className="text-slate-500 text-sm mt-1">Officer dispatch & real-time intercepts</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default RoleSelection;
