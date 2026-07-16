// import React, { useState, useEffect, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// const Dashboard = () => {
//   const navigate = useNavigate();

//   // Core Data Stream Hooks
//   const [products, setProducts] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [invoices, setInvoices] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchDashboardMetrics = async () => {
//     try {
//       const [productsRes, customersRes, invoicesRes] = await Promise.all([
//         axios.get('/products'),
//         axios.get('/customers'),
//         axios.get('/invoices')
//       ]);

//       setProducts(productsRes.data || []);
//       setCustomers(customersRes.data || []);
//       setInvoices(invoicesRes.data || []);
//     } catch (error) {
//       console.error("Dashboard performance telemetry synchronization fail:", error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboardMetrics();
//   }, []);

//   // 📊 COMPREHENSIVE FINANCIAL & LOGISTICAL ANALYTICS METRICS ENGINE
//   const dashboardStats = useMemo(() => {
//     const totalCatalogItems = products.length;
//     const totalStockVolume = products.reduce((acc, curr) => acc + (Number(curr.stockQuantity) || 0), 0);
//     const activeClientProfiles = customers.length;

//     // 1. Today's Revenue Shift (Accounting accurately for return reductions)
//     const todayStr = new Date().toDateString();
//     const todaysRevenue = invoices
//       .filter(inv => new Date(inv.createdAt).toDateString() === todayStr)
//       .reduce((acc, inv) => {
//         const originalGrandTotal = Number(inv.grandTotal) || 0;
//         const totalPaidSoFar = Number(inv.amountPaid) || 0;
//         const invoiceReturnCredit = (inv.returnedHistory || []).reduce((sum, r) => sum + (Number(r.returnedAmount) || 0), 0);
        
//         if (inv.paymentStatus === 'Paid') {
//           return acc + (originalGrandTotal - invoiceReturnCredit);
//         }
//         return acc + totalPaidSoFar;
//       }, 0);

//     // 2. TOTAL OUTSTANDING BALANCE, ACCUMULATED REAL SALES, & CREDIT SPILLOVER ENGINE
//     let totalOutstanding = 0;
//     let totalCreditVolume = 0;
//     let totalNetSalesVolume = 0;

//     const customerBalanceMap = {};

//     invoices.forEach(inv => {
//       const originalGrandTotal = Number(inv.grandTotal) || 0;
//       const totalPaidSoFar = Number(inv.amountPaid) || 0;
//       const invoiceReturnCredit = (inv.returnedHistory || []).reduce((sum, r) => sum + (Number(r.returnedAmount) || 0), 0);
//       const isPureReturn = inv.items?.every(item => item.status === 'returned') && invoiceReturnCredit > 0;

//       // Accumulate overall true net checkout volumes
//       if (!isPureReturn) {
//         totalNetSalesVolume += (originalGrandTotal - invoiceReturnCredit);
//       }

//       if (!inv.customer) return;
//       const custId = (inv.customer._id || inv.customer).toString();
//       if (!customerBalanceMap[custId]) customerBalanceMap[custId] = 0;

//       if (inv.paymentStatus === 'Paid') {
//         if (isPureReturn) {
//           customerBalanceMap[custId] -= invoiceReturnCredit;
//         }
//       } else {
//         const invoiceOutstandingDeficit = originalGrandTotal - totalPaidSoFar - invoiceReturnCredit;
//         customerBalanceMap[custId] += invoiceOutstandingDeficit;
//       }
//     });

//     Object.values(customerBalanceMap).forEach(balance => {
//       if (balance > 0) totalOutstanding += balance;
//       if (balance < 0) totalCreditVolume += Math.abs(balance);
//     });

//     // 3. Filter Out Low Inventory Items
//     const lowStockWatchlist = products.filter(p => (Number(p.stockQuantity) || 0) <= 5);

//     // 4. Compile Weekly Metrics for Trend Graph
//     const weeklyTrendData = Array.from({ length: 7 }).map((_, i) => {
//       const d = new Date();
//       d.setDate(d.getDate() - (6 - i));
//       const dateString = d.toDateString();
//       const label = d.toLocaleDateString(undefined, { weekday: 'short' });

//       const dayRevenue = invoices
//         .filter(inv => new Date(inv.createdAt).toDateString() === dateString)
//         .reduce((acc, inv) => {
//           if (inv.paymentStatus === 'Paid') {
//             const returns = (inv.returnedHistory || []).reduce((sum, r) => sum + (Number(r.returnedAmount) || 0), 0);
//             return acc + (Number(inv.grandTotal || 0) - returns);
//           }
//           return acc + (Number(inv.amountPaid) || 0);
//         }, 0);

//       return { label, revenue: Math.max(0, dayRevenue) };
//     });

//     return {
//       totalCatalogItems,
//       totalStockVolume,
//       activeClientProfiles,
//       todaysRevenue,
//       totalOutstanding,
//       totalCreditVolume,
//       totalNetSalesVolume,
//       lowStockWatchlist,
//       weeklyTrendData
//     };
//   }, [products, customers, invoices]);

//   // Generate responsive coordinates for the SVG Line Graph
//   const svgLineCoordinates = useMemo(() => {
//     const data = dashboardStats.weeklyTrendData;
//     const maxVal = Math.max(...data.map(d => d.revenue), 1000); 
//     const width = 500;
//     const height = 140;
//     const padding = 20;

//     const points = data.map((d, i) => {
//       const x = padding + (i * (width - padding * 2) / (data.length - 1));
//       const y = height - padding - (d.revenue * (height - padding * 2) / maxVal);
//       return { x, y, label: d.label, val: d.revenue };
//     });

//     const pathD = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
//     const areaD = points.length ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : '';

//     return { points, pathD, areaD, height, width, padding };
//   }, [dashboardStats.weeklyTrendData]);

//   // 💡 NEW VECTOR: Calculates coordinates for the financial Share Pie Chart
//   const pieChartSegments = useMemo(() => {
//     const { totalNetSalesVolume, totalCreditVolume, totalOutstanding } = dashboardStats;
//     const total = totalNetSalesVolume + totalCreditVolume + totalOutstanding;

//     if (total === 0) {
//       return [
//         { label: 'No Data', value: 0, percentage: 100, strokeDash: '100 100', strokeOffset: 0, color: 'stroke-zinc-200' }
//       ];
//     }

//     const segmentsRaw = [
//       { label: 'Net Sales', value: totalNetSalesVolume, color: 'stroke-emerald-600', fill: 'bg-emerald-600' },
//       { label: 'Store Credit', value: totalCreditVolume, color: 'stroke-red-500', fill: 'bg-red-500' },
//       { label: 'Outstanding Dues', value: totalOutstanding, color: 'stroke-amber-500', fill: 'bg-amber-500' }
//     ];

//     let accumulatedPercentage = 0;
//     return segmentsRaw.map(seg => {
//       const pct = (seg.value / total) * 100;
//       // Circumference of radius 15 ring = 2 * Math.PI * 15 ≈ 94.24
//       const circumference = 94.24;
//       const strokeDash = `${(pct / 100) * circumference} ${circumference}`;
//       const strokeOffset = -((accumulatedPercentage / 100) * circumference);
      
//       accumulatedPercentage += pct;
//       return { ...seg, percentage: pct, strokeDash, strokeOffset };
//     });
//   }, [dashboardStats]);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans">
//         <div className="h-6 w-6 rounded-full border-2 border-zinc-200 border-t-zinc-950 animate-spin" />
//         <span className="text-[10px] tracking-widest uppercase font-bold text-zinc-400 mt-3 animate-pulse">Syncing Operational Telemetry</span>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full min-h-full overflow-y-auto font-sans">

//       {/* Header Info */}
//       <div className="border-b border-zinc-200 pb-5">
//         <h1 className="text-base font-bold tracking-tight text-zinc-900">Operations Dashboard</h1>
//         <p className="text-xs text-zinc-400 mt-0.5">Real-time storefront parameters, tracking metrics summary, and logistical alerts overview.</p>
//       </div>

//       {/* Top Statistics Responsive Grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 select-none">
//         <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
//           <div>
//             <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Catalog Line Items</span>
//             <h2 className="text-2xl font-black text-zinc-900 mt-2">{dashboardStats.totalCatalogItems}</h2>
//           </div>
//           <div className="mt-2 text-[10px] text-zinc-400 font-medium">Registered Active Types</div>
//         </div>

//         <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
//           <div>
//             <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Stock Volume</span>
//             <h2 className="text-2xl font-black text-zinc-900 mt-2">{dashboardStats.totalStockVolume}</h2>
//           </div>
//           <div className="mt-2 text-[10px] text-zinc-400 font-medium">Physical Inventory Pieces</div>
//         </div>

//         <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
//           <div>
//             <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Active Client Profiles</span>
//             <h2 className="text-2xl font-black text-zinc-900 mt-2">{dashboardStats.activeClientProfiles}</h2>
//           </div>
//           <div className="mt-2 text-[10px] text-zinc-400 font-medium">Saved Ledger Registries</div>
//         </div>

//         <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
//           <div>
//             <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Today's Cash Intake</span>
//             <h2 className="text-xl font-black font-mono tracking-tight text-emerald-700 mt-2.5">₹{dashboardStats.todaysRevenue.toFixed(2)}</h2>
//           </div>
//           <div className="mt-2 text-[10px] text-zinc-400 font-medium">Net Realized Collection</div>
//         </div>

//         <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
//           <div>
//             <div className="flex justify-between items-center">
//               <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Outstanding</span>
//               {dashboardStats.totalCreditVolume > 0 && <span className="px-1 text-[8px] font-black text-red-700 bg-red-50 border border-red-200 rounded">Credit Active</span>}
//             </div>
//             <h2 className="text-xl font-black font-mono tracking-tight text-amber-600 mt-2.5">₹{dashboardStats.totalOutstanding.toFixed(2)}</h2>
//           </div>
//           {dashboardStats.totalCreditVolume > 0 ? (
//             <div className="mt-2 text-[10px] text-red-600 font-bold">Surplus Store Credit: ₹{dashboardStats.totalCreditVolume.toFixed(2)}</div>
//           ) : (
//             <div className="mt-2 text-[10px] text-zinc-400 font-medium">Unsettled Accrual Credit</div>
//           )}
//         </div>
//       </div>

//       {/* MIDDLE ANALYTICS BLOCK: Visual Line Graph & New Pie Chart */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
//         {/* Left Side: Weekly Revenue Trend Line Graph */}
//         <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-2xs p-5 space-y-4">
//           <div className="flex justify-between items-center select-none">
//             <div className="space-y-0.5">
//               <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Financial Run Performance</span>
//               <h3 className="text-xs font-bold text-zinc-800">Weekly Revenue Collection Trend</h3>
//             </div>
//             <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">Live Feed Connected</span>
//           </div>

//           <div className="w-full relative pt-2">
//             <svg viewBox={`0 0 ${svgLineCoordinates.width} ${svgLineCoordinates.height}`} className="w-full h-44 overflow-visible">
//               {svgLineCoordinates.points.map((p, i) => (
//                 <line key={i} x1={p.x} y1={0} x2={p.x} y2={svgLineCoordinates.height - svgLineCoordinates.padding} className="stroke-zinc-100 stroke-1 stroke-dasharray-[3,3]" />
//               ))}
//               <path d={svgLineCoordinates.areaD} className="fill-emerald-50/40" />
//               <path d={svgLineCoordinates.pathD} className="stroke-emerald-600 stroke-2 fill-none" />
//               {svgLineCoordinates.points.map((p, i) => (
//                 <g key={i} className="group cursor-pointer">
//                   <circle cx={p.x} cy={p.y} r={3.5} className="fill-white stroke-emerald-600 stroke-2 group-hover:r-5 transition-all duration-150" />
//                   <text x={p.x} y={p.y - 10} textAnchor="middle" className="font-mono font-bold text-[8px] fill-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity duration-150">₹{p.val.toFixed(0)}</text>
//                 </g>
//               ))}
//               {svgLineCoordinates.points.map((p, i) => (
//                 <text key={i} x={p.x} y={svgLineCoordinates.height - 4} textAnchor="middle" className="fill-zinc-400 font-mono text-[9px] font-bold select-none">{p.label}</text>
//               ))}
//             </svg>
//           </div>
//         </div>

//         {/* 💡 Right Side: NEW HIGH-CONTRAST FINANCIAL SUMMARY PIE CHART */}
//         <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs p-5 space-y-4 flex flex-col justify-between min-h-[244px]">
//           <div className="space-y-0.5 select-none">
//             <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Ledger Allocation Share</span>
//             <h3 className="text-xs font-bold text-zinc-800">Dues, Sales & Credits Ratio</h3>
//           </div>

//           <div className="flex items-center justify-center gap-6 py-2">
//             {/* SVG Donut / Pie Render Block */}
//             <div className="relative w-28 h-28 flex items-center justify-center">
//               <svg viewBox="0 0 40 40" className="w-full h-full transform -rotate-90">
//                 {pieChartSegments.map((seg, idx) => (
//                   <circle
//                     key={idx}
//                     cx="20"
//                     cy="20"
//                     r="15"
//                     fill="transparent"
//                     className={`stroke-[6] ${seg.color} transition-all duration-300`}
//                     strokeDasharray={seg.strokeDash}
//                     strokeDashoffset={seg.strokeOffset}
//                   />
//                 ))}
//               </svg>
//               <div className="absolute inset-0 flex flex-col items-center justify-center select-none bg-white rounded-full m-4 shadow-3xs border border-zinc-50">
//                 <span className="text-[8px] font-bold uppercase text-zinc-400 tracking-wider">Metrics</span>
//                 <span className="text-[10px] font-black font-mono text-zinc-800">Balanced</span>
//               </div>
//             </div>

//             {/* Micro Side Legend Indicators */}
//             <div className="flex-1 space-y-2 select-none text-[10px] font-semibold text-zinc-600">
//               {pieChartSegments.map((seg, idx) => (
//                 <div key={idx} className="flex flex-col gap-0.5">
//                   <div className="flex items-center gap-1.5">
//                     <span className={`h-2 w-2 rounded-full ${seg.fill}`} />
//                     <span className="truncate text-zinc-800 font-bold">{seg.label}</span>
//                   </div>
//                   <span className="font-mono text-zinc-400 pl-3.5">{seg.percentage.toFixed(1)}%</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//       </div>

//       {/* LOWER PANEL BLOCK: Watchlist and Access Links */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
//         {/* Left Bottom Card: Critical Low Stock Alert Table */}
//         <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
//           <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center select-none">
//             <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Critical Low-Stock Watchlist</span>
//             <span className={`text-[10px] font-black px-2 py-0.5 font-mono rounded-md border ${
//               dashboardStats.lowStockWatchlist.length > 0 ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' : 'bg-zinc-100 border-zinc-200 text-zinc-500'
//             }`}>
//               {dashboardStats.lowStockWatchlist.length} Flags
//             </span>
//           </div>

//           <div className="p-4">
//             {dashboardStats.lowStockWatchlist.length > 0 ? (
//               <div className="overflow-x-auto">
//                 <table className="w-full text-left text-xs font-medium border-collapse">
//                   <thead>
//                     <tr className="bg-zinc-50 border-b border-zinc-200 font-bold uppercase tracking-wider text-zinc-400 select-none">
//                       <th className="px-4 py-2">Product Name</th>
//                       <th className="px-4 py-2 w-36">SKU Identifier</th>
//                       <th className="px-4 py-2 w-32 text-center">Remaining Stock</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-zinc-100 text-zinc-700">
//                     {dashboardStats.lowStockWatchlist.map((item) => (
//                       <tr key={item._id} className="hover:bg-red-50/10 transition-colors">
//                         <td className="px-4 py-3 font-bold text-zinc-900">{item.name}</td>
//                         <td className="px-4 py-3 font-mono text-zinc-400">{item.sku || 'N/A'}</td>
//                         <td className="px-4 py-3 text-center">
//                           <span className="inline-block px-2 py-0.5 rounded-sm font-black font-mono text-[10px] bg-red-50 border border-red-100 text-red-700">
//                             {item.stockQuantity} Left ⚠️
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <div className="py-8 text-center text-zinc-400 italic text-xs select-none flex flex-col items-center justify-center gap-1">
//                 <span><span>✨ Logistics clear. Every asset threshold is balanced safely above operational targets.</span></span>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right Bottom Card: Access Navigation Links */}
//         <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-2xs space-y-4 select-none">
//           <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">
//             Terminal Access Links
//           </span>

//           <div className="flex flex-col gap-3">
//             <button
//               type="button"
//               onClick={() => navigate('/billing')}
//               className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer shadow-xs active:scale-98"
//             >
//               Open Checkout Terminal
//             </button>

//             <button
//               type="button"
//               onClick={() => navigate('/stock')}
//               className="w-full h-10 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-bold uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer shadow-3xs active:scale-98"
//             >
//               Adjust Storage Parameters
//             </button>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default Dashboard;

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();

  // Core Data Stream Hooks
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardMetrics = async () => {
    try {
      const [productsRes, customersRes, invoicesRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/customers'),
        axios.get('/invoices')
      ]);

      setProducts(productsRes.data || []);
      setCustomers(customersRes.data || []);
      setInvoices(invoicesRes.data || []);
    } catch (error) {
      console.error("Dashboard performance telemetry synchronization fail:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  // 📊 COMPREHENSIVE FINANCIAL & LOGISTICAL ANALYTICS METRICS ENGINE
  const dashboardStats = useMemo(() => {
    const totalCatalogItems = products.length;
    const totalStockVolume = products.reduce((acc, curr) => acc + (Number(curr.stockQuantity) || 0), 0);
    const activeClientProfiles = customers.length;

    // 1. Today's Revenue Shift (Accounting accurately for return reductions)
    const todayStr = new Date().toDateString();
    const todaysRevenue = invoices
      .filter(inv => new Date(inv.createdAt).toDateString() === todayStr)
      .reduce((acc, inv) => {
        const originalGrandTotal = Number(inv.grandTotal) || 0;
        const totalPaidSoFar = Number(inv.amountPaid) || 0;
        const invoiceReturnCredit = (inv.returnedHistory || []).reduce((sum, r) => sum + (Number(r.returnedAmount) || 0), 0);
        
        if (inv.paymentStatus === 'Paid') {
          return acc + (originalGrandTotal - invoiceReturnCredit);
        }
        return acc + totalPaidSoFar;
      }, 0);

    // 2. TOTAL OUTSTANDING BALANCE, ACCUMULATED REAL SALES, & CREDIT SPILLOVER ENGINE
    let totalOutstanding = 0;
    let totalCreditVolume = 0;
    let totalNetSalesVolume = 0;

    const customerBalanceMap = {};

    invoices.forEach(inv => {
      const originalGrandTotal = Number(inv.grandTotal) || 0;
      const totalPaidSoFar = Number(inv.amountPaid) || 0;
      const invoiceReturnCredit = (inv.returnedHistory || []).reduce((sum, r) => sum + (Number(r.returnedAmount) || 0), 0);
      const isPureReturn = inv.items?.every(item => item.status === 'returned') && invoiceReturnCredit > 0;

      // Accumulate overall true net checkout volumes
      if (!isPureReturn) {
        totalNetSalesVolume += (originalGrandTotal - invoiceReturnCredit);
      }

      if (!inv.customer) return;
      const custId = (inv.customer._id || inv.customer).toString();
      if (!customerBalanceMap[custId]) customerBalanceMap[custId] = 0;

      if (inv.paymentStatus === 'Paid') {
        if (isPureReturn) {
          customerBalanceMap[custId] -= invoiceReturnCredit;
        }
      } else {
        const invoiceOutstandingDeficit = originalGrandTotal - totalPaidSoFar - invoiceReturnCredit;
        customerBalanceMap[custId] += invoiceOutstandingDeficit;
      }
    });

    Object.values(customerBalanceMap).forEach(balance => {
      if (balance > 0) totalOutstanding += balance;
      if (balance < 0) totalCreditVolume += Math.abs(balance);
    });

    // 3. 💡 FIXED: Package-Aware Low Inventory Filter (2 Cartons or 5 Pieces)
    const lowStockWatchlist = products.filter(p => {
      if (p.packagingType === 'cartoon') {
        return (Number(p.cartoonCount) || 0) <= 2;
      }
      return (Number(p.stockQuantity) || 0) <= 5;
    });

    // 4. Compile Weekly Metrics for Trend Graph
    const weeklyTrendData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateString = d.toDateString();
      const label = d.toLocaleDateString(undefined, { weekday: 'short' });

      const dayRevenue = invoices
        .filter(inv => new Date(inv.createdAt).toDateString() === dateString)
        .reduce((acc, inv) => {
          if (inv.paymentStatus === 'Paid') {
            const returns = (inv.returnedHistory || []).reduce((sum, r) => sum + (Number(r.returnedAmount) || 0), 0);
            return acc + (Number(inv.grandTotal || 0) - returns);
          }
          return acc + (Number(inv.amountPaid) || 0);
        }, 0);

      return { label, revenue: Math.max(0, dayRevenue) };
    });

    return {
      totalCatalogItems,
      totalStockVolume,
      activeClientProfiles,
      todaysRevenue,
      totalOutstanding,
      totalCreditVolume,
      totalNetSalesVolume,
      lowStockWatchlist,
      weeklyTrendData
    };
  }, [products, customers, invoices]);

  // Generate responsive coordinates for the SVG Line Graph
  const svgLineCoordinates = useMemo(() => {
    const data = dashboardStats.weeklyTrendData;
    const maxVal = Math.max(...data.map(d => d.revenue), 1000); 
    const width = 500;
    const height = 140;
    const padding = 20;

    const points = data.map((d, i) => {
      const x = padding + (i * (width - padding * 2) / (data.length - 1));
      const y = height - padding - (d.revenue * (height - padding * 2) / maxVal);
      return { x, y, label: d.label, val: d.revenue };
    });

    const pathD = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
    const areaD = points.length ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : '';

    return { points, pathD, areaD, height, width, padding };
  }, [dashboardStats.weeklyTrendData]);

  // Calculates coordinates for the financial Share Pie Chart
  const pieChartSegments = useMemo(() => {
    const { totalNetSalesVolume, totalCreditVolume, totalOutstanding } = dashboardStats;
    const total = totalNetSalesVolume + totalCreditVolume + totalOutstanding;

    if (total === 0) {
      return [
        { label: 'No Data', value: 0, percentage: 100, strokeDash: '100 100', strokeOffset: 0, color: 'stroke-zinc-200' }
      ];
    }

    const segmentsRaw = [
      { label: 'Net Sales', value: totalNetSalesVolume, color: 'stroke-emerald-600', fill: 'bg-emerald-600' },
      { label: 'Store Credit', value: totalCreditVolume, color: 'stroke-red-500', fill: 'bg-red-500' },
      { label: 'Outstanding Dues', value: totalOutstanding, color: 'stroke-amber-500', fill: 'bg-amber-500' }
    ];

    let accumulatedPercentage = 0;
    return segmentsRaw.map(seg => {
      const pct = (seg.value / total) * 100;
      const circumference = 94.24;
      const strokeDash = `${(pct / 100) * circumference} ${circumference}`;
      const strokeOffset = -((accumulatedPercentage / 100) * circumference);
      
      accumulatedPercentage += pct;
      return { ...seg, percentage: pct, strokeDash, strokeOffset };
    });
  }, [dashboardStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans">
        <div className="h-6 w-6 rounded-full border-2 border-zinc-200 border-t-zinc-950 animate-spin" />
        <span className="text-[10px] tracking-widest uppercase font-bold text-zinc-400 mt-3 animate-pulse">Syncing Operational Telemetry</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full min-h-full overflow-y-auto font-sans">

      {/* Header Info */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-base font-bold tracking-tight text-zinc-900">Operations Dashboard</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Real-time storefront parameters, tracking metrics summary, and logistical alerts overview.</p>
      </div>

      {/* Top Statistics Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 select-none">
        <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Catalog Line Items</span>
            <h2 className="text-2xl font-black text-zinc-900 mt-2">{dashboardStats.totalCatalogItems}</h2>
          </div>
          <div className="mt-2 text-[10px] text-zinc-400 font-medium">Registered Active Types</div>
        </div>

        <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Stock Volume</span>
            <h2 className="text-2xl font-black text-zinc-900 mt-2">{dashboardStats.totalStockVolume}</h2>
          </div>
          <div className="mt-2 text-[10px] text-zinc-400 font-medium">Physical Pieces Total</div>
        </div>

        <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Active Client Profiles</span>
            <h2 className="text-2xl font-black text-zinc-900 mt-2">{dashboardStats.activeClientProfiles}</h2>
          </div>
          <div className="mt-2 text-[10px] text-zinc-400 font-medium">Saved Ledger Registries</div>
        </div>

        <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Today's Cash Intake</span>
            <h2 className="text-xl font-black font-mono tracking-tight text-emerald-700 mt-2.5">₹{dashboardStats.todaysRevenue.toFixed(2)}</h2>
          </div>
          <div className="mt-2 text-[10px] text-zinc-400 font-medium">Net Realized Collection</div>
        </div>

        <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Outstanding</span>
              {dashboardStats.totalCreditVolume > 0 && <span className="px-1 text-[8px] font-black text-red-700 bg-red-50 border border-red-200 rounded">Credit Active</span>}
            </div>
            <h2 className="text-xl font-black font-mono tracking-tight text-amber-600 mt-2.5">₹{dashboardStats.totalOutstanding.toFixed(2)}</h2>
          </div>
          {dashboardStats.totalCreditVolume > 0 ? (
            <div className="mt-2 text-[10px] text-red-600 font-bold">Surplus Store Credit: ₹{dashboardStats.totalCreditVolume.toFixed(2)}</div>
          ) : (
            <div className="mt-2 text-[10px] text-zinc-400 font-medium">Unsettled Accrual Credit</div>
          )}
        </div>
      </div>

      {/* MIDDLE ANALYTICS BLOCK: Visual Line Graph & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Weekly Revenue Trend Line Graph */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-2xs p-5 space-y-4">
          <div className="flex justify-between items-center select-none">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Financial Run Performance</span>
              <h3 className="text-xs font-bold text-zinc-800">Weekly Revenue Collection Trend</h3>
            </div>
            <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">Live Feed Connected</span>
          </div>

          <div className="w-full relative pt-2">
            <svg viewBox={`0 0 ${svgLineCoordinates.width} ${svgLineCoordinates.height}`} className="w-full h-44 overflow-visible">
              {svgLineCoordinates.points.map((p, i) => (
                <line key={i} x1={p.x} y1={0} x2={p.x} y2={svgLineCoordinates.height - svgLineCoordinates.padding} className="stroke-zinc-100 stroke-1 stroke-dasharray-[3,3]" />
              ))}
              <path d={svgLineCoordinates.areaD} className="fill-emerald-50/40" />
              <path d={svgLineCoordinates.pathD} className="stroke-emerald-600 stroke-2 fill-none" />
              {svgLineCoordinates.points.map((p, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle cx={p.x} cy={p.y} r={3.5} className="fill-white stroke-emerald-600 stroke-2 group-hover:r-5 transition-all duration-150" />
                  <text x={p.x} y={p.y - 10} textAnchor="middle" className="font-mono font-bold text-[8px] fill-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity duration-150">₹{p.val.toFixed(0)}</text>
                </g>
              ))}
              {svgLineCoordinates.points.map((p, i) => (
                <text key={i} x={p.x} y={svgLineCoordinates.height - 4} textAnchor="middle" className="fill-zinc-400 font-mono text-[9px] font-bold select-none">{p.label}</text>
              ))}
            </svg>
          </div>
        </div>

        {/* Right Side: FINANCIAL SUMMARY PIE CHART */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs p-5 space-y-4 flex flex-col justify-between min-h-[244px]">
          <div className="space-y-0.5 select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Ledger Allocation Share</span>
            <h3 className="text-xs font-bold text-zinc-800">Dues, Sales & Credits Ratio</h3>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-full h-full transform -rotate-90">
                {pieChartSegments.map((seg, idx) => (
                  <circle
                    key={idx}
                    cx="20"
                    cy="20"
                    r="15"
                    fill="transparent"
                    className={`stroke-[6] ${seg.color} transition-all duration-300`}
                    strokeDasharray={seg.strokeDash}
                    strokeDashoffset={seg.strokeOffset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none bg-white rounded-full m-4 shadow-3xs border border-zinc-50">
                <span className="text-[8px] font-bold uppercase text-zinc-400 tracking-wider">Metrics</span>
                <span className="text-[10px] font-black font-mono text-zinc-800">Balanced</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 select-none text-[10px] font-semibold text-zinc-600">
              {pieChartSegments.map((seg, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${seg.fill}`} />
                    <span className="truncate text-zinc-800 font-bold">{seg.label}</span>
                  </div>
                  <span className="font-mono text-zinc-400 pl-3.5">{seg.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* LOWER PANEL BLOCK: Watchlist and Access Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Bottom Card: Critical Low Stock Alert Table */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Critical Low-Stock Watchlist</span>
            <span className={`text-[10px] font-black px-2 py-0.5 font-mono rounded-md border ${
              dashboardStats.lowStockWatchlist.length > 0 ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' : 'bg-zinc-100 border-zinc-200 text-zinc-500'
            }`}>
              {dashboardStats.lowStockWatchlist.length} Flags
            </span>
          </div>

          <div className="p-4">
            {dashboardStats.lowStockWatchlist.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 font-bold uppercase tracking-wider text-zinc-400 select-none">
                      <th className="px-4 py-2">Product Name</th>
                      <th className="px-4 py-2 w-32">SKU Identifier</th>
                      <th className="px-4 py-2 w-44 text-center">Remaining Stock Ledger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {dashboardStats.lowStockWatchlist.map((item) => (
                      <tr key={item._id} className="hover:bg-red-50/10 transition-colors">
                        <td className="px-4 py-3 font-bold text-zinc-900">{item.name}</td>
                        <td className="px-4 py-3 font-mono text-zinc-400">{item.sku || 'N/A'}</td>
                        <td className="px-4 py-3 text-center font-mono">
                          {item.packagingType === 'cartoon' ? (
                            <div className="space-y-0.5">
                              <span className="inline-block px-2 py-0.5 rounded-sm font-black text-[10px] bg-red-50 border border-red-100 text-red-700">
                                {item.cartoonCount} Cartons Left ⚠️
                              </span>
                              <div className="text-[9px] text-zinc-400 font-medium">({item.stockQuantity} Total Pcs)</div>
                            </div>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-sm font-black text-[10px] bg-red-50 border border-red-100 text-red-700">
                              {item.stockQuantity} Pieces Left ⚠️
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-400 italic text-xs select-none flex flex-col items-center justify-center gap-1">
                <span>✨ Logistics clear. Every asset threshold is balanced safely above operational targets.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Bottom Card: Access Navigation Links */}
        <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-2xs space-y-4 select-none">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">
            Terminal Access Links
          </span>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate('/billing')}
              className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer shadow-xs active:scale-98"
            >
              Open Checkout Terminal
            </button>

            <button
              type="button"
              onClick={() => navigate('/stock')}
              className="w-full h-10 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-bold uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer shadow-3xs active:scale-98"
            >
              Adjust Storage Parameters
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;