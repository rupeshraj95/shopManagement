import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const PastBills = () => {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // Administrative Pass Guard Modal States
  const [securityModal, setSecurityModal] = useState({ isOpen: false, targetInvoiceId: null, currentStatus: '' });
  const [adminPassword, setAdminPassword] = useState('');
  const [incomingPaymentAmount, setIncomingPaymentAmount] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeReceiptModal, setActiveReceiptModal] = useState(null);

  const fetchHistoricalLedger = async () => {
    try {
      const [customersRes, invoicesRes] = await Promise.all([
        axios.get('/customers'),
        axios.get('/invoices')
      ]);
      setCustomers(customersRes.data || []);
      setInvoices(invoicesRes.data || []);
    } catch (err) {
      console.error("Historical accounting hydration fail:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistoricalLedger(); }, []);

  const filteredCustomers = useMemo(() => {
    const target = searchQuery.trim().toLowerCase();
    if (!target) return customers;
    return customers.filter(c => c.name.toLowerCase().includes(target) || c.phone.includes(target));
  }, [searchQuery, customers]);

  // 💡 UI/UX REWRITE: Recalibrated calculation matrix for accurate Dues vs Credit spillover balances
  const ledgerMap = useMemo(() => {
    if (!expandedCustomer || !expandedCustomer._id) {
      return { history: [], lifeTimeSum: 0, remainingBalance: 0, totalCreditBalance: 0 };
    }
    
    const targetCustomerIdStr = expandedCustomer._id.toString();

    // Filter customer transactions safely using primitive string values
    const clientHistory = invoices.filter(inv => {
      if (!inv.customer) return false;
      const invCustIdStr = (inv.customer._id || inv.customer).toString();
      return invCustIdStr === targetCustomerIdStr;
    });

    let totalPurchasesSum = 0;
    let netRunningDueOrCredit = 0;

    clientHistory.forEach(inv => {
      const originalGrandTotal = Number(inv.grandTotal) || 0;
      const totalPaidSoFar = Number(inv.amountPaid) || 0;
      
      // Extract absolute credit value of customer returns
      const invoiceReturnCredit = (inv.returnedHistory || []).reduce((acc, r) => acc + (Number(r.returnedAmount) || 0), 0);
      const isPureReturn = inv.items?.every(item => item.status === 'returned') && invoiceReturnCredit > 0;

      // Formula A: Live Lifetime Purchases Calculation
      if (isPureReturn) {
        totalPurchasesSum -= invoiceReturnCredit;
      } else {
        totalPurchasesSum += (originalGrandTotal - invoiceReturnCredit);
      }

      // Formula B: Raw Net Balance Calculation (Before separating Dues from Credit balances)
      if (inv.paymentStatus === 'Paid') {
        // If paid, the invoice itself has no positive due balance remaining.
        // However, if a pure return was submitted under a "Paid" flag to clear it, it creates negative balance/credit.
        if (isPureReturn) {
          netRunningDueOrCredit -= invoiceReturnCredit;
        }
      } else {
        // For Pending or Partial accounts: compute remaining uncollected gap minus the current invoice returns credit
        const invoiceOutstandingDeficit = originalGrandTotal - totalPaidSoFar - invoiceReturnCredit;
        netRunningDueOrCredit += invoiceOutstandingDeficit;
      }
    });

    // Determine final values based on whether the net calculation is a Debt or a Store Credit Surplus
    const remainingBalance = netRunningDueOrCredit > 0 ? netRunningDueOrCredit : 0;
    const totalCreditBalance = netRunningDueOrCredit < 0 ? Math.abs(netRunningDueOrCredit) : 0;

    return {
      history: clientHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      lifeTimeSum: Math.max(0, totalPurchasesSum),
      remainingBalance,
      totalCreditBalance
    };
  }, [expandedCustomer, invoices]);

  const handleStatusBadgeClick = (invoiceId, trackingStatusMode) => {
    setAuthError('');
    setAdminPassword('');
    setIncomingPaymentAmount('');
    setSecurityModal({
      isOpen: true,
      targetInvoiceId: invoiceId,
      currentStatus: trackingStatusMode
    });
  };

  const handleAuthorizationSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      const storedAuthToken = localStorage.getItem('token'); 

      const payload = { 
        paymentStatus: securityModal.currentStatus,
        verificationPassword: adminPassword,
        incomingPaymentAmount: securityModal.currentStatus === 'Partial' ? Number(incomingPaymentAmount) : 0
      };

      const response = await axios.put(`/invoices/${securityModal.targetInvoiceId}`, payload, {
        headers: {
          Authorization: `Bearer ${storedAuthToken}`
        }
      });
      
      setInvoices(prev => prev.map(inv => inv._id === securityModal.targetInvoiceId ? response.data : inv));
      
      if (activeReceiptModal && activeReceiptModal._id === securityModal.targetInvoiceId) {
        setActiveReceiptModal(response.data);
      }

      setSecurityModal({ isOpen: false, targetInvoiceId: null, currentStatus: '' });
      await fetchHistoricalLedger();
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authorization failed.');
    }
  };

  if (loading) {
    return <div className="p-8 text-xs font-bold text-zinc-400 animate-pulse">Hydrating Terminal Ledger Records...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full min-h-full font-sans relative">
      
      {/* CSS Printing Custom Injection Block */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .main-pastbills-dashboard { display: none !important; }
          .print-modal-overlay {
            position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important;
            background: white !important; display: flex !important; justify-content: center !important;
            align-items: flex-start !important; padding: 0 !important; margin: 0 !important; overflow: visible !important;
          }
          .print-card-body {
            border: 1px solid #e4e4e7 !important; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
            border-radius: 1rem !important; width: 100% !important; max-width: 28rem !important;
            margin: 1rem auto !important; padding: 1.5rem !important; overflow: visible !important;
            background-color: white !important; display: block !important;
          }
        }
      `}} />

      {/* Main UI Layout Container */}
      <div className="main-pastbills-dashboard space-y-6 w-full print:hidden">
        <div className="border-b border-zinc-200 pb-5">
          <h1 className="text-base font-bold tracking-tight text-zinc-900">Past Bills Log</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Audit historical billing files, filter profile statement tracking ledgers, and adjust settlement states.</p>
        </div>

        {/* 💡 REWORKED: 3-Column Top Aggregate Dashboard Panel Grid Layout */}
        {expandedCustomer && (
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-2xs select-none animate-fadeIn">
            <div className="text-center pb-4 border-b border-zinc-100">
              <h2 className="text-base font-black text-zinc-900 mt-1">{expandedCustomer.name}</h2>
              <p className="text-xs text-zinc-400 font-mono font-medium mt-0.5">{expandedCustomer.phone}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 text-center divide-x divide-zinc-100">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Live Lifetime Purchases</div>
                <div className="text-xl font-black text-zinc-900 font-mono mt-1">₹{ledgerMap.lifeTimeSum.toFixed(2)}</div>
              </div>
              {/* 💡 NEW PROFILE CARD COLUMN: Displays current active storefront credit balance surplus */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Live Credit Balance</div>
                <div className={`text-xl font-black font-mono mt-1 ${ledgerMap.totalCreditBalance > 0 ? 'text-red-600 animate-pulse' : 'text-zinc-400'}`}>
                  ₹{ledgerMap.totalCreditBalance.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Remaining Due Balance</div>
                <div className={`text-xl font-black font-mono mt-1 ${ledgerMap.remainingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  ₹{ledgerMap.remainingBalance.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Side: Directory search */}
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-2xs space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 select-none">Search Customer Directory</label>
              <input type="text" placeholder="Lookup file by profile phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-xs rounded-xl border border-zinc-200 px-3.5 py-2 bg-white text-zinc-900 focus:outline-none" />
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs max-h-[500px] overflow-y-auto divide-y divide-zinc-100">
              {filteredCustomers.map(c => (
                <button key={c._id} type="button" onClick={() => setExpandedCustomer(c)} className={`w-full text-left px-4 py-3 text-xs font-bold transition flex flex-col gap-0.5 border-l-2 select-none cursor-pointer ${expandedCustomer?._id === c._id ? 'bg-zinc-50 border-zinc-900 text-zinc-950' : 'border-transparent text-zinc-600 hover:bg-zinc-50/40'}`}>
                  <span>{c.name}</span><span className="font-mono text-[10px] text-zinc-400 font-normal">{c.phone}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Detailed Invoice Registry */}
          <div className="lg:col-span-2">
            {expandedCustomer ? (
              <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden animate-fadeIn">
                <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50 select-none">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Archived Document Log Listings</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-medium">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 font-bold uppercase tracking-wider text-zinc-400 select-none">
                        <th className="px-4 py-2.5">Invoice Number</th>
                        <th className="px-4 py-2.5 w-24">Date Log</th>
                        <th className="px-4 py-2.5 w-44 text-center">Settlement Parameters</th>
                        <th className="px-4 py-2.5 w-24 text-right">Grand Total</th>
                        <th className="px-4 py-2.5 w-24 text-right text-emerald-600">Paid Amt</th>
                        <th className="px-4 py-2.5 w-28 text-right text-red-600">Return Credit</th>
                        <th className="px-4 py-2.5 w-24 text-right text-amber-600">Due Amt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      {ledgerMap.history.map((bill) => {
                        const rowReturnsSum = (bill.returnedHistory || []).reduce((acc, r) => acc + (Number(r.returnedAmount) || 0), 0);
                        const isPureReturn = bill.items?.every(item => item.status === 'returned') && rowReturnsSum > 0;
                        
                        const isFullyPaid = bill.paymentStatus === 'Paid';
                        const displayPaid = isFullyPaid ? (Number(bill.grandTotal) - rowReturnsSum) : (bill.amountPaid || 0);
                        const displayDue = isFullyPaid ? 0 : Math.max(0, Number(bill.grandTotal) - Number(bill.amountPaid || 0) - rowReturnsSum);

                        return (
                          <tr key={bill._id} className="hover:bg-zinc-50/20 transition duration-150">
                            <td className="px-4 py-3.5 font-bold"><button type="button" onClick={() => setActiveReceiptModal(bill)} className="text-zinc-900 hover:text-zinc-600 underline font-mono tracking-wide cursor-pointer">{bill.invoiceNumber}</button></td>
                            <td className="px-4 py-3.5 text-zinc-400 font-mono">{new Date(bill.createdAt).toLocaleDateString()}</td>
                            
                            <td className="px-4 py-3.5 text-center space-x-1 whitespace-nowrap select-none">
                              {isPureReturn ? (
                                <span className="inline-block px-3 py-0.5 text-[10px] font-black uppercase rounded-md bg-red-50 border border-red-200 text-red-700 tracking-wide">
                                  Returned ↺
                                </span>
                              ) : isFullyPaid ? (
                                <span className="inline-block px-4 py-0.5 text-[10px] font-black uppercase rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">
                                  Fully Paid ✓
                                </span>
                              ) : (
                                <>
                                  <button type="button" onClick={() => handleStatusBadgeClick(bill._id, 'Paid')} className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-sm border bg-white text-zinc-400 border-zinc-200 hover:text-zinc-950 cursor-pointer">Paid</button>
                                  <button type="button" onClick={() => handleStatusBadgeClick(bill._id, 'Partial')} className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-sm border bg-white text-zinc-400 border-zinc-200 hover:text-zinc-950 cursor-pointer">+ Inst</button>
                                  <button type="button" onClick={() => handleStatusBadgeClick(bill._id, 'Pending')} className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded-sm border cursor-pointer ${bill.paymentStatus === 'Pending' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-white text-zinc-400 border-zinc-200 hover:text-zinc-950'}`}>Pending</button>
                                </>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold font-mono text-zinc-900">₹{Number(bill.grandTotal).toFixed(2)}</td>
                            <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 bg-emerald-50/10">₹{Number(displayPaid).toFixed(2)}</td>
                            <td className={`px-4 py-3.5 text-right font-mono font-bold ${rowReturnsSum > 0 ? 'text-red-600 bg-red-50/20' : 'text-zinc-300'}`}>
                              {rowReturnsSum > 0 ? `₹${rowReturnsSum.toFixed(2)}` : '₹0.00'}
                            </td>
                            <td className={`px-4 py-3.5 text-right font-mono font-bold bg-amber-50/5 ${displayDue > 0 ? 'text-amber-600' : 'text-zinc-400'}`}>₹{displayDue.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <div className="h-64 border border-dashed border-zinc-200 rounded-xl flex items-center justify-center p-6 text-center text-zinc-400 italic text-xs bg-white/50 select-none">💡 Select a customer from the directory to view logs.</div>}
          </div>
        </div>
      </div>

      {/* DETAILED OVERLAY POPUP RECEIPT WINDOW */}
      {activeReceiptModal && (
        <div className="print-modal-overlay fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn select-none">
          <div className="print-card-body bg-white border border-zinc-200 shadow-xl rounded-2xl max-w-md w-full p-6 my-4 space-y-6 max-h-[85vh] overflow-y-auto animate-scaleUp">
            
            <button type="button" onClick={() => setActiveReceiptModal(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 print:hidden text-base cursor-pointer font-bold transition duration-150">✕</button>

            <div className="text-center space-y-1 pb-2 border-b border-zinc-100">
              <div className="h-9 w-9 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[10px] mx-auto font-black tracking-tighter print:bg-black print:text-white">AT</div>
              <h2 className="text-sm font-black uppercase tracking-normal leading-normal py-0.5 text-zinc-900 block">Abhishek Trading</h2>
              <p className="text-[10px] font-mono font-bold text-zinc-500">GSTIN: 10CQPPK6688F1ZI</p>
              <p className="text-[10px] font-mono text-zinc-500 font-bold tracking-wide">Date: {new Date(activeReceiptModal.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-[10px] font-mono text-zinc-400 mt-0.5">Document No: {activeReceiptModal.invoiceNumber}</p>
            </div>

            <div className="border-t border-b border-dashed border-zinc-200 py-3 text-xs space-y-1.5 font-medium print:border-zinc-300">
              <div className="flex justify-between text-zinc-500 print:text-zinc-700"><span>Client Operator:</span><span className="font-bold text-zinc-900">{activeReceiptModal.customer?.name || expandedCustomer?.name || 'Registered Account'}</span></div>
              <div className="flex justify-between text-zinc-500 print:text-zinc-700"><span>Phone Registry:</span><span className="font-mono text-zinc-900">{activeReceiptModal.customer?.phone || expandedCustomer?.phone}</span></div>
              <div className="flex justify-between text-zinc-500 print:text-zinc-700"><span>Settlement Status:</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded-sm print:text-black print:border-black ${activeReceiptModal.items?.every(i => i.status === 'returned') ? 'bg-red-50 text-red-700 border border-red-200' : activeReceiptModal.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                  {activeReceiptModal.items?.every(i => i.status === 'returned') ? 'Returned' : activeReceiptModal.paymentStatus}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <span className="block text-[9px] font-black tracking-widest text-zinc-400 uppercase print:text-zinc-500">Settled Line Items</span>
              <div className="divide-y divide-zinc-100 font-medium print:divide-zinc-200">
                {activeReceiptModal.items?.map((item, index) => {
                  const isReturned = item.status === 'returned';
                  return (
                    <div key={index} className="py-2 flex justify-between items-start text-zinc-800 print:text-black">
                      <div className="space-y-0.5">
                        <p className="font-bold text-zinc-900 print:text-black flex items-center gap-1.5">
                          {item.product?.name || 'Asset Component'}
                          {isReturned && <span className="px-1 py-0.2 text-[8px] font-black bg-red-50 text-red-700 border border-red-200 uppercase rounded">Returned</span>}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono print:text-zinc-600">Qty: {item.quantity} × ₹{Number(item.pricePerUnit).toFixed(2)}</p>
                      </div>
                      <span className={`font-mono font-bold ${isReturned ? 'text-red-600 print:text-black' : 'text-zinc-900'}`}>
                        {isReturned ? '-' : ''}₹{Math.abs(Number(item.rowTotal)).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-3 space-y-2 text-xs font-bold text-zinc-600 print:border-zinc-300 print:text-zinc-800">
              {activeReceiptModal.subTotal > 0 && <div className="flex justify-between"><span>Subtotal Balance</span><span className="font-mono text-zinc-900 print:text-black">₹{Number(activeReceiptModal.subTotal).toFixed(2)}</span></div>}
              {activeReceiptModal.taxAmount > 0 && <div className="flex justify-between"><span>Tax Duty Assessment</span><span className="font-mono text-zinc-900 print:text-black">₹{Number(activeReceiptModal.taxAmount).toFixed(2)}</span></div>}
              {activeReceiptModal.discountAmount > 0 && <div className="flex justify-between text-red-600"><span>Discount Above Tax</span><span className="font-mono">-₹{Number(activeReceiptModal.discountAmount).toFixed(2)}</span></div>}
              
              {activeReceiptModal.grandTotal > 0 ? (
                <>
                  <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-zinc-100 text-zinc-900 print:border-zinc-300"><span>Grand Total Settled</span><span className="text-lg font-black font-mono text-zinc-950 print:text-black">₹{Number(activeReceiptModal.grandTotal).toFixed(2)}</span></div>
                  <div className="flex justify-between text-emerald-800 bg-emerald-50/50 p-1.5 rounded-lg mt-1"><span>Total Amount Paid</span><span className="font-mono font-black">₹{Number(activeReceiptModal.paymentStatus === 'Paid' ? activeReceiptModal.grandTotal : (activeReceiptModal.amountPaid || 0)).toFixed(2)}</span></div>
                  {activeReceiptModal.grandTotal - activeReceiptModal.amountPaid > 0 && (
                    <div className="flex justify-between text-amber-700 bg-amber-50/40 p-1.5 rounded-md mt-1"><span>Balance Deficit Due</span><span className="font-mono font-black">₹{Math.max(0, activeReceiptModal.grandTotal - (activeReceiptModal.amountPaid || 0)).toFixed(2)}</span></div>
                  )}
                </>
              ) : (
                <div className="flex justify-between text-red-800 bg-red-50/50 p-2 border border-red-200 rounded-xl mt-1">
                  <span className="uppercase text-[10px] tracking-wider">Total Return Credit Voucher Issued</span>
                  <span className="font-mono font-black text-base">₹{Number(activeReceiptModal.returnedHistory?.[0]?.returnedAmount || 0).toFixed(2)}</span>
                </div>
              )}

              {activeReceiptModal.partialPayments?.length > 0 && (
                <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-xl font-medium space-y-1 mt-1 print:border-zinc-200">
                  <span className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider">Installment Stamps History Logs</span>
                  {activeReceiptModal.partialPayments.map((p, i) => (
                    <div key={i} className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Step {i+1} ({new Date(p.collectedAt).toLocaleDateString()}):</span>
                      <span className="font-bold text-zinc-700">₹{p.amountCollected.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 print:hidden select-none">
              <button type="button" onClick={() => window.print()} className="w-full py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center shadow-3xs">🖨️ Print Receipt</button>
              <button type="button" onClick={() => setActiveReceiptModal(null)} className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer text-center">Dismiss View</button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN RE-AUTHORIZATION SECURITY OVERLAY MODAL */}
      {securityModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white border border-zinc-200 rounded-xl max-w-xs w-full shadow-2xl p-4 space-y-3.5 text-xs font-medium animate-fadeIn">
            <span className="block text-[10px] font-bold uppercase text-zinc-500 select-none">Security Check</span>
            
            <form onSubmit={handleAuthorizationSubmit} className="space-y-3">
              {authError && <p className="p-2 bg-red-50 text-red-700 font-bold rounded-lg border border-red-200">⚠️ {authError}</p>}
              
              {securityModal.currentStatus === 'Partial' && (
                <div className="p-2 border border-amber-200 bg-amber-50/10 rounded-xl space-y-1.5">
                  <label className="block text-[9px] text-amber-700 font-black uppercase">Collected Installment Value (₹)</label>
                  <input autoFocus required type="number" min="1" step="0.01" placeholder="0.00" value={incomingPaymentAmount} onChange={(e) => setIncomingPaymentAmount(e.target.value)} className="w-full text-right border border-amber-200 bg-white font-mono rounded-xl px-2.5 py-1 text-zinc-900 focus:outline-hidden" />
                </div>
              )}

              <div>
                <label className="block font-bold text-zinc-500 uppercase text-[9px]">Admin Password</label>
                <input required type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" className="mt-1.5 w-full border rounded-xl px-3 py-1.5 bg-white focus:outline-hidden" />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t mt-4 select-none">
                <button type="button" onClick={() => setSecurityModal({ isOpen: false, targetInvoiceId: null, currentStatus: '' })} className="px-3 py-1 border rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-zinc-900 text-white font-bold rounded-xl shadow-xs cursor-pointer">Authorize Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PastBills;