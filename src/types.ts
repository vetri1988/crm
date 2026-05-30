/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InventoryItem {
  id: string;
  brand: string;
  model: string;
  type: string; // 'Standard' | 'Premium' | 'Custom'
  capacity: string;
  voltage: number;
  stockLevel: number;
  reorderLevel: number;
  cost: number;
  price: number;
  location: string;
}

export type LeadStatus = 'New' | 'Contacted' | 'Under Discussion' | 'Proposal Sent' | 'Won' | 'Lost' | 'Service Lead' | 'Transferred to CS';

export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  source: string; // 'Website' | 'Walk-in' | 'Referral' | 'Google Ads' | 'Social Media'
  productInterest: string;
  status: LeadStatus;
  estimatedValue: number;
  assignedTo: string; // Employee ID or Name
  notes: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  productId: string;
  productDetails: string;
  quantity: number;
  totalAmount: number;
  paymentMethod: string; // 'Cash' | 'Card' | 'Bank Transfer' | 'Financing'
  installationDate: string;
  warrantyMonths: number;
  warrantyExpiration: string;
  status: 'Completed' | 'Pending Installation';
  employeeId: string; // sales executive
  technicianId?: string; // install technician
  leadId?: string; // origin lead from conversions
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  productDetails: string; // stored for client, e.g. "Model X - Standard"
  installationDate: string;
  warrantyExpiration: string;
  lastServiceDate: string;
  notes: string;
  status?: string;
}

export type ReminderStatus = 'Scheduled' | 'Sent' | 'Completed' | 'Overdue';
export type ReminderType = 'Maintenance Check' | 'Replacement Due' | 'General Health Check' | 'Water Level Top-up' | 'Terminal Cleaning';

export interface ServiceReminder {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  type: ReminderType;
  dueDate: string;
  status: ReminderStatus;
  notes: string;
}

export interface Employee {
  id: string;
  name: string;
  designation: string; // 'Senior Technician' | 'Sales Executive' | 'Depot Manager' | 'Helper' | 'Office Coordinator'
  phone: string;
  email: string;
  baseSalary: number;
  commissionPercentage: number;
  shiftSchedule: string; // 'Morning (08:00 - 16:00)' | 'Evening (16:00 - 00:00)' | 'Night (00:00 - 08:00)' | 'General (09:00 - 17:00)'
  workedShiftsCount: number;
  salesInvoiced: number; // calculated total sales
  leadsConverted: number; // count of leads converted to Won
  username?: string;
  passcode?: string;
  clearanceLevel?: 'High' | 'Medium' | 'Low';
}

export interface RolePermission {
  role: string;
  adminLevel: 'High' | 'Medium' | 'Low';
  description: string;
  permissions: {
    dashboard: boolean;
    inventory: boolean;
    leads: boolean;
    sales: boolean;
    employees: boolean;
    settings: boolean;
  };
}

export interface CompanySettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyTaxId: string;
  companyCurrency: string; // e.g., 'USD', 'INR', 'EUR'
  userRoles: RolePermission[];
}

export interface CRMDatabase {
  inventory: InventoryItem[];
  leads: Lead[];
  sales: Sale[];
  clients: Client[];
  reminders: ServiceReminder[];
  employees: Employee[];
  settings: CompanySettings;
}
