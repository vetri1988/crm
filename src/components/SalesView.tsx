/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Sale, InventoryItem, Employee, Client } from '../types';
import { formatDDMMYYYY } from '../utils/date';
import { 
  ShoppingBag, 
  Search, 
  Calendar, 
  ShieldCheck, 
  History, 
  ArrowRight, 
  Plus, 
  User, 
  MapPin, 
  DollarSign, 
  Sparkles, 
  CheckCircle,
  Truck,
  Box,
  Edit,
  Trash2,
  Printer
} from 'lucide-react';

interface SalesViewProps {
  sales: Sale[];
  inventory: InventoryItem[];
  employees: Employee[];
  clients: Client[];
  companyCurrency: string;
  companySettings?: any;
  leadPreset: any; // used to quickly pre-populate checkout from CRM pipeline conversions
  onClearPreset: () => void;
  onCheckoutSale: (sale: Sale) => void;
  onDeleteSale: (id: string) => void;
}

export default function SalesView({ 
  sales, 
  inventory, 
  employees, 
  clients, 
  companyCurrency, 
  companySettings,
  leadPreset, 
  onClearPreset, 
  onCheckoutSale,
  onDeleteSale
}: SalesViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'checkout' | 'sales_history' | 'client_profiles'>('checkout');
  const [searchTerm, setSearchTerm] = useState('');

  // Checkout form params
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  
  const [installationDate, setInstallationDate] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyMonths, setWarrantyMonths] = useState(24);
  const [status, setStatus] = useState<'Completed' | 'Pending Installation'>('Completed');
  const [employeeId, setEmployeeId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [activeLeadId, setActiveLeadId] = useState<string>('');

  const [deleteConfirmation, setDeleteConfirmation] = useState<Sale | null>(null);

  const handleStartEdit = (sale: Sale) => {
    setEditingSale(sale);
    setClientName(sale.clientName || '');
    setClientPhone(sale.clientPhone || '');
    setClientEmail(sale.clientEmail || '');
    setClientAddress(sale.clientAddress || '');
    setSelectedProductId(sale.productId || (sale as any).batteryId || '');
    setQuantity(sale.quantity !== undefined ? sale.quantity : 1);
    setPaymentMethod(sale.paymentMethod || 'Card');
    setInstallationDate(sale.installationDate || new Date().toISOString().split('T')[0]);
    setWarrantyMonths(sale.warrantyMonths !== undefined ? sale.warrantyMonths : 24);
    setStatus(sale.status || 'Completed');
    setEmployeeId(sale.employeeId || '');
    setTechnicianId(sale.technicianId || '');
    setActiveLeadId(sale.leadId || '');
    setActiveSubTab('checkout');
  };

  const handlePrintSale = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${sale.invoiceNumber}</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="p-8">
            <div class="p-8 border border-slate-200">
              <header class="border-b-2 border-slate-900 pb-6 mb-6">
                <h1 class="text-3xl font-black uppercase tracking-tighter text-slate-950">${companySettings?.companyName || 'GeneralCRM'}</h1>
                <p class="text-sm text-slate-600 mt-1">${companySettings?.companyAddress || ''}</p>
              </header>

              <div class="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h2 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billed To</h2>
                  <div class="text-sm font-semibold">${sale.clientName}</div>
                  <div class="text-sm text-slate-600">${sale.clientAddress}</div>
                  <div class="text-sm text-slate-600">${sale.clientPhone}</div>
                  <div class="text-sm text-slate-600">${sale.clientEmail}</div>
                </div>
                <div class="text-right">
                  <h2 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Invoice Details</h2>
                  <div class="text-sm font-semibold">Invoice #: ${sale.invoiceNumber}</div>
                  <div class="text-sm text-slate-600">Date: ${formatDDMMYYYY(sale.installationDate)}</div>
                </div>
              </div>

              <table class="w-full text-left mb-8">
                <thead>
                  <tr class="border-b border-slate-900">
                    <th class="py-2 text-xs font-bold uppercase tracking-wider">Product</th>
                    <th class="py-2 text-xs font-bold uppercase tracking-wider text-right">Qty</th>
                    <th class="py-2 text-xs font-bold uppercase tracking-wider text-right">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr>
                    <td class="py-4 text-sm">${sale.productDetails}</td>
                    <td class="py-4 text-sm text-right">${sale.quantity}</td>
                    <td class="py-4 text-sm text-right font-bold">${companyCurrency}${sale.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div class="flex justify-end">
                <div class="w-1/3">
                  <div class="flex justify-between py-2 border-b border-slate-200">
                    <span class="text-sm font-semibold">Total Due</span>
                    <span class="text-lg font-black">${companyCurrency}${sale.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleCancelEdit = () => {
    setEditingSale(null);
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setClientAddress('');
    setQuantity(1);
    setStatus('Completed');
    setActiveLeadId('');
  };

  // Autofill if a lead preset has been sent from leads tab
  useEffect(() => {
    if (leadPreset) {
      setClientName(leadPreset.clientName || '');
      setClientPhone(leadPreset.clientPhone || '');
      setClientEmail(leadPreset.clientEmail || '');
      // Match employee if exists
      if (leadPreset.employeeId) {
        setEmployeeId(leadPreset.employeeId);
      }
      if (leadPreset.leadId) {
        setActiveLeadId(leadPreset.leadId);
      } else {
        setActiveLeadId('');
      }
      setActiveSubTab('checkout');
      onClearPreset(); // Consume the preset
    }
  }, [leadPreset]);

  // Set default items
  useEffect(() => {
    if (inventory.length > 0 && !selectedProductId) {
      setSelectedProductId(inventory[0].id);
    }
    if (employees.length > 0 && !employeeId) {
      // Pick first sales exec if possible
      const exec = employees.find(e => e.designation === 'Sales Executive');
      setEmployeeId(exec ? exec.name : employees[0].name);
    }
    if (employees.length > 0 && !technicianId) {
      const tech = employees.find(e => e.designation === 'Senior Technician');
      setTechnicianId(tech ? tech.name : employees[0].name);
    }
  }, [inventory, employees]);

  // Calculations
  const chosenProductItem = inventory.find(item => item.id === selectedProductId);
  const subtotal = chosenProductItem ? chosenProductItem.price * quantity : 0;
  const taxes = Math.round(subtotal * 0.08); // 8% local tax rate representation
  const grossTotal = subtotal + taxes;

  const handleCheckoutSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !chosenProductItem) {
      alert("Please configure a valid product model standard for checkout.");
      return;
    }

    // When editing, the old quantity of the sale can be added back to compute true stock remaining
    const oldQty = editingSale && editingSale.productId === selectedProductId ? editingSale.quantity : 0;
    if (quantity > (chosenProductItem.stockLevel + oldQty)) {
      alert(`Insufficient stock. Only ${chosenProductItem.stockLevel + oldQty} units remaining for ${chosenProductItem.brand} ${chosenProductItem.model}.`);
      return;
    }

    // Auto-calculate warranty expiry date
    const installDateObj = new Date(installationDate);
    installDateObj.setMonth(installDateObj.getMonth() + Number(warrantyMonths));
    const warrantyExpiration = installDateObj.toISOString().split('T')[0];

    const saleRecord: Sale = {
      id: editingSale ? editingSale.id : '',
      invoiceNumber: editingSale ? editingSale.invoiceNumber : '',
      clientName: clientName || 'Walk-in Client',
      clientPhone: clientPhone || '+1 (555) 000-0000',
      clientEmail: clientEmail || 'billing@voltcharge.com',
      clientAddress: clientAddress || 'Depot Checkout Counter',
      productId: selectedProductId,
      productDetails: `${chosenProductItem.brand} ${chosenProductItem.model} (${chosenProductItem.capacity || 'Standard'}${chosenProductItem.voltage ? `, ${chosenProductItem.voltage}V` : ''})`,
      quantity,
      totalAmount: grossTotal,
      paymentMethod,
      installationDate,
      warrantyMonths,
      warrantyExpiration,
      status,
      employeeId: employeeId || 'Elena Rostova',
      technicianId: technicianId || undefined,
      leadId: activeLeadId || undefined
    };

    onCheckoutSale(saleRecord);
    
    if (editingSale) {
      alert(`Success! Updated invoice ${editingSale.invoiceNumber} successfully and synchronized inventory/commissions.`);
      setEditingSale(null);
    } else {
      alert(`Success! Generated invoice successfully and decremented warehouse stock level for ${chosenProductItem.model}. Automated 6-month reminder has been scheduled for client.`);
    }

    // Reset fields
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setClientAddress('');
    setQuantity(1);
    setStatus('Completed');
    setActiveLeadId('');
  };

  // Searching helper configurations
  const filteredSales = sales.filter(s => 
    s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.productDetails.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.productDetails.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="sales_view_container" className="space-y-6 animate-fade-in">
      
      {/* Sub menu Navigation channels bar */}
      <div id="sales_sub_tab_header" className="flex border-b border-slate-100 bg-white p-2 rounded-xl border shadow-xs gap-2">
        <button
          id="checkout_tab_btn"
          onClick={() => setActiveSubTab('checkout')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'checkout'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Lead Conversion
        </button>
        <button
          id="history_tab_btn"
          onClick={() => setActiveSubTab('sales_history')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'sales_history'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          Converted Leads history
        </button>
        <button
          id="profiles_tab_btn"
          onClick={() => setActiveSubTab('client_profiles')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'client_profiles'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          Client Warranty Records ({clients.length})
        </button>
      </div>

      {/* RENDER VIEW: CHECKOUT REGISTER */}
      {activeSubTab === 'checkout' && (
        <div id="checkout_tab_panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Checkout details input fields */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-sans font-bold text-slate-900 mb-5 flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-500" />
                {editingSale ? `Edit Invoice: ${editingSale.invoiceNumber}` : 'Primary Invoicing Checkout Details'}
              </span>
              {editingSale && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[10px] bg-rose-50 text-rose-600 font-bold px-2.5 py-1 rounded-md hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </h3>

            <form onSubmit={handleCheckoutSubmit} className="space-y-5">
              {/* Clients context segment */}
              <div className="space-y-3">
                <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest block">Client Contact Information</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Customer Name *</label>
                    <input
                      required
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Liam Sterling / Power Grid Corp"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1 font-medium">Customer Phone Line *</label>
                    <input
                      required
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+1 (555) 998-3321"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Billing Email Account</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="sterling.p@gmail.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Premise Installation Address</label>
                    <input
                      type="text"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="77 Oakwood Street, Suite 4"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Inventory Product association spec */}
              <div className="space-y-3 pt-3 border-t border-slate-50">
                <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest block">Product Allocation</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Choose Product Model *</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-bold"
                    >
                      {inventory.map(item => (
                        <option 
                           key={item.id} 
                           value={item.id} 
                           disabled={item.stockLevel === 0}
                        >
                          {item.brand} {item.model} — Spec:{item.capacity || 'Standard'} ({item.type}) | Stock: {item.stockLevel} left | Price: {companyCurrency}{item.price}
                        </option>
                      ))}
                      {inventory.length === 0 && (
                        <option value="">No Active Stock Available</option>
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Cart Quantity *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white font-mono text-center font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Warranties expiration details & assignment tracking dates */}
              <div className="space-y-3 pt-3 border-t border-slate-50">
                <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest block">Workorder & Dynamic Service Protocols</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Installation Date
                    </label>
                    <input
                      required
                      type="date"
                      value={installationDate}
                      onChange={(e) => setInstallationDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      Warranty Coverage
                    </label>
                    <select
                      value={warrantyMonths}
                      onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                    >
                      <option value={12}>12 Months (1 Year)</option>
                      <option value={24}>24 Months (2 Years)</option>
                      <option value={36}>36 Months (3 Years)</option>
                      <option value={48}>48 Months (4 Years)</option>
                      <option value={60}>60 Months (5 Years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Fulfillment Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-indigo-700"
                    >
                      <option value="Completed">Direct Counter Sale</option>
                      <option value="Pending Installation">Pending Site Installation</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Billing Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    >
                      <option value="Card">Visa / Credit Card</option>
                      <option value="Cash">Cash Transaction</option>
                      <option value="Bank Transfer">Bank Wire Transfer</option>
                      <option value="Financing">Company EMI Financing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1 font-medium">Billed by Sales Rep</label>
                    <select
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-semibold"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name} ({emp.designation})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Assigned Installer</label>
                    <select
                      value={technicianId}
                      onChange={(e) => setTechnicianId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-semibold"
                    >
                      {employees.filter(e => e.designation.includes('Technician') || e.designation.includes('Helper')).map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                      ))}
                      <option value="">No Installer (Counter Pick)</option>
                    </select>
                  </div>
                </div>
              </div>

               <div className="pt-2 flex gap-3">
                {editingSale && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!selectedProductId}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl font-sans text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {editingSale ? 'Save Changes & Update Invoice' : 'Complete Conversion'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Checkout calculator breakdown summary */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-indigo-400 font-bold mb-4">Calculated Quotation Preview</h4>
              
              <div className="space-y-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3">
                  <Box className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400">Selected Product spec:</span>
                    <h5 className="text-xs font-sans font-semibold mt-0.5">{chosenProductItem ? `${chosenProductItem.brand} ${chosenProductItem.model}` : 'None Chosen'}</h5>
                    <span className="text-[10px] font-mono text-slate-300 block">Spec: {chosenProductItem ? `${chosenProductItem.capacity || 'Standard'}${chosenProductItem.voltage ? ` | Volts: ${chosenProductItem.voltage}V` : ''}` : 'Standard'}</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-xs text-slate-300 border-b border-white/5 pb-4">
                  <div className="flex justify-between">
                    <span>Retail Unit Price:</span>
                    <span>{companyCurrency}{chosenProductItem ? chosenProductItem.price : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity selection:</span>
                    <span>x {quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{companyCurrency}{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin/Tax Charges (8%):</span>
                    <span>{companyCurrency}{taxes}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-slate-400">Invoice Total Due:</span>
                  <span className="text-2xl font-mono font-black text-white">
                    {companyCurrency}{grossTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 mt-12 space-y-2">
              <span className="text-[10px] text-emerald-400 font-sans font-bold flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/10">
                <CheckCircle className="w-3.5 h-3.5" /> Checked against live stock levels.
              </span>
              
              <span className="text-[10px] text-indigo-400 font-sans font-bold flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/15">
                <Truck className="w-3.5 h-3.5" /> Standard {warrantyMonths} months warranty scheduled automatically.
              </span>
            </div>
          </div>

        </div>
      )}

      {/* RENDER VIEW: BILLED HISTORY */}
      {activeSubTab === 'sales_history' && (
        <div id="sales_history_panel" className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
          
          <div className="p-5 border-b border-slate-50 flex items-center gap-4 bg-slate-50/20">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="sales_search_history"
                type="text"
                placeholder="Search invoice number, client details, or battery specs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-sans font-bold text-slate-500 bg-slate-50/50">
                  <th className="py-3 px-5">Invoice Code</th>
                  <th className="py-3 px-4">Client Associated</th>
                  <th className="py-3 px-4">Product Selection Details</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Invoiced Total</th>
                  <th className="py-3 px-4 text-center">Warranty duration</th>
                  <th className="py-3 px-4">Installation Date</th>
                  <th className="py-3 px-5">Sales Rep</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-800">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                      No invoices logged with the chosen keyword.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/30">
                      <td className="py-4 px-5 font-mono font-bold text-indigo-700">{sale.invoiceNumber}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{sale.clientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{sale.clientPhone}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-sans font-semibold text-slate-800 block">{sale.productDetails}</span>
                        <span className="text-[10px] bg-slate-50 px-2.5 py-0.5 inline-block text-slate-500 font-mono rounded mt-0.5">{sale.paymentMethod}</span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold">{sale.quantity}</td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-slate-950">{companyCurrency}{sale.totalAmount.toLocaleString()}</td>
                      <td className="py-4 px-4 text-center font-mono">
                        <div className="text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded text-[10px] font-bold">
                          {sale.warrantyMonths} Mos
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Expires: {formatDDMMYYYY(sale.warrantyExpiration)}</div>
                      </td>
                      <td className="py-4 px-4 font-mono font-medium text-slate-600">
                        {formatDDMMYYYY(sale.installationDate)}
                        <span className={`block text-[9px] font-bold ${sale.status === 'Completed' ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {sale.status === 'Completed' ? '✓ Installed' : '● Scheduled'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-semibold">{sale.employeeId}</td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title="Print Invoice"
                            onClick={() => handlePrintSale(sale)}
                            className="p-1 px-2 border border-slate-100 bg-slate-50/80 text-slate-600 hover:bg-slate-600 hover:text-white rounded transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            Print
                          </button>
                          <button
                            title="Edit Invoiced Sale"
                            onClick={() => handleStartEdit(sale)}
                            className="p-1 px-2 border border-indigo-100 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-650 hover:bg-indigo-600 hover:text-white rounded transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            title="Delete Invoiced Sale"
                            onClick={() => setDeleteConfirmation(sale)}
                            className="p-1 px-2 border border-rose-100 bg-rose-50/80 text-rose-600 hover:bg-rose-600 hover:text-white rounded transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-sans font-bold text-lg text-slate-900 mb-2">Are you sure?</h3>
            <p className="text-sm font-sans text-slate-600 mb-6">
              Are you sure you want to permanently delete invoice <strong>{deleteConfirmation.invoiceNumber}</strong> for client <strong>{deleteConfirmation.clientName}</strong>? This will revert any warehouse stock counts and remove employee commission credits.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onDeleteSale(deleteConfirmation.id);
                  setDeleteConfirmation(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-lg font-sans font-bold text-xs"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-sans font-bold text-xs"
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW: CLIENT WARRANTY RECORDS */}
      {activeSubTab === 'client_profiles' && (
        <div id="clients_grid_panel" className="space-y-4 animate-fade-in">
          
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="client_card_search"
                type="text"
                placeholder="Search customer name, contact details or battery specs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-sans">
              Total Customers Stored: <strong className="text-slate-900">{clients.length}</strong>
            </span>
          </div>

          <div id="clients_registry_layout" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClients.length === 0 ? (
              <div className="col-span-full py-16 bg-white border rounded-xl text-center text-slate-400 font-sans text-xs">
                No customer profiles match that query.
              </div>
            ) : (
              filteredClients.map((client) => {
                const isWarrantyExpired = new Date(client.warrantyExpiration) < new Date();
                return (
                  <div key={client.id} id={`client_card_${client.id}`} className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs relative">
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-sans font-bold text-slate-900 text-sm">{client.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{client.phone} | {client.email}</span>
                      </div>
                      
                      {isWarrantyExpired ? (
                        <span className="text-[9px] bg-rose-50 text-rose-600 font-bold uppercase rounded-md px-2 py-0.5 border border-rose-100">
                          Warranty Expired
                        </span>
                      ) : (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold uppercase rounded-md px-2 py-0.5 border border-emerald-100/50">
                          Active Warranty
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-3 my-4 text-center font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-sans">Product Details</span>
                        <span className="text-xs font-bold text-slate-800">{client.productDetails}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-sans">Install Date</span>
                        <span className="text-[10px] font-bold text-slate-800">{formatDDMMYYYY(client.installationDate)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-sans">Warranty Exp</span>
                        <span className="text-[10px] font-bold text-indigo-700">{formatDDMMYYYY(client.warrantyExpiration)}</span>
                      </div>
                    </div>

                    {client.notes && (
                      <div className="bg-slate-50/50 rounded-lg p-2.5 mt-2 flex gap-1 items-start text-[11px] font-sans text-slate-600">
                        <span className="font-semibold shrink-0 text-indigo-600">Note:</span>
                        <span className="italic">&quot;{client.notes}&quot;</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-sans mt-3 flex justify-between">
                      <span>Ref Code: {client.id}</span>
                      <span>Last Service Check: <strong className="text-slate-600">{formatDDMMYYYY(client.lastServiceDate)}</strong></span>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
