import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Component layout injections
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Operational storefront pages views
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import AddProduct from './pages/AddProduct';
import AddCategory from './pages/AddCategory';
import PastBills from './pages/PastBills';

// Main Corporate Dashboard Layout Container Shell
// Main Corporate Dashboard Layout Container Shell with Robust Mobile Overlays
const MasterDashboardShell = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="h-screen w-screen bg-zinc-50 flex flex-col font-sans antialiased text-slate-900 overflow-hidden relative">
      
      {/* Top Navbar */}
      <Navbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      
      {/* Core Workspace Wrapper */}
      <div className="flex flex-1 h-full min-h-0 overflow-hidden relative">
        
        {/* 📱 1. MOBILE DRAWER SYSTEM (Completely separate from desktop layout flow) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex animate-fadeIn">
            {/* Backdrop Dimmer Shade */}
            <div 
              onClick={() => setMobileMenuOpen(false)} 
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity"
            />
            
            {/* Slide-out White Panel Menu */}
            <div className="relative w-64 max-w-xs bg-white h-full border-r border-zinc-200 shadow-2xl flex flex-col z-10 animate-scaleUp">
              <Sidebar onItemClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* 💻 2. DESKTOP PERMANENT SIDEBAR (Hidden completely on mobile viewports) */}
        <div className="hidden md:flex md:w-64 h-full flex-shrink-0 bg-white border-r border-zinc-200 flex-col">
          <Sidebar />
        </div>

        {/* 📋 3. MAIN PAGES CONTENT VIEWPORTS */}
        <main className="flex-1 h-full min-w-0 overflow-y-auto bg-zinc-50/50">
          {children}
        </main>

      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Identity Gateway Access View */}
          <Route path="/login" element={<Login />} />

          {/* Secure Firewall Protected Application Layout Tree System */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MasterDashboardShell>
                  <Dashboard />
                </MasterDashboardShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <MasterDashboardShell>
                  <Billing />
                </MasterDashboardShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <MasterDashboardShell>
                  <Inventory />
                </MasterDashboardShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <MasterDashboardShell>
                  <Customers />
                </MasterDashboardShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-product"
            element={
              <ProtectedRoute>
                <MasterDashboardShell>
                  <AddProduct />
                </MasterDashboardShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-category"
            element={
              <ProtectedRoute>
                <MasterDashboardShell>
                  <AddCategory />
                </MasterDashboardShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/bills-log"
            element={
              <ProtectedRoute>
                <MasterDashboardShell>
                  <PastBills />
                </MasterDashboardShell>
              </ProtectedRoute>
            }
          />

          {/* Automated Fallback Redirect to prevent blank views */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;