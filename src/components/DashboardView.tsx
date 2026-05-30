/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CRMDatabase } from '../types';
import { PerformanceChart, LeadStatusPie } from './AnalyticsCharts';
import ClientCareAndServiceHealth from './ClientCareAndServiceHealth';
import { 
  DollarSign, 
  Users, 
  AlertTriangle, 
  BellRing, 
  ArrowUpRight, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

interface DashboardViewProps {
  data: CRMDatabase;
  onNavigate: (tab: string) => void;
  onCompleteReminder: (id: string) => void;
}

export default function DashboardView({ data, onNavigate, onCompleteReminder }: DashboardViewProps) {
  // 1. Calculate KPI Metrics
  const currency = data.settings?.companyCurrency || '$';
  
  const totalSalesRevenue = data.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const activeLeadsCount = data.leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').length;
  const lowStockItems = data.inventory.filter(item => item.stockLevel <= item.reorderLevel);
  const overdueReminders = data.reminders.filter(rem => rem.status === 'Overdue');
  const activeReminders = data.reminders.filter(rem => rem.status !== 'Completed');

  return (
    <div id="dashboard_container" className="space-y-8 animate-fade-in">
      {/* Upper Welcome Header */}
      <div id="dashboard_header_section" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div id="welcome_gradient_glow" className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div id="welcome_gradient_glow2" className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="z-10">
          <span className="text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">Operational Terminal</span>
          <h2 id="dashboard_welcome_heading" className="text-2xl md:text-3xl font-sans font-bold tracking-tight mt-1">
            Welcome to {data.settings?.companyName || 'Generic Corporation'}
          </h2>
          <p id="dashboard_welcome_sub" className="text-slate-300 text-sm mt-1 max-w-xl font-sans">
            Real-time inventories, customer relationships, service schedules, and staff payroll performance indicators.
          </p>
        </div>

        <div className="flex gap-3 z-10 w-full sm:w-auto">
          <button 
            id="dash_quick_sale_btn"
            onClick={() => onNavigate('sales')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-md shadow-indigo-900/20"
          >
            New Checkout
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button 
            id="dash_quick_lead_btn"
            onClick={() => onNavigate('leads')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-sans text-xs font-bold px-4 py-3 rounded-xl transition-all border border-white/10"
          >
            Add Lead
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div id="kpi_cards_grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: Sales Revenue */}
        <div 
          id="kpi_sales" 
          onClick={() => onNavigate('sales')}
          className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-sans text-xs font-semibold tracking-wide">Total Invoiced Sales</span>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-mono font-bold text-slate-950">
              {currency}{totalSalesRevenue.toLocaleString()}
            </h3>
            <span className="text-[10px] text-emerald-600 font-sans font-bold flex items-center gap-1 mt-1 bg-emerald-50 px-2 py-0.5 rounded-full w-max">
              +14.5% versus last month
            </span>
          </div>
        </div>

        {/* KPI: Active Pipeline Leads */}
        <div 
          id="kpi_leads"
          onClick={() => onNavigate('leads')}
          className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-sans text-xs font-semibold tracking-wide">Active Pipeline Leads</span>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-mono font-bold text-slate-950">{activeLeadsCount} Leads</h3>
            <span className="text-[10px] text-slate-500 font-sans font-medium flex items-center gap-1 mt-1">
              Assigned across sales executives
            </span>
          </div>
        </div>

        {/* KPI: Low Stock Alert */}
        <div 
          id="kpi_stock"
          onClick={() => onNavigate('inventory')}
          className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-sans text-xs font-semibold tracking-wide font-medium">Critical Understock Alerts</span>
            <div className={`p-3 rounded-lg group-hover:scale-105 transition-transform ${lowStockItems.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-mono font-bold ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-950'}`}>
              {lowStockItems.length} Products
            </h3>
            <span className="text-[10px] text-slate-500 font-sans font-medium flex items-center gap-1 mt-1">
              Reorder limits breached
            </span>
          </div>
        </div>

        {/* KPI: Service Alerts */}
        <div 
          id="kpi_service"
          onClick={() => onNavigate('clients')}
          className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-sans text-xs font-semibold tracking-wide">Overdue Service Reminders</span>
            <div className={`p-3 rounded-lg group-hover:scale-105 transition-transform ${overdueReminders.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <BellRing className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-mono font-bold ${overdueReminders.length > 0 ? 'text-rose-600' : 'text-slate-950'}`}>
              {overdueReminders.length} Client Alerts
            </h3>
            <span className="text-[10px] text-slate-500 font-sans font-medium flex items-center gap-1 mt-1">
              Maintenance reviews, health checks, or evaluations
            </span>
          </div>
        </div>
      </div>

      {/* Embedded Realtime Reports charts */}
      <div id="analytics_charts_row" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2 lg:col-span-2">
          <PerformanceChart />
        </div>
        <div className="md:col-span-1 lg:col-span-1">
          <LeadStatusPie />
        </div>
        <div className="md:col-span-1 lg:col-span-1">
          <ClientCareAndServiceHealth data={data} />
        </div>
      </div>

      {/* Critical Lists Split Row: Stock & reminders */}
      <div id="critical_action_grid" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Low Stock Watch Grid */}
        <div id="low_stock_watch_widget" className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
            <div>
              <h3 className="font-sans font-semibold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                Critical Stock Replenishment Action Log
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Products which require immediate procurement team purchase</p>
            </div>
            <button 
              id="procure_view_all" 
              onClick={() => onNavigate('inventory')} 
              className="text-xs px-2.5 py-1 text-indigo-600 hover:text-indigo-800 font-bold hover:bg-slate-50 rounded"
            >
              Restock Item
            </button>
          </div>

          <div id="stock_alert_scroller" className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
            {lowStockItems.length === 0 ? (
              <div id="stock_alert_empty" className="py-12 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl font-sans">
                ✓ All product brands and models are healthy & above reorder levels.
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3.5 bg-rose-50/20 hover:bg-rose-50/40 rounded-xl border border-rose-100/50 transition-all">
                  <div>
                    <span className="font-mono text-[9px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full inline-block uppercase mb-1">
                      Critical Stock (Level: {item.stockLevel})
                    </span>
                    <h4 className="font-sans text-xs font-bold text-slate-950">
                      {item.brand} {item.model}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">
                      Capacity: {item.capacity} | Grid Location: <span className="font-mono font-medium text-slate-800">{item.location}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-xs font-sans block">Trigger Limit: <span className="font-mono font-bold text-slate-800">{item.reorderLevel}</span></span>
                    <button
                      onClick={() => onNavigate('inventory')}
                      className="text-[10px] mt-1 text-slate-700 bg-white border border-slate-200/80 px-2.5 py-1 rounded-md font-sans font-bold hover:bg-slate-50"
                    >
                      Update Stock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time automated Service Reminders Widget */}
        <div id="service_rem_widget" className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
            <div>
              <h3 className="font-sans font-semibold text-slate-900 text-sm flex items-center gap-2">
                <BellRing className="w-4 h-4 text-emerald-500" />
                Upcoming Water Top-up & Health Routines
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Automated task alarms generated post-installation</p>
            </div>
            <button 
              id="service_view_all" 
              onClick={() => onNavigate('clients')} 
              className="text-xs px-2.5 py-1 text-indigo-600 hover:text-indigo-800 font-bold hover:bg-slate-50 rounded"
            >
              All Clients
            </button>
          </div>

          <div id="reminders_alert_scroller" className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
            {activeReminders.length === 0 ? (
              <div id="reminders_empty" className="py-12 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl font-sans">
                ✓ No pending service calls logged at this time.
              </div>
            ) : (
              activeReminders.map((rem) => {
                const isOverdue = rem.status === 'Overdue';
                return (
                  <div key={rem.id} className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                    isOverdue 
                      ? 'bg-rose-50/20 border-rose-100 hover:bg-rose-50/40' 
                      : 'bg-indigo-50/10 border-indigo-100/50 hover:bg-indigo-100/10'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded-full uppercase ${
                          isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {rem.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due: {rem.dueDate}
                        </span>
                      </div>
                      
                      <h4 className="font-sans text-xs font-bold text-slate-900">
                        {rem.clientName} ({rem.type})
                      </h4>
                      <p className="text-[11px] text-slate-600 font-sans italic">
                        &quot;{rem.notes}&quot;
                      </p>
                      <span className="text-[10px] text-slate-500 font-sans block">
                        Contact: {rem.clientPhone}
                      </span>
                    </div>

                    <button
                      onClick={() => onCompleteReminder(rem.id)}
                      title="Mark Service as Completed"
                      className="p-1 px-2.5 text-xs text-emerald-700 bg-white border border-emerald-200/50 hover:bg-emerald-50 rounded-lg flex items-center gap-1 font-bold whitespace-nowrap transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
