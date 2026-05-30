/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { CompanySettings, RolePermission, CRMDatabase } from '../types';
import { formatDDMMYYYY } from '../utils/date';
import { 
  Settings, 
  Building, 
  ShieldCheck, 
  Sparkles, 
  Save, 
  Info, 
  Plus, 
  Trash2,
  HardDriveDownload,
  Terminal,
  MousePointerClick,
  Key,
  Lock,
  Unlock,
  Calendar,
  AlertTriangle,
  Copy,
  Check,
  Database,
  UploadCloud,
  RefreshCw
} from 'lucide-react';

interface SettingsViewProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  license?: {
    installationDate: string;
    activated: boolean;
    activationKey: string;
    installationKey?: string;
  };
  onActivateLicense?: (key: string) => Promise<{ success: boolean; error?: string }>;
  onMockDate?: (daysAgo: number) => Promise<void>;
  onDatabaseReset?: (mode: 'wipe' | 'restore') => Promise<void>;
  onRestoreBackup?: (backupData: any) => Promise<boolean>;
  dbData?: CRMDatabase;
}

export default function SettingsView({ 
  settings, 
  onSaveSettings, 
  license,
  onActivateLicense,
  onMockDate,
  onDatabaseReset,
  onRestoreBackup,
  dbData
}: SettingsViewProps) {
  // Company state parameters
  const [companyName, setCompanyName] = useState(settings?.companyName || 'VoltCharge Battery Corp');
  const [companyEmail, setCompanyEmail] = useState(settings?.companyEmail || 'support@voltcharge.com');
  const [companyPhone, setCompanyPhone] = useState(settings?.companyPhone || '+1 (800) 555-VOLT');
  const [companyAddress, setCompanyAddress] = useState(settings?.companyAddress || '700 Ampere Blvd, Power City, PC 50505');
  const [companyTaxId, setCompanyTaxId] = useState(settings?.companyTaxId || 'TX-99882211-B');
  const [companyCurrency, setCompanyCurrency] = useState(settings?.companyCurrency || '₹');

  // Sync state when props change
  useEffect(() => {
    setCompanyName(settings?.companyName || 'VoltCharge Battery Corp');
    setCompanyEmail(settings?.companyEmail || 'support@voltcharge.com');
    setCompanyPhone(settings?.companyPhone || '+1 (800) 555-VOLT');
    setCompanyAddress(settings?.companyAddress || '700 Ampere Blvd, Power City, PC 50505');
    setCompanyTaxId(settings?.companyTaxId || 'TX-99882211-B');
    setCompanyCurrency(settings?.companyCurrency || '₹');
    setUserRoles(settings?.userRoles || []);
  }, [settings]);

  // Roles state parameters
  const [userRoles, setUserRoles] = useState<RolePermission[]>(settings?.userRoles || []);

  // Licensing specific states
  const [keyInput, setKeyInput] = useState('');
  const [actError, setActError] = useState('');
  const [actSuccess, setActSuccess] = useState('');
  const [loadingMock, setLoadingMock] = useState(false);

  // Database security access states & feedback
  const [dbPassword, setDbPassword] = useState('');
  const [isDbUnlocked, setIsDbUnlocked] = useState(false);
  const [dbAuthError, setDbAuthError] = useState('');
  const [dbFeedback, setDbFeedback] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  // Compute trial status locally
  const isActivated = license?.activated || false;
  const installDate = license?.installationDate ? new Date(license.installationDate) : new Date();
  const diffTime = Date.now() - installDate.getTime();
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 15 - daysPassed);
  const isExpired = !isActivated && (daysPassed >= 15);

  const handleUnlockDatabase = (e: FormEvent) => {
    e.preventDefault();
    setDbAuthError('');
    if (dbPassword === 'securebase') {
      setIsDbUnlocked(true);
      setDbPassword('');
      setDbFeedback({ type: '', message: '' });
    } else {
      setDbAuthError('Incorrect security credentials. Access is restricted.');
    }
  };

  const handleLockDatabase = () => {
    setIsDbUnlocked(false);
    setDbPassword('');
    setDbFeedback({ type: '', message: '' });
  };

  const handleBackupDownload = () => {
    if (!dbData) {
      setDbFeedback({ type: 'error', message: 'No database data is available to backup.' });
      return;
    }
    
    try {
      const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", `volt_crm_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
      
      setDbFeedback({ type: 'success', message: 'Database backup exported and downloaded successfully.' });
    } catch (err) {
      setDbFeedback({ type: 'error', message: 'Database backup export failed.' });
    }
  };

  const handleBackupUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Basic confirmation of standard schema
        if (!parsed.inventory && !parsed.leads && !parsed.sales && !parsed.employees) {
          setDbFeedback({ type: 'error', message: 'Invalid file format. Ensure you uploaded a valid CRM database backup.' });
          return;
        }

        if (onRestoreBackup) {
          const success = await onRestoreBackup(parsed);
          if (success) {
            setDbFeedback({ type: 'success', message: 'Database backup restored successfully! All tables updated.' });
          } else {
            setDbFeedback({ type: 'error', message: 'Failed to restore database backup. Please check backend connection.' });
          }
        }
      } catch (err) {
        setDbFeedback({ type: 'error', message: 'Invalid JSON file. Please supply a valid uncorrupted database JSON backup.' });
      }
    };
    
    fileReader.readAsText(file);
    e.target.value = '';
  };

  const handleCompanySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to save these corporate settings?")) {
      return;
    }
    const updated: CompanySettings = {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      companyTaxId,
      companyCurrency,
      userRoles
    };
    onSaveSettings(updated);
  };

  const handleApplyLicense = async (e: FormEvent) => {
    e.preventDefault();
    setActError('');
    setActSuccess('');
    if (!keyInput.trim()) return;

    if (onActivateLicense) {
      const res = await onActivateLicense(keyInput);
      if (res.success) {
        setActSuccess('App permanently activated! Thank you for supporting VoltCRM.');
        setKeyInput('');
      } else {
        setActError(res.error || 'Activation rejected. Please assert key formatting and try again.');
      }
    }
  };

  const handleMockBackdate = async (days: number) => {
    setLoadingMock(true);
    if (onMockDate) {
      await onMockDate(days);
    }
    setLoadingMock(false);
  };

  const handleTogglePermission = (roleIndex: number, page: 'dashboard' | 'inventory' | 'leads' | 'sales' | 'employees' | 'settings') => {
    const copy = [...userRoles];
    const prevPermissionVal = copy[roleIndex].permissions[page];
    copy[roleIndex].permissions = {
      ...copy[roleIndex].permissions,
      [page]: !prevPermissionVal
    };
    setUserRoles(copy);
  };

  const handleAdminLevelChange = (roleIndex: number, level: 'High' | 'Medium' | 'Low') => {
    const copy = [...userRoles];
    copy[roleIndex].adminLevel = level;
    setUserRoles(copy);
  };

  return (
    <div id="settings_view_container" className="space-y-8 animate-fade-in">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form panel columns */}
        <div id="company_config_col" className="lg:col-span-2 space-y-6">
          
          {/* Company metadata profile settings form */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-sans font-bold text-slate-900 mb-5 flex items-center gap-2 border-b border-slate-50 pb-3">
              <Building className="w-4 h-4 text-indigo-500" />
              Corporate Registry & Invoicing Coordinates
            </h3>

            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Company Registered Name</label>
                  <input
                    required
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Tax Registration / VAT ID</label>
                  <input
                    required
                    type="text"
                    value={companyTaxId}
                    onChange={(e) => setCompanyTaxId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white font-mono text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Corporate Help Desk Email</label>
                  <input
                    required
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Support Contact Hotline</label>
                  <input
                    required
                    type="text"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Billed Currency Symbol</label>
                  <select
                    value={companyCurrency}
                    onChange={(e) => setCompanyCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="₹">INR (₹) Indian Rupee</option>
                    <option value="$">USD ($) US Dollar</option>
                    <option value="€">EUR (€) Euro</option>
                    <option value="£">GBP (£) British Pound</option>
                  </select>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Physical Warehouse Address</label>
                  <input
                    required
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Corporate Settings
                </button>
              </div>
            </form>
          </div>

          {/* User roles authorization panel settings */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-sans font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              Organizational Security Customization Roles
            </h3>
            <p className="text-slate-500 text-xs mb-6 font-sans">
              Set security clearances (High, Mid, Low) and toggle page permissions for different administrator hierarchies.
            </p>

            <div id="roles_toggle_stack" className="space-y-6">
              {userRoles.map((role, rIdx) => (
                <div key={role.role} id={`role_sec_${role.role}`} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dashed border-slate-200/65">
                    <div>
                      <h4 className="font-sans font-bold text-slate-900 text-xs flex items-center gap-2">
                        {role.role}
                      </h4>
                      <p className="text-[11px] text-slate-500 italic mt-0.5">{role.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-sans font-medium">Clearance:</span>
                      <select
                        value={role.adminLevel}
                        onChange={(e) => handleAdminLevelChange(rIdx, e.target.value as any)}
                        className="bg-white border rounded p-1 text-[11px] font-bold text-indigo-600 font-sans"
                      >
                        <option value="High">High Clearance</option>
                        <option value="Medium">Medium Clearance</option>
                        <option value="Low">Low Clearance</option>
                      </select>
                    </div>
                  </div>

                  {/* Permissions grid switches */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-4">
                    {(Object.keys(role.permissions) as Array<keyof typeof role.permissions>).map((key) => {
                      const active = role.permissions[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleTogglePermission(rIdx, key as 'dashboard' | 'inventory' | 'leads' | 'sales' | 'employees' | 'settings')}
                          className={`p-2 rounded-lg font-sans text-[10px] font-bold text-center uppercase tracking-wider transition-all border ${
                            active 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {key}
                          <span className="block mt-0.5 text-[8px] font-semibold">
                            {active ? '● Permitted' : '○ Locked'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database Maintenance and Cleanup Panel */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-2">
              <h3 className="text-sm font-sans font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-500" />
                Database Control Console
              </h3>
              {isDbUnlocked && (
                <button
                  type="button"
                  onClick={handleLockDatabase}
                  className="text-[10px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-bold uppercase transition cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  Lock Console
                </button>
              )}
            </div>
            
            <p className="text-slate-500 text-xs mb-5 font-sans">
              Perform deep database tuning, cleaning, manual backups, and data restorations. These operations affect internal storage systems directly.
            </p>

            {/* Display general feedback alerts if present */}
            {dbFeedback.message && (
              <div className={`mb-4 p-3 rounded-lg text-xs font-semibold leading-relaxed border ${
                dbFeedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                  : 'bg-rose-50 text-rose-800 border-rose-100'
              }`}>
                {dbFeedback.type === 'success' ? '✓ ' : '⚠️ '}
                {dbFeedback.message}
              </div>
            )}

            {!isDbUnlocked ? (
              /* Security Authorization Control */
              <div className="p-5 bg-slate-50/55 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-sans">Security Control Access Required</h4>
                  <p className="text-[10px] text-slate-405 max-w-xs mt-1 leading-normal font-sans">
                    Enter the Database Security Password to access options to Clear, Backup, and Restore.
                  </p>
                </div>
                <form onSubmit={handleUnlockDatabase} className="w-full max-w-sm flex gap-2 pt-1">
                  <input
                    required
                    type="password"
                    id="db_authorization_password"
                    placeholder="Enter security password"
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    className="w-full bg-white border border-slate-205 border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Unlock
                  </button>
                </form>
                {dbAuthError && (
                  <p className="text-[10px] text-rose-600 font-bold font-sans">⚠️ {dbAuthError}</p>
                )}
              </div>
            ) : (
              /* Database Controls (Unlocked) */
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Option 1: Backup Database (export json) */}
                  <div className="border border-slate-100 bg-slate-50/40 p-3.5 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Backup Database
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-sans">
                        Export and download a complete cryptographic JSON state record of all CRM datasets (leads, sales, inventory, technicians) directly to your local computer.
                      </p>
                    </div>
                    <div className="mt-4 pt-2">
                      <button
                        type="button"
                        onClick={handleBackupDownload}
                        className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-sans text-[11px] font-bold px-2 py-2 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <HardDriveDownload className="w-3.5 h-3.5" />
                        Download Backup (.json)
                      </button>
                    </div>
                  </div>

                  {/* Option 2: Restore Database (upload/read json) */}
                  <div className="border border-slate-100 bg-slate-50/40 p-3.5 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                        Restore Database
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-sans">
                        Upload a previously generated GeneralCRM backup JSON file to safely reconstruct and re-instantiate all datasets. This replaces current data immediately.
                      </p>
                    </div>
                    <div className="mt-4 pt-2">
                      <label className="w-full bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-sans text-[11px] font-bold px-2 py-2 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 matches-feedback">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Backup File</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleBackupUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Option 3: Clean Database */}
                  <div className="border border-slate-100 bg-slate-50/40 p-3.5 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        Clear Database
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-sans">
                        Clears all preloaded or recorded customers (Clients), pipeline leads, transactions history, and technicians roster. Restarts application in clean mode.
                      </p>
                    </div>
                    <div className="mt-4 pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm("⚠️ WARNING: This will permanently DELETE all active leads, sales invoices, clients, inventory records, and employees to prepare a blank slate. Your active subscription status and company profile configuration will be kept. Are you sure you want to clean all data?")) {
                            if (onDatabaseReset) {
                              await onDatabaseReset('wipe');
                              setDbFeedback({ type: 'success', message: 'Database wiped successfully. Placed in blank mode.' });
                            }
                          }
                        }}
                        className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-850 font-sans text-[11px] font-bold px-2 py-2 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear System (Wipe)
                      </button>
                    </div>
                  </div>

                </div>

                {/* Additional Option: Restore demo dataset for testing */}
                <div className="p-3 bg-indigo-50/20 border border-indigo-100/60 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-indigo-950 block">Need training or testing datasets restored?</span>
                    <p className="text-[10px] text-slate-500">Instantly populate standard battery models, invoices, leads, and staff presets.</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm("Are you sure you want to restore the default sample databases? This will overwrite current custom input items, sales history, and customer records with original training assets.")) {
                        if (onDatabaseReset) {
                          await onDatabaseReset('restore');
                          setDbFeedback({ type: 'success', message: 'Demo sample datasets restored successfully.' });
                        }
                      }
                    }}
                    className="shrink-0 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-sans text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Restore Demo
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Local deployment and subscription licensing guidance column */}
        <div id="local_executable_download_col" className="space-y-6">
          
          {/* Subscription & License Status Card */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-sans font-bold text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-3">
              <Key className="w-4 h-4 text-indigo-500" />
              Subscription & Licensing
            </h3>

            {/* Current status display badge */}
            <div className="p-3.5 rounded-xl flex flex-col gap-1 text-slate-800 border bg-slate-50">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">License Status:</span>
                {isActivated ? (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">Permanent Active</span>
                ) : isExpired ? (
                  <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">Trial Expired</span>
                ) : (
                  <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase">{daysLeft} Days Trial Left</span>
                )}
              </div>
              
              <div className="text-slate-500 text-xs mt-2 space-y-1 font-sans">
                <div className="flex justify-between">
                  <span>Current Plane:</span>
                  <strong className="text-slate-800">{isActivated ? 'Professional Access' : '15-Day Free Trial'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Inital Setup Date:</span>
                  <strong className="text-slate-700 text-[10px] font-mono">{formatDDMMYYYY(installDate)}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-indigo-600 font-semibold">Installation Key:</span>
                  <strong className="text-indigo-700 text-[11px] font-mono select-all tracking-wider">{license?.installationKey || 'Generating...'}</strong>
                </div>
                {isActivated && license?.activationKey && (
                  <div className="flex justify-between">
                    <span>Active Key:</span>
                    <strong className="text-indigo-650 font-mono text-[10px] tracking-wider">
                      {license.activationKey.slice(0, 9)}••••••••
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* If not activated, render activation field input */}
            {!isActivated ? (
              <form onSubmit={handleApplyLicense} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Enter Permanent Activation Key</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono uppercase tracking-widest text-slate-800 focus:bg-white pl-8 focus:outline-indigo-600 focus:outline-offset-0"
                      placeholder="VOLT-XXXX-XXXX-XXXX-XXXX"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {actError && (
                  <div className="text-rose-600 font-sans text-[10px] font-bold bg-rose-50 border border-rose-100 p-2 rounded-lg flex items-center gap-1.5 leading-snug">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {actError}
                  </div>
                )}

                {actSuccess && (
                  <div className="text-emerald-700 font-sans text-[10px] font-bold bg-emerald-50 border border-emerald-100 p-2 rounded-lg flex items-center gap-1.5 leading-snug">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    {actSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-505 text-white bg-indigo-600 hover:bg-indigo-500 font-sans text-xs font-bold py-2 px-3 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Activate & Unlock app
                </button>
              </form>
            ) : (
              <div className="text-xs bg-emerald-50/50 text-emerald-800 border border-emerald-100/55 p-3 rounded-xl flex items-start gap-2 pt-2.5 font-sans leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider">Verification Complete</h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">Permanent activation verified. All features are fully unlocked indefinitely.</p>
                </div>
              </div>
            )}

            {/* Mock simulator backdating panel */}
            <div className="pt-3 border-t border-dashed border-slate-150 space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 font-mono tracking-wide uppercase">Developer Sandbox Clock Tools:</span>
              <p className="text-[10px] text-slate-500 leading-normal">
                Backdate setup files to instantly inspect subscription transition behaviors (locks/trial leftovers).
              </p>
              
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => handleMockBackdate(0)}
                  disabled={loadingMock}
                  className="p-1 px-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded text-[9px] font-bold text-slate-700 font-mono transition-all text-center cursor-pointer disabled:opacity-50"
                  title="Sets install date to today (0 days passed)"
                >
                  Reset (Today)
                </button>
                <button
                  onClick={() => handleMockBackdate(10)}
                  disabled={loadingMock}
                  className="p-1 px-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded text-[9px] font-bold text-slate-755 font-mono transition-all text-center cursor-pointer disabled:opacity-50 text-indigo-750"
                  title="Sets install date to 10 days ago (5 days left of trial)"
                >
                  -10 Days (Trial)
                </button>
                <button
                  onClick={() => handleMockBackdate(16)}
                  disabled={loadingMock}
                  className="p-1 px-1.5 border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 rounded text-[9px] font-bold font-mono transition-all text-center cursor-pointer disabled:opacity-50"
                  title="Sets install date to 16 days ago (expired)"
                >
                  -16 Days (Expired)
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
