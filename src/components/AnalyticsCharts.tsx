/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { BarChart2, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface MonthlyItem {
  month: string;
  sales: number;
  leads: number;
}

export function PerformanceChart() {
  const [activeMetric, setActiveMetric] = useState<'sales' | 'leads'>('sales');

  // Hardcoded historical analytics back-filled for VoltCharge battery activity
  const data: MonthlyItem[] = [
    { month: 'Jan', sales: 3200, leads: 14 },
    { month: 'Feb', sales: 4100, leads: 18 },
    { month: 'Mar', sales: 5800, leads: 26 },
    { month: 'Apr', sales: 4900, leads: 22 },
    { month: 'May (YTD)', sales: 7935, leads: 31 },
  ];

  const maxSales = Math.max(...data.map(d => d.sales));
  const maxLeads = Math.max(...data.map(d => d.leads));

  return (
    <div id="performance_chart_card" className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 id="performance_chart_title" className="font-sans font-semibold text-slate-900 text-lg flex items-center gap-2">
            <TrendingUp id="trending_icon" className="w-5 h-5 text-emerald-500" />
            Performance Growth Trend
          </h3>
          <p id="performance_chart_sub" className="text-slate-500 text-xs mt-0.5 font-sans">
            Real-time track of monthly product business volume and customer demand signals
          </p>
        </div>

        <div id="chart_toggle_box" className="inline-flex bg-slate-50 p-1 rounded-lg border border-slate-100">
          <button
            id="toggle_sales_btn"
            onClick={() => setActiveMetric('sales')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
              activeMetric === 'sales'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Invoice Sales ($)
          </button>
          <button
            id="toggle_leads_btn"
            onClick={() => setActiveMetric('leads')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
              activeMetric === 'leads'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Acquired Leads
          </button>
        </div>
      </div>

      {/* SVG Chart Drawing */}
      <div id="chart_canvas_wrapper" className="relative h-64 w-full flex flex-col justify-end pt-4">
        {/* Y-Axis lines */}
        <div id="y_axis_lines" className="absolute inset-0 flex flex-col justify-between pointer-events-none text-slate-200 select-none pb-6">
          <div className="border-b border-dashed border-slate-100 w-full h-0 relative">
            <span className="absolute right-0 -top-2 text-[10px] font-mono font-medium text-slate-400">
              {activeMetric === 'sales' ? `$${maxSales}` : `${maxLeads} Leads`}
            </span>
          </div>
          <div className="border-b border-dashed border-slate-100 w-full h-0 relative">
            <span className="absolute right-0 -top-2 text-[10px] font-mono font-medium text-slate-400">
              {activeMetric === 'sales' ? `$${Math.round(maxSales * 0.66)}` : `${Math.round(maxLeads * 0.66)}`}
            </span>
          </div>
          <div className="border-b border-dashed border-slate-100 w-full h-0 relative">
            <span className="absolute right-0 -top-2 text-[10px] font-mono font-medium text-slate-400">
              {activeMetric === 'sales' ? `$${Math.round(maxSales * 0.33)}` : `${Math.round(maxLeads * 0.33)}`}
            </span>
          </div>
          <div className="w-full h-0 relative">
            <span className="absolute right-0 -top-2 text-[10px] font-mono font-medium text-slate-400">0</span>
          </div>
        </div>

        {/* Bars Container */}
        <div id="chart_bars_flex" className="flex justify-around items-end h-full z-10 px-4 pb-6">
          {data.map((item, idx) => {
            const val = activeMetric === 'sales' ? item.sales : item.leads;
            const max = activeMetric === 'sales' ? maxSales : maxLeads;
            const percentage = max > 0 ? (val / max) * 100 : 0;

            return (
              <div key={idx} id={`chart_bar_col_${idx}`} className="flex flex-col items-center group relative w-12 sm:w-16">
                {/* Tooltip */}
                <div id={`chart_tooltip_${idx}`} className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white rounded px-2.5 py-1 text-xs font-mono font-bold shadow-md z-30 pointer-events-none whitespace-nowrap">
                  {activeMetric === 'sales' ? `$${val}` : `${val} Leads`}
                </div>

                {/* Animated bar column */}
                <div
                  id={`bar_visual_${idx}`}
                  style={{ height: `${Math.max(percentage, 8)}%` }}
                  className={`w-full rounded-t-lg transition-all duration-700 relative overflow-hidden ${
                    activeMetric === 'sales'
                      ? 'bg-gradient-to-t from-sky-600 to-indigo-500 shadow-lg shadow-indigo-100'
                      : 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-lg shadow-teal-100'
                  }`}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-white/20"></div>
                </div>

                <span id={`chart_bar_label_${idx}`} className="text-slate-500 font-sans text-xs font-semibold mt-3 text-center">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LeadStatusPie() {
  return (
    <div id="lead_category_card" className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
      <div>
        <h3 id="lead_breakdown_title" className="font-sans font-semibold text-slate-900 text-lg flex items-center gap-2">
          <Activity id="activity_icon" className="w-5 h-5 text-indigo-500" />
          Lead Pipeline Health
        </h3>
        <p id="lead_breakdown_sub" className="text-slate-500 text-xs mt-0.5 font-sans">
          Conversion percentages and statuses of current dynamic product customer inquiries
        </p>
      </div>

      <div id="pie_representation" className="my-6 flex items-center justify-center">
        {/* Custom High Quality Mini Layout Bar Chart representing relative densities */}
        <div id="distribution_bars" className="w-full space-y-3.5">
          <div>
            <div className="flex justify-between text-xs text-slate-600 font-sans font-medium mb-1">
              <span>Proposal Sent</span>
              <span className="font-mono text-slate-900 font-bold">45%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 font-sans font-medium mb-1">
              <span>Under Discussion</span>
              <span className="font-mono text-slate-900 font-bold">28%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: '28%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 font-sans font-medium mb-1">
              <span>New Lead Inflow</span>
              <span className="font-mono text-slate-900 font-bold">17%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '17%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 font-sans font-medium mb-1">
              <span>Direct Handshake (Won)</span>
              <span className="font-mono text-slate-900 font-bold">10%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div id="pie_badges" className="grid grid-cols-2 gap-2 text-[11px] font-sans font-medium text-slate-500 pt-3 border-t border-slate-50">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>Proposal</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>Discussion</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>New Inflow</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Target Won</span>
      </div>
    </div>
  );
}
