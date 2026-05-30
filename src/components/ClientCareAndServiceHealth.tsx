/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CRMDatabase } from '../types';
import { BellRing, ShieldCheck, Activity } from 'lucide-react';

interface ClientCareAndServiceHealthProps {
  data: CRMDatabase;
}

export default function ClientCareAndServiceHealth({ data }: ClientCareAndServiceHealthProps) {
  const clients = data.clients || [];
  const reminders = data.reminders || [];
  const totalClients = clients.length;

  let clientsRequiresCare = 0;
  let clientsHealthy = 0;
  let clientsNoAlarms = 0;

  clients.forEach(c => {
    const cRems = reminders.filter(r => r.clientId === c.id || r.clientPhone === c.phone);
    if (cRems.length === 0) {
      clientsNoAlarms++;
    } else if (cRems.some(r => r.status === 'Overdue')) {
      clientsRequiresCare++;
    } else {
      clientsHealthy++;
    }
  });

  const pcRequiresCare = totalClients > 0 ? Math.round((clientsRequiresCare / totalClients) * 105) : 0; // scaled slightly or kept accurate
  const pcHealthy = totalClients > 0 ? Math.round((clientsHealthy / totalClients) * 100) : 0;
  const pcNoAlarms = totalClients > 0 ? Math.round((clientsNoAlarms / totalClients) * 100) : 0;
  // Ensure we round cleanly to realistic percentages
  const checkPcRequiresCare = totalClients > 0 ? Math.round((clientsRequiresCare / totalClients) * 100) : 0;

  // Servicing alarms resolution rate
  const totalRemindersCount = reminders.length;
  const completedRemindersCount = reminders.filter(r => r.status === 'Completed').length;
  const resolutionRate = totalRemindersCount > 0 ? Math.round((completedRemindersCount / totalRemindersCount) * 100) : 100;

  return (
    <div id="service_health_card" className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between h-full">
      <div id="service_health_header">
        <h3 id="service_health_title" className="font-sans font-semibold text-slate-900 text-lg flex items-center gap-2">
          <Activity id="care_health_icon" className="w-5 h-5 text-rose-500" />
          Client Care & Service Health
        </h3>
        <p id="service_health_sub" className="text-slate-500 text-xs mt-0.5 font-sans">
          Real-time indices of battery client care, water top-ups, and alert resolution levels
        </p>
      </div>

      <div id="service_health_representation" className="my-6 space-y-4">
        {/* Dynamic Resolution Banner */}
        <div id="resolution_index_banner" className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Resolution Index</span>
            <span className="text-base font-mono font-black text-rose-600 block mt-0.5">
              {resolutionRate}% Completed
            </span>
          </div>
          <span className="text-[10px] font-mono font-extrabold bg-rose-50 border border-rose-100 text-rose-600 px-2 py-1 rounded-full">
            {completedRemindersCount}/{totalRemindersCount} Done
          </span>
        </div>

        {/* Dynamic Proportions */}
        <div className="space-y-3.5">
          <div>
            <div className="flex justify-between text-xs text-slate-600 font-sans font-medium mb-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Healthy Portfolio (All alert resolved)
              </span>
              <span className="font-mono text-slate-900 font-bold">{pcHealthy}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${pcHealthy}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 font-sans font-medium mb-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Urgent Attention (Overdue alarms)
              </span>
              <span className="font-mono text-slate-900 font-bold">{checkPcRequiresCare}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                style={{ width: `${checkPcRequiresCare}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 font-sans font-medium mb-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-450"></span>
                Pristine (No Active Schedule)
              </span>
              <span className="font-mono text-slate-900 font-bold">{pcNoAlarms}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-400 rounded-full transition-all duration-500" 
                style={{ width: `${pcNoAlarms}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div id="service_health_badges" className="grid grid-cols-2 gap-2 text-[11px] font-sans font-medium text-slate-500 pt-3 border-t border-slate-50">
        <span className="flex items-center gap-1.5" title="Clients with active schedules other than Overdue"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>{clientsHealthy} Healthy</span>
        <span className="flex items-center gap-1.5" title="Clients with active overdue service alarms"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>{clientsRequiresCare} Urgent Alert</span>
        <span className="flex items-center gap-1.5" title="Clients with no reminders logged in system"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>{clientsNoAlarms} No Alerts</span>
        <span className="text-slate-400 font-mono text-[9px] self-center text-right font-bold">{totalClients} Profiles</span>
      </div>
    </div>
  );
}
