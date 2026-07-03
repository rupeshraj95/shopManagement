// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import InputField from '../components/InputField';

// const Customers = () => {
//   const [customers, setCustomers] = useState([]);
//   const [invoices, setInvoices] = useState([]); // 💡 Added state repository to compute order tallies
//   const [loading, setLoading] = useState(true);

//   // Form input track states
//   const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
//   const [fieldErrors, setFieldErrors] = useState({});
//   const [serverFeedback, setServerFeedback] = useState({ type: '', msg: '' });
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // 💡 FIXED: Pulls both customer data and invoices simultaneously
//   const fetchCustomerRegistryRecords = async () => {
//     try {
//       const [customersResponse, invoicesResponse] = await Promise.all([
//         axios.get('/customers'),
//         axios.get('/invoices')
//       ]);
//       setCustomers(customersResponse.data || []);
//       setInvoices(invoicesResponse.data || []);
//     } catch (error) {
//       console.error("Failed to sync customer structural index indices:", error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCustomerRegistryRecords();
//   }, []);

//   /**
//    * Evaluates input parameters explicitly against structural compliance configurations
//    */
//   const validateField = (name, value) => {
//     if (name === 'name') {
//       if (!value.trim()) return 'Customer identity profile name is mandatory.';
//     }
//     if (name === 'phone') {
//       if (!value.trim()) return 'Mobile contact sequence number is required.';
//       // Regular Expression checking against Indian Telephone Formatting architectures 
//       const indianPhoneRegex = /^(?:\+91|0)?[6789]\d{9}$/;
//       if (!indianPhoneRegex.test(value.trim())) {
//         return 'Enter a clean 10-digit phone tracking footprint (e.g., 9876543210).';
//       }
//     }
//     if (name === 'email' && value.trim()) {
//       const emailSyntaxRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailSyntaxRegex.test(value)) return 'Structured email formatting syntax incorrect.';
//     }
//     return '';
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//     setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
//     if (serverFeedback.msg) setServerFeedback({ type: '', msg: '' });
//   };

//   const handleRegistrationSubmit = async (e) => {
//     e.preventDefault();
    
//     const nameErr = validateField('name', formData.name);
//     const phoneErr = validateField('phone', formData.phone);
//     const emailErr = validateField('email', formData.email);

//     if (nameErr || phoneErr || emailErr) {
//       setFieldErrors({ name: nameErr, phone: phoneErr, email: emailErr });
//       return;
//     }

//     setIsSubmitting(true);
//     setServerFeedback({ type: '', msg: '' });

//     try {
//       const response = await axios.post('/customers', formData);
//       setServerFeedback({ type: 'success', msg: `Account ledger profile for "${response.data.name}" committed.` });
//       setFormData({ name: '', phone: '', email: '', address: '' });
//       setFieldErrors({});
//       await fetchCustomerRegistryRecords(); // Hydrate tracking dashboard elements instantly
//     } catch (err) {
//       setServerFeedback({
//         type: 'error',
//         msg: err.response?.data?.message || 'Database rejected client configuration parameters mapping.'
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans">
//         <div className="h-6 w-6 rounded-full border-2 border-zinc-200 border-t-zinc-950 animate-spin" />
//         <span className="text-[10px] tracking-widest uppercase font-bold text-zinc-400 mt-3 animate-pulse">Syncing Index Registers</span>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 lg:p-8 space-y-6 animate-fadeIn">
      
//       {/* Title Header Card Section */}
//       <div className="border-b border-zinc-200 pb-5">
//         <h1 className="text-base font-bold tracking-tight text-zinc-900">Customer Registry</h1>
//         <p className="text-xs text-zinc-400 mt-0.5">Manage regional operator accounts, append fresh customer footprints, and catalog profile histories.</p>
//       </div>

//       {/* TOP COMPONENT LAYOUT PANEL: Registration Form Block */}
//       <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
//         <div>
//           <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider select-none">
//             Provision New Client Account
//           </h3>
//         </div>

//         {serverFeedback.msg && (
//           <div className={`p-3 text-xs font-semibold border rounded-xl animate-fadeIn ${
//             serverFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
//           }`}>
//             {serverFeedback.type === 'success' ? '✅' : '⚠️'} {serverFeedback.msg}
//           </div>
//         )}

//         <form onSubmit={handleRegistrationSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4" noValidate>
//           <InputField
//             label="Client Profile Name *"
//             name="name"
//             value={formData.name}
//             onChange={handleInputChange}
//             placeholder="Annu Bhaiya"
//             error={fieldErrors.name}
//             disabled={isSubmitting}
//           />
          
//           <InputField
//             label="Mobile Contact Sequence *"
//             name="phone"
//             type="tel"
//             value={formData.phone}
//             onChange={handleInputChange}
//             placeholder="+91 98765 43210"
//             error={fieldErrors.phone}
//             disabled={isSubmitting}
//           />
          
//           <InputField
//             label="Email Identity Token"
//             name="email"
//             type="email"
//             value={formData.email}
//             onChange={handleInputChange}
//             placeholder="annu@terminal.com"
//             error={fieldErrors.email}
//             disabled={isSubmitting}
//           />

//           <div className="md:col-span-3 space-y-1.5">
//             <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 select-none">
//               Physical Mailing Address Location
//             </label>
//             <textarea
//               name="address"
//               rows="2"
//               value={formData.address}
//               onChange={handleInputChange}
//               disabled={isSubmitting}
//               placeholder="Enter building coordinates, room, street designations map..."
//               className="w-full text-sm rounded-xl border border-zinc-200 px-3.5 py-1.5 bg-white resize-none focus:outline-hidden focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition duration-150 text-zinc-900"
//             />
//           </div>

//           <div className="md:col-span-3 pt-2 flex justify-end select-none">
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="px-5 h-9 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer disabled:cursor-not-allowed shadow-xs"
//             >
//               {isSubmitting ? 'Saving Framework Parameters...' : 'Commit Client Registry'}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* LOWER COMPONENT LAYOUT PANEL: Account History Table Overview Sheet */}
//       <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
//         <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center select-none">
//           <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
//             Registered Store Client Overview Logs
//           </span>
//           <span className="text-[10px] font-bold px-2.5 py-1 bg-white border border-zinc-200 rounded-lg font-mono text-zinc-500">
//             Active Accounts: {customers.length}
//           </span>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse text-xs font-medium">
//             <thead>
//               <tr className="bg-zinc-50 border-b border-zinc-200 font-bold uppercase tracking-wider text-zinc-400 select-none">
//                 <th className="px-5 py-3">Client Full Name</th>
//                 <th className="px-5 py-3 w-44">Phone Digit Index</th>
//                 <th className="px-5 py-3 w-56">Email Reference Link</th>
//                 <th className="px-5 py-3">Location Address Block</th>
//                 <th className="px-5 py-3 w-40 text-center">Invoice Milestones</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-zinc-100 text-zinc-700">
//               {customers.length > 0 ? (
//                 customers.map((client) => {
//                   // 💡 LIVE CALCULATION ENGINE: Compares incoming invoice references to active IDs
//                   const activeOrderCount = invoices.filter(inv => {
//                     const invCustId = inv.customer?._id || inv.customer;
//                     return invCustId === client._id;
//                   }).length;

//                   return (
//                     <tr key={client._id} className="hover:bg-zinc-50/20 transition-colors duration-150">
//                       <td className="px-5 py-3.5 font-bold text-zinc-900">{client.name}</td>
//                       <td className="px-5 py-3.5 font-mono font-bold text-zinc-500">{client.phone}</td>
//                       <td className="px-5 py-3.5 font-semibold text-zinc-500">
//                         {client.email || <span className="text-zinc-300 italic font-normal">No email logged</span>}
//                       </td>
//                       <td className="px-5 py-3.5 text-zinc-400 truncate max-w-xs">
//                         {client.address || <span className="text-zinc-200 italic font-normal">--</span>}
//                       </td>
//                       <td className="px-5 py-3.5 text-center select-none">
//                         {/* 💡 FIXED: Dynamically renders the correct layout milestone count code */}
//                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black font-mono bg-zinc-50 border border-zinc-200 text-zinc-600">
//                           {activeOrderCount} Orders
//                         </span>
//                       </td>
//                     </tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td colSpan="5" className="px-5 py-8 text-center text-zinc-400 italic">
//                     No matching storefront accounts trace logs are currently initialized inside system memory.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Customers;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputField from '../components/InputField';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Form input track states
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 💡 NEW LAYOUT INTERACTIVE ENGINE INLINE STATES
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', email: '', address: '' });

  // PREMIUM OVERLAY POPUP MODAL STATE CONTROLLERS
  const [customAlert, setCustomAlert] = useState({ isOpen: false, type: 'success', title: '', msg: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, targetId: null, msg: '' });

  const fetchCustomerRegistryRecords = async () => {
    try {
      const [customersResponse, invoicesResponse] = await Promise.all([
        axios.get('/customers'),
        axios.get('/invoices')
      ]);
      setCustomers(customersResponse.data || []);
      setInvoices(invoicesResponse.data || []);
    } catch (error) {
      console.error("Failed to sync customer structural index indices:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerRegistryRecords();
  }, []);

  const triggerPopupAlert = (type, title, msg) => {
    setCustomAlert({ isOpen: true, type, title, msg });
  };

  const validateField = (name, value) => {
    if (name === 'name') {
      if (!value.trim()) return 'Customer identity profile name is mandatory.';
    }
    if (name === 'phone') {
      if (!value.trim()) return 'Mobile contact sequence number is required.';
      const indianPhoneRegex = /^(?:\+91|0)?[6789]\d{9}$/;
      if (!indianPhoneRegex.test(value.trim())) {
        return 'Enter a clean 10-digit phone tracking footprint (e.g., 9876543210).';
      }
    }
    if (name === 'email' && value.trim()) {
      const emailSyntaxRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailSyntaxRegex.test(value)) return 'Structured email formatting syntax incorrect.';
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    
    const nameErr = validateField('name', formData.name);
    const phoneErr = validateField('phone', formData.phone);
    const emailErr = validateField('email', formData.email);

    if (nameErr || phoneErr || emailErr) {
      setFieldErrors({ name: nameErr, phone: phoneErr, email: emailErr });
      triggerPopupAlert('error', 'Form Incomplete', 'Provide compliance tracking values inside compulsory fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/customers', formData);
      triggerPopupAlert('success', 'Account Created', `Account ledger profile for "${response.data.name}" committed successfully.`);
      setFormData({ name: '', phone: '', email: '', address: '' });
      setFieldErrors({});
      await fetchCustomerRegistryRecords(); 
    } catch (err) {
      triggerPopupAlert('error', 'Registration Rejected', err.response?.data?.message || 'Database rejected client parameters mapping.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline Data Row Handlers Configuration
  const startEditingMode = (client) => {
    setEditingId(client._id);
    setEditFormData({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      address: client.address || ''
    });
  };

  const handleInlineUpdateSubmit = async (id) => {
    const nameErr = validateField('name', editFormData.name);
    const phoneErr = validateField('phone', editFormData.phone);
    if (nameErr || phoneErr) {
      triggerPopupAlert('error', 'Validation Error', nameErr || phoneErr);
      return;
    }

    try {
      await axios.put(`/customers/${id}`, editFormData);
      triggerPopupAlert('success', 'Profile Restructured', 'Customer identity reference adjusted securely.');
      setEditingId(null);
      await fetchCustomerRegistryRecords();
    } catch (err) {
      triggerPopupAlert('error', 'Modification Blocked', err.response?.data?.message || 'Failed to update index mapping metrics.');
    }
  };

  const startDeleteConfirmation = (client) => {
    setConfirmModal({
      isOpen: true,
      targetId: client._id,
      msg: `Are you entirely sure you want to delete "${client.name}" from your active accounts folder? This structural reference flush cannot be reversed.`
    });
  };

  const handleConfirmedDelete = async () => {
    const id = confirmModal.targetId;
    setConfirmModal({ isOpen: false, targetId: null, msg: '' });
    try {
      await axios.delete(`/customers/${id}`);
      triggerPopupAlert('success', 'Account Flushed', 'Customer profile record was cleared from your database architecture.');
      await fetchCustomerRegistryRecords();
    } catch (err) {
      triggerPopupAlert('error', 'Purge Denied', err.response?.data?.message || 'System failed to delete this customer account node.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans">
        <div className="h-6 w-6 rounded-full border-2 border-zinc-200 border-t-zinc-950 animate-spin" />
        <span className="text-[10px] tracking-widest uppercase font-bold text-zinc-400 mt-3 animate-pulse">Syncing Index Registers</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn font-sans relative">
      
      {/* Title Header Card Section */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-base font-bold tracking-tight text-zinc-900">Customer Registry</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Manage regional operator accounts, append fresh customer footprints, and catalog profile histories.</p>
      </div>

      {/* Form Interface Block */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2 mb-2 select-none">Provision New Client Account</span>
        <form onSubmit={handleRegistrationSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4" noValidate>
          <InputField label="Client Profile Name *" name="name" value={formData.name} onChange={handleInputChange} placeholder="Annu Bhaiya" error={fieldErrors.name} disabled={isSubmitting} />
          <InputField label="Mobile Contact Sequence *" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="9876543210" error={fieldErrors.phone} disabled={isSubmitting} />
          <InputField label="Email Identity Token" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="annu@terminal.com" error={fieldErrors.email} disabled={isSubmitting} />

          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 select-none">Physical Mailing Address Location</label>
            <textarea name="address" rows="2" value={formData.address} onChange={handleInputChange} disabled={isSubmitting} placeholder="Enter building coordinates, room, street designations map..." className="w-full text-sm rounded-xl border border-zinc-200 px-3.5 py-1.5 bg-white resize-none focus:outline-hidden focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition duration-150 text-zinc-900" />
          </div>

          <div className="md:col-span-3 pt-2 flex justify-end select-none">
            <button type="submit" disabled={isSubmitting} className="px-5 h-9 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer disabled:cursor-not-allowed shadow-xs">
              {isSubmitting ? 'Saving Framework Parameters...' : 'Commit Client Registry'}
            </button>
          </div>
        </form>
      </div>

      {/* Account History Table Overview Sheet */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center select-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Registered Store Client Overview Logs</span>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-white border border-zinc-200 rounded-lg font-mono text-zinc-500">Active Accounts: {customers.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-medium">
            <thead>
              <tr className="bg-zinc-50/70 border-b border-zinc-200 font-bold uppercase tracking-wider text-zinc-400 select-none">
                <th className="px-4 py-3">Client Full Name</th>
                <th className="px-4 py-3 w-40">Phone Digit Index</th>
                <th className="px-4 py-3 w-48">Email Reference Link</th>
                <th className="px-4 py-3">Location Address</th>
                <th className="px-4 py-3 w-28 text-center">Milestones</th>
                <th className="px-4 py-3 w-36 text-center">Action Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {customers.length > 0 ? (
                customers.map((client) => {
                  const isEditingRow = editingId === client._id;
                  const activeOrderCount = invoices.filter(inv => (inv.customer?._id || inv.customer) === client._id).length;

                  return (
                    <tr key={client._id} className="hover:bg-zinc-50/10 transition duration-150">
                      
                      {/* Name Parameters */}
                      <td className="px-4 py-2.5">
                        {isEditingRow ? (
                          <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full text-xs font-bold rounded-lg border border-zinc-200 px-2 py-1 bg-white focus:outline-hidden text-zinc-900" />
                        ) : (
                          <span className="font-bold text-zinc-900">{client.name}</span>
                        )}
                      </td>

                      {/* Phone Parameters */}
                      <td className="px-4 py-2.5">
                        {isEditingRow ? (
                          <input type="text" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} className="w-full text-xs font-mono rounded-lg border border-zinc-200 px-2 py-1 bg-white focus:outline-hidden text-zinc-900" />
                        ) : (
                          <span className="font-mono font-bold text-zinc-500">{client.phone}</span>
                        )}
                      </td>

                      {/* Email Reference Parameters */}
                      <td className="px-4 py-2.5">
                        {isEditingRow ? (
                          <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full text-xs rounded-lg border border-zinc-200 px-2 py-1 bg-white focus:outline-hidden text-zinc-900" />
                        ) : (
                          <span className="font-semibold text-zinc-500">{client.email || <span className="text-zinc-300 italic font-normal">No email logged</span>}</span>
                        )}
                      </td>

                      {/* Address Location Block */}
                      <td className="px-4 py-2.5">
                        {isEditingRow ? (
                          <input type="text" value={editFormData.address} onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} className="w-full text-xs rounded-lg border border-zinc-200 px-2 py-1 bg-white focus:outline-hidden text-zinc-900" />
                        ) : (
                          <span className="text-zinc-400 truncate max-w-[150px] block">{client.address || <span className="text-zinc-200 italic">--</span>}</span>
                        )}
                      </td>

                      {/* Milestone Summary Flags */}
                      <td className="px-4 py-2.5 text-center select-none">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-zinc-50 border border-zinc-200 text-zinc-500">
                          {activeOrderCount} Bills
                        </span>
                      </td>

                      {/* Interactive Configuration Triggers */}
                      <td className="px-4 py-2.5 text-center select-none">
                        {isEditingRow ? (
                          <div className="flex justify-center gap-1.5">
                            <button type="button" onClick={() => handleInlineUpdateSubmit(client._id)} className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-bold text-[10px] uppercase cursor-pointer">Save ✓</button>
                            <button type="button" onClick={() => setEditingId(null)} className="px-2 py-0.5 bg-white border border-zinc-200 text-zinc-400 rounded-md font-bold text-[10px] uppercase cursor-pointer">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => startEditingMode(client)} className="text-zinc-900 hover:text-zinc-600 underline font-bold cursor-pointer focus:outline-hidden">Edit</button>
                            <button type="button" onClick={() => startDeleteConfirmation(client)} className="text-red-600 hover:text-red-800 underline font-bold cursor-pointer focus:outline-hidden">Delete</button>
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-zinc-400 italic">No matching storefront accounts trace logs found inside memory pools.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP FEEDBACK ALERT LAYOUT FRAME */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn select-none">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${customAlert.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {customAlert.type === 'success' ? '✓' : '⚠️'}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">{customAlert.title}</h3>
                <p className="text-xs leading-normal text-zinc-500 font-medium">{customAlert.msg}</p>
              </div>
            </div>
            <div className="flex justify-end pt-1 border-t border-zinc-100">
              <button type="button" onClick={() => setCustomAlert({ isOpen: false, type: 'success', title: '', msg: '' })} className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer">Acknowledge Check</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP DESTRUCTIVE CONFLICT CONFIRM MODAL LAYOUT */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn select-none">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-red-50 text-red-800 border border-red-200 flex items-center justify-center shrink-0 font-black text-sm">✕</div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">Confirm Account Purge</h3>
                <p className="text-xs leading-normal text-zinc-500 font-medium">{confirmModal.msg}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button type="button" onClick={() => setConfirmModal({ isOpen: false, targetId: null, msg: '' })} className="px-3.5 py-1.5 border border-zinc-200 text-zinc-500 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer">Abort</button>
              <button type="button" onClick={handleConfirmedDelete} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-xs">Execute Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;