import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVaultInventoryMetrics = async () => {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        axios.get('/products'),
        // 💡 THE FIX: Aligned to hit your exact backend mounted endpoint path cleanly
        axios.get('/products/category') 
      ]);
      setProducts(productsResponse.data || []);
      
      if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
        setCategories(categoriesResponse.data);
      }
    } catch (error) {
      console.error("Critical stock data matrix synchronization failure:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultInventoryMetrics();
  }, []);

  // Compute total lines and units grouped inside each distinct category block
  const categorySummaries = useMemo(() => {
    return categories.map(cat => {
      const associatedItems = products.filter(p => p.category?._id === cat._id || p.category === cat._id);
      const totalUnitsVolume = associatedItems.reduce((acc, curr) => acc + (Number(curr.stockQuantity) || 0), 0);
      
      return {
        ...cat,
        itemCount: associatedItems.length,
        totalUnitsVolume,
        items: associatedItems
      };
    });
  }, [categories, products]);

  // Extract products belonging to the actively drilled down taxonomy segment
  const activeProductList = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter(p => p.category?._id === selectedCategory._id || p.category === selectedCategory._id);
  }, [selectedCategory, products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans">
        <div className="h-6 w-6 rounded-full border-2 border-zinc-200 border-t-zinc-950 animate-spin" />
        <span className="text-[10px] tracking-widest uppercase font-bold text-zinc-400 mt-3 animate-pulse">Syncing Vault Logs</span>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fadeIn">
      
      {/* Dynamic Header Interaction Bar */}
      <div className="border-b border-zinc-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-base font-bold tracking-tight text-zinc-900">
            {selectedCategory ? `Stock Details ➔ ${selectedCategory.name}` : 'Stock Details & Products'}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {selectedCategory 
              ? `Reviewing specific product allocation segments under the ${selectedCategory.name} taxonomy cluster.`
              : 'Drill down into specialized store departments to trace specific serial SKU profiles and units.'}
          </p>
        </div>
        
        {selectedCategory && (
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="self-start text-xs font-bold text-zinc-700 bg-white border border-zinc-200 px-3.5 py-1.5 rounded-xl hover:bg-zinc-50 transition cursor-pointer select-none"
          >
            ← Back to Categories
          </button>
        )}
      </div>

      {/* VIEW LAYER A: Default Category Cards Matrix View */}
      {!selectedCategory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorySummaries.length > 0 ? (
            categorySummaries.map((cat) => (
              <div
                key={cat._id}
                onClick={() => setSelectedCategory(cat)}
                className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs space-y-3 hover:border-zinc-400 transition duration-200 cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <span className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-sm group-hover:bg-zinc-900 group-hover:text-white transition duration-200">
                    🏷️
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 font-mono text-zinc-500 border border-zinc-200/40">
                    {cat.itemCount} SKUs
                  </span>
                </div>
                
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-zinc-900 group-hover:text-zinc-950 transition">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-zinc-400 truncate font-medium">
                    {cat.description || 'No detailed log constraints provided.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex justify-between items-center text-[10px] text-zinc-400 font-medium">
                  <span>Cumulative Balance:</span>
                  <span className="font-mono font-bold text-zinc-800">{cat.totalUnitsVolume} units</span>
                </div>
              </div>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 p-12 text-center text-zinc-400 italic text-xs bg-white border border-zinc-200 rounded-xl">
              No store divisions cataloged. Create a category profile to structure your layouts.
            </div>
          )}
        </div>
      )}

      {/* VIEW LAYER B: Targeted Products Detailed Spreadsheet */}
      {selectedCategory && (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden animate-fadeIn">
          <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Department Item Inventory Ledger
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-white border border-zinc-200 rounded-lg font-mono text-zinc-500">
              Filtered Entries: {activeProductList.length} Rows
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-medium">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 font-bold uppercase tracking-wider text-zinc-400 select-none">
                  <th className="px-5 py-3">Product Description Reference</th>
                  <th className="px-5 py-3 w-44">Universal SKU</th>
                  <th className="px-5 py-3 w-36 text-right">Unit Rate</th>
                  <th className="px-5 py-3 w-44 text-center">Remaining Stock Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {activeProductList.length > 0 ? (
                  activeProductList.map((item) => {
                    const isLowStock = item.stockQuantity < 5;
                    return (
                      <tr key={item._id} className={`transition-colors duration-150 ${isLowStock ? 'bg-amber-50/20' : 'hover:bg-zinc-50/20'}`}>
                        <td className="px-5 py-3.5 font-bold text-zinc-900">{item.name}</td>
                        <td className="px-5 py-3.5 font-mono text-zinc-400 font-semibold uppercase">{item.sku}</td>
                        <td className="px-5 py-3.5 text-right font-bold font-mono text-zinc-500">
                          ₹{Number(item.price).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono font-bold text-zinc-900">{item.stockQuantity}</span>
                            {isLowStock && (
                              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide uppercase border border-amber-200/50 animate-pulse select-none">
                                Low Stock
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-zinc-400 italic">
                      No active line entries assigned to this department block yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;