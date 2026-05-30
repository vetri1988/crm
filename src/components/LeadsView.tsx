/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Lead, LeadStatus, Employee } from '../types';
import { formatDDMMYYYY } from '../utils/date';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Sparkles, 
  UserPlus, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  MessageSquare,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Inbox,
  Send,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  Printer
} from 'lucide-react';

interface LeadsViewProps {
  leads: Lead[];
  employees: Employee[];
  companyCurrency: string;
  companySettings?: any;
  onSaveLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onNavigateToCheckout: (leadPreset: any) => void;
}

export default function LeadsView({ leads, employees, companyCurrency, companySettings, onSaveLead, onDeleteLead, onNavigateToCheckout }: LeadsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form Field parameters
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('Website');
  const [productInterest, setProductInterest] = useState('Premium Specification Package');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [estimatedValue, setEstimatedValue] = useState(400);
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  // Communication modal state
  const [activeCommLead, setActiveCommLead] = useState<Lead | null>(null);
  const [commType, setCommType] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [editableBody, setEditableBody] = useState('');
  const [editableSubject, setEditableSubject] = useState('');

  // Delete confirmation modal state
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  useEffect(() => {
    (window as any).handleLeadQuotationShared = (leadId: string) => {
      const match = leads.find(l => l.id === leadId);
      if (match && match.status !== 'Proposal Sent') {
        onSaveLead({ ...match, status: 'Proposal Sent' });
      }
    };
    return () => {
      delete (window as any).handleLeadQuotationShared;
    };
  }, [leads, onSaveLead]);

  const handlePrintQuotation = (lead: Lead) => {
    const shareText = `*QUOTATION*
-----------------------------------
*Prepared For*: ${lead.customerName}
*Product / Service*: ${lead.productInterest}
*Estimated Cost*: ${companyCurrency}${lead.estimatedValue.toLocaleString()}

Thank you for considering our services. We value the opportunity to provide you with this quotation. Please note that this is an estimate and is subject to final confirmation upon detailed technical assessment.

Representative: ${lead.assignedTo || 'Office Coordinator'}
${companySettings?.companyName || 'GeneralCRM'}`;

    const waLink = `https://wa.me/${lead.phone.replace(/[^\d+]/g, '')}?text=${encodeURIComponent(shareText)}`;
    const emailLink = `mailto:${lead.email}?subject=${encodeURIComponent('Quotation - ' + (companySettings?.companyName || 'GeneralCRM'))}&body=${encodeURIComponent(shareText)}`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Quotation - ${lead.customerName}</title>
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
                  <div class="text-lg font-bold text-slate-900">${lead.customerName}</div>
                  <div class="text-sm text-slate-600 mt-1 flex items-center gap-2">📞 ${lead.phone}</div>
                  <div class="text-sm text-slate-600 mt-1 flex items-center gap-2">✉ ${lead.email}</div>
                </div>
                <div class="text-right">
                  <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Representative:</h3>
                  <div class="text-sm text-slate-800 font-semibold">${lead.assignedTo || 'Office Coordinator'}</div>
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
                    <td class="py-6 text-sm pl-3 text-slate-800 font-medium">${lead.productInterest}</td>
                    <td class="py-6 text-sm text-right font-bold pr-3 text-slate-900">${companyCurrency}${lead.estimatedValue.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div class="flex justify-between items-end mt-16 pt-8 border-t border-slate-200">
                <div class="text-sm text-slate-600 italic max-w-sm leading-relaxed border-l-4 border-indigo-500 pl-4">
                  "Thank you for considering our services. We value the opportunity to provide you with this quotation. Please note that this is an estimate and is subject to final confirmation upon detailed technical assessment."
                </div>
                <div class="text-right bg-slate-50 p-6 rounded-xl border border-slate-100">
                   <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Estimated Amount</div>
                   <div class="text-3xl font-black text-indigo-950">${companyCurrency}${lead.estimatedValue.toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div class="mt-8 text-center print:hidden flex items-center justify-center gap-4">
              <a href="${waLink}" target="_blank" onclick="if(window.opener) window.opener.handleLeadQuotationShared('${lead.id}')" class="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-all cursor-pointer">
                Share via WhatsApp
              </a>
              <a href="${emailLink}" target="_blank" onclick="if(window.opener) window.opener.handleLeadQuotationShared('${lead.id}')" class="px-6 py-3 bg-sky-600 text-white font-bold rounded-xl shadow-md hover:bg-sky-700 transition-all cursor-pointer">
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

  const getPredefinedTemplates = (lead: Lead, type: 'whatsapp' | 'email' | 'sms') => {
    const customer = lead.customerName;
    const product = lead.productInterest || 'Premium Specification Package';
    const rep = lead.assignedTo || 'Office Representative';
    const stage = lead.status;

    let subject = '';
    let body = '';

    if (type === 'whatsapp') {
      switch (stage) {
        case 'New':
          body = `Hello ${customer}, this is ${rep} from GeneralCRM. Thank you for your inquiry about our "${product}". We have received your request and would love to connect to discuss details at your earliest convenience. Please let us know a convenient time to chat. Best regards!`;
          break;
        case 'Contacted':
          body = `Hi ${customer}, this is ${rep} from GeneralCRM. It was great speaking with you earlier regarding your interest in the "${product}". I am summarizing our notes and will follow up shortly. Feel free to reply here if you have any questions!`;
          break;
        case 'Under Discussion':
          body = `Hello ${customer}, this is ${rep} from GeneralCRM. I'm following up on our ongoing discussion regarding your requirements for "${product}". We want to ensure we align our specs perfectly to your needs. Please let me know if we should hop on a brief call. Thank you!`;
          break;
        case 'Proposal Sent':
          body = `Hello ${customer}, this is ${rep} from GeneralCRM. I hope you've had a chance to look over the custom proposal we sent for the "${product}" setup. We are super excited to partner with you. Let me know if you would like to clarify any of the terms inside. Have a wonderful day!`;
          break;
        case 'Won':
          body = `Dear ${customer}, this is ${rep} from GeneralCRM. Thank you so much for choosing us! We have marked your inquiry for "${product}" as successfully won and are preparing the final installation/invoicing parameters. Welcome onboard!`;
          break;
        case 'Lost':
          body = `Hello ${customer}, this is ${rep} from GeneralCRM. We completely understand that now might not be the right project timeline for "${product}". We highly appreciate your consideration and hope we can assist you in future trials. Wishing you the absolute best!`;
          default:
          body = `Hello ${customer}, this is ${rep} from GeneralCRM. Thank you for connecting with us regarding "${product}". Please let us know how we can assist you today. Best regards!`;
      }
    } else if (type === 'sms') {
      switch (stage) {
        case 'New':
          body = `Hello ${customer}, this is ${rep} from GeneralCRM. Thank you for your interest in "${product}". We have received your inquiry and look forward to discussing details. Let us know when you're available to speak. Regards!`;
          break;
        case 'Contacted':
          body = `Hi ${customer}, this is ${rep} from GeneralCRM. Great speaking with you about "${product}". I'm preparing additional details and will connect soon. Text me with any questions. Thanks!`;
          break;
        case 'Under Discussion':
          body = `Hello ${customer}, this is ${rep} from GeneralCRM. Following up on our ongoing discussion regarding "${product}". Let me know if you would like to clarify any technical or pricing points. Best!`;
          break;
        case 'Proposal Sent':
          body = `Hello ${customer}, this is ${rep} from GeneralCRM. Following up on the custom proposal sent for "${product}". Please review and let me know if you have questions or modifications. Thanks!`;
          break;
        case 'Won':
          body = `Dear ${customer}, this is ${rep} from GeneralCRM. Thank you so much for choosing us for "${product}"! We are excited to partner with you and are preparing setup invoices. Best regards!`;
          break;
        case 'Lost':
          body = `Hello ${customer}, this is ${rep} from GeneralCRM. Thank you for considering us for "${product}". We appreciate your time and hope to collaborate in future cycles. All the best!`;
          break;
        default:
          body = `Hello ${customer}, this is ${rep} from GeneralCRM concerning your interest in "${product}". Please let us know how we can best assist you. Warm regards!`;
      }
    } else {
      switch (stage) {
        case 'New':
          subject = `Thank you for your inquiry - GeneralCRM`;
          body = `Dear ${customer},\n\nMy name is ${rep} and I'm contacting you from GeneralCRM. Thank you for reaching out and showing interest in our "${product}" solutions.\n\nWe would be highly pleased to schedule a short conversation to understand your requirements better. Please let me know your availability or a preferred phone number to connect.\n\nLooking forward to speaking with you.\n\nWarm regards,\n${rep}\nGeneralCRM Team`;
          break;
        case 'Contacted':
          subject = `Great speaking with you - GeneralCRM`;
          body = `Dear ${customer},\n\nIt was a pleasure speaking with you regarding your interest in "${product}" and our enterprise CRM solutions.\n\nI am currently organizing the detailed specifications we discussed and will follow up shortly to ensure all your requirements are comprehensively met.\n\nIf you have any initial questions or require additional details in the meantime, please feel free to reply to this email.\n\nKind regards,\n${rep}\nGeneralCRM Team`;
          break;
        case 'Under Discussion':
          subject = `Follow-up on our conversation - GeneralCRM`;
          body = `Dear ${customer},\n\nI hope this message finds you well.\n\nThis is ${rep} from GeneralCRM, following up on our ongoing discussions regarding your interest in "${product}".\n\nWe are fully committed to designing the optimal setup for your business parameters. Please let me know if we should convene for a brief review call to clarify any technical specifications or operational details.\n\nBest regards,\n${rep}\nGeneralCRM Team`;
          break;
        case 'Proposal Sent':
          subject = `Review of custom proposal - GeneralCRM`;
          body = `Dear ${customer},\n\nI hope you are having a productive week.\n\nI am writing to follow up on the custom proposal we recently shared for "${product}". We are highly enthusiastic about working together and supporting your organization's goals.\n\nIf you have reviewed the details and would like to discuss any items, modify any configurations, or proceed with the invoice setups, I am at your service.\n\nThank you for your time and consideration.\n\nSincerely,\n${rep}\nGeneralCRM Team`;
          break;
        case 'Won':
          subject = `A warm welcome & next steps - GeneralCRM`;
          body = `Dear ${customer},\n\nOn behalf of everyone at GeneralCRM, thank you for placing your trust in us for "${product}". We are absolutely thrilled to officially welcome you as a partner.\n\nWe are currently drafting the final checkout invoices and coordinating with our scheduling team for the next steps.\n\nThank you once again for your business, and please let us know if we can do anything to assist you today.\n\nWith warm regards,\n${rep}\nGeneralCRM Team`;
          break;
        case 'Lost':
          subject = `Thank you for your time & consideration - GeneralCRM`;
          body = `Dear ${customer},\n\nThank you for taking the time to explore GeneralCRM solutions for "${product}". Although we were not able to collaborate at this specific juncture, we sincerely appreciate your consideration.\n\nWe will keep your requirements on file and would be happy to assist you in future cycles should your circumstances change. Wishing you and your company great success in all your endeavors.\n\nWith our best wishes,\n${rep}\nGeneralCRM Team`;
          break;
        default:
          subject = `Follow up on your inquiry - GeneralCRM`;
          body = `Dear ${customer},\n\nThis is ${rep} from GeneralCRM, reaching out with regard to your interest in "${product}".\n\nPlease let us know how we can best assist you or if you need any additional specifications.\n\nSincerely,\n${rep}\nGeneralCRM Team`;
      }
    }

    return { subject, body };
  };

  // Setup form fields on adding new lead
  const handleAddNew = () => {
    setEditingLead(null);
    setCustomerName('');
    setPhone('');
    setEmail('');
    setSource('Website');
    setProductInterest('Premium Specification Package');
    setStatus('New');
    setEstimatedValue(400);
    // Auto populate first employee is available
    setAssignedTo(employees[0]?.name || 'Sarah Jenkins');
    setNotes('');
    setIsFormOpen(true);
  };

  // Setup form fields on editing lead
  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setCustomerName(lead.customerName || '');
    setPhone(lead.phone || '');
    setEmail(lead.email || '');
    setSource(lead.source || 'Website');
    setProductInterest(lead.productInterest || '');
    setStatus(lead.status || 'New');
    setEstimatedValue(lead.estimatedValue !== undefined ? lead.estimatedValue : 400);
    setAssignedTo(lead.assignedTo || '');
    setNotes(lead.notes || '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    const lead: Lead = {
      id: editingLead?.id || '',
      customerName: customerName || 'Anoymous Lead',
      phone: phone || '+1 (555) 000-0000',
      email: email || 'missing@email.com',
      source,
      productInterest,
      status,
      estimatedValue: Number(estimatedValue),
      assignedTo,
      notes,
      createdAt: editingLead?.createdAt || new Date().toISOString()
    };
    onSaveLead(lead);
    setIsFormOpen(false);
    setEditingLead(null);
  };

  const handleQuickStatusChange = (lead: Lead, nextStatus: LeadStatus) => {
    const updatedLead = { ...lead, status: nextStatus };
    onSaveLead(updatedLead);
  };

  // Calculations
  const activePipelineValue = leads
    .filter(l => l.status !== 'Won' && l.status !== 'Lost')
    .reduce((sum, current) => sum + current.estimatedValue, 0);

  const wonCount = leads.filter(l => l.status === 'Won').length;
  const matchFilterLeads = leads.filter(l => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      l.customerName.toLowerCase().includes(term) ||
      l.phone.toLowerCase().includes(term) ||
      l.productInterest.toLowerCase().includes(term) ||
      l.assignedTo.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (s: LeadStatus) => {
    switch (s) {
      case 'New': return 'bg-sky-50 text-sky-700 border-sky-200/50';
      case 'Contacted': return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'Under Discussion': return 'bg-indigo-50 text-indigo-700 border-indigo-200/50';
      case 'Proposal Sent': return 'bg-purple-50 text-purple-700 border-purple-200/50';
      case 'Won': return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'Lost': return 'bg-rose-50 text-rose-700 border-rose-200/50';
      default: return 'bg-slate-50 text-slate-700 border-slate-200/50';
    }
  };

  const getLeadSourceIcon = (src: string) => {
    switch (src) {
      case 'Website': return '🌐 Website';
      case 'Walk-in': return '🥪 Walk-In';
      case 'Referral': return '🤝 Referral';
      case 'Social Media': return '📱 Social Media';
      case 'Google Ads': return '🎯 Google Ads';
      default: return '🔌 Other';
    }
  };

  return (
    <div id="leads_view_container" className="space-y-6 animate-fade-in">
      
      {/* Top Value Indicators */}
      <div id="leads_value_cards" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wide block">Unconverted Pipeline Value</span>
              <h4 className="text-2xl font-mono font-bold text-indigo-600 mt-1">{companyCurrency}{activePipelineValue.toLocaleString()}</h4>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-sans mt-2 block">Value based on expected order dimensions</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wide block">Conversion Count (Won)</span>
              <h4 className="text-2xl font-mono font-bold text-emerald-600 mt-1">{wonCount} Deals Closed</h4>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-sans mt-2 block">Closed with positive client transaction invoice generation</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wide block">Total Registered Leads</span>
              <h4 className="text-2xl font-mono font-bold text-slate-800 mt-1">{leads.length} Active Profiles</h4>
            </div>
            <div className="p-3 bg-slate-50 text-slate-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-sans mt-2 block">Stored in local server database storage registry</span>
        </div>
      </div>

      {/* Main CRM pipeline segment control card */}
      <div id="leads_pipeline_control" className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Dynamic Toolbar */}
        <div id="leads_pipeline_toolbar" className="p-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/20">
          
          <div className="flex flex-1 items-center gap-3 w-full max-w-lg">
            <div id="search_box_leads" className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="lead_search_input"
                type="text"
                placeholder="Search potential client, interest or representative name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
              />
            </div>
            
            <select
              id="lead_status_filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl font-sans text-xs px-3 py-2.5 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Pipeline Stages</option>
              <option value="New">New Feed</option>
              <option value="Contacted">Contacted</option>
              <option value="Under Discussion">Under Discussion</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Won">Won (Closed)</option>
              <option value="Lost">Lost (Archived)</option>
            </select>
          </div>

          <button
            id="create_lead_btn"
            onClick={handleAddNew}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Capture New Lead
          </button>
        </div>

        {/* Pipeline List View cards */}
        <div id="leads_items_grid" className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {matchFilterLeads.length === 0 ? (
            <div id="leads_empty_panel" className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400">
              <Inbox className="w-12 h-12 text-slate-200 mb-2" />
              <span className="font-sans text-xs">No active clients or enquiries match the queried options.</span>
            </div>
          ) : (
            matchFilterLeads.map((lead) => (
              <div 
                key={lead.id} 
                id={`lead_card_${lead.id}`}
                className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-250 hover:shadow-xs transition-all relative overflow-hidden"
              >
                {/* Upper row status bar info */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-sans font-bold text-slate-900 text-sm">{lead.customerName}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Via {getLeadSourceIcon(lead.source)}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5"><Clock className="w-3 h-3" /> {formatDDMMYYYY(new Date(lead.createdAt))}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${getStatusBadge(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>

                {/* Sub details battery target context */}
                <div className="space-y-1.5 py-3 border-y border-slate-50 text-[11px] font-sans text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Inflow Channel Source: <strong className="text-slate-800 font-semibold">{lead.source}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    <span>Inquiring: <strong className="text-slate-800 font-semibold">{lead.productInterest}</strong></span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                      <span>Attended by: <strong className="text-slate-800 font-semibold">{lead.assignedTo}</strong></span>
                    </div>
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded">
                      Value: {companyCurrency}{lead.estimatedValue}
                    </span>
                  </div>
                </div>

                {/* Notes log */}
                {lead.notes && (
                  <div className="mt-3 bg-slate-50/70 rounded-lg p-2.5 flex gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-500 italic block leading-relaxed font-sans">
                      &quot;{lead.notes}&quot;
                    </p>
                  </div>
                )}

                {/* Foot actionable quick actions */}
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleEdit(lead)}
                      className="p-1 px-2.5 rounded text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Profile
                    </button>
                    <button
                      title="Send WhatsApp update template to customer"
                      onClick={() => {
                        setActiveCommLead(lead);
                        setCommType('whatsapp');
                        const temp = getPredefinedTemplates(lead, 'whatsapp');
                        setEditableBody(temp.body);
                        setEditableSubject(temp.subject);
                      }}
                      className="p-1 px-2 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    <button
                      title="Send SMS update template to customer"
                      onClick={() => {
                        setActiveCommLead(lead);
                        setCommType('sms');
                        const temp = getPredefinedTemplates(lead, 'sms');
                        setEditableBody(temp.body);
                        setEditableSubject(temp.subject);
                      }}
                      className="p-1 px-2 rounded text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> SMS Text
                    </button>
                    <button
                      title="Send Email update template to customer"
                      onClick={() => {
                        setActiveCommLead(lead);
                        setCommType('email');
                        const temp = getPredefinedTemplates(lead, 'email');
                        setEditableBody(temp.body);
                        setEditableSubject(temp.subject);
                      }}
                      className="p-1 px-2 rounded text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                    <button
                      title="Quotation"
                      onClick={() => handlePrintQuotation(lead)}
                      className="p-1 px-2 rounded text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer transition-all border border-indigo-100"
                    >
                      <Printer className="w-3.5 h-3.5" /> Quotation
                    </button>
                    <button
                      title="Delete Lead Profile"
                      onClick={() => setLeadToDelete(lead)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {lead.status !== 'Won' && lead.status !== 'Lost' && (
                    <div className="flex gap-1">
                      <button
                        title="Mark dynamic conversion status: Lost"
                        onClick={() => handleQuickStatusChange(lead, 'Lost')}
                        className="p-1 text-rose-500 hover:bg-rose-50 border border-slate-100 rounded-md"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        title="Convert Lead and proceed to Checkout Sale Invoicing"
                        onClick={() => {
                          // Trigger redirect preset to sales panel with leadId
                          onNavigateToCheckout({
                            leadId: lead.id,
                            clientName: lead.customerName,
                            clientPhone: lead.phone,
                            clientEmail: lead.email,
                            employeeId: lead.assignedTo,
                            resolvedSelectionName: lead.productInterest
                          });
                        }}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 border border-emerald-100 rounded-md flex items-center gap-1 text-[11px] font-bold font-sans"
                      >
                        <CheckCircle className="w-4 h-4 animate-bounce" /> Win & Invoice
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Slide Drawer Drawer for Capture Lead Details */}
      {isFormOpen && (
        <div id="lead_drawer_backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-slide-left">
            <div>
              <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100">
                <h3 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-500" />
                  {editingLead ? 'Edit Lead Parameters' : 'Capture CRM Client Inquiry'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 hover:bg-slate-50 rounded text-slate-500"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {/* Client Name Details */}
                <div>
                  <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Customer / Enterprise Name</label>
                  <input
                    required
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Liam Sterling, Peak IT Labs Ltd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white"
                  />
                </div>

                {/* Phone & Mail Contact channel info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Direct Phone</label>
                    <input
                      required
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 777-5050"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Email Address</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. contact@peaklabs.co"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white"
                    />
                  </div>
                </div>

                {/* Lead Feed Source channel origin */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1 font-medium">Inflow Channel Source</label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
                    >
                      <option value="Website">Website Form</option>
                      <option value="Walk-in">Depot Walk-in</option>
                      <option value="Referral">Client Referral</option>
                      <option value="Google Ads">Google Ads Campaign</option>
                      <option value="Social Media">Social Networks</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Expected Lead Value ({companyCurrency})</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={estimatedValue}
                      onChange={(e) => setEstimatedValue(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white"
                    />
                  </div>
                </div>

                {/* Product requirement spec */}
                <div>
                  <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Product Requirements</label>
                  <input
                    required
                    type="text"
                    value={productInterest}
                    onChange={(e) => setProductInterest(e.target.value)}
                    placeholder="e.g. 2x units custom specs or high throughput model"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white font-serif"
                  />
                </div>

                {/* Representative deployment */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Assigned Sales Executive</label>
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium"
                    >
                      {employees.map(e => (
                        <option key={e.id} value={e.name}>{e.name} ({e.designation})</option>
                      ))}
                      {employees.length === 0 && (
                        <option value="Office Coordinator">Office Coordinator</option>
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1 font-medium">Pipeline Stage Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as LeadStatus)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Under Discussion">Under Discussion</option>
                      <option value="Proposal Sent">Proposal Sent</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                      <option value="Service Lead">Service Lead</option>
                    </select>
                  </div>
                </div>

                {/* Negotiation / Chat log insights */}
                <div>
                  <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1">Negotiation Logs / Notes</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Needs high discharge runtime backing for a 10kVA off-grid hybrid setup..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white font-sans text-slate-700 leading-relaxed"
                  />
                </div>

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
                    {editingLead ? 'Update Details' : 'Register Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Communication Composer Modal */}
      {activeCommLead && (
        <div id="comm_composer_overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div id="comm_composer_card" className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl relative overflow-hidden animate-fade-in text-left">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600"></div>
            
            <div className="p-5 md:p-6 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-500" />
                    Reach Out: {activeCommLead.customerName}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Stage status is currently: <strong>{activeCommLead.status}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setActiveCommLead(null)}
                  className="text-slate-400 hover:text-slate-600 font-sans text-xs font-bold uppercase p-1 hover:bg-slate-50 rounded"
                >
                  ✕
                </button>
              </div>

              {/* Communication channel switcher tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setCommType('whatsapp');
                    const temp = getPredefinedTemplates(activeCommLead, 'whatsapp');
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
                    const temp = getPredefinedTemplates(activeCommLead, 'sms');
                    setEditableBody(temp.body);
                    setEditableSubject(temp.subject);
                  }}
                  className={`py-2 text-[11px] font-bold font-sans rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    commType === 'sms' 
                      ? 'bg-white text-amber-700 shadow-sm border border-amber-100/50' 
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
                    const temp = getPredefinedTemplates(activeCommLead, 'email');
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

              {/* Contact recipient summary */}
              <div className="bg-slate-50/60 border border-slate-100/60 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient Name:</span>
                  <span className="font-semibold text-slate-800">{activeCommLead.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Representative:</span>
                  <span className="font-semibold text-slate-805 text-slate-800">{activeCommLead.assignedTo || 'Office Representative'}</span>
                </div>
                {commType === 'whatsapp' ? (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verified WhatsApp Phone:</span>
                    <span className="font-mono text-slate-700 font-semibold">{activeCommLead.phone}</span>
                  </div>
                ) : commType === 'sms' ? (
                  <div className="flex justify-between">
                    <span className="text-slate-400">SMS Mobile Phone:</span>
                    <span className="font-mono text-slate-700 font-semibold">{activeCommLead.phone}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer Email Address:</span>
                    <span className="font-mono text-slate-700 font-semibold">{activeCommLead.email}</span>
                  </div>
                )}
              </div>

              {/* Form Input areas */}
              <div className="space-y-3">
                {commType === 'email' && (
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 mb-1 font-medium">Subject Header</label>
                    <input
                      type="text"
                      value={editableSubject}
                      onChange={(e) => setEditableSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-sans font-semibold text-slate-500 font-medium">Edit Message Body</label>
                    <button
                      type="button"
                      onClick={() => {
                        const temp = getPredefinedTemplates(activeCommLead, commType);
                        setEditableBody(temp.body);
                        setEditableSubject(temp.subject);
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      Reset to stage template
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={editableBody}
                    onChange={(e) => setEditableBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 border-slate-200 rounded-lg p-3 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 font-sans text-slate-700 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-405 text-slate-400 font-sans mt-1">
                    This message is written to be polite, helpful, and highly professional. Feel free to edit the text box directly.
                  </p>
                </div>
              </div>

              {/* Trigger Send actions */}
              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveCommLead(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-sans text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                {commType === 'whatsapp' ? (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(activeCommLead.phone)}&text=${encodeURIComponent(editableBody)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setActiveCommLead(null)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/10 flex items-center justify-center gap-1.5 text-center cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open WhatsApp
                  </a>
                ) : commType === 'sms' ? (
                  <a
                    href={`sms:${encodeURIComponent(activeCommLead.phone.replace(/[^\d+]/g, ''))}?body=${encodeURIComponent(editableBody)}`}
                    onClick={() => setActiveCommLead(null)}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-amber-950/10 flex items-center justify-center gap-1.5 text-center cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Send SMS
                  </a>
                ) : (
                  <a
                    href={`mailto:${encodeURIComponent(activeCommLead.email)}?subject=${encodeURIComponent(editableSubject)}&body=${encodeURIComponent(editableBody)}`}
                    onClick={() => setActiveCommLead(null)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-blue-950/10 flex items-center justify-center gap-1.5 text-center cursor-pointer"
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

      {/* Warning/Confirmation modal for deleting leads */}
      {leadToDelete && (
        <div id="delete_lead_confirmation_overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div id="delete_lead_confirmation_card" className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl relative overflow-hidden animate-fade-in text-left">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-600"></div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-sm">
                    Confirm Lead Deletion
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    You are performing a permanent database deletion operation.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                <div className="text-xs">
                  <span className="text-slate-400 font-medium">Lead to Delete:</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{leadToDelete.customerName}</p>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <p>• Inquiring: <strong className="text-slate-700">{leadToDelete.productInterest}</strong></p>
                  <p>• Value: <strong className="text-slate-700">{companyCurrency}{leadToDelete.estimatedValue}</strong></p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                ⚠️ WARNING: This will permanently remove the lead, including their profile details, assigned personnel notes, and contact pipeline values. This operation cannot be reverted.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setLeadToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-sans text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                >
                  No, Keep Lead
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteLead(leadToDelete.id);
                    setLeadToDelete(null);
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-sans text-xs font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-rose-950/10 text-center cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
