/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent } from 'react';
import { CRMDatabase, InventoryItem, Lead, Sale, Client, ServiceReminder, Employee, CompanySettings } from './types';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import LeadsView from './components/LeadsView';
import SalesView from './components/SalesView';
import EmployeeView from './components/EmployeeView';
import SettingsView from './components/SettingsView';
import ReportsView from './components/ReportsView';
import ClientsView from './components/ClientsView';
import { 
  Building2, 
  LayoutDashboard, 
  Box, 
  Users, 
  ShoppingBag, 
  Bell, 
  Wrench, 
  ShieldCheck, 
  FolderLock, 
  Loader2,
  Settings as SettingsIcon,
  RefreshCw,
  TrendingUp,
  BellRing
} from 'lucide-react';

const isTabPermitted = (tabId: string, level: 'High' | 'Medium' | 'Low' | null, settings?: CompanySettings): boolean => {
  if (!level) return false;

  if (settings?.userRoles) {
    const role = settings.userRoles.find(r => r.adminLevel === level);
    if (role) {
      // map tabId 'reports' and 'clients' to follow 'sales' permission of the role settings
      const permKey = tabId === 'reports' || tabId === 'clients' ? 'sales' : (tabId as keyof typeof role.permissions);
      if (role.permissions && role.permissions[permKey] !== undefined) {
        return role.permissions[permKey];
      }
    }
  }

  // Fallback defaults
  if (level === 'High') return true;
  if (level === 'Medium') {
    return ['dashboard', 'inventory', 'leads', 'sales', 'reports', 'clients'].includes(tabId);
  }
  if (level === 'Low') {
    return ['dashboard', 'leads', 'clients'].includes(tabId);
  }
  return false;
};

// Login View Component
function LoginView({ 
  employees, 
  onLogin 
}: { 
  employees: Employee[]; 
  onLogin: (username: string, clearance: 'High' | 'Medium' | 'Low') => void 
}) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const typedUser = username.trim();
    const typedPin = pin.trim();

    if (!typedUser) {
      setErrorMsg('Please specify your profile username.');
      return;
    }
    if (!typedPin) {
      setErrorMsg('Please enter your security passcode.');
      return;
    }

    // 1. Check built-in common super admin
    if (typedUser.toLowerCase() === 'admin') {
      if (typedPin === 'minda123') {
        onLogin('Super Admin (admin)', 'High');
        return;
      } else {
        setErrorMsg('Invalid passcode for the default Super Admin credential.');
        return;
      }
    }

    // 2. Look up the designated registered employee details
    const foundEmployee = employees.find(
      (emp) => emp.username && emp.username.trim().toLowerCase() === typedUser.toLowerCase()
    );

    if (foundEmployee) {
      if (foundEmployee.passcode === typedPin) {
        onLogin(foundEmployee.name, foundEmployee.clearanceLevel || 'Low');
        return;
      } else {
        setErrorMsg('Incorrect passcode entered for this staff profile.');
        return;
      }
    }

    setErrorMsg('Profile username not found. Ask any High Clearance administrator to enroll your account details first.');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background radial effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-800 border border-slate-700/60 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative z-10 text-left">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">GeneralCRM Terminal Authentication</h1>
            <p className="text-[11px] text-slate-405 mt-1 font-medium">Restricted Access Portal • Secure Identity Gateway</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold leading-relaxed">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-[11px] font-sans font-bold text-slate-400 uppercase tracking-widest mb-1.5">User Identity Profile / Username</label>
            <input
              required
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin, lsterling, ..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
            />
          </div>

          {/* Secret PIN */}
          <div>
            <label className="block text-[11px] font-sans font-bold text-slate-400 uppercase tracking-widest mb-1.5">Security PIN / Passcode</label>
            <input
              type="password"
              placeholder="••••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 tracking-widest text-center"
            />
          </div>

          {/* Guidance / Help box */}
          <div className="p-3 bg-slate-900/40 rounded-xl text-[10px] text-slate-400 leading-relaxed border border-slate-705/30 text-center">
            🔒 Enter your registered GeneralCRM staff username and secure passcode to authenticate your terminal.
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Authenticate Session
          </button>
        </form>
      </div>
    </div>
  );
}

// Access Restricted View
function AccessRestrictedView({ requiredLevel, currentLevel, onSignOut }: { requiredLevel: string, currentLevel: string, onSignOut: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 max-w-md mx-auto animate-fade-in font-sans">
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 animate-pulse">
        <FolderLock className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-sans font-black text-slate-900 tracking-tight">Access Restricted (Level Insufficient)</h3>
        <p className="text-xs text-slate-500 font-sans leading-relaxed">
          The requested console page requires <strong className="text-slate-900">[{requiredLevel} Clearance]</strong> or higher. Your account is logged in under <strong className="text-slate-900">[{currentLevel} Clearance]</strong>.
        </p>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-[11px] text-slate-500 text-left font-sans space-y-1.5 w-full">
        <span className="font-bold text-slate-700 block mb-1">Sandbox Security Override Protocol:</span>
        <div>🔑 <strong className="text-slate-800">High Clearance</strong>: Full access to everything, including Salaries and Systems.</div>
        <div>📂 <strong className="text-slate-800">Medium Clearance</strong>: View/update inventory stock levels, CRM leads, and Invoices.</div>
        <div>📉 <strong className="text-slate-800">Low Clearance</strong>: Access performance dashboard and Pipeline leads only.</div>
      </div>
      <button
        onClick={onSignOut}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm cursor-pointer"
      >
        Sign Out & Switch Clearance Level
      </button>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [dbData, setDbData] = useState<CRMDatabase | null>(null);
  const [leadPreset, setLeadPreset] = useState<any | null>(null);

  const [currentUserName, setCurrentUserName] = useState<string>(() => localStorage.getItem('volt_user_name') || '');
  const [currentUserLevel, setCurrentUserLevel] = useState<'High' | 'Medium' | 'Low' | null>(() => {
    const stored = localStorage.getItem('volt_user_clearance');
    return (stored as 'High' | 'Medium' | 'Low' | null) || null;
  });

  // Load database on mount
  const fetchDatabase = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/data');
      if (res.ok) {
        const data: CRMDatabase = await res.json();
        setDbData(data);
      } else {
        console.error("Failed to fetch CRM dataset payload.");
      }
    } catch (e) {
      console.error("Networking error on load:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  // API triggers
  const handleSaveInventory = async (item: InventoryItem) => {
    try {
      const res = await fetch('/api/crm/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { ...prev, inventory: payload.inventory } : null);
        }
      }
    } catch (err) {
      console.error("Save inventory transaction failed:", err);
    }
  };

  const handleDeleteInventory = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { ...prev, inventory: payload.inventory } : null);
        }
      }
    } catch (err) {
      console.error("Delete inventory record failed:", err);
    }
  };

  const handleSaveLead = async (lead: Lead) => {
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { ...prev, leads: payload.leads, employees: payload.employees } : null);
        }
      }
    } catch (err) {
      console.error("Save lead transaction failed:", err);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { ...prev, leads: payload.leads } : null);
        }
      }
    } catch (err) {
      console.error("Delete lead transaction failed:", err);
    }
  };

  const handleCheckoutSale = async (sale: Sale) => {
    try {
      const res = await fetch('/api/crm/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { 
            ...prev, 
            sales: payload.sales,
            inventory: payload.inventory,
            clients: payload.clients,
            reminders: payload.reminders,
            employees: payload.employees,
            leads: payload.leads || prev.leads
          } : null);
        }
      }
    } catch (err) {
      console.error("Checkout sales transaction failed:", err);
    }
  };

  const handleDeleteSale = async (id: string) => {
    console.log(`App handleDeleteSale called with ID: ${id}`);
    try {
      const res = await fetch(`/api/crm/sales/${id}`, {
        method: 'DELETE'
      });
      console.log(`DELETE request returned status: ${res.status}`);
      if (res.ok) {
        const payload = await res.json();
        console.log("DELETE payload:", payload);
        if (payload.success) {
          setDbData(prev => prev ? { 
            ...prev, 
            sales: payload.sales,
            inventory: payload.inventory,
            clients: payload.clients,
            reminders: payload.reminders,
            employees: payload.employees
          } : null);
        }
      } else {
        console.error("DELETE request failed");
      }
    } catch (err) {
      console.error("Delete sales transaction failed:", err);
    }
  };

  const handleSaveClient = async (client: Client) => {
    try {
      const res = await fetch('/api/crm/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { ...prev, clients: payload.clients } : null);
        }
      }
    } catch (err) {
      console.error("Save client failed:", err);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { ...prev, clients: payload.clients, reminders: payload.reminders } : null);
        }
      }
    } catch (err) {
      console.error("Delete client failed:", err);
    }
  };

  const handleSaveReminder = async (rem: ServiceReminder) => {
    try {
      const res = await fetch('/api/crm/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rem)
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { ...prev, reminders: payload.reminders } : null);
        }
      }
    } catch (err) {
      console.error("Save reminder failed:", err);
    }
  };

  const handleCompleteReminder = async (id: string) => {
    // Locate the task, set status as completed
    if (!dbData) return;
    const task = dbData.reminders.find(r => r.id === id);
    if (!task) return;

    const updatedTask = { ...task, status: 'Completed' as const };
    await handleSaveReminder(updatedTask);
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/reminders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { ...prev, reminders: payload.reminders } : null);
        }
      }
    } catch (err) {
      console.error("Delete reminder failed:", err);
    }
  };

  const handleSaveEmployee = async (emp: Employee) => {
    try {
      const res = await fetch('/api/crm/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emp)
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { ...prev, employees: payload.employees } : null);
        }
      }
    } catch (err) {
      console.error("Save employee failed:", err);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/employees/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { ...prev, employees: payload.employees } : null);
        }
      }
    } catch (err) {
      console.error("Delete employee associate failed:", err);
    }
  };

  const handleSaveSettings = async (settings: CompanySettings) => {
    try {
      const res = await fetch('/api/crm/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { ...prev, settings: payload.settings } : null);
        }
      }
    } catch (err) {
      console.error("Save company settings failed:", err);
    }
  };

  const handleActivateLicense = async (key: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/crm/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        setDbData(prev => prev ? { ...prev, license: payload.license } : null);
        return { success: true };
      } else {
        return { success: false, error: payload.error || "Invalid key. Check format." };
      }
    } catch (err) {
      console.error("Failed to activate key:", err);
      return { success: false, error: "Network error with validation server node." };
    }
  };

  const handleMockDateChange = async (daysAgo: number) => {
    try {
      const res = await fetch('/api/crm/license/mock-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysAgo })
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDbData(prev => prev ? { ...prev, license: payload.license } : null);
        }
      }
    } catch (err) {
      console.error("Mock date updating failed:", err);
    }
  };

  const handleDatabaseReset = async (mode: 'wipe' | 'restore') => {
    try {
      const res = await fetch('/api/crm/database/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.db) {
          setDbData(payload.db);
        }
      }
    } catch (err) {
      console.error("Database reset operation failed:", err);
    }
  };

  const handleRestoreBackup = async (backupData: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/crm/database/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup: backupData })
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.db) {
          setDbData(payload.db);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Database restore operation failed:", err);
      return false;
    }
  };

  const handleNavigateToCheckout = (preset: any) => {
    setLeadPreset(preset);
    setActiveTab('sales');
  };

  // Nav definitions
  const tabs = [
    { id: 'dashboard', label: 'Monitor Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Product Inventory', icon: Box },
    { id: 'leads', label: 'Pipeline Leads', icon: Users },
    { id: 'clients', label: 'Client Care & Service', icon: BellRing },
    { id: 'sales', label: 'Conversions', icon: ShoppingBag },
    { id: 'reports', label: 'Commercial Reports', icon: TrendingUp },
    { id: 'employees', label: 'Staff Shift & Payroll', icon: Wrench },
    { id: 'settings', label: 'Access Settings', icon: SettingsIcon }
  ];

  if (loading && !dbData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <h3 className="text-sm font-semibold text-slate-800 mt-3">Booting GeneralCRM Engine</h3>
        <p className="text-xs text-slate-400 mt-1">Connecting node storage controller files...</p>
      </div>
    );
  }

  const appSettings = dbData?.settings;
  const currencySymbol = appSettings?.companyCurrency || '₹';

  // Compute licensing trial characteristics
  const isActivated = true;
  const isTrialExpired = false;

  // Authentication Lock
  if (!currentUserLevel) {
    return (
      <LoginView 
        employees={dbData?.employees || []}
        onLogin={(username, clearance) => {
          localStorage.setItem('volt_user_name', username);
          localStorage.setItem('volt_user_clearance', clearance);
          setCurrentUserName(username);
          setCurrentUserLevel(clearance);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex text-slate-800 antialiased selection:bg-indigo-600 selection:text-white">
      
      {/* Visual Navigation Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-900 text-white flex flex-col justify-between shrink-0 hidden md:flex sticky top-0 h-screen print:hidden">
        <div>
          {/* Logo Brand banner */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-sans font-black tracking-wider text-white truncate max-w-[170px]">{appSettings?.companyName || 'GeneralCRM Portal'}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-400 font-mono tracking-tight font-medium">Core Node Active</span>
                <span className="text-[8px] px-1 py-0.5 rounded font-sans font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Licensed
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="p-4 space-y-1.5">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              const permitted = isTabPermitted(tab.id, currentUserLevel, appSettings);
              return (
                <button
                  key={tab.id}
                  id={`side_tab_${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between py-3 px-4 rounded-xl text-left text-xs font-bold transition-all ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 font-bold' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <TabIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {!permitted && (
                    <FolderLock className="w-3.5 h-3.5 text-slate-500 hover:text-slate-400 shrink-0" title="Clearance Restricted" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Foot status panel */}
        <div className="p-5 border-t border-white/5 bg-slate-950/40 text-[10px] text-slate-500 font-mono space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span>USER:</span>
            <span className="text-white font-bold truncate max-w-[110px]">{currentUserName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>CLEARANCE:</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans font-bold uppercase tracking-wider ${
              currentUserLevel === 'High' ? 'bg-indigo-500/20 text-indigo-300' :
              currentUserLevel === 'Medium' ? 'bg-teal-500/20 text-teal-300' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {currentUserLevel}
            </span>
          </div>
          <div className="pt-2 border-t border-white/5 space-y-0.5">
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-sans font-bold">Installation Key:</span>
            <code className="text-indigo-400 block text-[11px] font-bold tracking-wider select-all">
              {dbData?.license?.installationKey || 'N/A'}
            </code>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('volt_user_name');
              localStorage.removeItem('volt_user_clearance');
              setCurrentUserLevel(null);
              setCurrentUserName('');
            }}
            className="w-full mt-2 bg-slate-900 border border-slate-800 hover:bg-rose-950 hover:text-white text-slate-400 py-1.5 rounded text-center block font-sans font-bold transition-all cursor-pointer text-[10px]"
          >
            ✕ Sign Out Terminal
          </button>
        </div>
      </aside>

      {/* Main Container screen area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header toolbar panel */}
        <header className="bg-white border-b border-slate-100 py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            {/* Mobile Nav toggle indicator banner for smaller views */}
            <div className="md:hidden p-2 bg-slate-150 rounded-lg text-slate-600 block">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            
            <div className="font-sans">
              <h2 className="text-xs font-bold uppercase text-indigo-600 tracking-wider">
                {appSettings?.companyName || 'Generic CRM System'}
              </h2>
              <span className="text-sm font-bold text-slate-900 mt-0.5 inline-block">
                {activeTab === 'dashboard' ? 'Operational Real-time Performance Indicator' :
                 activeTab === 'inventory' ? 'Primary Warehouse Inventory Register' :
                 activeTab === 'leads' ? 'Client Pipeline Acquisitions' :
                 activeTab === 'clients' ? 'Client Care & Service Reminders Portfolio' :
                 activeTab === 'sales' ? 'Invoice Checkout Counter' :
                 activeTab === 'reports' ? 'Corporate Statistical Ledger & Print Center' :
                 activeTab === 'employees' ? 'Associate Organizational Register & Payroll Index' : 'System configurations'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Permanent unique local Installation Key display widget */}
            <div className="flex font-mono text-[10px] bg-slate-900 text-slate-200 border border-slate-950 rounded-xl px-2.5 py-1.5 items-center gap-1.5 leading-none shrink-0" title="Secure Machine Identification Key">
              <span className="text-slate-400 text-[8px] font-sans font-extrabold uppercase tracking-wide">Inst Key:</span>
              <span className="font-bold text-indigo-400 tracking-wider select-all transition-all">
                {dbData?.license?.installationKey || 'Generating...'}
              </span>
            </div>

            {/* Real-time Refresh trigger */}
            <button 
              title="Refresh offline databases"
              onClick={fetchDatabase}
              className="p-2 border hover:bg-slate-50 text-slate-500 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Quick user role widget */}
            <div className="hidden sm:flex text-xs font-sans font-bold bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl items-center gap-2 text-slate-700">
              <FolderLock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{currentUserName}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold ${
                currentUserLevel === 'High' ? 'bg-indigo-100 text-indigo-800' :
                currentUserLevel === 'Medium' ? 'bg-teal-100 text-teal-800' :
                'bg-slate-100 text-slate-600'
              }`}>
                {currentUserLevel} Clearance
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation bar (Header sub-tabs row) when displayed on mobile sizes */}
        <div className="bg-slate-900 text-white p-2 flex gap-1 overflow-x-auto md:hidden border-b border-slate-800 print:hidden">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const permitted = isTabPermitted(tab.id, currentUserLevel, appSettings);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-3 rounded-lg text-[11px] font-sans font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {!permitted && <FolderLock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Active render contents template wrapper */}
        <div id="app_view_content_frame" className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {dbData && (
            <>
              {!isTabPermitted(activeTab, currentUserLevel, appSettings) ? (
                <AccessRestrictedView 
                  requiredLevel={
                    activeTab === 'employees' || activeTab === 'settings' ? 'High' : 'Medium'
                  } 
                  currentLevel={currentUserLevel} 
                  onSignOut={() => {
                    localStorage.removeItem('volt_user_name');
                    localStorage.removeItem('volt_user_clearance');
                    setCurrentUserLevel(null);
                    setCurrentUserName('');
                  }}
                />
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <DashboardView 
                      data={dbData} 
                      onNavigate={(tab) => setActiveTab(tab)} 
                      onCompleteReminder={handleCompleteReminder} 
                    />
                  )}

                  {activeTab === 'inventory' && (
                    <InventoryView 
                      inventory={dbData.inventory} 
                      companyCurrency={currencySymbol}
                      onSaveItem={handleSaveInventory}
                      onDeleteItem={handleDeleteInventory}
                    />
                  )}

                  {activeTab === 'leads' && (
                    <LeadsView 
                      leads={dbData.leads} 
                      employees={dbData.employees}
                      companyCurrency={currencySymbol}
                      companySettings={appSettings}
                      onSaveLead={handleSaveLead}
                      onDeleteLead={handleDeleteLead}
                      onNavigateToCheckout={handleNavigateToCheckout}
                    />
                  )}

                  {activeTab === 'clients' && (
                    <ClientsView 
                      clients={dbData.clients} 
                      reminders={dbData.reminders}
                      employees={dbData.employees}
                      companyCurrency={currencySymbol}
                      companySettings={appSettings}
                      onSaveClient={handleSaveClient}
                      onDeleteClient={handleDeleteClient}
                      onSaveReminder={handleSaveReminder}
                      onDeleteReminder={handleDeleteReminder}
                    />
                  )}

                  {activeTab === 'sales' && (
                    <SalesView 
                      sales={dbData.sales} 
                      inventory={dbData.inventory} 
                      employees={dbData.employees}
                      clients={dbData.clients} 
                      companyCurrency={currencySymbol}
                      companySettings={appSettings}
                      leadPreset={leadPreset}
                      onClearPreset={() => setLeadPreset(null)}
                      onCheckoutSale={handleCheckoutSale}
                      onDeleteSale={handleDeleteSale}
                    />
                  )}

                  {activeTab === 'reports' && (
                    <ReportsView 
                      data={dbData}
                    />
                  )}

                  {activeTab === 'employees' && (
                    <EmployeeView 
                      employees={dbData.employees} 
                      companyCurrency={currencySymbol}
                      onSaveEmployee={handleSaveEmployee}
                      onDeleteEmployee={handleDeleteEmployee}
                    />
                  )}

                  {activeTab === 'settings' && (
                    <SettingsView 
                      settings={dbData.settings} 
                      onSaveSettings={handleSaveSettings}
                      license={dbData.license}
                      onActivateLicense={handleActivateLicense}
                      onMockDate={handleMockDateChange}
                      onDatabaseReset={handleDatabaseReset}
                      onRestoreBackup={handleRestoreBackup}
                      dbData={dbData}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Absolute Blocking Overlay - removed */}

    </div>
  );
}
