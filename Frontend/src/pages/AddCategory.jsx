import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputField from '../components/InputField';

const AddCategory = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', msg: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Editing States
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });

  // 💡 CUSTOM POPUP ALERTS & CONFIRM PROCESSING OVERLAYS STATES
  const [customAlert, setCustomAlert] = useState({ isOpen: false, type: 'success', title: '', msg: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, targetId: null, msg: '' });

  const fetchCategoriesList = async () => {
    try {
      const res = await axios.get('/products/category');
      if (res.data && Array.isArray(res.data)) setCategories(res.data);
    } catch (err) {
      console.error("Failed to sync category options:", err.message);
    }
  };

  useEffect(() => {
    fetchCategoriesList();
  }, []);

  const triggerPopupAlert = (type, title, msg) => {
    setCustomAlert({ isOpen: true, type, title, msg });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (feedback.msg) setFeedback({ type: '', msg: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Taxonomy division name designation is required.');
      triggerPopupAlert('error', 'Validation Check', 'Category title input field parameter cannot remain blank.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/products/category', formData);
      triggerPopupAlert('success', 'Division Setup', `Taxonomy department category "${formData.name}" established successfully.`);
      setFormData({ name: '', description: '' });
      await fetchCategoriesList();
    } catch (err) {
      triggerPopupAlert('error', 'Operation Rejected', err.response?.data?.message || 'Failed to authorize custom taxonomy record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingMode = (cat) => {
    setEditingId(cat._id);
    setEditFormData({ name: cat.name, description: cat.description || '' });
  };

  const handleUpdateSubmit = async (id) => {
    if (!editFormData.name.trim()) {
      triggerPopupAlert('error', 'Validation Error', 'Category name cannot be empty.');
      return;
    }
    try {
      await axios.put(`/products/category/${id}`, editFormData);
      triggerPopupAlert('success', 'Record Saved', 'Category details updated successfully.');
      setEditingId(null);
      await fetchCategoriesList();
    } catch (err) {
      triggerPopupAlert('error', 'Update Failed', err.response?.data?.message || 'Failed to update category.');
    }
  };

  // Launches custom verification overlay panel instead of standard window browser intercept
  const startDeleteConfirmation = (cat) => {
    setConfirmModal({
      isOpen: true,
      targetId: cat._id,
      msg: `Are you completely sure you want to permanently delete the "${cat.name}" category structure? This action will break dependent product loops.`
    });
  };

  const handleConfirmedDelete = async () => {
    const id = confirmModal.targetId;
    setConfirmModal({ isOpen: false, targetId: null, msg: '' });
    try {
      await axios.delete(`/products/category/${id}`);
      triggerPopupAlert('success', 'Category Purged', 'The category profile was wiped from server index records.');
      await fetchCategoriesList();
    } catch (err) {
      triggerPopupAlert('error', 'Deletion Blocked', err.response?.data?.message || 'Failed to delete category.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-fadeIn font-sans relative">
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-base font-bold tracking-tight text-zinc-900">Add New Category</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Establish an overarching product department configuration module layer.</p>
      </div>

      {/* FORM CARD */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <InputField label="Category Division Designation *" name="name" value={formData.name} onChange={handleInputChange} placeholder="DETERGENT, BUCKET, AGARBATI ..." error={error} disabled={isSubmitting} />
          
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 select-none">Scope Log Description</label>
            <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} disabled={isSubmitting} placeholder="Briefly chart out the tracking boundaries..." className="w-full text-sm rounded-xl border border-zinc-200 px-3.5 py-1.5 bg-white resize-none focus:outline-hidden focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition duration-150 text-zinc-900" />
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end select-none">
            <button type="submit" disabled={isSubmitting} className="px-5 h-9 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs">
              {isSubmitting ? 'Establishing Reference...' : 'Commit New Category'}
            </button>
          </div>
        </form>
      </div>

      {/* CATEGORIES MANAGEMENT TABLE */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden animate-fadeIn">
        <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 select-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Available Shop Categories ({categories.length})</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="bg-zinc-50/70 border-b border-zinc-200 font-bold uppercase tracking-wider text-zinc-400 select-none">
                <th className="px-4 py-3 w-1/3">Category Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 w-40 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {categories.length > 0 ? (
                categories.map((cat) => {
                  const isEditing = editingId === cat._id;
                  return (
                    <tr key={cat._id} className="hover:bg-zinc-50/10 transition duration-150">
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full text-xs font-bold rounded-lg border border-zinc-200 px-2 py-1 bg-white focus:outline-hidden text-zinc-900" />
                        ) : (
                          <span className="font-bold text-zinc-900">{cat.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <input type="text" value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} className="w-full text-xs rounded-lg border border-zinc-200 px-2 py-1 bg-white focus:outline-hidden text-zinc-900" />
                        ) : (
                          <span className="text-zinc-400 truncate max-w-xs block">{cat.description || 'No description provided.'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center select-none">
                        {isEditing ? (
                          <div className="flex justify-center gap-1.5">
                            <button type="button" onClick={() => handleUpdateSubmit(cat._id)} className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-bold text-[10px] uppercase cursor-pointer">Save</button>
                            <button type="button" onClick={() => setEditingId(null)} className="px-2 py-0.5 bg-white border border-zinc-200 text-zinc-400 rounded-md font-bold text-[10px] uppercase cursor-pointer">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => startEditingMode(cat)} className="text-zinc-900 hover:text-zinc-600 underline font-bold cursor-pointer">Edit</button>
                            <button type="button" onClick={() => startDeleteConfirmation(cat)} className="text-red-600 hover:text-red-800 underline font-bold cursor-pointer">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3" className="px-5 py-8 text-center text-zinc-400 italic">No category tracking nodes found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 💡 LIVE NOTIFICATION POPUP PANEL */}
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

      {/* 💡 PREMIUM ASYNC DELETION DESTRUCTIVE CONFIRM MODAL OVERLAY */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn select-none">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-red-50 text-red-800 border border-red-200 flex items-center justify-center shrink-0 font-black text-sm">✕</div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">Confirm Master Purge</h3>
                <p className="text-xs leading-normal text-zinc-500 font-medium">{confirmModal.msg}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button type="button" onClick={() => setConfirmModal({ isOpen: false, targetId: null, msg: '' })} className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-500 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer">Abort</button>
              <button type="button" onClick={handleConfirmedDelete} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs">Execute Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCategory;