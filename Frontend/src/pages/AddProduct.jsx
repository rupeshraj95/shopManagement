import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputField from '../components/InputField';

const AddProduct = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ 
    name: '', sku: '', category: '', price: '', 
    stockQuantity: '', packagingType: 'piece', cartoonCount: '', piecesPerCartoon: '', individualPieces: '' 
  });
  
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ 
    name: '', sku: '', category: '', price: '', 
    stockQuantity: '', packagingType: 'piece', cartoonCount: '', piecesPerCartoon: '', individualPieces: '',
    stockEditMode: 'add' 
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAlert, setCustomAlert] = useState({ isOpen: false, type: 'success', title: '', msg: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, targetId: null, msg: '' });

  const fetchInventoryTelemetry = async () => {
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        axios.get('/products/category'),
        axios.get('/products')
      ]);
      if (categoriesRes.data && Array.isArray(categoriesRes.data)) setCategories(categoriesRes.data);
      if (productsRes.data && Array.isArray(productsRes.data)) setProducts(productsRes.data);
    } catch (err) {
      console.error("Failed to sync core onboarding dependencies:", err.message);
    }
  };

  useEffect(() => { fetchInventoryTelemetry(); }, []);

  const triggerPopupAlert = (type, title, msg) => {
    setCustomAlert({ isOpen: true, type, title, msg });
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Product name is required.';
    if (!formData.sku.trim()) tempErrors.sku = 'SKU is required.';
    if (!formData.category) tempErrors.category = 'Please assign a store department category.';
    if (!formData.price || Number(formData.price) <= 0) tempErrors.price = 'Provide a baseline price above ₹0.';
    
    if (formData.packagingType === 'piece') {
      if (!formData.stockQuantity || Number(formData.stockQuantity) < 0) {
        tempErrors.stockQuantity = 'Stock parameters cannot be blank.';
      }
    } else {
      if (!formData.cartoonCount || Number(formData.cartoonCount) < 0) tempErrors.cartoonCount = 'Number of cartons is required.';
      if (!formData.piecesPerCartoon || Number(formData.piecesPerCartoon) <= 0) tempErrors.piecesPerCartoon = 'Specify volume count configurations.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      triggerPopupAlert('error', 'Form Validation Error', 'Please correct the highlighted errors before injecting the product.');
      return;
    }

    setIsSubmitting(true);
    
    const sanitizedPayload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      category: formData.category,
      price: Number(formData.price) || 0,
      packagingType: formData.packagingType || 'piece',
      stockQuantity: formData.stockQuantity === '' ? 0 : Number(formData.stockQuantity),
      cartoonCount: formData.cartoonCount === '' ? 0 : Number(formData.cartoonCount),
      piecesPerCartoon: formData.piecesPerCartoon === '' ? 0 : Number(formData.piecesPerCartoon),
      individualPieces: formData.individualPieces === '' ? 0 : Number(formData.individualPieces)
    };

    try {
      const response = await axios.post('/products', sanitizedPayload);
      setProducts(prev => [response.data, ...prev]);
      triggerPopupAlert('success', 'Asset Logged Successfully', `Product "${formData.name}" committed successfully.`);
      setFormData({ name: '', sku: '', category: '', price: '', stockQuantity: '', packagingType: 'piece', cartoonCount: '', piecesPerCartoon: '', individualPieces: '' });
    } catch (err) {
      const exactErrorReason = err.response?.data?.error || err.response?.data?.message || 'Database rejected declaration.';
      triggerPopupAlert('error', 'Database Rejection', exactErrorReason);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingMode = (product) => {
    setEditingId(product._id);
    setEditFormData({
      name: product.name,
      sku: product.sku || '',
      category: product.category?._id || product.category || '',
      price: product.price,
      packagingType: product.packagingType || 'piece',
      stockQuantity: '', 
      cartoonCount: '',
      piecesPerCartoon: product.piecesPerCartoon || '',
      individualPieces: '',
      stockEditMode: 'add'
    });
  };

  const handleInlineUpdateSubmit = async (id) => {
    try {
      const sanitizedPayload = {
        name: editFormData.name.trim(),
        sku: editFormData.sku.trim(),
        category: editFormData.category,
        price: Number(editFormData.price) || 0,
        packagingType: editFormData.packagingType,
        stockQuantity: editFormData.stockQuantity === '' ? 0 : Number(editFormData.stockQuantity),
        cartoonCount: editFormData.cartoonCount === '' ? 0 : Number(editFormData.cartoonCount),
        piecesPerCartoon: editFormData.piecesPerCartoon === '' ? 0 : Number(editFormData.piecesPerCartoon),
        individualPieces: editFormData.individualPieces === '' ? 0 : Number(editFormData.individualPieces),
        stockEditMode: editFormData.stockEditMode
      };

      const response = await axios.put(`/products/${id}`, sanitizedPayload);
      setProducts(prev => prev.map(p => p._id === id ? response.data : p));
      triggerPopupAlert('success', 'Record Saved', 'Product database properties updated successfully.');
      setEditingId(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to modify entry.';
      triggerPopupAlert('error', 'Update Failed', errorMsg);
    }
  };

  const startDeleteConfirmation = (product) => {
    setConfirmModal({
      isOpen: true,
      targetId: product._id,
      msg: `Permanently delete "${product.name}"? This action cannot be reversed.`
    });
  };

  // 💡 HARDENED DELETE HANDLER WITH IMMEDIATE LOCAL ARRAY RE-FILTERING
  const handleConfirmedDelete = async () => {
    const id = confirmModal.targetId;
    setConfirmModal({ isOpen: false, targetId: null, msg: '' });
    try {
      await axios.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      if (editingId === id) setEditingId(null);
      triggerPopupAlert('success', 'Product Deleted', 'Product record successfully removed.');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to remove product item.';
      triggerPopupAlert('error', 'Deletion Failed', errorMsg);
    }
  };

  const resolveCategoryLabel = (itemCategory) => {
    if (!itemCategory) return 'Unassigned';
    if (typeof itemCategory === 'object' && itemCategory.name) return itemCategory.name;
    const fallbackMatch = categories.find(c => c._id === itemCategory);
    return fallbackMatch ? fallbackMatch.name : 'Unassigned';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-base font-bold text-zinc-900">Add New Product Portfolio Asset</h1>
        <p className="text-xs text-zinc-400">Initialize a brand new inventory stock item tracking blueprint into your database ledger.</p>
      </div>

      {/* Creation Form Block */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <InputField label="Product Name *" name="name" value={formData.name} onChange={handleInputChange} placeholder="TOP BAR" disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Inventory Tracking Mode *</label>
              <select name="packagingType" value={formData.packagingType} onChange={handleInputChange} className="w-full text-sm rounded-xl border border-zinc-200 px-3.5 py-2 bg-white focus:outline-hidden focus:border-zinc-900 transition">
                <option value="piece">Pieces (Standard Single Loose Stock)</option>
                <option value="cartoon">Cartons (Hybrid Packaged Box Multipliers)</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="SKU Code *" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="TOP-25G-BAR" disabled={isSubmitting} />
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Category Department *</label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="w-full text-sm rounded-xl border border-zinc-200 px-3.5 py-2 bg-white focus:outline-hidden focus:border-zinc-900">
                <option value="">-- Choose Store Department --</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <InputField label="Retail Price (₹) *" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} placeholder="399.99" disabled={isSubmitting} />
            
            {formData.packagingType === 'piece' ? (
              <InputField label="Opening Pieces Count *" name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleInputChange} placeholder="15" disabled={isSubmitting} />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <InputField label="No. of Cartons *" name="cartoonCount" type="number" value={formData.cartoonCount} onChange={handleInputChange} placeholder="5" />
                <InputField label="Pcs Per Carton *" name="piecesPerCartoon" type="number" value={formData.piecesPerCartoon} onChange={handleInputChange} placeholder="2" />
                <InputField label="Loose Pieces *" name="individualPieces" type="number" value={formData.individualPieces} onChange={handleInputChange} placeholder="1" />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-zinc-100">
            <button type="submit" disabled={isSubmitting} className="px-5 h-9 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase rounded-xl transition">Inject Product Line</button>
          </div>
        </form>
      </div>

      {/* Main Ledger Database List View */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Inventory Stock Ledger Registry ({products.length})</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-medium">
            <thead>
              <tr className="bg-zinc-50/70 border-b border-zinc-200 font-bold uppercase tracking-wider text-zinc-400 select-none">
                <th className="px-3 py-3 w-40">Product Details</th>
                <th className="px-3 py-3 w-28">SKU / Category</th>
                <th className="px-3 py-3 w-20 text-right">Price</th>
                <th className="px-3 py-3 w-40 text-center">Update Settings Mode</th>
                <th className="px-3 py-3 w-48 text-center">Quantities Allocation Balance</th>
                <th className="px-3 py-3 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {products.length > 0 ? (
                products.map((item) => {
                  const isEditingRow = editingId === item._id;
                  return (
                    <tr key={item._id} className="hover:bg-zinc-50/10 transition duration-150">
                      <td className="px-3 py-2.5">
                        {isEditingRow ? (
                          <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full text-xs font-bold rounded-lg border border-zinc-200 px-2 py-1 text-zinc-900 focus:outline-hidden" />
                        ) : (
                          <span className="font-bold text-zinc-900 block">{item.name}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {isEditingRow ? (
                          <div className="space-y-1">
                            <input type="text" value={editFormData.sku} onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })} className="w-full text-[11px] font-mono rounded-lg border border-zinc-200 px-2 py-0.5 text-zinc-900 focus:outline-hidden" />
                            <select value={editFormData.category} onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })} className="w-full text-[11px] rounded-lg border border-zinc-200 p-0.5 text-zinc-900 font-medium focus:outline-hidden">
                              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="font-mono text-zinc-400 block">{item.sku || 'N/A'}</span>
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-zinc-100 text-zinc-500 rounded uppercase">{resolveCategoryLabel(item.category)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">
                        {isEditingRow ? (
                          <input type="number" step="0.01" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} className="w-16 text-right rounded-lg border border-zinc-200 px-2 py-1 text-zinc-900 focus:outline-hidden" />
                        ) : (
                          <span className="text-zinc-900">₹{Number(item.price).toFixed(2)}</span>
                        )}
                      </td>
                      
                      <td className="px-3 py-2.5 text-center">
                        {isEditingRow ? (
                          <div className="space-y-1.5 max-w-[150px] mx-auto">
                            <select value={editFormData.stockEditMode} onChange={(e) => setEditFormData({ ...editFormData, stockEditMode: e.target.value })} className="w-full text-[10px] font-bold border border-zinc-300 rounded bg-zinc-900 text-white p-0.5 focus:outline-hidden">
                              <option value="add">➕ Add More Stock</option>
                              <option value="change">✏️ Change Previous</option>
                            </select>
                            
                            <select disabled value={editFormData.packagingType} className="w-full text-[10px] rounded border border-zinc-200 p-0.5 bg-zinc-100 text-zinc-400 font-semibold cursor-not-allowed">
                              <option value="piece">Pieces Mode (Locked)</option>
                              <option value="cartoon">Cartons Mode (Locked)</option>
                            </select>
                          </div>
                        ) : (
                          <span className="text-zinc-400 font-medium text-[10px] uppercase tracking-wide">
                            {item.packagingType === 'cartoon' ? '📦 Carton Tracking' : '🧩 Loose Piece'}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-center font-mono">
                        {isEditingRow ? (
                          <div className="flex items-center gap-1 justify-center">
                            {editFormData.packagingType === 'piece' ? (
                              <input type="number" placeholder={editFormData.stockEditMode === 'add' ? "+Qty" : "Qty"} value={editFormData.stockQuantity} onChange={(e) => setEditFormData({ ...editFormData, stockQuantity: e.target.value })} className="w-16 text-center text-xs border border-zinc-200 rounded text-zinc-900 p-0.5" />
                            ) : (
                              <div className="flex flex-col gap-1 items-center bg-zinc-50 border border-zinc-100 p-1 rounded-md">
                                <div className="flex gap-1 items-center justify-center">
                                  <input type="number" placeholder={editFormData.stockEditMode === 'add' ? "+Ctn" : "Ctn"} value={editFormData.cartoonCount} onChange={(e) => setEditFormData({ ...editFormData, cartoonCount: e.target.value })} className="w-10 text-center text-[10px] border border-zinc-200 rounded text-zinc-900" title="Cartons Input" />
                                  <span className="text-[9px] text-zinc-400">×</span>
                                  <input type="number" placeholder="Pcs/Ctn" value={editFormData.piecesPerCartoon} onChange={(e) => setEditFormData({ ...editFormData, piecesPerCartoon: e.target.value })} className="w-12 text-center text-[10px] border border-zinc-200 rounded text-zinc-900" title="Pcs per Carton Configuration" />
                                </div>
                                <input type="number" placeholder={editFormData.stockEditMode === 'add' ? "+Loose" : "Loose Pcs"} value={editFormData.individualPieces} onChange={(e) => setEditFormData({ ...editFormData, individualPieces: e.target.value })} className="w-24 text-center text-[10px] border border-zinc-200 rounded text-zinc-900" title="Individual Loose Pieces Input" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5 text-center">
                            {item.packagingType === 'cartoon' ? (
                              <>
                                <div className="text-zinc-900 font-bold text-[11px]">
                                  {item.cartoonCount} <span className="text-zinc-400 font-normal">Ctn</span>
                                  {item.individualPieces > 0 && <span className="text-zinc-900 pl-1">+{item.individualPieces} Pcs</span>}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-semibold">
                                  ({item.piecesPerCartoon} Pcs/Ctn = <span className="text-zinc-800 font-black">{item.stockQuantity} Total Pcs</span>)
                                </div>
                              </>
                            ) : (
                              <div className="text-zinc-900 font-bold">
                                {item.stockQuantity} <span className="text-zinc-400 font-normal text-[11px]">Pieces</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-3 py-2.5 text-center select-none">
                        {isEditingRow ? (
                          <div className="flex justify-center gap-1">
                            <button type="button" onClick={() => handleInlineUpdateSubmit(item._id)} className="px-2 py-0.5 bg-zinc-900 text-white rounded font-bold text-[9px] uppercase cursor-pointer">Save</button>
                            <button type="button" onClick={() => setEditingId(null)} className="px-1.5 py-0.5 bg-white border border-zinc-200 text-zinc-400 rounded font-bold text-[9px] uppercase cursor-pointer">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => startEditingMode(item)} className="text-zinc-900 underline font-bold cursor-pointer">Edit</button>
                            <button type="button" onClick={() => startDeleteConfirmation(item)} className="text-red-600 underline font-bold cursor-pointer">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-zinc-400 italic">No inventory tracked yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 💡 FIXED: POPUP CONFIRMATION MODAL INTERFACE ADDED CLEANLY AT THE DOM ROOT CONTAINER */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-red-50 text-red-800 flex items-center justify-center shrink-0 font-bold text-sm">
                🗑️
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">Confirm Deletion</h3>
                <p className="text-xs leading-normal text-zinc-500 font-medium">{confirmModal.msg}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1 border-t border-zinc-100">
              <button type="button" onClick={() => setConfirmModal({ isOpen: false, targetId: null, msg: '' })} className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-500 font-bold text-xs uppercase rounded-xl transition cursor-pointer">Cancel</button>
              <button type="button" onClick={handleConfirmedDelete} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer">Delete Asset</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Overlay Modal */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${customAlert.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                {customAlert.type === 'success' ? '✓' : '⚠️'}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">{customAlert.title}</h3>
                <p className="text-xs leading-normal text-zinc-500 font-medium">{customAlert.msg}</p>
              </div>
            </div>
            <div className="flex justify-end pt-1 border-t border-zinc-100">
              <button type="button" onClick={() => setCustomAlert({ isOpen: false, type: 'success', title: '', msg: '' })} className="px-4 py-1.5 bg-zinc-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer">Acknowledge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;