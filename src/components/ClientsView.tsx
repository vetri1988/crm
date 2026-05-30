import React, { useState, useEffect } from 'react';
import { Client, ServiceReminder, Employee } from '../types';
import { formatDDMMYYYY } from '../utils/date';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Wrench, 
  Battery, 
  ExternalLink, 
  MessageCircle, 
  FileText, 
  AlertTriangle,
  ChevronRight,
  Filter,
  CheckCircle2,
  X,
  MessageSquare,
  Bell,
  Send,
  Printer
} from 'lucide-react';

interface ClientsViewProps {
  clients: Client[];
  reminders: ServiceReminder[];
  employees: Employee[];
  companyCurrency: string;
  companySettings?: any;
  onSaveClient: (client: Client) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onSaveReminder: (reminder: ServiceReminder) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}

export default function ClientsView({
  clients,
  reminders,
  employees,
  companyCurrency,
  companySettings,
  onSaveClient,
  onDeleteClient,
  onSaveReminder,
  onDeleteReminder
}: ClientsViewProps) {
  // Navigation tabs for this view
  const [activeSubTab, setActiveSubTab] = useState<'profiles' | 'reminders'>('profiles');

  // Search and filters
  const [clientSearch, setClientSearch] = useState('');
  const [reminderFilter, setReminderFilter] = useState<'All' | 'Overdue' | 'Scheduled' | 'Completed'>('All');
  const [reminderSearch, setReminderSearch] = useState('');

  // Modals / forms states
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    productDetails: '',
    installationDate: '',
    warrantyExpiration: '',
    lastServiceDate: '',
    notes: ''
  });

  const [editingReminder, setEditingReminder] = useState<ServiceReminder | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    clientId: '',
    type: 'Water Level Top-up' as ServiceReminder['type'],
    dueDate: '',
    status: 'Scheduled' as ServiceReminder['status'],
    notes: ''
  });

  // Client delete confirmation
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  // Reminder delete confirmation
  const [reminderToDelete, setReminderToDelete] = useState<ServiceReminder | null>(null);

  // Communication Composer Modal State
  const [activeCommReminder, setActiveCommReminder] = useState<ServiceReminder | null>(null);
  const [activeCommClient, setActiveCommClient] = useState<Client | null>(null);
  const [commType, setCommType] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [editableBody, setEditableBody] = useState('');
  const [editableSubject, setEditableSubject] = useState('');

  useEffect(() => {
    (window as any).handleClientQuotationShared = async (clientId: string) => {
      const match = clients.find(c => c.id === clientId);
      if (match && match.status !== 'Proposal Sent') {
        await onSaveClient({ ...match, status: 'Proposal Sent' });
      }
    };
    return () => {
      delete (window as any).handleClientQuotationShared;
    };
  }, [clients, onSaveClient]);

  const handlePrintQuotation = (client: Client) => {
    const shareText = `*QUOTATION*
-----------------------------------
*Prepared For*: ${client.name}
*Product / Service*: Proposed service / upgrade for: ${client.productDetails}
*Estimated Cost*: TBD

Thank you for being a valued client. We appreciate the opportunity to offer further services to you. Please contact our support desk to finalize this quotation.

Representative: Client Care Dept.
${companySettings?.companyName || 'GeneralCRM'}`;

    const waLink = `https://wa.me/${client.phone.replace(/[^\d+]/g, '')}?text=${encodeURIComponent(shareText)}`;
    const emailLink = `mailto:${client.email}?subject=${encodeURIComponent('Quotation - ' + (companySettings?.companyName || 'GeneralCRM'))}&body=${encodeURIComponent(shareText)}`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Quotation - ${client.name}</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="p-8 font-sans text-slate-900 bg-slate-50">
            <div class="mb-6 text-center print:hidden text-sm text-slate-600 font-bold bg-indigo-50 border border-indigo-100 p-3 rounded-lg max-w-4xl mx-auto flex items-center justify-center gap-2">
              <span>✏️</span> Click on any text inside the document below to edit it before printing.
            </div>
            <div contenteditable="true" class="max-w-4xl mx-auto p-12 border border-slate-200 shadow-md rounded-lg bg-white outline-none hover:border-indigo-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all cursor-text min-h-[800px]">
              <header class="border-b-2 border-slate-900 pb-8 mb-8 flex justify-between items-end">
                <div>
                  <h1 class="text-4xl font-black uppercase tracking-tighter text-slate-950">${companySettings?.companyName || 'GeneralCRM'}</h1>
                  <p class="text-sm text-slate-600 mt-2 whitespace-pre-wrap">${companySettings?.companyAddress || ''}</p>
                </div>
                <div class="text-right">
                  <h2 class="text-3xl font-bold text-slate-300 uppercase tracking-widest">QUOTATION</h2>
                  <p class="text-sm text-slate-500 mt-2 font-mono">Date: ${formatDDMMYYYY(new Date())}</p>
                </div>
              </header>

              <div class="grid grid-cols-2 gap-12 mb-12">
                <div>
                  <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Prepared For:</h3>
                  <div class="text-lg font-bold text-slate-900">${client.name}</div>
                  <div class="text-sm text-slate-600 mt-1">${client.address || ''}</div>
                  <div class="text-sm text-slate-600 mt-1 flex items-center gap-2">📞 ${client.phone}</div>
                  <div class="text-sm text-slate-600 mt-1 flex items-center gap-2">✉ ${client.email}</div>
                </div>
                <div class="text-right">
                  <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Representative:</h3>
                  <div class="text-sm text-slate-800 font-semibold">Client Care Dept.</div>
                </div>
              </div>

              <table class="w-full text-left mb-12 border-collapse">
                <thead>
                  <tr class="border-b-2 border-slate-900">
                    <th class="py-3 text-xs font-bold uppercase tracking-wider bg-slate-50 pl-3">Product / Service Description</th>
                    <th class="py-3 text-xs font-bold uppercase tracking-wider text-right pr-3 w-48">Estimated Cost</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr>
                    <td class="py-6 text-sm pl-3 text-slate-800 font-medium">Proposed service / upgrade for: ${client.productDetails}</td>
                    <td class="py-6 text-sm text-right font-bold pr-3 text-slate-900">TBD</td>
                  </tr>
                </tbody>
              </table>

              <div class="flex justify-between items-end mt-16 pt-8 border-t border-slate-200">
                <div class="text-sm text-slate-600 italic max-w-sm leading-relaxed border-l-4 border-indigo-500 pl-4">
                  "Thank you for being a valued client. We appreciate the opportunity to offer further services to you. Please contact our support desk to finalize this quotation."
                </div>
                <div class="text-right bg-slate-50 p-6 rounded-xl border border-slate-100">
                   <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Estimated Amount</div>
                   <div class="text-3xl font-black text-indigo-950">TBD</div>
                </div>
              </div>
            </div>
            
            <div class="mt-8 text-center print:hidden flex items-center justify-center gap-4">
              <a href="${waLink}" target="_blank" onclick="if(window.opener) window.opener.handleClientQuotationShared('${client.id}')" class="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-all cursor-pointer">
                Share via WhatsApp
              </a>
              <a href="${emailLink}" target="_blank" onclick="if(window.opener) window.opener.handleClientQuotationShared('${client.id}')" class="px-6 py-3 bg-sky-600 text-white font-bold rounded-xl shadow-md hover:bg-sky-700 transition-all cursor-pointer">
                Share via Email
              </a>
              <button onclick="window.print()" class="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all cursor-pointer border-l-4 border-transparent">
                Print Quotation Document
              </button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Predefined service outreach text templates
  const getOutreachTemplate = (reminder: ServiceReminder, channel: 'whatsapp' | 'email' | 'sms') => {
    const customer = reminder.clientName;
    const taskType = reminder.type;
    const dueDate = reminder.dueDate;
    const notes = reminder.notes || 'routine inspection and evaluation';

    if (channel === 'whatsapp') {
      return {
        subject: '',
        body: `Hello ${customer}, this is a service update from GeneralCRM. You have a scheduled "${taskType}" due on ${dueDate}. Setup notes indicate: "${notes}". Please let us know if this timing fits your schedule or if we should coordinate another interval. Best regards!`
      };
    } else if (channel === 'sms') {
      return {
        subject: '',
        body: `Hello ${customer}, GeneralCRM alert: Scheduled "${taskType}" is due on ${dueDate}. We will connect shortly to run this setup. Direct queries to this terminal. Best regards!`
      };
    } else {
      return {
        subject: `Upcoming Item Service Reminder - ${taskType}`,
        body: `Dear ${customer},\n\nThis is a scheduled notification regarding your registered item solutions.\n\nOur database indicates that a "${taskType}" is marked for attention on: ${dueDate}.\n\nAdditional notes on project specs:\n"${notes}"\n\nPlease let us know your availability so we can assign an installation engineer to your location.\n\nWarm regards,\nService & Care Office\nGeneralCRM`
      };
    }
  };

  // Predefined client proactive maintenance templates
  const getClientOutreachTemplate = (client: Client, channel: 'whatsapp' | 'email' | 'sms') => {
    const customer = client.name;
    const item = client.productDetails || 'Standard battery setup';
    const lastService = client.lastServiceDate || 'recent months';

    if (channel === 'whatsapp') {
      return {
        subject: '',
        body: `Hello ${customer}, hope you are doing well! This is a proactive check-in regarding your "${item}" battery setup. Standard diagnostics were conducted on ${lastService}. Please let us know if there are any current backup issues, gravity changes, or water level top-ups needed. Best regards!`
      };
    } else if (channel === 'sms') {
      return {
        subject: '',
        body: `Hello ${customer}, hope your backup is running great. Proactive care reminder for your "${item}". Dial back to schedule routine service topping or inspection. Thanks!`
      };
    } else {
      return {
        subject: `Proactive Item Care & Maintenance Support for ${customer}`,
        body: `Dear ${customer},\n\nWe hope your backup systems and equipment are performing optimally.\n\nThis is a friendly follow-up regarding your "${item}" installed at your site.\n\nAccording to our logs, your system was last serviced on ${lastService}.\n\nTo ensure maximum life cycle of your items and system, we recommend regular maintenance checkpoints.\n\nIf you would like to schedule a technician visit or have any physical maintenance queries, please reply directly or call our care support desk.\n\nWarm regards,\nClient Care & Maintenance Center\nVoltCRM Solutions`
      };
    }
  };

  // Check warranty status helper
  const getWarrantyInfo = (expirationDate: string) => {
    if (!expirationDate) return { label: 'No Warranty', color: 'bg-slate-100 text-slate-600 border-slate-150' };
    const exp = new Date(expirationDate);
    const now = new Date();
    if (exp < now) {
      return { label: `Expired on ${expirationDate}`, color: 'bg-red-100 text-red-600 border-red-200' };
    }
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 90) {
      return { label: `Expires soon: ${diffDays} days left`, color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: `Active till ${expirationDate}`, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  };

  // Filter clients
  const filteredClients = clients.filter(c => {
    const term = clientSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.productDetails.toLowerCase().includes(term) ||
      c.notes.toLowerCase().includes(term)
    );
  });

  // Filter reminders
  const filteredReminders = reminders.filter(r => {
    const term = reminderSearch.toLowerCase();
    const searchMatch = (
      r.clientName.toLowerCase().includes(term) ||
      r.type.toLowerCase().includes(term) ||
      r.notes.toLowerCase().includes(term) ||
      r.clientPhone.toLowerCase().includes(term)
    );

    if (reminderFilter === 'All') return searchMatch;
    return searchMatch && r.status === reminderFilter;
  });

  // Manage client action triggers
  const handleAddNewClient = () => {
    setEditingClient(null);
    setClientForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      productDetails: '',
      installationDate: new Date().toISOString().split('T')[0],
      warrantyExpiration: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 years standard
      lastServiceDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      productDetails: client.productDetails || '',
      installationDate: client.installationDate || '',
      warrantyExpiration: client.warrantyExpiration || '',
      lastServiceDate: client.lastServiceDate || '',
      notes: client.notes || ''
    });
    setIsClientModalOpen(true);
  };

  const handleSaveClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name.trim() || !clientForm.phone.trim()) return;

    const record: Client = {
      ...(editingClient || { id: `client_${Date.now()}` }),
      name: clientForm.name.trim(),
      phone: clientForm.phone.trim(),
      email: clientForm.email.trim(),
      address: clientForm.address.trim(),
      productDetails: clientForm.productDetails.trim(),
      installationDate: clientForm.installationDate,
      warrantyExpiration: clientForm.warrantyExpiration,
      lastServiceDate: clientForm.lastServiceDate,
      notes: clientForm.notes.trim()
    };

    await onSaveClient(record);
    setIsClientModalOpen(false);
  };

  // Manage reminder action triggers
  const handleCreateReminderForClient = (client: Client) => {
    setEditingReminder(null);
    setReminderForm({
      clientId: client.id,
      type: 'Water Level Top-up',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days prompt
      status: 'Scheduled',
      notes: 'Monthly checklist distilled water replenishment and verification of cell gravity.'
    });
    setIsReminderModalOpen(true);
  };

  const handleEditReminder = (rem: ServiceReminder) => {
    setEditingReminder(rem);
    setReminderForm({
      clientId: rem.clientId || '',
      type: rem.type || 'Water Level Top-up',
      dueDate: rem.dueDate || '',
      status: rem.status || 'Scheduled',
      notes: rem.notes || ''
    });
    setIsReminderModalOpen(true);
  };

  const handleSaveReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderForm.clientId || !reminderForm.dueDate) return;

    const associatedClient = clients.find(c => c.id === reminderForm.clientId);
    if (!associatedClient) return;

    const record: ServiceReminder = {
      ...(editingReminder || { id: `rem_${Date.now()}` }),
      clientId: reminderForm.clientId,
      clientName: associatedClient.name,
      clientPhone: associatedClient.phone,
      type: reminderForm.type,
      dueDate: reminderForm.dueDate,
      status: reminderForm.status,
      notes: reminderForm.notes.trim()
    };

    await onSaveReminder(record);
    setIsReminderModalOpen(false);
  };

  const handleDirectCompleteReminder = async (rem: ServiceReminder) => {
    const updated: ServiceReminder = {
      ...rem,
      status: 'Completed'
    };
    await onSaveReminder(updated);

    // Also update associated client's last service date to today
    const associatedClient = clients.find(c => c.id === rem.clientId);
    if (associatedClient) {
      const updatedClient: Client = {
        ...associatedClient,
        lastServiceDate: new Date().toISOString().split('T')[0]
      };
      await onSaveClient(updatedClient);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Navigation Row with search box & interactive controls */}
      <div id="clients_header_row" className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="space-y-1">
          <h1 className="font-sans font-bold text-slate-800 text-base flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-500" />
            Client Care & Maintenance Center
          </h1>
          <p className="text-xs text-slate-500 font-sans">
            Track battery installations, check passive warranties, and schedule diagnostic service top-ups.
          </p>
        </div>
        <button
          onClick={handleAddNewClient}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-sans py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-950/15 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Client Profile
        </button>
      </div>

      {/* Internal Nav bar Tab toggles */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveSubTab('profiles')}
          className={`pb-2.5 px-4 text-xs font-bold font-sans relative transition-all cursor-pointer ${
            activeSubTab === 'profiles' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Registered Client Profiles ({clients.length})
        </button>
        <button
          onClick={() => setActiveSubTab('reminders')}
          className={`pb-2.5 px-4 text-xs font-bold font-sans relative transition-all cursor-pointer ${
            activeSubTab === 'reminders' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Service Routines & Alarms ({reminders.length})
        </button>
      </div>

      {/* Main Panel views */}
      {activeSubTab === 'profiles' ? (
        <div className="space-y-4">
          
          {/* Filters Row */}
          <div className="bg-slate-50/65 rounded-xl border border-slate-150 p-3 flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search clients by name, email, phone, capacity or notes..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full bg-transparent border-none text-xs focus:outline-none focus:ring-0 text-slate-700 font-sans placeholder-slate-400"
            />
            {clientSearch && (
              <button onClick={() => setClientSearch('')} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            )}
          </div>

          {/* Grid Layout of Clients */}
          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 font-sans text-xs">
              <Battery className="w-8 h-8 text-slate-350 mx-auto mb-2 animate-bounce" />
              No matching client profiles registered. Feel free to catalog your first client profile!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClients.map((client) => {
                const warranty = getWarrantyInfo(client.warrantyExpiration);
                const isExpired = client.warrantyExpiration ? new Date(client.warrantyExpiration) < new Date() : false;
                const clientReminders = reminders.filter(r => r.clientId === client.id && r.status !== 'Completed');
                
                return (
                  <div key={client.id} className={`bg-white rounded-2xl border ${isExpired ? 'border-red-300' : 'border-slate-100'} hover:border-indigo-100 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative overflow-hidden`}>
                    
                    <div className="space-y-3">
                      {/* Title & Warranty Badge */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
                        <div>
                          <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            {client.name}
                            {client.status === 'Proposal Sent' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 font-bold ml-2 border border-sky-100">Proposal Sent</span>
                            )}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-sans mt-0.5 block">Client ID: {client.id}</span>
                        </div>
                        <span className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded border ${warranty.color}`}>
                          {warranty.label}
                        </span>
                      </div>

                      {/* Client Demographics & Specs fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{client.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{client.address || 'No physical address configured'}</span>
                        </div>
                      </div>

                      {/* Technical specifications specs summary */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-sans text-slate-700">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">Item Equipment Installed</span>
                          <span className="font-semibold text-slate-900 mt-0.5 inline-block">{client.productDetails || 'Standard capacity cells'}</span>
                        </div>
                        <div className="text-right border-l border-slate-200 pl-3 shrink-0">
                          <span className="text-[9px] text-slate-400 block uppercase">Last Serviced</span>
                          <span className="font-mono text-slate-700 text-xs">{client.lastServiceDate ? formatDDMMYYYY(client.lastServiceDate) : 'N/A'}</span>
                        </div>
                      </div>

                      {/* Custom notes */}
                      {client.notes && (
                        <p className="text-[11px] text-slate-500 leading-relaxed font-sans italic border-l-2 border-indigo-200 pl-2">
                          &ldquo;{client.notes}&rdquo;
                        </p>
                      )}

                      {/* Attached upcoming service alarms */}
                      {clientReminders.length > 0 && (
                        <div className="mt-2 text-[10px] bg-amber-50/50 border border-amber-100 rounded-lg p-2 flex items-center justify-between text-amber-800">
                          <span className="font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                            {clientReminders.length} pending service alarm(s)
                          </span>
                          <span className="font-mono">Next: {formatDDMMYYYY(clientReminders[0].dueDate)}</span>
                        </div>
                      )}

                      {/* Direct Outreach Channels */}
                      <div className="pt-2.5 border-t border-slate-100/70 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400 font-sans uppercase tracking-tight">Direct outreach:</span>
                        <div className="flex gap-1">
                          <button
                            title="Proactive WhatsApp notification outreach"
                            onClick={() => {
                              setActiveCommClient(client);
                              setCommType('whatsapp');
                              const temp = getClientOutreachTemplate(client, 'whatsapp');
                              setEditableBody(temp.body);
                              setEditableSubject(temp.subject);
                            }}
                            className="p-1 px-2 rounded text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 transition-all cursor-pointer flex items-center gap-0.5"
                          >
                            <MessageCircle className="w-3 h-3" /> WA
                          </button>
                          <button
                            title="Proactive SMS Text outreach"
                            onClick={() => {
                              setActiveCommClient(client);
                              setCommType('sms');
                              const temp = getClientOutreachTemplate(client, 'sms');
                              setEditableBody(temp.body);
                              setEditableSubject(temp.subject);
                            }}
                            className="p-1 px-2 rounded text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-150 transition-all cursor-pointer flex items-center gap-0.5"
                          >
                            <MessageSquare className="w-3 h-3" /> SMS
                          </button>
                          <button
                            title="Proactive Email outreach"
                            onClick={() => {
                              setActiveCommClient(client);
                              setCommType('email');
                              const temp = getClientOutreachTemplate(client, 'email');
                              setEditableBody(temp.body);
                              setEditableSubject(temp.subject);
                            }}
                            className="p-1 px-2 rounded text-[10px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-150 transition-all cursor-pointer flex items-center gap-0.5"
                          >
                            <Mail className="w-3 h-3" /> Mail
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actionable buttons */}
                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleCreateReminderForClient(client)}
                        className="p-1 px-2.5 rounded text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Plus className="w-3 h-3" /> Schedule Alarm
                      </button>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handlePrintQuotation(client)}
                          className="p-1 px-2.5 rounded text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Quotation
                        </button>
                        <button
                          onClick={() => handleEditClient(client)}
                          className="p-1 px-2.5 rounded text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Profile
                        </button>
                        <button
                          onClick={() => setClientToDelete(client)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Sub-filtering headers */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-xs justify-between">
            <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search service tasks by client name, notes..."
                value={reminderSearch}
                onChange={(e) => setReminderSearch(e.target.value)}
                className="w-full bg-transparent border-none text-xs focus:outline-none focus:ring-0 text-slate-700 placeholder-slate-400 font-sans"
              />
            </div>

            <div className="flex items-center gap-1 border border-slate-150 p-1 rounded-xl bg-slate-50">
              {(['All', 'Overdue', 'Scheduled', 'Completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setReminderFilter(filter)}
                  className={`px-3 py-1 cursor-pointer text-xs font-semibold rounded-lg font-sans transition-all ${
                    reminderFilter === filter 
                      ? 'bg-white text-indigo-750 shadow-xs border border-indigo-100' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* List of Reminders */}
          {filteredReminders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 font-sans text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/75 mx-auto mb-2" />
              No pending service alarms match the selected filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReminders.map((rem) => {
                const isOverdue = rem.status === 'Overdue';
                const isCompleted = rem.status === 'Completed';
                
                return (
                  <div key={rem.id} className={`bg-white rounded-2xl border p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden ${
                    isOverdue 
                      ? 'border-rose-100 bg-rose-50/10 hover:border-rose-200' 
                      : isCompleted
                        ? 'border-slate-100 bg-slate-50/50 opacity-80'
                        : 'border-slate-100 hover:border-indigo-100'
                  }`}>
                    
                    <div className="space-y-2 flex-1 max-w-2xl">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isOverdue ? 'bg-rose-100 text-rose-700' :
                          isCompleted ? 'bg-slate-200 text-slate-650' :
                          'bg-indigo-100 text-indigo-750'
                        }`}>
                          {rem.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-tight">
                          {rem.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Due Date: {formatDDMMYYYY(rem.dueDate)}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-sans font-bold text-slate-900 text-xs">
                          {rem.clientName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-sans block mt-0.5">Phone Contact: <span className="font-mono text-slate-700">{rem.clientPhone}</span></span>
                      </div>

                      {rem.notes && (
                        <p className="text-[11px] text-slate-600 font-sans italic p-2 bg-slate-50/70 border border-slate-100 rounded-lg">
                          &ldquo;{rem.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Left Actions */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      
                      {/* Outreach Template Button */}
                      {!isCompleted && (
                        <div className="flex gap-1">
                          <button
                            title="Open WhatsApp notification outreach"
                            onClick={() => {
                              setActiveCommReminder(rem);
                              setCommType('whatsapp');
                              const temp = getOutreachTemplate(rem, 'whatsapp');
                              setEditableBody(temp.body);
                              setEditableSubject(temp.subject);
                            }}
                            className="p-1 px-2 rounded-lg text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-0.5 border border-emerald-150 transition-all cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3" /> WA
                          </button>
                          <button
                            title="Send SMS"
                            onClick={() => {
                              setActiveCommReminder(rem);
                              setCommType('sms');
                              const temp = getOutreachTemplate(rem, 'sms');
                              setEditableBody(temp.body);
                              setEditableSubject(temp.subject);
                            }}
                            className="p-1 px-2 rounded-lg text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 flex items-center gap-0.5 border border-amber-150 transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" /> SMS
                          </button>
                          <button
                            title="Send Email"
                            onClick={() => {
                              setActiveCommReminder(rem);
                              setCommType('email');
                              const temp = getOutreachTemplate(rem, 'email');
                              setEditableBody(temp.body);
                              setEditableSubject(temp.subject);
                            }}
                            className="p-1 px-2 rounded-lg text-[10px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 flex items-center gap-0.5 border border-blue-150 transition-all cursor-pointer"
                          >
                            <Mail className="w-3 h-3" /> Mail
                          </button>
                        </div>
                      )}

                      {/* Complete status */}
                      {!isCompleted ? (
                        <button
                          onClick={() => handleDirectCompleteReminder(rem)}
                          className="p-1 px-2.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm border border-indigo-700/10 flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Resolve Task
                        </button>
                      ) : (
                        <span className="text-[11px] font-sans font-semibold text-slate-400 flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg border border-slate-150">
                          ✓ Resolved Service
                        </span>
                      )}

                      <div className="flex border-l border-slate-100 pl-2">
                        <button
                          onClick={() => handleEditReminder(rem)}
                          title="Edit Task Details"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setReminderToDelete(rem)}
                          title="Delete Service Task"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* MODAL 1: Add/Edit Client Dialog */}
      {isClientModalOpen && (
        <div id="client_modal_overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div id="client_modal_card" className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl relative overflow-hidden animate-fade-in text-left">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600"></div>
            
            <form onSubmit={handleSaveClientSubmit} className="p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4.5 h-4.5 text-indigo-500" />
                  {editingClient ? 'Update Customer Profile' : 'Enroll New Customer Client'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                
                {/* Visual Name Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Customer Client Name *</label>
                    <input
                      required
                      type="text"
                      value={clientForm.name}
                      onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Contact Phone Mobile *</label>
                    <input
                      required
                      type="text"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Email Coordinates</label>
                    <input
                      type="email"
                      value={clientForm.email}
                      onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                      placeholder="e.g. customer@domain.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Product Installed (Details)</label>
                    <input
                      type="text"
                      value={clientForm.productDetails}
                      onChange={(e) => setClientForm({ ...clientForm, productDetails: e.target.value })}
                      placeholder="e.g. Exide Tubular 150Ah + Wave HUPS"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Physical Site Address</label>
                  <textarea
                    rows={2}
                    value={clientForm.address}
                    onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                    placeholder="Provide detailed residence or office delivery coordinates"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-sans font-bold text-slate-500 mb-1">Installation Date</label>
                    <input
                      type="date"
                      value={clientForm.installationDate}
                      onChange={(e) => setClientForm({ ...clientForm, installationDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-sans font-bold text-slate-500 mb-1">Warranty Expiry</label>
                    <input
                      type="date"
                      value={clientForm.warrantyExpiration}
                      onChange={(e) => setClientForm({ ...clientForm, warrantyExpiration: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-sans font-bold text-slate-500 mb-1">Last Service Visit</label>
                    <input
                      type="date"
                      value={clientForm.lastServiceDate}
                      onChange={(e) => setClientForm({ ...clientForm, lastServiceDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Administrative Service Notes</label>
                  <textarea
                    rows={2}
                    value={clientForm.notes}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                    placeholder="Specific battery brand parameters, cell replacement history, gravity comments..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-xs font-sans text-center"
                >
                  Clear & Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-950/10 text-xs font-sans text-center"
                >
                  Save Profile
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add/Edit Service Reminder Alarm Dialog */}
      {isReminderModalOpen && (
        <div id="reminder_modal_overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div id="reminder_modal_card" className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl relative overflow-hidden animate-fade-in text-left">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500"></div>
            
            <form onSubmit={handleSaveReminderSubmit} className="p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5 text-amber-500" />
                  {editingReminder ? 'Modulate Scheduled Service' : 'Schedule New Item Service Routine'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                
                <div>
                  <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Target Client Profile</label>
                  <select
                    disabled={!!editingReminder}
                    value={reminderForm.clientId}
                    onChange={(e) => setReminderForm({ ...reminderForm, clientId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-sans focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="">-- Choose registered customer --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Task Category</label>
                    <select
                      value={reminderForm.type}
                      onChange={(e) => setReminderForm({ ...reminderForm, type: e.target.value as ServiceReminder['type'] })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-sans cursor-pointer focus:outline-none"
                    >
                      <option value="Water Level Top-up">Water Level Top-up</option>
                      <option value="Terminal Cleaning">Terminal Cleaning</option>
                      <option value="Maintenance Check">Maintenance Check</option>
                      <option value="General Health Check">General Health Check</option>
                      <option value="Replacement Due">Replacement Due</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Service Target Date</label>
                    <input
                      required
                      type="date"
                      value={reminderForm.dueDate}
                      onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Current State</label>
                    <select
                      value={reminderForm.status}
                      onChange={(e) => setReminderForm({ ...reminderForm, status: e.target.value as ServiceReminder['status'] })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-sans cursor-pointer focus:outline-none"
                    >
                      <option value="Scheduled">Scheduled (Upcoming)</option>
                      <option value="Overdue">Overdue (Delayed)</option>
                      <option value="Completed">Completed (Resolved)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Instructions / Specific Tasks</label>
                  <textarea
                    rows={3}
                    value={reminderForm.notes}
                    onChange={(e) => setReminderForm({ ...reminderForm, notes: e.target.value })}
                    placeholder="Enter instructions, e.g., inspect safety terminals, measure specific gravity, fill electrolyte water up to standard marking level..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-sans focus:outline-none"
                  />
                </div>

              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-xs font-sans text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-amber-950/10 text-xs font-sans text-center"
                >
                  Save Task
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Client Delete Confirmation */}
      {clientToDelete && (
        <div id="delete_client_overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div id="delete_client_card" className="bg-white w-full max-w-sm rounded-2xl border border-slate-100 shadow-2xl relative overflow-hidden text-left animate-fade-in">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-600"></div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 text-rose-650 rounded-xl shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-sm">Delete Client Profile</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Are you completely sure you want to remove this client record?</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/55 text-xs text-slate-700">
                <p className="font-bold text-slate-900">{clientToDelete.name}</p>
                <p className="text-slate-500 mt-0.5 font-mono">{clientToDelete.phone}</p>
              </div>

              <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed">
                ⚠️ CONFIRMATION: Deleting this profile also purges all associated upcoming checkups and service alarms. This operation is permanent and database-validated.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setClientToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-lg text-xs"
                >
                  No, Retain
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteClient(clientToDelete.id);
                    setClientToDelete(null);
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg text-xs shadow-sm cursor-pointer"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Reminder Delete Confirmation */}
      {reminderToDelete && (
        <div id="delete_reminder_overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div id="delete_reminder_card" className="bg-white w-full max-w-sm rounded-2xl border border-slate-100 shadow-2xl relative overflow-hidden text-left animate-fade-in">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-600"></div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 text-rose-650 rounded-xl shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-sm">Delete Service Alarm</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Are you sure you want to cancel this service reminder?</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-750">
                <p className="font-bold text-slate-800">{reminderToDelete.type}</p>
                <p className="text-slate-505 text-slate-500 font-mono mt-0.5">Customer: {reminderToDelete.clientName} (Due: {formatDDMMYYYY(reminderToDelete.dueDate)})</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReminderToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-2 rounded-lg text-xs font-sans text-center"
                >
                  No, Keep Task
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteReminder(reminderToDelete.id);
                    setReminderToDelete(null);
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg text-xs cursor-pointer"
                >
                  Yes, Purge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Service Outreach Template Composer */}
      {activeCommReminder && (
        <div id="comm_reminder_overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div id="comm_reminder_card" className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl relative overflow-hidden animate-fade-in text-left">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600"></div>
            
            <div className="p-5 md:p-6 space-y-4">
              
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-500" />
                    Service Communication Outreach
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Service reminder: <strong>{activeCommReminder.type}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setActiveCommReminder(null)}
                  className="text-slate-400 hover:text-slate-600 font-sans text-xs font-bold uppercase p-1 hover:bg-slate-50 rounded"
                >
                  ✕
                </button>
              </div>

              {/* Channel Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setCommType('whatsapp');
                    const temp = getOutreachTemplate(activeCommReminder, 'whatsapp');
                    setEditableBody(temp.body);
                    setEditableSubject(temp.subject);
                  }}
                  className={`py-2 text-[11px] font-bold font-sans rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    commType === 'whatsapp' 
                      ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100/50' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/30'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCommType('sms');
                    const temp = getOutreachTemplate(activeCommReminder, 'sms');
                    setEditableBody(temp.body);
                    setEditableSubject(temp.subject);
                  }}
                  className={`py-2 text-[11px] font-bold font-sans rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    commType === 'sms' 
                      ? 'bg-white text-amber-700 shadow-sm border border-rose-100/30' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/30'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>SMS/Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCommType('email');
                    const temp = getOutreachTemplate(activeCommReminder, 'email');
                    setEditableBody(temp.body);
                    setEditableSubject(temp.subject);
                  }}
                  className={`py-2 text-[11px] font-bold font-sans rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    commType === 'email' 
                      ? 'bg-white text-blue-700 shadow-sm border border-blue-100/50' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/30'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
              </div>

              {/* Recipient Details */}
              <div className="bg-slate-50/60 border border-slate-100/60 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient Name:</span>
                  <span className="font-semibold text-slate-800">{activeCommReminder.clientName}</span>
                </div>
                {commType === 'email' ? (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recipient Email Address:</span>
                    <span className="font-mono text-slate-700 font-semibold">{clients.find(c => c.id === activeCommReminder.clientId)?.email || 'customer@domain.com'}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mobile Contact:</span>
                    <span className="font-mono text-slate-700 font-semibold">{activeCommReminder.clientPhone}</span>
                  </div>
                )}
              </div>

              {/* Form Input fields */}
              <div className="space-y-3">
                {commType === 'email' && (
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Subject Header</label>
                    <input
                      type="text"
                      value={editableSubject}
                      onChange={(e) => setEditableSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-800 font-sans"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-sans font-bold text-slate-500 font-medium">Outreach Text Body</label>
                    <button
                      type="button"
                      onClick={() => {
                        const temp = getOutreachTemplate(activeCommReminder, commType);
                        setEditableBody(temp.body);
                        setEditableSubject(temp.subject);
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      Reset template
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={editableBody}
                    onChange={(e) => setEditableBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 font-sans text-slate-705 leading-relaxed text-slate-700"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveCommReminder(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-sans text-xs font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                {commType === 'whatsapp' ? (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(activeCommReminder.clientPhone)}&text=${encodeURIComponent(editableBody)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setActiveCommReminder(null)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 text-center cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open WhatsApp
                  </a>
                ) : commType === 'sms' ? (
                  <a
                    href={`sms:${encodeURIComponent(activeCommReminder.clientPhone.replace(/[^\d+]/g, ''))}?body=${encodeURIComponent(editableBody)}`}
                    onClick={() => setActiveCommReminder(null)}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 text-center cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Send SMS Text
                  </a>
                ) : (
                  <a
                    href={`mailto:${encodeURIComponent(clients.find(c => c.id === activeCommReminder.clientId)?.email || '')}?subject=${encodeURIComponent(editableSubject)}&body=${encodeURIComponent(editableBody)}`}
                    onClick={() => setActiveCommReminder(null)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 text-center cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Email App
                  </a>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Client Direct Proactive Care Template Composer */}
      {activeCommClient && (
        <div id="comm_client_overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div id="comm_client_card" className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl relative overflow-hidden animate-fade-in text-left">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600"></div>
            
            <div className="p-5 md:p-6 space-y-4">
              
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-500" />
                    Proactive Customer Care Outreach
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Client: <strong>{activeCommClient.name}</strong> • Product: {activeCommClient.productDetails || 'Standard capacity cells'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveCommClient(null)}
                  className="text-slate-400 hover:text-slate-600 font-sans text-xs font-bold uppercase p-1 hover:bg-slate-50 rounded"
                >
                  ✕
                </button>
              </div>

              {/* Channel Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setCommType('whatsapp');
                    const temp = getClientOutreachTemplate(activeCommClient, 'whatsapp');
                    setEditableBody(temp.body);
                    setEditableSubject(temp.subject);
                  }}
                  className={`py-2 text-[11px] font-bold font-sans rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    commType === 'whatsapp' 
                      ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100/50' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/30'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCommType('sms');
                    const temp = getClientOutreachTemplate(activeCommClient, 'sms');
                    setEditableBody(temp.body);
                    setEditableSubject(temp.subject);
                  }}
                  className={`py-2 text-[11px] font-bold font-sans rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    commType === 'sms' 
                      ? 'bg-white text-amber-700 shadow-sm border border-rose-100/30' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/30'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>SMS/Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCommType('email');
                    const temp = getClientOutreachTemplate(activeCommClient, 'email');
                    setEditableBody(temp.body);
                    setEditableSubject(temp.subject);
                  }}
                  className={`py-2 text-[11px] font-bold font-sans rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    commType === 'email' 
                      ? 'bg-white text-blue-700 shadow-sm border border-blue-100/50' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/30'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
              </div>

              {/* Recipient Details */}
              <div className="bg-slate-50/60 border border-slate-100/60 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient Name:</span>
                  <span className="font-semibold text-slate-800">{activeCommClient.name}</span>
                </div>
                {commType === 'email' ? (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recipient Email Address:</span>
                    <span className="font-mono text-slate-700 font-semibold">{activeCommClient.email || 'customer@domain.com'}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mobile Contact:</span>
                    <span className="font-mono text-slate-700 font-semibold">{activeCommClient.phone}</span>
                  </div>
                )}
              </div>

              {/* Form Input fields */}
              <div className="space-y-3">
                {commType === 'email' && (
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-slate-500 mb-1">Subject Header</label>
                    <input
                      type="text"
                      value={editableSubject}
                      onChange={(e) => setEditableSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-800 font-sans"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-sans font-bold text-slate-500 font-medium">Outreach Text Body</label>
                    <button
                      type="button"
                      onClick={() => {
                        const temp = getClientOutreachTemplate(activeCommClient, commType);
                        setEditableBody(temp.body);
                        setEditableSubject(temp.subject);
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      Reset template
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={editableBody}
                    onChange={(e) => setEditableBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 font-sans text-slate-700 leading-relaxed text-slate-700"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveCommClient(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-sans text-xs font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                {commType === 'whatsapp' ? (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(activeCommClient.phone)}&text=${encodeURIComponent(editableBody)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setActiveCommClient(null)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 text-center cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open WhatsApp
                  </a>
                ) : commType === 'sms' ? (
                  <a
                    href={`sms:${encodeURIComponent(activeCommClient.phone.replace(/[^\d+]/g, ''))}?body=${encodeURIComponent(editableBody)}`}
                    onClick={() => setActiveCommClient(null)}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 text-center cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Send SMS Text
                  </a>
                ) : (
                  <a
                    href={`mailto:${encodeURIComponent(activeCommClient.email || '')}?subject=${encodeURIComponent(editableSubject)}&body=${encodeURIComponent(editableBody)}`}
                    onClick={() => setActiveCommClient(null)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 text-center cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Email App
                  </a>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
