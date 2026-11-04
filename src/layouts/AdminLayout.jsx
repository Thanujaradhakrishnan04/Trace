import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart2, Users, Map, Settings } from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/admin/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
    { path: '/admin/users', icon: <Users size={20} />, label: 'Personnel' },
    { path: '/admin/heatmap', icon: <Map size={20} />, label: 'City Map' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'System' }
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shadow-sm z-10">
        
        <div>
          <div className="px-8 py-6 mb-4 border-b border-slate-100">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-wider m-0">STREET SENTINEL</h1>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Smart City Control</p>
          </div>

          <div className="flex flex-col">
            {navItems.map((item, idx) => {
              const isActive = location.pathname === item.path;
              return (
                <div 
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-4 px-8 py-4 cursor-pointer transition-colors border-l-4 ${
                    isActive 
                      ? 'border-l-slate-800 bg-slate-50 text-slate-800' 
                      : 'border-l-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {item.icon}
                  <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-400 mb-2 tracking-wider">SYSTEM STATUS</div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-emerald-500 text-sm font-bold tracking-widest">OPTIMAL</span>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="px-8 py-4 bg-white border-b border-slate-200 flex justify-end items-center shadow-sm z-0">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 tracking-wider">ADMINISTRATOR</div>
              <div className="text-[10px] font-bold text-slate-800 tracking-widest">LEVEL 5 ACCESS</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-800"></div>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
