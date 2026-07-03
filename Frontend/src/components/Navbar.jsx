// import React from 'react';

// // 💡 Pass down the onMenuToggle handler parameter injected by MasterDashboardShell
// const Navbar = ({ onMenuToggle }) => {
//   return (
//     <nav className="h-14 border-b border-zinc-200 bg-white px-4 flex items-center justify-between select-none z-30 relative">
//       <div className="flex items-center gap-2">
        
//         {/* 💡 RESPONSIVE HAMBURGER BUTTON: Visible on mobile viewports, hidden entirely on desktop layout frames */}
//         <button
//           type="button"
//           onClick={onMenuToggle}
//           className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 active:scale-95 transition cursor-pointer md:hidden flex items-center justify-center focus:outline-hidden"
//           aria-label="Toggle Navigation Options"
//         >
//           {/* SVG Vector Hamburger Menu Icon Lines */}
//           <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
//             <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
//           </svg>
//         </button>

//         {/* Brand System Title */}
//         <span className="font-black tracking-wider text-sm font-sans text-zinc-950 uppercase pl-1 md:pl-0">
//           Abhishek Trading
//         </span>
//       </div>

//       {/* Right Side Control Widgets Profile Row */}
//       <div className="flex items-center gap-4">
//         {/* Active Session Identity Status Badge */}
//         <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full">
//           <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
//           <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600">
//             Abhishek-Admin
//           </span>
//         </div>

//         {/* Global Standard Exit Gateway Interaction Trigger */}
//         <button
//           type="button"
//           onClick={() => {
//             // Your custom logout sequence logic handler here
//             console.log("Terminating active credentials configuration session.");
//           }}
//           className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition duration-150 cursor-pointer"
//         >
//           Log Out
//         </button>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;

import React from 'react';
import { useNavigate } from 'react-router-dom'; // 💡 ADDED: For client-side route redirection

// Pass down the onMenuToggle handler parameter injected by MasterDashboardShell
const Navbar = ({ onMenuToggle }) => {
  const navigate = useNavigate(); // 💡 Instantiate navigation hooks

  const handleLogoutExecution = () => {
    // 1. Purge secure active session parameters from browser local & session storage registries
    localStorage.clear();
    sessionStorage.clear();

    // 2. Safely reroute the user session layout viewport back to the login gateway checkpoint page
    navigate('/login');
    
    // 3. Force layout view memory flush to reset global API states cleanly
    window.location.reload();
  };

  return (
    <nav className="h-14 border-b border-zinc-200 bg-white px-4 flex items-center justify-between select-none z-30 relative">
      <div className="flex items-center gap-2">
        
        {/* RESPONSIVE HAMBURGER BUTTON: Visible on mobile viewports, hidden entirely on desktop layout frames */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 active:scale-95 transition cursor-pointer md:hidden flex items-center justify-center focus:outline-hidden"
          aria-label="Toggle Navigation Options"
        >
          {/* SVG Vector Hamburger Menu Icon Lines */}
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Brand System Title */}
        <span className="font-black tracking-wider text-sm font-sans text-zinc-950 uppercase pl-1 md:pl-0">
          Abhishek Trading
        </span>
      </div>

      {/* Right Side Control Widgets Profile Row */}
      <div className="flex items-center gap-4">
        {/* Active Session Identity Status Badge */}
        <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600">
            Abhishek-Admin
          </span>
        </div>

        {/* Global Standard Exit Gateway Interaction Trigger */}
        <button
          type="button"
          onClick={handleLogoutExecution} // 💡 FIXED: Wired directly to authentication purge handler
          className="text-xs font-bold text-zinc-400 hover:text-red-600 transition duration-150 cursor-pointer select-none focus:outline-hidden"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;