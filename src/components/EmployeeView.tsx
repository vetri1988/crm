/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Employee } from '../types';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Trophy, 
  UserPlus, 
  Clock, 
  Briefcase, 
  Plus, 
  Edit3, 
  Trash2,
  Phone,
  Mail,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';

interface EmployeeViewProps {
  employees: Employee[];
  companyCurrency: string;
  onSaveEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export default function EmployeeView({ employees, companyCurrency, onSaveEmployee, onDeleteEmployee }: EmployeeViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Sales Executive');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [baseSalary, setBaseSalary] = useState(2500);
  const [commissionPercentage, setCommissionPercentage] = useState(5);
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [clearanceLevel, setClearanceLevel] = useState<'High' | 'Medium' | 'Low'>('Low');
  const [validationError, setValidationError] = useState('');

  // Calculations for KPI ranks
  const topSalesRepresentative = [...employees].sort((a,b) => b.salesInvoiced - a.salesInvoiced)[0];
  const topLeadConverter = [...employees].sort((a,b) => b.leadsConverted - a.leadsConverted)[0];

  const handleAddNew = () => {
    setEditingEmployee(null);
    setName('');
    setDesignation('Sales Executive');
    setPhone('');
    setEmail('');
    setBaseSalary(2500);
    setCommissionPercentage(5);
    setUsername('');
    setPasscode('');
    setClearanceLevel('Low');
    setValidationError('');
    setIsFormOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name || '');
    setDesignation(emp.designation || 'Sales Executive');
    setPhone(emp.phone || '');
    setEmail(emp.email || '');
    setBaseSalary(emp.baseSalary !== undefined ? emp.baseSalary : 0);
    setCommissionPercentage(emp.commissionPercentage !== undefined ? emp.commissionPercentage : 0);
    setUsername(emp.username || '');
    setPasscode(emp.passcode || '');
    setClearanceLevel(emp.clearanceLevel || 'Low');
    setValidationError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const trimUser = username.trim().toLowerCase();
    if (trimUser) {
      if (trimUser === 'admin') {
        setValidationError("The username 'admin' is a reserved built-in super administrator profile. Please select another username.");
        return;
      }

      const duplicate = employees.find(emp => 
        emp.id !== (editingEmployee?.id || '') && 
        emp.username?.trim().toLowerCase() === trimUser
      );

      if (duplicate) {
        setValidationError(`The username '${username.trim()}' is already taken by another employee record (${duplicate.name}). Please enter a unique handler.`);
        return;
      }
    }

    const emp: Employee = {
      id: editingEmployee?.id || '',
      name: name || 'Unnamed Team Member',
      designation,
      phone: phone || '+1 (555) 000-0000',
      email: email || 'work@voltcharge.com',
      baseSalary: Number(baseSalary),
      commissionPercentage: Number(commissionPercentage),
      shiftSchedule: editingEmployee?.shiftSchedule || 'General (09:00 - 17:00)',
      workedShiftsCount: editingEmployee?.workedShiftsCount || 0,
      salesInvoiced: editingEmployee?.salesInvoiced || 0,
      leadsConverted: editingEmployee?.leadsConverted || 0,
      username: username ? username.trim() : undefined,
      passcode: passcode || undefined,
      clearanceLevel: clearanceLevel
    };
    onSaveEmployee(emp);
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  // Helper calculation for dynamic commission and total payroll value
  const calculatePayroll = (emp: Employee) => {
    // Commission is base % of invoice sales + additional 50 bucks per converted lead
    const commissionVal = (emp.salesInvoiced * (emp.commissionPercentage / 100)) + (emp.leadsConverted * 50);
    return {
      commission: Math.round(commissionVal * 10) / 10,
      totalPayroll: Math.round((emp.baseSalary + commissionVal) * 10) / 10
    };
  };

  return (
    <div id="employee_view_container" className="space-y-6 animate-fade-in">
      
      {/* Upper Leaders and trophy ranks section */}
      <div id="employee_ranks_board" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Performance champion */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-xl p-5 shadow-md flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl text-yellow-400">
            <Trophy className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Top Sales Exec</span>
            <h4 className="text-sm font-sans font-bold mt-1 text-white">
              {topSalesRepresentative ? topSalesRepresentative.name : 'Not available'}
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Invoiced Total: <strong className="text-emerald-400 font-mono font-bold">{companyCurrency}{topSalesRepresentative?.salesInvoiced ? topSalesRepresentative.salesInvoiced.toLocaleString() : 0}</strong>
            </p>
          </div>
        </div>

        {/* Lead champions */}
        <div className="bg-gradient-to-br from-teal-900 to-emerald-950 text-white rounded-xl p-5 shadow-md flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider block font-sans">CRM Conversion Hero</span>
            <h4 className="text-sm font-sans font-bold mt-1 text-white">
              {topLeadConverter ? topLeadConverter.name : 'Not available'}
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Leads Won: <strong className="text-teal-300 font-mono font-bold">{topLeadConverter?.leadsConverted || 0} Clients</strong>
            </p>
          </div>
        </div>

        {/* Dynamic statistics summary */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-sans font-bold uppercase tracking-wider block">VoltCharge Workforce</span>
            <h4 className="text-sm font-sans font-bold mt-1 text-slate-900">Personnel & Staff Roles</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Active Headcount: <strong className="text-indigo-600 font-mono font-bold">{employees.length} Members</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Main Staff ledger card */}
      <div id="employees_general_ledger" className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Upper title bar */}
        <div id="employee_bar_header" className="p-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/20">
          <div>
            <h3 className="font-sans font-bold text-slate-950 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Organizational Index & Integrated Payroll System
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">Dynamic performance payouts and commission structures mapped per associate</p>
          </div>

          <button
            id="register_staff_btn"
            onClick={handleAddNew}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Recruit New Associate
          </button>
        </div>

        {/* Table representation for staff details */}
        <div id="employee_table_scroller" className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-sans font-bold text-slate-500 bg-slate-50/50">
                <th className="py-3 px-5">Associate Profile</th>
                <th className="py-3 px-4">Role / Division</th>
                <th className="py-3 px-4 text-center">Invoiced / Won</th>
                <th className="py-3 px-4 text-right">Payroll Base ({companyCurrency})</th>
                <th className="py-3 px-4 text-right">Commissions ({companyCurrency})</th>
                <th className="py-3 px-4 text-right">Total Net Payout</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-800">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    No active employees registered. Click above to add staff associate.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const pricing = calculatePayroll(emp);
                  return (
                    <tr key={emp.id} id={`emp_row_${emp.id}`} className="hover:bg-slate-50/35 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{emp.phone}</div>
                        {emp.username ? (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">
                              @{emp.username}
                            </span>
                            <span className={`text-[8px] font-sans font-extrabold px-1.5 py-0.5 rounded uppercase tracking-widest ${
                              emp.clearanceLevel === 'High' ? 'bg-indigo-100 text-indigo-800' :
                              emp.clearanceLevel === 'Medium' ? 'bg-teal-100 text-teal-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {emp.clearanceLevel || 'Low'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 mt-1 block italic font-medium">No Login Access</span>
                        )}
                      </td>
                      
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                          emp.designation === 'Senior Technician' ? 'bg-orange-50 text-orange-700' :
                          emp.designation === 'Sales Executive' ? 'bg-indigo-50 text-indigo-700' :
                          emp.designation === 'Depot Manager' ? 'bg-teal-50 text-teal-700' : 'bg-slate-50 text-slate-700'
                        }`}>
                          {emp.designation}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center font-mono">
                        <div className="text-[11px] font-bold text-slate-900">{companyCurrency}{emp.salesInvoiced.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-400">Wins: {emp.leadsConverted}</div>
                      </td>

                      <td className="py-4 px-4 text-right font-mono font-semibold">
                        {companyCurrency}{emp.baseSalary.toLocaleString()}
                      </td>

                      <td className="py-4 px-4 text-right font-mono text-emerald-600 font-bold">
                        +{companyCurrency}{pricing.commission.toLocaleString()}
                        <span className="text-[9px] text-slate-400 block font-sans font-normal">Rates: {emp.commissionPercentage}% + Lead Bonus</span>
                      </td>

                      <td className="py-4 px-4 text-right font-mono font-black text-indigo-700 bg-indigo-50/10">
                        {companyCurrency}{pricing.totalPayroll.toLocaleString()}
                        <span className="text-[8px] text-slate-400 block font-normal font-sans">Base + Comm.</span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            title="Edit Associate configurations"
                            onClick={() => handleEdit(emp)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            title="De-register employee record"
                            onClick={() => {
                              if (confirm(`Do you wish to de-register this associate: ${emp.name}?`)) {
                                onDeleteEmployee(emp.id);
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

      {/* Slide Drawer Modal to Enroll Associate & Scheduling Shift */}
      {isFormOpen && (
        <div id="associate_modal_panel" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-slide-left">
            <div>
              <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100">
                <h3 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-500" />
                  {editingEmployee ? 'Adjust Payroll Rules' : 'Enroll New Fleet Associate'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 hover:bg-slate-50 rounded text-slate-500"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {/* Staff Full Name */}
                <div>
                  <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Associate Full Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Liam sterling"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white"
                  />
                </div>

                {/* Contacts channels */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Call Phone Line</label>
                    <input
                      required
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 777-2121"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Work Email</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. lsterling@volt.co"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white"
                    />
                  </div>
                </div>

                {/* Designation Category */}
                <div>
                  <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Designation Category</label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-bold"
                  >
                    <option value="Senior Technician">Senior Technician</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Depot Manager">Depot Manager</option>
                    <option value="Helper">Fulfillment Helper</option>
                    <option value="Office Coordinator">Coordinator / Admin</option>
                  </select>
                </div>

                {/* Base Salary & Commissions dynamics config */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Base Salary Month-rate</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Commissions rate (%)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      max="40"
                      value={commissionPercentage}
                      onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white text-emerald-600 font-bold"
                    />
                  </div>
                </div>

                {/* Credentials & Access Clearance Config */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-3">
                  <span className="text-[10px] text-indigo-650 font-extrabold uppercase tracking-wider block">System Authentication Credentials</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Login Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. lsterling"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Passcode / PIN</label>
                      <input
                        type="password"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Security Clearance Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['High', 'Medium', 'Low'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setClearanceLevel(lvl)}
                          className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                            clearanceLevel === lvl
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {lvl} Level
                        </button>
                      ))}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">Specify system access restrictions for this employee.</span>
                  </div>
                </div>

                {validationError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-sans font-semibold leading-relaxed">
                    ⚠️ {validationError}
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-900/10"
                  >
                    {editingEmployee ? 'Persist Updates' : 'Enlist Associate'}
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
