import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// 💡 onItemClick is passed down to automatically close the mobile drawer when a link is clicked
const Sidebar = ({ onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Unified navigation configuration map block
  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'New Sale (Billing)', path: '/billing', icon: '🛒' },
    { label: 'Stock Details', path: '/inventory', icon: '📦' },
    { label: 'Customer Registry', path: '/customers', icon: '👥' },
    { label: 'Add New Product', path: '/add-product', icon: '➕' },
    { label: 'Add New Category', path: '/add-category', icon: '🏷️' },
    { label: 'Past Bills Log', path: '/bills-log', icon: '📜' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (onItemClick) onItemClick(); // 💡 Closes the mobile drawer immediately
  };

  return (
    /* 💡 FIXED ROOT: Explicitly defined dimensions (w-full h-full), forced block display, and padding values */
    <div className="w-full h-full flex flex-col bg-white text-zinc-600 select-none font-sans">
      
      {/* Scope Brand Padding Buffer Area (Visible on mobile viewports for clean spacing) */}
      <div className="p-4 border-b border-zinc-100 md:hidden flex items-center justify-between bg-zinc-50/50">
        <span className="font-black tracking-wider text-xs uppercase text-zinc-950">Navigation Menu</span>
      </div>

      {/* Interactive Links Console Body */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 block">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-3 mb-3 select-none">
          Store Operations
        </span>

        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition duration-150 cursor-pointer text-left focus:outline-hidden ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
              }`}
            >
              <span className="text-sm leading-none">{item.icon}</span>
              <span className="truncate flex-1">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Branding Footprint Block */}
      <div className="p-4 border-t border-zinc-100 bg-zinc-50/30 select-none mt-auto">
        <div className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-center shadow-3xs">
          <span className="font-mono text-[10px] tracking-wider text-zinc-400 font-bold block">
            TERMINAL CONSOLE V2.6.2
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;