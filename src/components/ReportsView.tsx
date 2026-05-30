/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CRMDatabase, Employee, Sale, Lead, Client, InventoryItem } from '../types';
import { formatDDMMYYYY } from '../utils/date';
import { 
  Printer, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Layers, 
  Search, 
  Filter, 
  ChevronRight, 
  Award,
  DollarSign,
  PieChart,
  ShoppingBag,
  BadgeAlert,
  ArrowUpDown,
  Box,
  BellRing
} from 'lucide-react';

interface ReportsViewProps {
  data: CRMDatabase;
}

type ReportTab = 'sales' | 'leads' | 'customers' | 'employees' | 'stock' | 'service';

export default function ReportsView({ data }: ReportsViewProps) {
  const [activeReport, setActiveReport] = useState<ReportTab>('sales');
  const [salesSearch, setSalesSearch] = useState('');
  const [leadsSearch, setLeadsSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  // Fallback defaults
  const sales = data.sales || [];
  const leads = data.leads || [];
  const clients = data.clients || [];
  const reminders = data.reminders || [];
  const employees = data.employees || [];
  const inventory = data.inventory || [];
  const currency = data.settings?.companyCurrency || '$';
  const companyName = data.settings?.companyName || 'VoltCRM Enterprise Solutions';

  const today = useMemo(() => new Date(), []);

  // --- REPORT 6: SERVICE CUSTOMER & CARE ALERTS ---
  const serviceReportData = useMemo(() => {
    const totalReminders = reminders.length;
    const completedReminders = reminders.filter(r => r.status === 'Completed').length;
    const overdueReminders = reminders.filter(r => r.status === 'Overdue').length;
    const scheduledReminders = reminders.filter(r => r.status === 'Scheduled' || r.status === 'Sent').length;

    const completionRate = totalReminders > 0 ? Math.round((completedReminders / totalReminders) * 100) : 0;
    const overdueRate = totalReminders > 0 ? Math.round((overdueReminders / totalReminders) * 100) : 0;

    // Type-wise stats for reminders
    const typeWiseMap: { [type: string]: { type: string; count: number; completed: number; pending: number } } = {};
    reminders.forEach(r => {
      const typeKey = r.type || 'Other';
      if (!typeWiseMap[typeKey]) {
        typeWiseMap[typeKey] = { type: typeKey, count: 0, completed: 0, pending: 0 };
      }
      typeWiseMap[typeKey].count += 1;
      if (r.status === 'Completed') {
        typeWiseMap[typeKey].completed += 1;
      } else {
        typeWiseMap[typeKey].pending += 1;
      }
    });
    const typeWiseList = Object.values(typeWiseMap).sort((a, b) => b.count - a.count);

    // Clients paired with reminders count
    const clientServiceSummary = clients.map(c => {
      const clientReminders = reminders.filter(r => r.clientId === c.id || r.clientPhone === c.phone);
      const totalCount = clientReminders.length;
      const completedCount = clientReminders.filter(r => r.status === 'Completed').length;
      const dueNext = clientReminders
        .filter(r => r.status !== 'Completed' && r.dueDate)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate || '';

      return {
        ...c,
        totalRemindersCount: totalCount,
        completedRemindersCount: completedCount,
        dueNextDate: dueNext
      };
    }).sort((a, b) => b.totalRemindersCount - a.totalRemindersCount);

    return {
      totalReminders,
      completedReminders,
      overdueReminders,
      scheduledReminders,
      completionRate,
      overdueRate,
      typeWiseList,
      clientServiceSummary,
      totalServiceCustomers: clients.length
    };
  }, [clients, reminders]);

  // --- REPORT 1: SALES REPORT (Employee-wise & Brand-wise) ---
  const salesReportData = useMemo(() => {
    // 1. Employee-wise Sales aggregation
    const employeeWise: { [idOrName: string]: { name: string; designation: string; revenue: number; quantity: number; orderCount: number } } = {};
    
    // Initialize with all existing employees to ensure full scope
    employees.forEach(emp => {
      employeeWise[emp.id] = {
        name: emp.name,
        designation: emp.designation,
        revenue: 0,
        quantity: 0,
        orderCount: 0
      };
    });

    sales.forEach(sale => {
      const empId = sale.employeeId;
      const matchedEmp = employees.find(e => e.id === empId || e.name === empId);
      
      const key = matchedEmp ? matchedEmp.id : (empId || 'unassigned');
      
      if (!employeeWise[key]) {
        employeeWise[key] = {
          name: matchedEmp ? matchedEmp.name : (sale.employeeId || 'External Channel/Unassigned'),
          designation: matchedEmp ? matchedEmp.designation : 'Staff',
          revenue: 0,
          quantity: 0,
          orderCount: 0
        };
      }
      employeeWise[key].revenue += sale.totalAmount;
      employeeWise[key].quantity += sale.quantity || 1;
      employeeWise[key].orderCount += 1;
    });

    const employeeList = Object.values(employeeWise).sort((a, b) => b.revenue - a.revenue);

    // 2. Brand-wise Sales aggregation
    const brandWise: { [brand: string]: { brand: string; revenue: number; quantity: number; orderCount: number } } = {};
    
    sales.forEach(sale => {
      // Find item in inventory to determine its brand
      const product = inventory.find(inv => inv.id === sale.productId);
      let brandName = 'Unspecified';
      
      if (product && product.brand) {
        brandName = product.brand;
      } else if (sale.productDetails) {
        // Try to parse brand name from details if inventory item is deleted
        const firstWord = sale.productDetails.split(' ')[0];
        if (firstWord && firstWord.length > 2) {
          brandName = firstWord;
        }
      }

      const key = brandName.trim();
      if (!brandWise[key]) {
        brandWise[key] = {
          brand: key,
          revenue: 0,
          quantity: 0,
          orderCount: 0
        };
      }
      brandWise[key].revenue += sale.totalAmount;
      brandWise[key].quantity += sale.quantity || 1;
      brandWise[key].orderCount += 1;
    });

    const brandList = Object.values(brandWise).sort((a, b) => b.revenue - a.revenue);
    
    // Total aggregate metrics
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalQty = sales.reduce((sum, s) => sum + (s.quantity || 1), 0);
    const totalSalesCount = sales.length;

    return {
      employeeSales: employeeList,
      brandSales: brandList,
      totalRevenue,
      totalQty,
      totalSalesCount
    };
  }, [sales, employees, inventory]);

  // --- REPORT 2: LEADS REPORT (Pipeline-wise) ---
  const leadsReportData = useMemo(() => {
    // Pipeline stage-wise aggregation
    const stageSummary: { [stage in string]: { stage: string; count: number; value: number } } = {
      'New': { stage: 'New', count: 0, value: 0 },
      'Contacted': { stage: 'Contacted', count: 0, value: 0 },
      'Under Discussion': { stage: 'Under Discussion', count: 0, value: 0 },
      'Proposal Sent': { stage: 'Proposal Sent', count: 0, value: 0 },
      'Won': { stage: 'Won', count: 0, value: 0 },
      'Lost': { stage: 'Lost', count: 0, value: 0 }
    };

    leads.forEach(lead => {
      const status = lead.status || 'New';
      if (!stageSummary[status]) {
        stageSummary[status] = { stage: status, count: 0, value: 0 };
      }
      stageSummary[status].count += 1;
      stageSummary[status].value += lead.estimatedValue || 0;
    });

    const pipelineList = Object.values(stageSummary);
    const totalLeadsCount = leads.length;
    const totalPipelineValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    
    // Calculate win-rate percentage (Won / (Won + Lost + other processed...))
    const wonCount = stageSummary['Won']?.count || 0;
    const lostCount = stageSummary['Lost']?.count || 0;
    const finishedCount = wonCount + lostCount;
    const winRate = finishedCount > 0 ? Math.round((wonCount / finishedCount) * 100) : 0;

    return {
      pipelineList,
      totalLeadsCount,
      totalPipelineValue,
      winRate,
      wonCount
    };
  }, [leads]);

  // --- REPORT 3: CUSTOMER REPORT ---
  const customerReportData = useMemo(() => {
    // Construct premium list of customers mapped with purchase count, revenue, and warranty status
    // Merging formal clients + active checkouts for full fidelity data integrity
    const customerMap: { 
      [phone: string]: { 
        name: string; 
        phone: string; 
        email: string; 
        address: string;
        orderCount: number; 
        totalSpent: number; 
        warrantyActive: number; 
        warrantyExpired: number;
        lastPurchaseDate?: string;
        sourceClientRegistry: boolean;
      } 
    } = {};

    // 1. Seed with registered clients
    clients.forEach(client => {
      const isWarrantyActive = client.warrantyExpiration ? (new Date(client.warrantyExpiration) > today) : false;
      customerMap[client.phone] = {
        name: client.name,
        phone: client.phone,
        email: client.email || 'N/A',
        address: client.address || 'N/A',
        orderCount: 0,
        totalSpent: 0,
        warrantyActive: isWarrantyActive ? 1 : 0,
        warrantyExpired: isWarrantyActive ? 0 : 1,
        sourceClientRegistry: true
      };
    });

    // 2. Aggregate sales
    sales.forEach(sale => {
      const keyPhone = sale.clientPhone;
      const parsedExpiration = sale.warrantyExpiration ? new Date(sale.warrantyExpiration) : null;
      const isWarrantyActive = parsedExpiration ? (parsedExpiration > today) : false;

      if (!customerMap[keyPhone]) {
        customerMap[keyPhone] = {
          name: sale.clientName,
          phone: sale.clientPhone,
          email: sale.clientEmail || 'N/A',
          address: sale.clientAddress || 'N/A',
          orderCount: 0,
          totalSpent: 0,
          warrantyActive: isWarrantyActive ? 1 : 0,
          warrantyExpired: isWarrantyActive ? 0 : 1,
          sourceClientRegistry: false
        };
      }

      customerMap[keyPhone].orderCount += 1;
      customerMap[keyPhone].totalSpent += sale.totalAmount;
      
      // Track latest purchase date
      const purchaseDate = sale.installationDate || '';
      if (purchaseDate) {
        if (!customerMap[keyPhone].lastPurchaseDate || purchaseDate > customerMap[keyPhone].lastPurchaseDate!) {
          customerMap[keyPhone].lastPurchaseDate = purchaseDate;
          // Sync warranty flags to the latest sale
          customerMap[keyPhone].warrantyActive = isWarrantyActive ? 1 : 0;
          customerMap[keyPhone].warrantyExpired = isWarrantyActive ? 0 : 1;
        }
      }
    });

    const clientList = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
    
    const activeWarranties = clientList.filter(c => c.warrantyActive > 0).length;
    const totalRevenueSum = clientList.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgLifetimeValue = clientList.length > 0 ? Math.round(totalRevenueSum / clientList.length) : 0;

    return {
      clientList,
      activeWarranties,
      avgLifetimeValue,
      totalCustomersCount: clientList.length
    };
  }, [clients, sales, today]);

  // --- REPORT 4: EMPLOYEE REPORT ---
  const employeeReportData = useMemo(() => {
    // Generate detailed organizational summaries for all staff, linking payroll values
    const staffProfiles = employees.map(emp => {
      // commission calc matched with backend logic:
      // (salesInvoiced * comm. percentage) + (leadsConverted * $50)
      const commissionVal = (emp.salesInvoiced * (emp.commissionPercentage / 100)) + (emp.leadsConverted * 50);
      const roundedCommission = Math.round(commissionVal * 10) / 10;
      const totalPayout = Math.round((emp.baseSalary + commissionVal) * 10) / 10;

      // Find leads assigned vs converted
      const assignedLeadsCount = leads.filter(l => 
        l.assignedTo === emp.id || 
        l.assignedTo === emp.name || 
        (emp.username && l.assignedTo === emp.username)
      ).length;

      const convertedLeadsCount = emp.leadsConverted || 0;
      const conversionRate = assignedLeadsCount > 0 ? Math.round((convertedLeadsCount / assignedLeadsCount) * 100) : 0;

      return {
        ...emp,
        actualCommission: roundedCommission,
        totalPayout,
        assignedLeadsCount,
        conversionRate
      };
    }).sort((a, b) => b.salesInvoiced - a.salesInvoiced);

    const totalPersonnelCompensation = staffProfiles.reduce((sum, p) => sum + p.totalPayout, 0);
    const topPerformer = staffProfiles[0];

    return {
      staffProfiles,
      totalPersonnelCompensation,
      topPerformer,
      totalPersonnelCount: staffProfiles.length
    };
  }, [employees, leads]);

  // --- REPORT 5: STOCK / WAREHOUSE INVENTORY REPORT ---
  const stockReportData = useMemo(() => {
    const totalSKUs = inventory.length;
    const totalStockQty = inventory.reduce((sum, item) => sum + (item.stockLevel || 0), 0);
    const totalValuationCost = inventory.reduce((sum, item) => sum + ((item.stockLevel || 0) * (item.cost || 0)), 0);
    const totalValuationSales = inventory.reduce((sum, item) => sum + ((item.stockLevel || 0) * (item.price || 0)), 0);
    const potentialProfit = Math.max(0, totalValuationSales - totalValuationCost);

    const lowStockItems = inventory.filter(item => (item.stockLevel || 0) <= (item.reorderLevel || 0));
    const lowStockItemsCount = lowStockItems.length;

    // Type-wise stock level and valuation aggregation
    const typeWiseMap: { [type: string]: { type: string; count: number; stockQty: number; costValuation: number; salesValuation: number } } = {};
    inventory.forEach(item => {
      const typeKey = (item.type || 'Other').trim();
      if (!typeWiseMap[typeKey]) {
        typeWiseMap[typeKey] = { type: typeKey, count: 0, stockQty: 0, costValuation: 0, salesValuation: 0 };
      }
      typeWiseMap[typeKey].count += 1;
      typeWiseMap[typeKey].stockQty += (item.stockLevel || 0);
      typeWiseMap[typeKey].costValuation += ((item.stockLevel || 0) * (item.cost || 0));
      typeWiseMap[typeKey].salesValuation += ((item.stockLevel || 0) * (item.price || 0));
    });
    const typeWiseList = Object.values(typeWiseMap).sort((a, b) => b.costValuation - a.costValuation);

    // Brand-wise stock level and valuation aggregation
    const brandWiseMap: { [brand: string]: { brand: string; count: number; stockQty: number; costValuation: number; salesValuation: number } } = {};
    inventory.forEach(item => {
      const brandKey = (item.brand || 'Other').trim();
      if (!brandWiseMap[brandKey]) {
        brandWiseMap[brandKey] = { brand: brandKey, count: 0, stockQty: 0, costValuation: 0, salesValuation: 0 };
      }
      brandWiseMap[brandKey].count += 1;
      brandWiseMap[brandKey].stockQty += (item.stockLevel || 0);
      brandWiseMap[brandKey].costValuation += ((item.stockLevel || 0) * (item.cost || 0));
      brandWiseMap[brandKey].salesValuation += ((item.stockLevel || 0) * (item.price || 0));
    });
    const brandWiseList = Object.values(brandWiseMap).sort((a, b) => b.costValuation - a.costValuation);

    return {
      totalSKUs,
      totalStockQty,
      totalValuationCost,
      totalValuationSales,
      potentialProfit,
      lowStockItemsCount,
      lowStockItems,
      typeWiseList,
      brandWiseList
    };
  }, [inventory]);

  const filteredStockList = useMemo(() => {
    const q = stockSearch.toLowerCase().trim();
    if (!q) return inventory;
    return inventory.filter(item => 
      (item.brand || '').toLowerCase().includes(q) ||
      (item.model || '').toLowerCase().includes(q) ||
      (item.type || '').toLowerCase().includes(q) ||
      (item.location || '').toLowerCase().includes(q)
    );
  }, [inventory, stockSearch]);

  // Search filter computations
  const filteredEmployeeSales = useMemo(() => {
    const q = salesSearch.toLowerCase().trim();
    if (!q) return salesReportData.employeeSales;
    return salesReportData.employeeSales.filter(emp => 
      emp.name.toLowerCase().includes(q) || 
      emp.designation.toLowerCase().includes(q)
    );
  }, [salesReportData.employeeSales, salesSearch]);

  const filteredBrandSales = useMemo(() => {
    const q = salesSearch.toLowerCase().trim();
    if (!q) return salesReportData.brandSales;
    return salesReportData.brandSales.filter(b => 
      b.brand.toLowerCase().includes(q)
    );
  }, [salesReportData.brandSales, salesSearch]);

  const filteredLeadsPipeline = useMemo(() => {
    const q = leadsSearch.toLowerCase().trim();
    if (!q) return leadsReportData.pipelineList;
    return leadsReportData.pipelineList.filter(stage => 
      stage.stage.toLowerCase().includes(q)
    );
  }, [leadsReportData.pipelineList, leadsSearch]);

  const filteredCustomerReportList = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customerReportData.clientList;
    return customerReportData.clientList.filter(client => 
      client.name.toLowerCase().includes(q) || 
      client.phone.includes(q) || 
      client.email.toLowerCase().includes(q) ||
      client.address.toLowerCase().includes(q)
    );
  }, [customerReportData.clientList, customerSearch]);

  const filteredStaffProfiles = useMemo(() => {
    const q = employeeSearch.toLowerCase().trim();
    if (!q) return employeeReportData.staffProfiles;
    return employeeReportData.staffProfiles.filter(staff => 
      staff.name.toLowerCase().includes(q) || 
      staff.designation.toLowerCase().includes(q) ||
      (staff.username && staff.username.toLowerCase().includes(q))
    );
  }, [employeeReportData.staffProfiles, employeeSearch]);

  const filteredServiceClients = useMemo(() => {
    const q = serviceSearch.toLowerCase().trim();
    if (!q) return serviceReportData.clientServiceSummary;
    return serviceReportData.clientServiceSummary.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q) || 
      c.email.toLowerCase().includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [serviceReportData.clientServiceSummary, serviceSearch]);


  // Native standard printing strategy
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="reports_main_container" className="space-y-6 animate-fade-in font-sans">
      
      {/* Dynamic Header Frame - Hidden in Native Browser Printing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl p-5 border border-slate-150 shadow-sm print:hidden">
        <div>
          <span className="text-xs text-slate-400 font-mono font-bold tracking-wider uppercase">VoltCRM Intelligence Unit</span>
          <h2 className="text-xl font-bold font-sans text-slate-900 mt-1">Commercial Reports Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">Generate, audit, filter and print organizational indices and sales metrics</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-sans text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm w-full sm:w-auto justify-center"
        >
          <Printer className="w-4 h-4" />
          <span>Print Current Ledger</span>
        </button>
      </div>

      {/* Tabs Selector Navigation - Hidden in Native Browser Printing */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 p-1 bg-slate-100 rounded-xl max-w-max print:hidden">
        <button
          onClick={() => setActiveReport('sales')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeReport === 'sales'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-550 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales Ledger (Staff & Brands)</span>
        </button>
        <button
          onClick={() => setActiveReport('leads')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeReport === 'leads'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-550 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Pipeline Leads Summary</span>
        </button>
        <button
          onClick={() => { console.log('Setting active report: customers'); setActiveReport('customers'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeReport === 'customers'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-550 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer CRM Roster</span>
        </button>
        <button
          onClick={() => setActiveReport('employees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeReport === 'employees'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-550 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Personnel Compensation Ledger</span>
        </button>
        <button
          onClick={() => setActiveReport('stock')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeReport === 'stock'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-550 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Warehouse Stock Ledger</span>
        </button>
        <button
          onClick={() => setActiveReport('service')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeReport === 'service'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-550 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Service Customer reports</span>
        </button>
      </div>

      {/* ==================== INTERACTIVE SCREEN DISPLAY ==================== */}
      <div className="print:hidden space-y-6">
        
        {/* --- REPORT VIEW 1: SALES REPORT (Employee & Brand) --- */}
        {activeReport === 'sales' && (
          <div className="space-y-6">
            {/* Sales Stats Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Total Sales Revenue</span>
                <span className="text-xl font-mono font-black text-slate-950 block mt-1">
                  {currency}{salesReportData.totalRevenue.toLocaleString()}
                </span>
                <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Processed from standard checkouts</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Aggregate Items Sold</span>
                <span className="text-xl font-mono font-black text-indigo-600 block mt-1">
                  {salesReportData.totalQty} Units
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Accumulated across commercial terms</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Registered Checkout Invoices</span>
                <span className="text-xl font-mono font-black text-slate-950 block mt-1">
                  {salesReportData.totalSalesCount} Transactions
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Valid system invoice lines</p>
              </div>
            </div>

            {/* Filter Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-150 flex items-center gap-3 shadow-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                placeholder="Search sales report by associate name, designation, or product manufacturer brand..."
                className="w-full text-xs text-slate-800 bg-transparent focus:outline-none placeholder-slate-400"
              />
              <Filter className="w-4 h-4 text-slate-450 shrink-0 ml-auto" />
            </div>

            {/* Employee sales listing */}
            <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">Associate-Wise Sales Performances</h3>
                  <p className="text-[10px] text-slate-500">Invoices and revenues attributed per registered team representative</p>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-sans text-[10px] font-bold">
                  {filteredEmployeeSales.length} Staff Mapped
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Staff Associate</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4 text-center">Items Sold (Qty)</th>
                      <th className="py-3 px-4 text-center">Orders Cleared</th>
                      <th className="py-3 px-4 text-right">Invoiced Revenue</th>
                      <th className="py-3 px-4 text-right">Average Order Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-750">
                    {filteredEmployeeSales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">No associate matches found.</td>
                      </tr>
                    ) : (
                      filteredEmployeeSales.map((emp, i) => {
                        const aov = emp.orderCount > 0 ? Math.round(emp.revenue / emp.orderCount) : 0;
                        return (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-1.5ClassName">
                              <span className="flex items-center justify-center w-5 h-5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg shrink-0">
                                {i + 1}
                              </span>
                              <span>{emp.name}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-550 text-[11px]">{emp.designation}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-750">{emp.quantity}</td>
                            <td className="py-3 px-4 text-center font-mono text-slate-600">{emp.orderCount}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">{currency}{emp.revenue.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono text-slate-500">{currency}{aov.toLocaleString()}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Brand-wise sales listing */}
            <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">Brand-Wise Product Sales Volume</h3>
                  <p className="text-[10px] text-slate-550">Market share split computed by invoice items manufacturer brands</p>
                </div>
                <span className="px-2.5 py-1 bg-teal-50 border border-teal-100 text-teal-700 rounded-full font-sans text-[10px] font-bold">
                  {filteredBrandSales.length} Manufacturer Bands
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Product Brand / Manufacturer</th>
                      <th className="py-3 px-4 text-center">Invoiced Units (Qty)</th>
                      <th className="py-3 px-4 text-center">Transactions Count</th>
                      <th className="py-3 px-4 text-right">Aggregated Brand Revenue</th>
                      <th className="py-3 px-4 text-right">Revenue Market Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-750">
                    {filteredBrandSales.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic font-medium">No manufacturer data matches found.</td>
                      </tr>
                    ) : (
                      filteredBrandSales.map((b, i) => {
                        const marketShare = salesReportData.totalRevenue > 0 
                          ? Math.round((b.revenue / salesReportData.totalRevenue) * 100) 
                          : 0;
                        return (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 text-slate-900 font-bold">{b.brand}</td>
                            <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">{b.quantity} Sold</td>
                            <td className="py-3 px-4 text-center font-mono text-slate-500">{b.orderCount} Directs</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{currency}{b.revenue.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono">
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-extrabold text-teal-700">{marketShare}%</span>
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                  <div className="bg-teal-500 h-full" style={{ width: `${marketShare}%` }}></div>
                                </div>
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
          </div>
        )}

        {/* --- REPORT VIEW 2: LEADS PIPELINEwise --- */}
        {activeReport === 'leads' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Total Funnel Leads</span>
                <span className="text-xl font-mono font-black text-slate-950 block mt-1">
                  {leadsReportData.totalLeadsCount} Leads
                </span>
                <p className="text-[10px] text-slate-500 mt-1">All pipeline acquisitions</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Total Estimated Funnel Worth</span>
                <span className="text-xl font-mono font-black text-indigo-600 block mt-1">
                  {currency}{leadsReportData.totalPipelineValue.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Sum of projected estimates</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Won Projects Count</span>
                <span className="text-xl font-mono font-black text-emerald-600 block mt-1">
                  {leadsReportData.wonCount} Status
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Closed won conversions</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Pipeline Conversion Quality (Win-rate)</span>
                <span className="text-xl font-mono font-black text-slate-950 block mt-1">
                  {leadsReportData.winRate}% Success
                </span>
                <p className="text-[10px] text-emerald-600 mt-1 font-bold">Of total resolved negotiations</p>
              </div>
            </div>

            {/* Filter Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-150 flex items-center gap-3 shadow-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={leadsSearch}
                onChange={(e) => setLeadsSearch(e.target.value)}
                placeholder="Search pipeline stage classifications..."
                className="w-full text-xs text-slate-800 bg-transparent focus:outline-none placeholder-slate-400"
              />
              <Filter className="w-4 h-4 text-slate-450 shrink-0 ml-auto" />
            </div>

            {/* Pipeline Stage distribution */}
            <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-150">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">Pipeline Status & Value Distribution</h3>
                <p className="text-[10px] text-slate-500">Funnel volume stats dynamically computed by sales stages</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Pipeline Status Stage</th>
                      <th className="py-3 px-4 text-center">Leads Count</th>
                      <th className="py-3 px-4 text-right">Proportion Rank</th>
                      <th className="py-3 px-5 text-right">Aggregated Stage Estimated Worth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-750">
                    {filteredLeadsPipeline.map((stage, i) => {
                      const leadsShare = leadsReportData.totalLeadsCount > 0 
                        ? Math.round((stage.count / leadsReportData.totalLeadsCount) * 100) 
                        : 0;
                      
                      let badgeColor = 'bg-slate-100 text-slate-750';
                      if (stage.stage === 'New') badgeColor = 'bg-blue-50 text-blue-800 border-blue-100';
                      if (stage.stage === 'Contacted') badgeColor = 'bg-amber-50 text-amber-800 border-amber-100';
                      if (stage.stage === 'Under Discussion') badgeColor = 'bg-purple-50 text-purple-800 border-purple-100';
                      if (stage.stage === 'Proposal Sent') badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-100';
                      if (stage.stage === 'Won') badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                      if (stage.stage === 'Lost') badgeColor = 'bg-rose-50 text-rose-800 border-rose-100';

                      return (
                        <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-black">
                            <span className={`px-2.5 py-1 border text-[11px] rounded-lg font-sans font-extrabold ${badgeColor}`}>
                              {stage.stage}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">{stage.count} Leads</td>
                          <td className="py-3.5 px-4 text-right font-mono">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-bold text-slate-600">{leadsShare}%</span>
                              <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                <div className="bg-indigo-650 h-full" style={{ width: `${leadsShare}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono font-black text-indigo-700">
                            {currency}{stage.value.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- REPORT VIEW 3: CUSTOMER CRM ROSTER --- */}
        {activeReport === 'customers' && (
          <div className="space-y-6">
            {console.log('Rendering Customer Roster block')}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Total Client Base Size</span>
                <span className="text-xl font-mono font-black text-slate-950 block mt-1">
                  {customerReportData.totalCustomersCount} Accounts
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Combined registries & checkouts</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Average Client Lifetime Value</span>
                <span className="text-xl font-mono font-black text-indigo-600 block mt-1">
                  {currency}{customerReportData.avgLifetimeValue.toLocaleString()}
                </span>
                <p className="text-[10px] text-emerald-600 mt-1 font-bold">Of total corporate acquisitions</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Active Protective Warranties</span>
                <span className="text-xl font-mono font-black text-emerald-600 block mt-1">
                  {customerReportData.activeWarranties} Items
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Secured systems under coverage</p>
              </div>
            </div>

            {/* Filter Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-150 flex items-center gap-3 shadow-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search CRM customers roster by name, registered phone number, email handles, or details..."
                className="w-full text-xs text-slate-800 bg-transparent focus:outline-none placeholder-slate-400"
              />
              <Filter className="w-4 h-4 text-slate-450 shrink-0 ml-auto" />
            </div>

            {/* Customer List */}
            <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-150">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">CRM Customer Value ledger</h3>
                <p className="text-[10px] text-slate-500">Summary list mapping loyalty, lifetime invoice totals, and warranty protections</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Client Representative</th>
                      <th className="py-3 px-4">Contact Particulars</th>
                      <th className="py-3 px-4 text-center">Orders Placed</th>
                      <th className="py-3 px-4 text-center">Warranty Cover</th>
                      <th className="py-3 px-4 text-right">Cumulative Gross Value</th>
                      <th className="py-3 px-4 text-right">Database Node Src</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-755">
                    {filteredCustomerReportList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">No customer accounts match criteria.</td>
                      </tr>
                    ) : (
                      filteredCustomerReportList.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-black text-slate-950">{c.name}</td>
                          <td className="py-3 px-4 text-[11px]">
                            <div className="text-slate-800">{c.phone}</div>
                            <div className="text-slate-400 font-mono text-[10px]">{c.email}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">{c.orderCount} standard</td>
                          <td className="py-3 px-4 text-center">
                            {c.warrantyActive > 0 ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-[9px] font-bold font-sans">
                                LIVE COVERAGE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-450 rounded text-[9px] font-sans">
                                EXPIRED TERM
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                            {currency}{c.totalSpent.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-extrabold ${
                              c.sourceClientRegistry 
                                ? 'bg-indigo-50 text-indigo-700' 
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {c.sourceClientRegistry ? 'Registry Profile' : 'Direct Checkout'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- REPORT VIEW 4: PERSONNEL COMPENSATION LEDGER --- */}
        {activeReport === 'employees' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Total Personnel Headcount</span>
                <span className="text-xl font-mono font-black text-slate-950 block mt-1">
                  {employeeReportData.totalPersonnelCount} Active Members
                </span>
                <p className="text-[10px] text-slate-500 mt-1">VoltCharge division staff</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Aggregated Monthly Compensation</span>
                <span className="text-xl font-mono font-black text-indigo-600 block mt-1">
                  {currency}{employeeReportData.totalPersonnelCompensation.toLocaleString()}
                </span>
                <p className="text-[10px] text-indigo-600 mt-1 font-bold">Sum of monthly base salaries & commissions</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Top Monthly Performer</span>
                <span className="text-xl font-sans font-bold text-emerald-600 truncate block mt-1">
                  {employeeReportData.topPerformer ? employeeReportData.topPerformer.name : 'None'}
                </span>
                <p className="text-[10px] text-slate-550 mt-1">Represented by total invoice volume</p>
              </div>
            </div>

            {/* Filter Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-150 flex items-center gap-3 shadow-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Search staff indices by associate name, division designation, or username..."
                className="w-full text-xs text-slate-800 bg-transparent focus:outline-none placeholder-slate-400"
              />
              <Filter className="w-4 h-4 text-slate-450 shrink-0 ml-auto" />
            </div>

            {/* Personnel Listing */}
            <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-150">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">Corporate Payroll Compensation index</h3>
                <p className="text-[10px] text-slate-505">Details of basic compensation paired with monthly performance bonus commissions</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Staff Associate</th>
                      <th className="py-3 px-4">Security User Profile</th>
                      <th className="py-3 px-4 text-center">Conversions / Assigned</th>
                      <th className="py-3 px-4 text-right">Base Salary</th>
                      <th className="py-3 px-4 text-right">Commissions Payout</th>
                      <th className="py-3 px-4 text-right bg-indigo-50/20 font-bold text-indigo-950">Total Projected Payroll</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-750">
                    {filteredStaffProfiles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">No registered personnel profiles matched.</td>
                      </tr>
                    ) : (
                      filteredStaffProfiles.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-black">
                            <div className="text-slate-950">{p.name}</div>
                            <div className="text-slate-400 text-[10px] font-medium mt-0.5">{p.designation}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            {p.username ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                                  @{p.username}
                                </span>
                                <span className="text-[8px] px-1 font-sans font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider rounded">
                                  {p.clearanceLevel || 'Low'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic font-medium">Inactive System Access</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-semibold">
                            <div className="text-slate-900">{p.leadsConverted} Won</div>
                            <div className="text-[9px] text-slate-400">{p.assignedLeadsCount} Assigned ({p.conversionRate}%)</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono">{currency}{p.baseSalary.toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-650">+{currency}{p.actualCommission.toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-indigo-700 bg-indigo-50/10">
                            {currency}{p.totalPayout.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- REPORT VIEW 5: STOCK / WAREHOUSE REPORT --- */}
        {activeReport === 'stock' && (
          <div className="space-y-6">
            {/* Stock Valuation Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm col-span-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Distinct SKUs</span>
                <span className="text-lg font-mono font-black text-slate-950 block mt-1">
                  {stockReportData.totalSKUs} Models
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Active models catalog</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm col-span-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Total Units in Stock</span>
                <span className="text-lg font-mono font-black text-indigo-600 block mt-1">
                  {stockReportData.totalStockQty} Items
                </span>
                <p className="text-[10px] text-slate-550 mt-1">Physical stock quantity</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm col-span-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Asset Value (Cost)</span>
                <span className="text-lg font-mono font-black text-slate-950 block mt-1">
                  {currency}{stockReportData.totalValuationCost.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-550 mt-1">At procurement cost</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm col-span-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Retail Asset Value</span>
                <span className="text-lg font-mono font-black text-slate-950 block mt-1">
                  {currency}{stockReportData.totalValuationSales.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-555 mt-1">Listed retail value</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-sm bg-gradient-to-br from-indigo-50/15 via-white to-transparent col-span-1">
                <span className="text-[10px] text-indigo-600 font-mono font-bold block uppercase tracking-wide font-black">Margin Opportunity</span>
                <span className="text-lg font-mono font-black text-emerald-600 block mt-1">
                  {currency}{stockReportData.potentialProfit.toLocaleString()}
                </span>
                <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Projected markup spread</p>
              </div>
            </div>

            {/* Low Stock Indicator Header Alert */}
            {stockReportData.lowStockItemsCount > 0 && (
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex gap-4 items-center">
                <span className="flex items-center justify-center w-10 h-10 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                  <BadgeAlert className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 font-sans">Restock Advisory Warning</h4>
                  <p className="text-[11px] text-amber-700 font-sans mt-0.5">
                    There are {stockReportData.lowStockItemsCount} items at or below safety reorder parameters. Promptly initiate replenishment to avoid delivery shortages.
                  </p>
                </div>
              </div>
            )}

            {/* Top row: Low Stock Alerts and Category breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Low stock checklist panel */}
              <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-slate-150">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Immediate Restock Forecast Alerts ({stockReportData.lowStockItemsCount})
                  </h3>
                  <p className="text-[10px] text-slate-500">Products requiring warehouse replenishment sheets</p>
                </div>
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[350px] flex-10">
                  {stockReportData.lowStockItems.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 italic font-medium text-xs">
                      All warehouse product stocks are above safety buffers.
                    </div>
                  ) : (
                    stockReportData.lowStockItems.map((item, i) => (
                      <div key={i} className="p-3 hover:bg-slate-50/40 transition-colors flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{item.brand} {item.model}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>{item.type}</span>
                            <span>•</span>
                            {item.voltage ? (
                              <>
                                <span>Volt: {item.voltage}V</span>
                                <span>•</span>
                              </>
                            ) : null}
                            <span>Spec: {item.capacity || item.capacityAh || 'Standard'}</span>
                            <span>•</span>
                            <span>Loc: {item.location || 'Rack Unassigned'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold rounded">
                            {item.stockLevel} units left
                          </span>
                          <div className="text-[9px] text-slate-400 font-mono mt-1">Reorder level: {item.reorderLevel}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Product Type stock breakdown */}
              <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-slate-150">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">
                    Product Specification Ratios
                  </h3>
                  <p className="text-[10px] text-slate-500">Market composition categorised by active product specifications</p>
                </div>
                <div className="overflow-x-auto flex-10">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 font-mono">
                      <tr>
                        <th className="py-2.5 px-3">Product Type Class</th>
                        <th className="py-2.5 px-3 text-center">Models Count</th>
                        <th className="py-2.5 px-3 text-center">Stock Volume</th>
                        <th className="py-2.5 px-3 text-right">Valuation (Cost)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-705">
                      {stockReportData.typeWiseList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400 italic">No inventory available.</td>
                        </tr>
                      ) : (
                        stockReportData.typeWiseList.map((type, i) => (
                          <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{type.type}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600">{type.count} models</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">{type.stockQty} items</td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">{currency}{type.costValuation.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Brand-Wise Stock Valuation Spread */}
            <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-150">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">
                  Manufacturer Brand Stock Shares & Valuation Spans
                </h3>
                <p className="text-[10px] text-slate-500">Warehouse capital concentration sorted by manufacturer value totals</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Brand Flag</th>
                      <th className="py-3 px-4 text-center">SKU Variety</th>
                      <th className="py-3 px-4 text-center">Stock Units</th>
                      <th className="py-3 px-4 text-right">Procurement Cost</th>
                      <th className="py-3 px-4 text-right">Expected Retail Value</th>
                      <th className="py-3 px-4 text-right">Capital Share Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-700">
                    {stockReportData.brandWiseList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 italic">No manufacturer data.</td>
                      </tr>
                    ) : (
                      stockReportData.brandWiseList.map((b, i) => {
                        const stockShare = stockReportData.totalValuationCost > 0
                          ? Math.round((b.costValuation / stockReportData.totalValuationCost) * 100)
                          : 0;
                        return (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 text-slate-955 font-bold">{b.brand}</td>
                            <td className="py-3 px-4 text-center text-slate-550">{b.count} models</td>
                            <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">{b.stockQty} items</td>
                            <td className="py-3 px-4 text-right font-mono text-slate-650">{currency}{b.costValuation.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-indigo-750">{currency}{b.salesValuation.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono">
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-extrabold text-indigo-700">{stockShare}%</span>
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                  <div className="bg-indigo-600 h-full" style={{ width: `${stockShare}%` }}></div>
                                </div>
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

            {/* Search Filter Stock list */}
            <div className="bg-white p-4 rounded-xl border border-slate-150 flex items-center gap-3 shadow-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Search precise product models by brand, type, category, or rack location..."
                className="w-full text-xs text-slate-800 bg-transparent focus:outline-none placeholder-slate-400"
              />
              <Filter className="w-4 h-4 text-slate-455 shrink-0 ml-auto" />
            </div>

            {/* Warehouse stock spreadsheet roster */}
            <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">Active Warehouse Stock spreadsheet</h3>
                  <p className="text-[10px] text-slate-550">Live operational catalogue data and margins for active warehouse inventory</p>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-sans text-[10px] font-bold">
                  {filteredStockList.length} Models Mapped
                </span>
              </div>
              <div className="overflow-x-auto border-t border-slate-100">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Product Particulars</th>
                      <th className="py-3 px-4">Technical Specs</th>
                      <th className="py-3 px-4">Rack Location</th>
                      <th className="py-3 px-4 text-center">Unit Ratios</th>
                      <th className="py-3 px-4 text-right">Procure Cost</th>
                      <th className="py-3 px-4 text-right">Mark-Up Margin</th>
                      <th className="py-3 px-4 text-right">Stock Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-700">
                    {filteredStockList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-450 italic">No matching warehouse models found.</td>
                      </tr>
                    ) : (
                      filteredStockList.map((item, i) => {
                        const isLow = (item.stockLevel || 0) <= (item.reorderLevel || 0);
                        const grossValue = (item.stockLevel || 0) * (item.price || 0);
                        const markup = (item.price && item.cost) ? Math.round(((item.price - item.cost) / item.cost) * 100) : 0;
                        return (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{item.brand} {item.model}</span>
                                {isLow && (
                                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[8px] font-extrabold uppercase animate-pulse">
                                    Low Stock
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 font-mono text-[9px] uppercase tracking-wider mt-0.5">
                                {item.type} Class
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[11px] font-mono text-slate-600">
                              {item.voltage ? `${item.voltage}V / ` : ''}{item.capacity || item.capacityAh || 'Standard'}
                            </td>
                            <td className="py-3 px-4 text-[11px]">
                              {item.location ? (
                                <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] border border-slate-200">
                                  {item.location}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Unassigned Rack</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              <div className="text-slate-900 font-bold">{item.stockLevel} units</div>
                              <div className="text-[9px] text-slate-400">Min safety: {item.reorderLevel}</div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              <div className="text-slate-900">{currency}{item.cost.toLocaleString()}</div>
                              <div className="text-[9px] text-slate-500">Retail: {currency}{item.price.toLocaleString()}</div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              <div className="font-bold text-emerald-600">+{markup}%</div>
                              <div className="text-[9px] text-slate-450">Markup spread</div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-indigo-700">
                              {currency}{grossValue.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- REPORT VIEW 6: SERVICE CUSTOMERS & CARE ALERTS --- */}
        {activeReport === 'service' && (
          <div className="space-y-6 animate-fade-in font-sans">
            {/* Service Stats Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Registered Service Customers</span>
                <span className="text-xl font-mono font-black text-slate-950 block mt-1">
                  {serviceReportData.totalServiceCustomers} Clients
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Roster with active profiles</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Total Support Reminders</span>
                <span className="text-xl font-mono font-black text-indigo-600 block mt-1">
                  {serviceReportData.totalReminders} Alerts Generated
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Maintenance & replacement schedules</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Overdue / Scheduled Alerts</span>
                <span className="text-xl font-mono font-black text-rose-600 block mt-1">
                  {serviceReportData.overdueReminders} Overdue • {serviceReportData.scheduledReminders} Pending
                </span>
                <p className="text-[10px] text-slate-550 mt-1">Awaiting active team touchpoint</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Care Service Resolution Rate</span>
                <span className="text-xl font-mono font-black text-emerald-600 block mt-1">
                  {serviceReportData.completionRate}% Cleared
                </span>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-emerald-500 h-full" style={{ width: `${serviceReportData.completionRate}%` }}></div>
                </div>
              </div>
            </div>

            {/* Service Search & Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-150 flex items-center gap-3 shadow-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search service customers report ledger by representative, phone, or care logs notes..."
                className="w-full text-xs text-slate-800 bg-transparent focus:outline-none placeholder-slate-400"
              />
              <Filter className="w-4 h-4 text-slate-455 shrink-0 ml-auto" />
            </div>

            {/* Grid Split: Category Type Frequencies & Specific Clients */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Type Frequencies */}
              <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm lg:col-span-1">
                <div className="p-4 bg-slate-50 border-b border-slate-150">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">Alert Classification Frequency</h3>
                  <p className="text-[10px] text-slate-500">Service types and success delivery index</p>
                </div>
                <div className="p-4 divide-y divide-slate-100">
                  {serviceReportData.typeWiseList.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-4 text-center">No service alerts found.</p>
                  ) : (
                    serviceReportData.typeWiseList.map((typeObj, i) => {
                      const share = serviceReportData.totalReminders > 0 
                        ? Math.round((typeObj.count / serviceReportData.totalReminders) * 100) 
                        : 0;
                      return (
                        <div key={i} className="py-2.5 first:pt-0 last:pb-0">
                          <div className="flex justify-between text-xs font-sans">
                            <span className="font-bold text-slate-800">{typeObj.type}</span>
                            <span className="font-mono text-slate-550 font-semibold">{typeObj.count} ({share}%)</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-455 mt-1 font-mono">
                            <span>Cleared: {typeObj.completed}</span>
                            <span>Pending: {typeObj.pending}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 mt-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-550 h-full" style={{ width: `${share}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Service Customers Ledger */}
              <div className="bg-white rounded-xl border border-slate-155 overflow-hidden shadow-sm lg:col-span-2">
                <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">Support Delivery Ledger</h3>
                    <p className="text-[10px] text-slate-500">Status metrics for registered CRM service accounts</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-sans text-[10px] font-bold">
                    {filteredServiceClients.length} Profiles
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 font-mono">
                      <tr>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4 text-center">Invoiced Item</th>
                        <th className="py-3 px-4 text-center">Total Care Alerts</th>
                        <th className="py-3 px-4 text-center">Cleared Alerts</th>
                        <th className="py-3 px-4 text-right">Upcoming Alert Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-105 text-xs font-sans text-slate-700">
                      {filteredServiceClients.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-450 italic">No matching service customer records found.</td>
                        </tr>
                      ) : (
                        filteredServiceClients.map((client, i) => (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{client.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{client.phone}</div>
                            </td>
                            <td className="py-3.5 px-4 text-center text-[11px] text-slate-600">
                              {client.productDetails || 'No item recorded'}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-705">
                              {client.totalRemindersCount} generated
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                client.completedRemindersCount === client.totalRemindersCount && client.totalRemindersCount > 0
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              }`}>
                                {client.completedRemindersCount} / {client.totalRemindersCount} resolved
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                              {client.dueNextDate ? (
                                <span className="text-indigo-650">{formatDDMMYYYY(client.dueNextDate)}</span>
                              ) : (
                                <span className="text-slate-400 italic">No pending alerts</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ==================== PRISTINE PRINT LAYOUT ==================== */}
      {/* Optimized strictly for full physical / PDF page printing. Hidden during standard screen UI. */}
      <div className="hidden print:block bg-white text-black font-sans p-2 space-y-8">
        
        {/* Printable Official Title Block */}
        <div className="border-b-4 border-slate-900 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">{companyName}</h1>
            <p className="text-xs uppercase font-mono tracking-widest text-slate-550 mt-1">Corporate Performance Reports ledger</p>
          </div>
          <div className="text-right font-mono text-[10px] text-slate-600">
            <div>GENERATED: {formatDDMMYYYY(today)} {today.toLocaleTimeString()}</div>
            <div>CRM REPORT: {activeReport.toUpperCase()} LEDGER</div>
            <div className="font-sans font-bold text-slate-900 uppercase">INTERNAL CORPORATE RECORD ONLY</div>
          </div>
        </div>

        {/* --- PRINT AREA: SALES --- */}
        {activeReport === 'sales' && (
          <div className="space-y-6">
            <h2 className="text-base font-black uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900 flex items-center justify-between">
              <span>Section I: Invoiced Sales & Revenue Metrics</span>
              <span className="font-mono text-xs font-normal">Active Dataset File</span>
            </h2>

            {/* Quick Metrics Summaries */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Gross Invoiced Revenue</span>
                <span className="text-lg font-mono font-bold text-black block mt-0.5">
                  {currency}{salesReportData.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Total Items Delivered</span>
                <span className="text-lg font-mono font-bold text-black block mt-0.5">
                  {salesReportData.totalQty} Units
                </span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Sales Count</span>
                <span className="text-lg font-mono font-bold text-black block mt-0.5">
                  {salesReportData.totalSalesCount} Transactions
                </span>
              </div>
            </div>

            {/* Table 1: Employee performance */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">1. Revenue Attributes per Personnel Representative</h3>
              <table className="w-full text-left border-collapse border border-slate-300 text-xs text-black">
                <thead>
                  <tr className="bg-slate-100 font-mono text-[10px] uppercase border-b border-slate-300 text-slate-850">
                    <th className="py-2 px-3 border-r border-slate-300">Staff Agent</th>
                    <th className="py-2 px-3 border-r border-slate-300">Registered Designation</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Qty Sold</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Orders</th>
                    <th className="py-2 px-3 text-right">Invoiced Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {salesReportData.employeeSales.map((emp, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 border-r border-slate-300 font-bold">{emp.name}</td>
                      <td className="py-2 px-3 border-r border-slate-300 text-[11px]">{emp.designation}</td>
                      <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">{emp.quantity}</td>
                      <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">{emp.orderCount}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{currency}{emp.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table 2: Brand split */}
            <div className="space-y-2 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">2. Sales Share Split classified by Manufacturer Brands</h3>
              <table className="w-full text-left border-collapse border border-slate-300 text-xs text-black">
                <thead>
                  <tr className="bg-slate-100 font-mono text-[10px] uppercase border-b border-slate-300 text-slate-850">
                    <th className="py-2 px-3 border-r border-slate-300">Product Brand</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Quantity Sold</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Invoices Count</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Revenue Contribution</th>
                    <th className="py-2 px-3 text-right">Market Share %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {salesReportData.brandSales.map((b, i) => {
                    const share = salesReportData.totalRevenue > 0 ? Math.round((b.revenue / salesReportData.totalRevenue) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td className="py-2 px-3 border-r border-slate-300 font-bold">{b.brand}</td>
                        <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">{b.quantity} Sold</td>
                        <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">{b.orderCount} Orders</td>
                        <td className="py-2 px-3 text-right border-r border-slate-300 font-mono font-bold">{currency}{b.revenue.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{share}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PRINT AREA: LEADS PIPELINE --- */}
        {activeReport === 'leads' && (
          <div className="space-y-6">
            <h2 className="text-base font-black uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900 flex items-center justify-between">
              <span>Section II: Pipeline Leads & Conversion Statistics</span>
              <span className="font-mono text-xs font-normal">Active Dataset File</span>
            </h2>

            {/* Key pipeline figures */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Total Funnel Leads</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{leadsReportData.totalLeadsCount} Leads</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Pipeline Projections</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{currency}{leadsReportData.totalPipelineValue.toLocaleString()}</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Total Closed Won</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{leadsReportData.wonCount} conversions</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Negotiation Win-rate</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{leadsReportData.winRate}% Success</span>
              </div>
            </div>

            {/* Stage wise tables */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">1. Pipeline Status Volume & Value Breakdown</h3>
              <table className="w-full text-left border-collapse border border-slate-300 text-xs text-black">
                <thead>
                  <tr className="bg-slate-100 font-mono text-[10px] uppercase border-b border-slate-300 text-slate-850">
                    <th className="py-2 px-3 border-r border-slate-300">Funnel Sales Stage</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Leads Handcount</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Volume Share %</th>
                    <th className="py-2 px-3 text-right">Estimated Projected Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {leadsReportData.pipelineList.map((stage, i) => {
                    const share = leadsReportData.totalLeadsCount > 0 ? Math.round((stage.count / leadsReportData.totalLeadsCount) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td className="py-2 px-3 border-r border-slate-300 font-bold uppercase">{stage.stage}</td>
                        <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">{stage.count} Leads</td>
                        <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">{share}%</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{currency}{stage.value.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PRINT AREA: CUSTOMERS --- */}
        {activeReport === 'customers' && (
          <div className="space-y-6">
            <h2 className="text-base font-black uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900 flex items-center justify-between">
              <span>Section III: CRM Consolidated Client Index</span>
              <span className="font-mono text-xs font-normal">Active Dataset File</span>
            </h2>

            {/* Stats block */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Total Active Client Registrations</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{customerReportData.totalCustomersCount} Accounts</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Average Customer Lifetime Value</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{currency}{customerReportData.avgLifetimeValue.toLocaleString()}</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Active Protective Warranties</span>
                <span className="text-base font-mono font-bold text-emerald-700 block mt-0.5">{customerReportData.activeWarranties} batteries</span>
              </div>
            </div>

            {/* Customers table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">1. Customer Lifecycle Ledger & Transaction Totals</h3>
              <table className="w-full text-left border-collapse border border-slate-300 text-[11px] text-black">
                <thead>
                  <tr className="bg-slate-100 font-mono text-[9px] uppercase border-b border-slate-300 text-slate-850">
                    <th className="py-2 px-3 border-r border-slate-300">Client Name</th>
                    <th className="py-2 px-3 border-r border-slate-300">Contact Number</th>
                    <th className="py-2 px-3 border-r border-slate-300">Registered Email</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Orders</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Warranty status</th>
                    <th className="py-2 px-3 text-right">Aggregated Purchases Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {customerReportData.clientList.map((c, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 border-r border-slate-300 font-bold">{c.name}</td>
                      <td className="py-2 px-3 border-r border-slate-300 font-mono">{c.phone}</td>
                      <td className="py-2 px-3 border-r border-slate-300 font-mono text-[10px] text-slate-700">{c.email}</td>
                      <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">{c.orderCount} Bills</td>
                      <td className="py-2 px-3 text-center border-r border-slate-300 uppercase font-sans text-[9px]">
                        {c.warrantyActive > 0 ? 'Active Coverage' : 'Expired term'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{currency}{c.totalSpent.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PRINT AREA: EMPLOYEES --- */}
        {activeReport === 'employees' && (
          <div className="space-y-6">
            <h2 className="text-base font-black uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900 flex items-center justify-between">
              <span>Section IV: workforce Profile & Payroll compensations ledger</span>
              <span className="font-mono text-xs font-normal">Active Dataset File</span>
            </h2>

            {/* compensate indices */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Total Monitored Employees</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{employeeReportData.totalPersonnelCount} Staff Members</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Total Projected Monthly Compensation Payroll</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{currency}{employeeReportData.totalPersonnelCompensation.toLocaleString()}</span>
              </div>
            </div>

            {/* Personnel payroll table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">1. Personnel Compensation & Leads Conversion Ratio ledger</h3>
              <table className="w-full text-left border-collapse border border-slate-300 text-xs text-black">
                <thead>
                  <tr className="bg-slate-100 font-mono text-[10px] uppercase border-b border-slate-300 text-slate-850">
                    <th className="py-2 px-3 border-r border-slate-300">Staff Profile</th>
                    <th className="py-2 px-3 border-r border-slate-300">Access Level</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Conversion Rate</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Base Salary</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Commissions</th>
                    <th className="py-2 px-3 text-right bg-slate-100 font-bold">Total Payroll Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {employeeReportData.staffProfiles.map((p, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 border-r border-slate-300">
                        <div className="font-bold">{p.name}</div>
                        <div className="text-[10px] text-slate-600">{p.designation}</div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 font-mono text-[11px]">
                        {p.username ? `@${p.username} [${p.clearanceLevel || 'Low'}]` : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">
                        {p.leadsConverted} Won / {p.assignedLeadsCount} Assigned ({p.conversionRate}%)
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-300 font-mono">{currency}{p.baseSalary.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right border-r border-slate-300 font-mono">+{currency}{p.actualCommission.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold bg-slate-50">{currency}{p.totalPayout.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PRINT AREA: WAREHOUSE STOCK --- */}
        {activeReport === 'stock' && (
          <div className="space-y-6">
            <h2 className="text-base font-black uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900 flex items-center justify-between">
              <span>Section V: Warehouse Inventory Stock & valuation Ledger</span>
              <span className="font-mono text-xs font-normal">Active Dataset File</span>
            </h2>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Distinct Models / SKUs</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{stockReportData.totalSKUs} Variations</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Gross Inventory Units</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{stockReportData.totalStockQty} items</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Accumulated Cost Value</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{currency}{stockReportData.totalValuationCost.toLocaleString()}</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Gross Profit Potential</span>
                <span className="text-base font-mono font-bold text-emerald-700 block mt-0.5">{currency}{stockReportData.potentialProfit.toLocaleString()}</span>
              </div>
            </div>

            {/* Quick sections: categories split & low stocks */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-300 p-4 rounded space-y-2">
                <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-800">1. Stock Share per Product Category</h3>
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 font-mono text-[9px] uppercase text-slate-500">
                      <th className="pb-1">Category</th>
                      <th className="pb-1 text-center font-bold">Units</th>
                      <th className="pb-1 text-right">Cost Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockReportData.typeWiseList.map((type, i) => (
                      <tr key={i}>
                        <td className="py-1 font-bold">{type.type}</td>
                        <td className="py-1 text-center font-mono">{type.stockQty} items</td>
                        <td className="py-1 text-right font-mono font-bold">{currency}{type.costValuation.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border border-slate-300 p-4 rounded space-y-2">
                <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-800">2. Low Stock Alerts & Reorder Levels</h3>
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 font-mono text-[9px] uppercase text-slate-500">
                      <th className="pb-1">Item Title</th>
                      <th className="pb-1 text-center font-bold">Current Stock</th>
                      <th className="pb-1 text-right">Safety Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockReportData.lowStockItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center italic text-slate-400">All inventory levels are above safety reorder parameters.</td>
                      </tr>
                    ) : (
                      stockReportData.lowStockItems.slice(0, 10).map((item, i) => (
                        <tr key={i}>
                          <td className="py-1 font-bold">{item.brand} {item.model}</td>
                          <td className="py-1 text-center font-mono text-rose-705 font-semibold">{item.stockLevel} units</td>
                          <td className="py-1 text-right font-mono">{item.reorderLevel} units</td>
                        </tr>
                      ))
                    )}
                    {stockReportData.lowStockItems.length > 10 && (
                      <tr>
                        <td colSpan={3} className="py-1 font-sans italic text-[10px] text-slate-500 text-center font-bold">
                          There are {stockReportData.lowStockItems.length - 10} more low stock items...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Complete active list */}
            <div className="space-y-2 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">3. Granular Active Warehouse Catalog & Valuation Spreadsheet</h3>
              <table className="w-full text-left border-collapse border border-slate-300 text-xs text-black">
                <thead>
                  <tr className="bg-slate-100 font-mono text-[10px] uppercase border-b border-slate-300 text-slate-850">
                    <th className="py-2 px-3 border-r border-slate-300">Model Description</th>
                    <th className="py-2 px-3 border-r border-slate-300">Specification Details</th>
                    <th className="py-2 px-3 border-r border-slate-300">Location</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Available units</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Procure Cost</th>
                    <th className="py-2 px-3 text-right">Stock Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {inventory.map((item, i) => {
                    const isLow = (item.stockLevel || 0) <= (item.reorderLevel || 0);
                    const grossValue = (item.stockLevel || 0) * (item.price || 0);
                    return (
                      <tr key={i} className={isLow ? "bg-rose-50" : ""}>
                        <td className="py-2 px-3 border-r border-slate-300 font-bold">
                          {item.brand} {item.model} {isLow && <span className="text-[9px] text-rose-700 font-bold uppercase font-sans shrink-0 ml-1">(Low Stock)</span>}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 font-mono text-[11px]">{item.type}{item.voltage ? ` • ${item.voltage}V` : ''} • {item.capacity || 'Standard'}</td>
                        <td className="py-2 px-3 border-r border-slate-300">{item.location || 'Rack Unassigned'}</td>
                        <td className="py-2 px-3 text-center border-r border-slate-300 font-mono font-bold">{item.stockLevel} units</td>
                        <td className="py-2 px-3 text-right border-r border-slate-300 font-mono">{currency}{item.cost.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold bg-slate-50">{currency}{grossValue.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PRINT AREA: SERVICE CUSTOMERS --- */}
        {activeReport === 'service' && (
          <div className="space-y-6 text-black">
            <h2 className="text-base font-black uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900 flex items-center justify-between">
              <span>Section VI: Service Customer & Care Support Alerts Ledger</span>
              <span className="font-mono text-xs font-normal">Active Dataset File</span>
            </h2>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Service Customers</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{serviceReportData.totalServiceCustomers} Accounts</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Generated Support Reminders</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{serviceReportData.totalReminders} Alerts</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Pending/Overdue Actions</span>
                <span className="text-base font-mono font-bold text-black block mt-0.5">{serviceReportData.overdueReminders + serviceReportData.scheduledReminders} Tasks</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Care Resolution Rate</span>
                <span className="text-base font-mono font-bold text-emerald-700 block mt-0.5">{serviceReportData.completionRate}% Cleared</span>
              </div>
            </div>

            {/* Split tables for print */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-300 p-4 rounded space-y-2">
                <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-800">1. Alert Frequencies per Classification</h3>
                <table className="w-full text-left font-sans text-xs flex-wrap">
                  <thead>
                    <tr className="border-b border-slate-300 font-mono text-[9px] uppercase text-slate-550">
                      <th className="pb-1">Classification Class</th>
                      <th className="pb-1 text-center font-bold">Total</th>
                      <th className="pb-1 text-right">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {serviceReportData.typeWiseList.map((typeObj, i) => {
                      const score = typeObj.count > 0 ? Math.round((typeObj.completed / typeObj.count) * 100) : 0;
                      return (
                        <tr key={i}>
                          <td className="py-1 font-bold">{typeObj.type}</td>
                          <td className="py-1 text-center font-mono">{typeObj.count} items</td>
                          <td className="py-1 text-right font-mono font-bold text-emerald-700">{score}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border border-slate-300 p-4 rounded space-y-2">
                <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-800">2. Customer Support Ledger Status Summary</h3>
                <table className="w-full text-left font-sans text-xs flex-wrap">
                  <thead>
                    <tr className="border-b border-slate-300 font-mono text-[9px] uppercase text-slate-550">
                      <th className="pb-1">Customer Representative</th>
                      <th className="pb-1 text-center font-bold">Reminders</th>
                      <th className="pb-1 text-right">Resolved Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {serviceReportData.clientServiceSummary.slice(0, 10).map((client, i) => (
                      <tr key={i}>
                        <td className="py-1 font-bold">{client.name}</td>
                        <td className="py-1 text-center font-mono">{client.totalRemindersCount} generated</td>
                        <td className="py-1 text-right font-mono font-bold text-indigo-700">
                          {client.completedRemindersCount} / {client.totalRemindersCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Granular Spreadsheet */}
            <div className="space-y-2 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">3. Registered Clients Upcoming Maintenance / Support Schedule Spreadsheet</h3>
              <table className="w-full text-left border-collapse border border-slate-300 text-xs text-black">
                <thead>
                  <tr className="bg-slate-100 font-mono text-[10px] uppercase border-b border-slate-300 text-slate-850">
                    <th className="py-2 px-3 border-r border-slate-300">Client Profile</th>
                    <th className="py-2 px-3 border-r border-slate-300">Invoiced Item Details</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Completed Care Alerts</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300">Total Scheduled</th>
                    <th className="py-2 px-3 text-right">Next Due Action Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {serviceReportData.clientServiceSummary.map((client, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 border-r border-slate-300 font-bold">{client.name} ({client.phone})</td>
                      <td className="py-2 px-3 border-r border-slate-300">{client.productDetails || 'N/A'}</td>
                      <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">{client.completedRemindersCount} alerts</td>
                      <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">{client.totalRemindersCount} entries</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">{client.dueNextDate ? formatDDMMYYYY(client.dueNextDate) : 'None Scheduled'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Printable Footer Stamp */}
        <div className="pt-20 border-t border-dashed border-slate-300 text-center font-mono text-[9px] text-slate-400">
          <div>VoltCRM Secure Operational Reports Audit Gateway • Confidential Internal Record</div>
          <div>All computations are dynamic based on local active storage engines logs. End of Ledger Doc.</div>
        </div>
      </div>
    </div>
  );
}
