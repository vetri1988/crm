/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { InventoryItem } from '../types';
import { 
  Plus, 
  Search, 
  Box, 
  MapPin, 
  Edit3, 
  Trash2, 
  Sparkles,
  AlertTriangle,
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  companyCurrency: string;
  onSaveItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function InventoryView({ inventory, companyCurrency, onSaveItem, onDeleteItem }: InventoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('Standard');
  const [capacity, setCapacity] = useState('Standard');
  const [voltage, setVoltage] = useState(12);
  const [stockLevel, setStockLevel] = useState(10);
  const [reorderLevel, setReorderLevel] = useState(4);
  const [cost, setCost] = useState(100);
  const [price, setPrice] = useState(150);
  const [location, setLocation] = useState('Shelf A1');

  // Open form to add a completely new product
  const handleAddNew = () => {
    setEditingItem(null);
    setBrand('');
    setModel('');
    setType('Standard');
    setCapacity('Standard');
    setVoltage(12);
    setStockLevel(10);
    setReorderLevel(4);
    setCost(100);
    setPrice(150);
    setLocation('Shelf A1');
    setIsFormOpen(true);
  };

  // Open form to edit an existing battery item
  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setBrand(item.brand || '');
    setModel(item.model || '');
    setType(item.type || 'Standard');
    setCapacity(item.capacity || '');
    setVoltage(item.voltage !== undefined ? item.voltage : 12);
    setStockLevel(item.stockLevel !== undefined ? item.stockLevel : 0);
    setReorderLevel(item.reorderLevel !== undefined ? item.reorderLevel : 0);
    setCost(item.cost !== undefined ? item.cost : 0);
    setPrice(item.price !== undefined ? item.price : 0);
    setLocation(item.location || '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    const item: InventoryItem = {
      id: editingItem?.id || '',
      brand: brand || 'Generic',
      model: model || 'Product Item',
      type,
      capacity,
      voltage: Number(voltage),
      stockLevel: Number(stockLevel),
      reorderLevel: Number(reorderLevel),
      cost: Number(cost),
      price: Number(price),
      location: location || 'Warehouse Common'
    };
    onSaveItem(item);
    setIsFormOpen(false);
    setEditingItem(null);
  };

  // Calculate stats
  const totalStockCount = inventory.reduce((total, item) => total + item.stockLevel, 0);
  const lowStockCount = inventory.filter(item => item.stockLevel <= item.reorderLevel).length;
  const portfolioValue = inventory.reduce((total, item) => total + (item.stockLevel * item.cost), 0);

  // Filters and queries
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'All' || item.type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div id="inventory_view_container" className="space-y-6 animate-fade-in">
      
      {/* Dynamic Summary counters */}
      <div id="inventory_stats_cards" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/10 rounded-xl border border-indigo-100/55 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-sans font-bold text-indigo-500 uppercase tracking-wide">Product Models Registered</span>
            <h4 className="text-2xl font-mono font-bold text-slate-800">{inventory.length} Units</h4>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50/40 to-amber-100/10 rounded-xl border border-amber-100/60 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-sans font-bold text-amber-600 uppercase tracking-wide">Total Physical StockCount</span>
            <h4 className="text-2xl font-mono font-bold text-slate-800">{totalStockCount} Left</h4>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Box className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50/40 to-teal-100/10 rounded-xl border border-teal-100/65 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-sans font-bold text-teal-600 uppercase tracking-wide">Warehouse Assets Valuation</span>
            <h4 className="text-2xl font-mono font-bold text-slate-800">
              {companyCurrency}{portfolioValue.toLocaleString()}
            </h4>
          </div>
          <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div id="inventory_control_card" className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Live Filter Controls bar */}
        <div id="inventory_search_toolbar" className="p-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex flex-1 items-center gap-3 w-full max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="inv_search_input"
                type="text"
                placeholder="Search product model, brand, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
              />
            </div>
            
            <select
              id="inv_chemistry_filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl font-sans text-xs px-3 py-2.5 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Types</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <button
            id="inv_create_btn"
            onClick={handleAddNew}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>

        {/* Dynamic inventory table list */}
        <div id="inventory_table_scroller" className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-[11px] font-sans font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-5">Brand & Model</th>
                <th className="py-3 px-4">Product Type</th>
                <th className="py-3 px-4 text-center">Tech Spec</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4 text-right">Unit cost / Retails</th>
                <th className="py-3 px-4">Shelf Location</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 text-xs font-sans">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No items match your current keyword or product filters.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLow = item.stockLevel <= item.reorderLevel;
                  const isOut = item.stockLevel === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900">{item.brand}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.model}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-2 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono">
                        <span className="font-bold text-slate-800">{item.capacity || 'Standard'}</span>
                        {item.voltage ? <span className="text-[10px] text-slate-400 block">{item.voltage} V</span> : null}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-mono font-bold text-sm ${isOut ? 'text-rose-600' : isLow ? 'text-amber-500' : 'text-slate-800'}`}>
                            {item.stockLevel}
                          </span>
                          
                          {isOut ? (
                            <span className="text-[9px] bg-rose-50 text-rose-600 font-bold uppercase px-1.5 py-0.2 mt-0.5 rounded flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Out
                            </span>
                          ) : isLow ? (
                            <span className="text-[9px] bg-amber-50 text-amber-600 font-bold uppercase px-1.5 py-0.2 mt-0.5 rounded">
                              Reorder
                            </span>
                          ) : (
                            <span className="text-[9px] text-emerald-600 font-medium font-mono">Optimal</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono">
                        <div className="text-slate-400 text-[10px]">Cost: {companyCurrency}{item.cost}</div>
                        <div className="font-bold text-slate-900">{companyCurrency}{item.price}</div>
                        <div className="text-[9px] text-emerald-600">Margin: {Math.round(((item.price - item.cost) / item.price) * 100)}%</div>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-600 flex items-center gap-1 mt-2.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.location}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            title="Edit details"
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete item from register"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${item.brand} ${item.model}?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide Drawer Modal for Creating / Editing Products */}
      {isFormOpen && (
        <div id="inv_drawer_card" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-slide-left">
            <div>
              <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100">
                <h3 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2">
                  <Box className="w-5 h-5 text-indigo-500" />
                  {editingItem ? 'Edit Product Details' : 'Register New Product'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 hover:bg-slate-50 rounded text-slate-500 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {/* Brand & Model details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Manufacturer Brand</label>
                    <input
                      required
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Acme, Sony"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Model Name / Series</label>
                    <input
                      required
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. Model X, Hi-Fi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                    />
                  </div>
                </div>

                {/* Product type dropdown */}
                <div>
                  <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Product Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="Standard">Standard Product (Core)</option>
                    <option value="Premium">Premium Product (High End)</option>
                    <option value="Custom">Custom Order Specification</option>
                  </select>
                </div>

                {/* Capacity & Voltage Spec */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Product Capacity / Spec</label>
                    <input
                      required
                      type="text"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="e.g. Standard, 150 Ah, 1 TB"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Operating Voltage (V)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={voltage}
                      onChange={(e) => setVoltage(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                    />
                  </div>
                </div>

                {/* Stock levels and reorders */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-50">
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Current Stock Level</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={stockLevel}
                      onChange={(e) => setStockLevel(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Reorder Level Threshold</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={reorderLevel}
                      onChange={(e) => setReorderLevel(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                {/* Cost price & Selling Retail Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Purchase Cost ({companyCurrency})</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Selling Price ({companyCurrency})</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                    />
                  </div>
                </div>

                {/* Location code storage inside rackings */}
                <div>
                  <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Depot Storage Location code</label>
                  <input
                    required
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Shelf C3, North Corner"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Racks and coordinate zones help technician quick-picks.</span>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-bold py-2.5 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-900/10"
                  >
                    {editingItem ? 'Update Database' : 'Register Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
