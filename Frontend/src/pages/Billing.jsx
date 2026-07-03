import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const Billing = () => {
  // Core Telemetry Registries
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Active Invoice Parameter Matrix
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Manages structural transaction mode toggle workspace state parameters
  const [transactionMode, setTransactionMode] = useState('sale'); // 'sale' or 'return'

  const [invoiceItems, setInvoiceItems] = useState([
    { id: Date.now(), product: '', quantity: 1, pricePerUnit: 0, status: 'included' }
  ]);
  const [taxAmount, setTaxAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState('');

  const refreshCoreRecords = async () => {
    try {
      const [productsResponse, customersResponse] = await Promise.all([
        axios.get('/products'),
        axios.get('/customers')
      ]);
      setProducts(productsResponse.data || []);
      setCustomers(customersResponse.data || []);
    } catch (error) {
      console.error("Failed to sync core terminal telemetry data:", error.message);
    }
  };

  useEffect(() => { refreshCoreRecords(); }, []);

  // Sync rows instantly when mode transforms
  useEffect(() => {
    setInvoiceItems(prev => prev.map(item => ({
      ...item,
      status: transactionMode === 'return' ? 'returned' : 'included'
    })));
  }, [transactionMode]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query));
  }, [customerSearch, customers]);

  const billingCalculations = useMemo(() => {
    let subTotal = 0;
    let totalReturnsCredit = 0;
    let hasInventoryDeficit = false;

    const analyzedItems = invoiceItems.map(item => {
      const targetProduct = products.find(p => p._id === item.product);
      const inventoryCeiling = targetProduct ? targetProduct.stockQuantity : 0;

      const absoluteLineCost = item.pricePerUnit * (Number(item.quantity) || 0);
      const isIncluded = item.status === 'included';

      if (isIncluded) {
        subTotal += absoluteLineCost;
      } else if (item.status === 'returned') {
        totalReturnsCredit += absoluteLineCost;
      }

      const isOverStock = isIncluded && targetProduct && item.quantity > inventoryCeiling;
      if (isOverStock) hasInventoryDeficit = true;

      return {
        ...item,
        name: targetProduct ? targetProduct.name : 'Unknown Product',
        rowTotal: isIncluded ? absoluteLineCost : -absoluteLineCost,
        availableStock: inventoryCeiling,
        isInvalid: isOverStock
      };
    });

    const parsedTax = Number(taxAmount) || 0;
    const parsedDiscount = Number(discountAmount) || 0;
    const grandTotal = Math.max(0, subTotal + parsedTax - parsedDiscount);
    const netDueTarget = Math.max(0, grandTotal - totalReturnsCredit);

    return {
      items: analyzedItems,
      subTotal,
      grandTotal,
      totalReturnsCredit,
      netDueTarget,
      hasInventoryDeficit,
      isBlocked: !selectedCustomer || 
                 invoiceItems.length === 0 || 
                 invoiceItems.some(i => !i.product || i.quantity === '') || 
                 (transactionMode === 'sale' && hasInventoryDeficit) ||
                 (transactionMode === 'sale' && paymentStatus === 'Partial' && (Number(partialAmount) <= 0 || Number(partialAmount) >= netDueTarget))
    };
  }, [invoiceItems, products, taxAmount, discountAmount, selectedCustomer, paymentStatus, partialAmount, transactionMode]);

  const appendRowItem = () => {
    setInvoiceItems(prev => [...prev, { 
      id: Date.now(), 
      product: '', 
      quantity: '', 
      pricePerUnit: 0, 
      status: transactionMode === 'return' ? 'returned' : 'included' 
    }]);
  };

  const clearRowItem = (id) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  };

  const modifyRowField = (id, field, value) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const revisedItem = { ...item, [field]: value };
      if (field === 'product') {
        const match = products.find(p => p._id === value);
        revisedItem.pricePerUnit = match ? match.price : 0;
      }
      return revisedItem;
    }));
  };

  const executeInvoiceCompilation = async (e) => {
    e?.preventDefault();
    if (billingCalculations.isBlocked) return;
    setIsSubmitting(true);
    setErrorFeedback('');

    try {
      const payload = {
        customer: selectedCustomer._id,
        items: billingCalculations.items.map(({ product, quantity, pricePerUnit, status }) => ({
          product, quantity, pricePerUnit, status
        })),
        taxAmount: transactionMode === 'return' ? 0 : (Number(taxAmount) || 0),
        discountAmount: transactionMode === 'return' ? 0 : (Number(discountAmount) || 0),
        paymentStatus: transactionMode === 'return' ? 'Paid' : paymentStatus,
        partialAmount: (transactionMode === 'sale' && paymentStatus === 'Partial') ? Number(partialAmount) : 0
      };

      const response = await axios.post('/invoices', payload);
      setCompletedInvoice(response.data.invoice);

      setSelectedCustomer(null);
      setCustomerSearch('');
      setInvoiceItems([{ id: Date.now(), product: '', quantity: 1, pricePerUnit: 0, status: 'included' }]);
      setTaxAmount('');
      setDiscountAmount('');
      setPartialAmount('');
      setPaymentStatus('Paid');
      setTransactionMode('sale');

      await refreshCoreRecords();
    } catch (err) {
      setErrorFeedback(err.response?.data?.message || 'Transaction compilation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumericInputClearance = (value, setterStateFunction) => {
    if (value === '') { setterStateFunction(''); return; }
    const parsedValue = parseFloat(value);
    setterStateFunction(isNaN(parsedValue) ? '' : parsedValue);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full min-h-full overflow-y-auto font-sans">
      <div className="border-b border-zinc-200 pb-5 print:hidden">
        <h1 className="text-base font-bold tracking-tight text-zinc-900">New Sale (Billing)</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Initialize customer transactions, process returned components, and issue immediate receipts.</p>
      </div>

      {errorFeedback && <div className="p-3.5 text-xs font-semibold border rounded-xl bg-red-50 border-red-200 text-red-800 print:hidden">⚠️ {errorFeedback}</div>}

      {completedInvoice ? (
        <div className="relative z-50 max-w-md mx-auto bg-white border border-zinc-200 shadow-xl rounded-2xl p-6 space-y-6 animate-scaleUp print:border-none print:shadow-none print:p-0 print:max-w-full my-4">
          <div className="text-center space-y-1 pb-2 border-b border-zinc-100">
            <div className="h-9 w-9 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[10px] mx-auto font-black tracking-tighter print:bg-black print:text-white">AT</div>
            <h2 className="text-sm font-black uppercase tracking-normal leading-normal py-0.5 text-zinc-900 block">Abhishek Trading</h2>
            <p className="text-[10px] font-mono font-bold text-zinc-500 tracking-wider">GSTIN: 10CQPPK6688F1ZI</p>
            <p className="text-[10px] font-mono text-zinc-500 font-bold tracking-wide">Date: {new Date(completedInvoice.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-[10px] font-mono text-zinc-400 mt-0.5">Document No: {completedInvoice.invoiceNumber}</p>
          </div>

          <div className="border-t border-b border-dashed border-zinc-200 py-3 text-xs space-y-1.5 font-medium print:border-zinc-300">
            <div className="flex justify-between text-zinc-500 print:text-zinc-700"><span>Client Operator:</span><span className="font-bold text-zinc-900">{completedInvoice.customer?.name || 'Registered Account'}</span></div>
            <div className="flex justify-between text-zinc-500 print:text-zinc-700"><span>Phone Registry:</span><span className="font-mono text-zinc-900">{completedInvoice.customer?.phone}</span></div>
            <div className="flex justify-between text-zinc-500 print:text-zinc-700"><span>Settlement Status:</span><span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded-sm print:text-black print:border-black ${completedInvoice.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>{completedInvoice.paymentStatus}</span></div>
          </div>

          <div className="space-y-2.5 text-xs">
            <span className="block text-[9px] font-black tracking-widest text-zinc-400 uppercase print:text-zinc-500">Settled Line Items</span>
            <div className="divide-y divide-zinc-100 font-medium print:divide-zinc-200">
              {completedInvoice.items?.map((item, index) => {
                const isItemReturn = item.status === 'returned';
                return (
                  <div key={index} className="py-2 flex justify-between items-start text-zinc-800 print:text-black">
                    <div className="space-y-0.5">
                      <p className="font-bold text-zinc-900 print:text-black flex items-center gap-1">
                        {item.product?.name || 'Asset Component'}
                        {isItemReturn && <span className="text-[8px] px-1 bg-red-50 text-red-600 rounded uppercase font-black tracking-wide border border-red-200">Returned</span>}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono print:text-zinc-600">Qty: {item.quantity} × ₹{Number(item.pricePerUnit).toFixed(2)}</p>
                    </div>
                    <span className={`font-mono font-bold ${isItemReturn ? 'text-red-600 print:text-black' : 'text-zinc-900'}`}>
                      {isItemReturn ? '-' : ''}₹{Math.abs(Number(item.rowTotal)).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 space-y-2 text-xs font-bold text-zinc-600 print:border-zinc-300 print:text-zinc-800">
            {completedInvoice.subTotal > 0 && <div className="flex justify-between"><span>Subtotal Balance</span><span className="font-mono text-zinc-900 print:text-black">₹{Number(completedInvoice.subTotal).toFixed(2)}</span></div>}
            {completedInvoice.taxAmount > 0 && <div className="flex justify-between"><span>Tax Duty Assessment</span><span className="font-mono text-zinc-900 print:text-black">₹{Number(completedInvoice.taxAmount).toFixed(2)}</span></div>}
            {completedInvoice.discountAmount > 0 && <div className="flex justify-between text-red-600"><span>Discount Above Tax</span><span className="font-mono">-₹{Number(completedInvoice.discountAmount).toFixed(2)}</span></div>}
            
            {completedInvoice.grandTotal > 0 ? (
              <>
                <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-zinc-100 text-zinc-900 print:border-zinc-300"><span className="uppercase text-[10px] tracking-wider">Grand Total Settled</span><span className="text-lg font-black font-mono text-zinc-950 print:text-black">₹{Number(completedInvoice.grandTotal).toFixed(2)}</span></div>
                <div className="flex justify-between text-emerald-800 bg-emerald-50/50 p-1.5 rounded-lg mt-1"><span>Amount Paid</span><span className="font-mono font-black">₹{Number(completedInvoice.amountPaid).toFixed(2)}</span></div>
                {completedInvoice.grandTotal - completedInvoice.amountPaid > 0 && (
                  <div className="flex justify-between text-amber-800 bg-amber-50/50 p-1.5 rounded-lg"><span>Balance Remainder Due</span><span className="font-mono font-black">₹{(completedInvoice.grandTotal - completedInvoice.amountPaid).toFixed(2)}</span></div>
                )}
              </>
            ) : (
              <div className="flex justify-between text-red-800 bg-red-50/50 p-2 border border-red-200 rounded-xl mt-1">
                <span className="uppercase text-[10px] tracking-wider">Total Return Credit Issued</span>
                <span className="font-mono text-base font-black">
                  ₹{Number(completedInvoice.returnedHistory?.[0]?.returnedAmount || 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 print:hidden select-none">
            <button type="button" onClick={() => window.print()} className="w-full py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center shadow-3xs">🖨️ Print Invoice</button>
            <button type="button" onClick={() => setCompletedInvoice(null)} className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center">Next Order ✓</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn print:hidden">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs relative space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Find Customer</label>
                <div className="mt-2 relative">
                  <input type="text" placeholder="Scan mobile number or trace account identity name..." value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }} onFocus={() => setShowCustomerDropdown(true)} className="w-full text-sm rounded-xl border border-zinc-200 px-3.5 py-1.5 focus:outline-hidden focus:border-zinc-900 bg-white" />
                  {showCustomerDropdown && customerSearch && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 shadow-xl rounded-xl z-50 max-h-44 overflow-y-auto divide-y divide-zinc-100">
                      {filteredCustomers.map(c => (
                        <button key={c._id} type="button" onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowCustomerDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-zinc-50 text-zinc-900 flex justify-between items-center"><span>{c.name}</span><span className="text-zinc-400 font-mono font-normal">{c.phone}</span></button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedCustomer && (
                  <div className="mt-3 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="font-bold text-zinc-800"><span>{selectedCustomer.name}</span><span className="mx-2 text-zinc-300">|</span><span className="text-zinc-500 font-mono">{selectedCustomer.phone}</span></div>
                    <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); setTransactionMode('sale'); }} className="text-zinc-400 hover:text-red-600 font-bold cursor-pointer">Unlink</button>
                  </div>
                )}
              </div>

              {selectedCustomer && (
                <div className="animate-fadeIn pt-1 border-t border-zinc-100">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 select-none mb-2">Select Transaction Mode Workspace</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setTransactionMode('sale')} className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer select-none text-center ${transactionMode === 'sale' ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}>📦 Order / Standard Sale (Included)</button>
                    <button type="button" onClick={() => setTransactionMode('return')} className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer select-none text-center ${transactionMode === 'return' ? 'bg-red-50 border-red-300 text-red-700 font-black shadow-2xs' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}>🔄 Customer Return Processing</button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center select-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Bill Entry Table</span>
                <button type="button" onClick={appendRowItem} className="text-xs font-bold text-zinc-900 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg hover:bg-zinc-50 cursor-pointer shadow-3xs">+ Append Row Item</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/70 border-b border-zinc-200 font-bold uppercase tracking-wider text-zinc-400 select-none">
                      <th className="px-4 py-2.5">Product Allocation</th>
                      <th className="px-4 py-2.5 w-24 text-right">Qty</th>
                      <th className="px-4 py-2.5 w-24 text-right">Rate</th>
                      {/* 💡 REMOVED: Status header column has been stripped away */}
                      <th className="px-4 py-2.5 w-24 text-right">Row Net</th>
                      <th className="px-4 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {billingCalculations.items.map((row) => (
                      <tr key={row.id} className={`transition-colors duration-150 ${row.isInvalid ? 'bg-red-50/60' : 'hover:bg-zinc-50/20'}`}>
                        <td className="px-4 py-3">
                          <select value={row.product} onChange={(e) => modifyRowField(row.id, 'product', e.target.value)} className="w-full rounded-lg border border-zinc-200 p-1 bg-white focus:outline-hidden font-medium">
                            <option value="">-- Choose Target --</option>
                            {products.map(p => <option key={p._id} value={p._id}>{p.sku} ({p.stockQuantity} left)</option>)}
                          </select>
                          {row.isInvalid && <p className="mt-1 text-[11px] font-bold text-red-600 animate-pulse">⚠️ Stock Not Available.</p>}
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="1" value={row.quantity === '' ? '' : row.quantity} onChange={(e) => {
                            const inputValue = e.target.value;
                            if (inputValue === '') {
                              modifyRowField(row.id, 'quantity', '');
                            } else {
                              const parsedValue = parseInt(inputValue, 10);
                              modifyRowField(row.id, 'quantity', Math.max(1, isNaN(parsedValue) ? 1 : parsedValue));
                            }
                          }} className="w-full text-right rounded-lg border border-zinc-200 p-1 bg-white focus:outline-none" />
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-zinc-400">₹{row.pricePerUnit.toFixed(2)}</td>
                        {/* 💡 REMOVED: Individual row status dropdown block column stripped completely */}
                        <td className={`px-4 py-3 text-right font-bold font-mono ${row.rowTotal < 0 ? 'text-red-600' : 'text-zinc-900'}`}>₹{row.rowTotal.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center"><button type="button" onClick={() => clearRowItem(row.id)} disabled={invoiceItems.length === 1} className="text-zinc-300 hover:text-red-600 disabled:opacity-20 transition font-bold cursor-pointer">✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar Totals Aggregates Box */}
          <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-2xs space-y-4 sticky top-20">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2 select-none">Checkout Aggregates</span>
            
            {transactionMode === 'sale' ? (
              <>
                <div className="space-y-3.5 border-b border-zinc-100 pb-4 animate-fadeIn">
                  <div className="flex justify-between font-bold text-zinc-600 text-xs"><span>Subtotal</span><span className="font-bold font-mono text-zinc-900">₹{billingCalculations.subTotal.toFixed(2)}</span></div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase tracking-wider select-none">Tax (₹)</label>
                    <input type="number" min="0" value={taxAmount} placeholder="0" onChange={(e) => handleNumericInputClearance(e.target.value, setTaxAmount)} className="w-full text-right rounded-xl border border-zinc-200 px-3 py-1 font-mono text-xs focus:outline-hidden" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-red-500 mb-1 font-bold uppercase tracking-wider select-none">Discount Above Tax (₹)</label>
                    <input type="number" min="0" value={discountAmount} placeholder="0" onChange={(e) => handleNumericInputClearance(e.target.value, setDiscountAmount)} className="w-full text-right rounded-xl border border-red-200 bg-red-50/10 text-red-700 font-mono text-xs px-3 py-1 focus:outline-hidden" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase tracking-wider select-none">Settlement Parameters</label>
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full text-xs rounded-xl border border-zinc-200 px-2.5 py-1 bg-white focus:outline-hidden font-semibold">
                      <option value="Paid">Paid / Settled Document</option>
                      <option value="Pending">Pending / Accrual Credit</option>
                      <option value="Partial">Partial Payment / Installment</option>
                    </select>
                  </div>
                  {paymentStatus === 'Partial' && (
                    <div className="p-2.5 border border-amber-200 bg-amber-50/10 rounded-xl space-y-1.5 animate-fadeIn">
                      <label className="block text-[10px] text-amber-700 font-black uppercase tracking-wider">Upfront Collected Amount (₹)</label>
                      <input type="number" min="0" placeholder="0" value={partialAmount} onChange={(e) => handleNumericInputClearance(e.target.value, setPartialAmount)} className="w-full text-right border border-amber-300 rounded-xl px-3 py-1 font-mono text-xs text-amber-900 bg-white focus:outline-hidden" />
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-bold text-zinc-900 select-none uppercase tracking-wide">Grand Total</span>
                  <span className="text-xl font-black font-mono tracking-tight text-zinc-950">₹{billingCalculations.grandTotal.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="p-4 border border-red-200 bg-red-50/40 rounded-xl space-y-2 text-center animate-fadeIn select-none">
                <span className="block text-[10px] font-black text-red-700 tracking-widest uppercase">Total Customer Return Credit</span>
                <span className="block font-mono text-xl font-black text-red-700">₹{billingCalculations.totalReturnsCredit.toFixed(2)}</span>
                <p className="text-[10px] text-red-500 font-medium">This transaction logs outward store credit. Grand Total ledger rows sync to zero.</p>
              </div>
            )}

            <button type="button" disabled={billingCalculations.isBlocked || isSubmitting} onClick={executeInvoiceCompilation} className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer select-none">
              {isSubmitting ? 'Processing...' : transactionMode === 'return' ? 'Log Return Statement' : 'Generate Bill'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;