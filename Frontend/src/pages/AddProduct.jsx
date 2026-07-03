import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputField from '../components/InputField';

const AddProduct = () => {
  // Core Component Registries
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', sku: '', category: '', price: '', stockQuantity: '' });
  
  // Inline Administrative Operations States
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', sku: '', category: '', price: '', stockQuantity: '' });
  
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: '', msg: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CUSTOM POPUP OVERLAY ALERTS STATE MATRIX
  const [customAlert, setCustomAlert] = useState({ isOpen: false, type: 'success', title: '', msg: '' });
  // State for product delete confirmation modal
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

  useEffect(() => {
    fetchInventoryTelemetry();
  }, []);

  const triggerPopupAlert = (type, title, msg) => {
    setCustomAlert({ isOpen: true, type, title, msg });
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Commercial product item designation is required.';
    if (!formData.sku.trim()) tempErrors.sku = 'Universal product SKU alphanumeric tracking code is required.';
    if (!formData.category) tempErrors.category = 'Please assign this item to a taxonomy group department.';
    if (!formData.price || Number(formData.price) <= 0) tempErrors.price = 'Provide a baseline structural retail rate above $0.';
    if (!formData.stockQuantity || Number(formData.stockQuantity) < 0) tempErrors.stockQuantity = 'Opening balance stock parameters cannot be blank.';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (feedback.msg) setFeedback({ type: '', msg: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      triggerPopupAlert('error', 'Form Validation Error', 'Please correct the highlighted errors before injecting the product.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/products', {
        ...formData,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity)
      });
      triggerPopupAlert('success', 'Asset Logged Successfully', `Product profile asset line "${formData.name}" committed successfully.`);
      setFormData({ name: '', sku: '', category: '', price: '', stockQuantity: '' });
      await fetchInventoryTelemetry();
    } catch (err) {
      triggerPopupAlert('error', 'Database Rejection', err.response?.data?.message || 'Database rejected asset profile declaration.');
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
      stockQuantity: product.stockQuantity
    });
  };

  const handleInlineUpdateSubmit = async (id) => {
    if (!editFormData.name.trim() || !editFormData.sku.trim() || !editFormData.category || Number(editFormData.price) <= 0 || Number(editFormData.stockQuantity) < 0) {
      triggerPopupAlert('error', 'Invalid Parameters', 'Invalid inline changes. Verify all fields are properly configured.');
      return;
    }

    try {
      await axios.put(`/products/${id}`, {
        name: editFormData.name.trim(),
        sku: editFormData.sku.trim(),
        category: editFormData.category,
        price: Number(editFormData.price),
        stockQuantity: Number(editFormData.stockQuantity)
      });

      triggerPopupAlert('success', 'Record Saved', 'Product profile index parameters updated successfully.');
      setEditingId(null);
      await fetchInventoryTelemetry();
    } catch (err) {
      triggerPopupAlert('error', 'Update Failed', err.response?.data?.message || 'Failed to modify entry profile parameters.');
    }
  };

  const startDeleteConfirmation = (product) => {
    setConfirmModal({
      isOpen: true,
      targetId: product._id,
      msg: `Are you completely sure you want to permanently delete "${product.name}" from your active inventory? This action cannot be reversed.`
    });
  };

  const handleConfirmedDelete = async () => {
    const id = confirmModal.targetId;
    setConfirmModal({ isOpen: false, targetId: null, msg: '' });
    try {
      await axios.delete(`/products/${id}`);
      triggerPopupAlert('success', 'Product Deleted', 'The product registry was completely cleared from storage nodes.');
      await fetchInventoryTelemetry();
    } catch (err) {
      triggerPopupAlert('error', 'Deletion Failed', err.response?.data?.message || 'Failed to clear product item from database.');
    }
  };

  // Helper helper utility resolution logic string extractor to guarantee safe render paths
  const resolveCategoryLabel = (itemCategory) => {
    if (!itemCategory) return 'Unassigned';
    if (typeof itemCategory === 'object' && itemCategory.name) return itemCategory.name;
    const fallbackMatch = categories.find(c => c._id === itemCategory);
    return fallbackMatch ? fallbackMatch.name : 'Unassigned';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn font-sans relative">
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-base font-bold tracking-tight text-zinc-900">Add New Product</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Initialize a brand new inventory stock item tracking blueprint into your live database.</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <InputField label="Commercial Item Name *" name="name" value={formData.name} onChange={handleInputChange} placeholder="TOP BAR" error={errors.name} disabled={isSubmitting} />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Stock Keeping Unit (SKU) *" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="TOP-25G-BAR" error={errors.sku} disabled={isSubmitting} />
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 select-none">Taxonomy Association *</label>
              <select name="category" value={formData.category} onChange={handleInputChange} disabled={isSubmitting} className={`w-full text-sm rounded-xl border px-3.5 py-2 bg-white focus:outline-hidden font-medium transition duration-150 ${errors.category ? 'border-red-300 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-900'}`}>
                <option value="">-- Choose Store Department --</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.category && <p className="text-[11px] font-medium text-red-600 animate-fadeIn">{errors.category}</p>}
            </div>

            <InputField label="Retail Rate Price (₹) *" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} placeholder="399.99" error={errors.price} disabled={isSubmitting} />
            <InputField label="Opening Balance Volume *" name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleInputChange} placeholder="15" error={errors.stockQuantity} disabled={isSubmitting} />
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end select-none">
            <button type="submit" disabled={isSubmitting} className="px-5 h-9 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs">
              {isSubmitting ? 'Injecting Entry...' : 'Inject Product Line'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden animate-fadeIn">
        <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 select-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Current Inventory Ledger Rows ({products.length})</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="bg-zinc-50/70 border-b border-zinc-200 font-bold uppercase tracking-wider text-zinc-400 select-none">
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3 w-36">SKU Code</th>
                <th className="px-4 py-3 w-36">Category</th>
                <th className="px-4 py-3 w-28 text-right">Price Rate</th>
                <th className="px-4 py-3 w-24 text-center">In Stock</th>
                <th className="px-4 py-3 w-36 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {products.length > 0 ? (
                products.map((item) => {
                  const isEditingRow = editingId === item._id;
                  return (
                    <tr key={item._id} className="hover:bg-zinc-50/10 transition duration-150">
                      <td className="px-4 py-2.5">
                        {isEditingRow ? (
                          <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full text-xs font-bold rounded-lg border border-zinc-200 px-2 py-1 bg-white focus:outline-hidden text-zinc-900" />
                        ) : (
                          <span className="font-bold text-zinc-900">{item.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditingRow ? (
                          <input type="text" value={editFormData.sku} onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })} className="w-full text-xs font-mono rounded-lg border border-zinc-200 px-2 py-1 bg-white focus:outline-hidden text-zinc-900" />
                        ) : (
                          <span className="font-mono text-zinc-400">{item.sku || 'N/A'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditingRow ? (
                          <select value={editFormData.category} onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })} className="w-full text-xs rounded-lg border border-zinc-200 px-2 py-1 bg-white focus:outline-hidden text-zinc-900 font-medium">
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-100 text-zinc-600 rounded-md uppercase">
                            {resolveCategoryLabel(item.category)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold">
                        {isEditingRow ? (
                          <input type="number" step="0.01" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} className="w-20 text-right rounded-lg border border-zinc-200 px-2 py-1 bg-white focus:outline-hidden text-zinc-900" />
                        ) : (
                          <span className="text-zinc-900">₹{Number(item.price).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-semibold">
                        {isEditingRow ? (
                          <input type="number" value={editFormData.stockQuantity} onChange={(e) => setEditFormData({ ...editFormData, stockQuantity: e.target.value })} className="w-16 text-center rounded-lg border border-zinc-200 px-2 py-1 bg-white focus:outline-hidden text-zinc-900" />
                        ) : (
                          <span className={item.stockQuantity <= 5 ? 'text-red-600 font-bold animate-pulse' : 'text-zinc-500'}>{item.stockQuantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center select-none">
                        {isEditingRow ? (
                          <div className="flex justify-center gap-1.5">
                            <button type="button" onClick={() => handleInlineUpdateSubmit(item._id)} className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-bold text-[10px] uppercase cursor-pointer">Save</button>
                            <button type="button" onClick={() => setEditingId(null)} className="px-2 py-0.5 bg-white border border-zinc-200 text-zinc-400 rounded-md font-bold text-[10px] uppercase cursor-pointer">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => startEditingMode(item)} className="text-zinc-900 hover:text-zinc-600 underline font-bold cursor-pointer focus:outline-hidden">Edit</button>
                            <button type="button" onClick={() => startDeleteConfirmation(item)} className="text-red-600 hover:text-red-800 underline font-bold cursor-pointer focus:outline-hidden">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-zinc-400 italic">No items registered inside database ledger nodes yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP NOTIFICATION MODAL */}
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

      {/* ASYNC PRODUCT PURGE DESTRUCTIVE CONFIRM MODAL OVERLAY */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn select-none">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-red-50 text-red-800 border border-red-200 flex items-center justify-center shrink-0 font-black text-sm">✕</div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">Confirm Product Removal</h3>
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

export default AddProduct;