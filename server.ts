/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { CRMDatabase, InventoryItem, Lead, Sale, Client, ServiceReminder, Employee, CompanySettings } from './src/types';

const DB_PATH = process.env.VOLT_CRM_DB_PATH || path.join(process.cwd(), 'database.json');

const INITIAL_DB: CRMDatabase = {
  inventory: [
    { id: "inv_1", brand: "Exide", model: "Mile XL 100", type: "Standard", capacity: "100 Ah", voltage: 12, stockLevel: 18, reorderLevel: 5, cost: 90, price: 140, location: "Shelf A1" },
    { id: "inv_2", brand: "Amaron", model: "Hi-Life AGM", type: "Premium", capacity: "150 Ah", voltage: 12, stockLevel: 3, reorderLevel: 8, cost: 130, price: 195, location: "Shelf B2" },
    { id: "inv_3", brand: "Luminous", model: "Solar Tubular 220", type: "Custom", capacity: "220 Ah", voltage: 12, stockLevel: 12, reorderLevel: 4, cost: 180, price: 270, location: "Warehouse Rear" },
    { id: "inv_4", brand: "Tesla Power", model: "Li-Ion PowerPack", type: "Premium", capacity: "100 Ah", voltage: 48, stockLevel: 5, reorderLevel: 3, cost: 850, price: 1200, location: "Premium Bay" },
    { id: "inv_5", brand: "Optima", model: "BlueTop D31M", type: "Standard", capacity: "75 Ah", voltage: 12, stockLevel: 2, reorderLevel: 4, cost: 160, price: 240, location: "Shelf A2" }
  ],
  leads: [
    { id: "lead_1", customerName: "Robert Chen", phone: "+1 (555) 234-5678", email: "robert.chen@outlook.com", source: "Google Ads", productInterest: "150Ah AGM", status: "New", estimatedValue: 390, assignedTo: "Sarah Jenkins", notes: "Wants AGM batteries for solar off-grid storage setup. Seeking advice on capacity requirements.", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "lead_2", customerName: "Apex Logistics Inc.", phone: "+1 (555) 890-1234", email: "procurement@apexlogistics.com", source: "Walk-in", productInterest: "Multiple Tubular 220Ah", status: "Under Discussion", estimatedValue: 1620, assignedTo: "Alex Rivera", notes: "Fleet backup power solution. Needs bulk pricing quotation for 6 units of solar tubular batteries.", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "lead_3", customerName: "Emma Thompson", phone: "+1 (555) 432-1098", email: "emma.t77@gmail.com", source: "Social Media", productInterest: "100Ah Li-ion", status: "Proposal Sent", estimatedValue: 1200, assignedTo: "Sarah Jenkins", notes: "E-bike conversion project. Sent dynamic lithium-ion battery pricing sheet with customized warranty option.", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "lead_4", customerName: "Gregory Miller", phone: "+1 (555) 829-1029", email: "g.miller@gmail.com", source: "Website", productInterest: "75Ah Gel", status: "Contacted", estimatedValue: 480, assignedTo: "Sarah Jenkins", notes: "Marine backup system queries. Invoiced client for a consultation call.", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
  ],
  sales: [
    { id: "sale_1", invoiceNumber: "INV-2026-001", clientName: "David Miller", clientPhone: "+1 (555) 987-6543", clientEmail: "dmiller@gmail.com", clientAddress: "482 Pine Dr, Springfield", productId: "inv_3", productDetails: "Luminous Solar Tubular 220 (220 Ah, 12V)", quantity: 2, totalAmount: 540, paymentMethod: "Bank Transfer", installationDate: "2026-05-10", warrantyMonths: 36, warrantyExpiration: "2029-05-10", status: "Completed", employeeId: "Sarah Jenkins" },
    { id: "sale_2", invoiceNumber: "INV-2026-002", clientName: "Jessica Taylor", clientPhone: "+1 (555) 474-3921", clientEmail: "jtaylor@yahoo.com", clientAddress: "12 Ocean Breeze Ave, Sector 4", productId: "inv_2", productDetails: "Amaron Hi-Life AGM (150 Ah, 12V)", quantity: 1, totalAmount: 195, paymentMethod: "Card", installationDate: "2026-05-18", warrantyMonths: 24, warrantyExpiration: "2028-05-18", status: "Completed", employeeId: "Alex Rivera" },
    { id: "sale_3", invoiceNumber: "INV-2026-003", clientName: "Global Corp Office", clientPhone: "+1 (555) 555-0199", clientEmail: "it.backups@globalcorp.net", clientAddress: "100 Corporate Plaza, Fl 4", productId: "inv_4", productDetails: "Tesla Power Li-Ion PowerPack (100 Ah, 48V)", quantity: 3, totalAmount: 3600, paymentMethod: "Financing", installationDate: "2026-05-26", warrantyMonths: 48, warrantyExpiration: "2030-05-26", status: "Pending Installation", employeeId: "Sarah Jenkins" }
  ],
  clients: [
    { id: "client_1", name: "David Miller", phone: "+1 (555) 987-6543", email: "dmiller@gmail.com", address: "482 Pine Dr, Springfield", productDetails: "220 Ah", installationDate: "2026-05-10", warrantyExpiration: "2029-05-10", lastServiceDate: "2026-05-10", notes: "Double pack backup system installed for residence. Requires distilled water top-up reminders." },
    { id: "client_2", name: "Jessica Taylor", phone: "+1 (555) 474-3921", email: "jtaylor@yahoo.com", address: "12 Ocean Breeze Ave, Sector 4", productDetails: "150 Ah", installationDate: "2026-05-18", warrantyExpiration: "2028-05-18", lastServiceDate: "2026-05-18", notes: "Suburban backup installation. High load profile." },
    { id: "client_3", name: "Global Corp Office", phone: "+1 (555) 555-0199", email: "it.backups@globalcorp.net", address: "100 Corporate Plaza, Fl 4", productDetails: "100 Ah (48V Li-ion)", installationDate: "2026-05-26", warrantyExpiration: "2030-05-26", lastServiceDate: "2026-05-26", notes: "Enterprise server backup power units, premium lithium battery cells safety inspection needed annually." },
    { id: "client_4", name: "Marcus Aurelius", phone: "+1 (555) 123-9999", email: "marcus.stoic@gmail.com", address: "77 Stoic Villa Way, Empire Hills", productDetails: "100 Ah", installationDate: "2025-11-20", warrantyExpiration: "2027-11-20", lastServiceDate: "2025-11-20", notes: "Standard Exide Lead Acid battery pack. Intact, but due for first diagnostic check and distilled water refill." }
  ],
  reminders: [
    { id: "rem_1", clientId: "client_1", clientName: "David Miller", clientPhone: "+1 (555) 987-6543", type: "Water Level Top-up", dueDate: "2026-11-10", status: "Scheduled", notes: "6 Month recommended water service interval verification." },
    { id: "rem_2", clientId: "client_4", clientName: "Marcus Aurelius", clientPhone: "+1 (555) 123-9999", type: "Water Level Top-up", dueDate: "2026-05-20", status: "Overdue", notes: "6 Months since initial battery pack installation - water refill extremely critical to prevent plate oxidation durability drops." },
    { id: "rem_3", clientId: "client_2", clientName: "Jessica Taylor", clientPhone: "+1 (555) 474-3921", type: "Terminal Cleaning", dueDate: "2026-05-25", status: "Sent", notes: "Auto-notified client via email/sms template regarding terminal check." }
  ],
  employees: [
    { id: "emp_1", name: "Sarah Jenkins", designation: "Sales Executive", phone: "+1 (555) 111-2222", email: "sjenkins@batteryco.com", baseSalary: 2800, commissionPercentage: 5, shiftSchedule: "General (09:00 - 17:00)", workedShiftsCount: 20, salesInvoiced: 4140, leadsConverted: 2 },
    { id: "emp_2", name: "Alex Rivera", designation: "Senior Technician", phone: "+1 (555) 333-4444", email: "arivera@batteryco.com", baseSalary: 3400, commissionPercentage: 2, shiftSchedule: "Morning (08:00 - 16:00)", workedShiftsCount: 22, salesInvoiced: 195, leadsConverted: 1 },
    { id: "emp_3", name: "Tyler Durden", designation: "Helper", phone: "+1 (555) 555-5555", email: "tdurden@batteryco.com", baseSalary: 1800, commissionPercentage: 0, shiftSchedule: "Evening (16:00 - 00:00)", workedShiftsCount: 18, salesInvoiced: 0, leadsConverted: 0 },
    { id: "emp_4", name: "Elena Rostova", designation: "Depot Manager", phone: "+1 (555) 777-8888", email: "erostova@batteryco.com", baseSalary: 4500, commissionPercentage: 1, shiftSchedule: "General (09:00 - 17:00)", workedShiftsCount: 24, salesInvoiced: 0, leadsConverted: 0 }
  ],
  settings: {
    companyName: "VoltCharge Battery Corp",
    companyEmail: "support@voltcharge.com",
    companyPhone: "+1 (800) 555-VOLT",
    companyAddress: "700 Ampere Blvd, Power City, PC 50505",
    companyTaxId: "TX-99882211-B",
    companyCurrency: "₹",
    userRoles: [
      {
        role: "Super Admin",
        adminLevel: "High",
        description: "Full system access to accounts, inventory configurations, employee payroll and system settings.",
        permissions: { dashboard: true, inventory: true, leads: true, sales: true, employees: true, settings: true }
      },
      {
        role: "Manager",
        adminLevel: "Medium",
        description: "Can manage stock levels, technician allocation, service intervals, shift scheduling and lead entries.",
        permissions: { dashboard: true, inventory: true, leads: true, sales: true, employees: true, settings: false }
      },
      {
        role: "Sales Executive",
        adminLevel: "Low",
        description: "Responsible for logging battery sales, managing active customer leads and scheduling initial inspection reminders.",
        permissions: { dashboard: true, inventory: true, leads: true, sales: true, employees: false, settings: false }
      }
    ]
  }
};

// Database utility helper functions
function loadDatabase(): CRMDatabase {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const defaultDb = { ...INITIAL_DB };
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
      return defaultDb;
    }
    const rawData = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(rawData);
    
    return {
      inventory: parsed.inventory || [],
      leads: parsed.leads || [],
      sales: parsed.sales || [],
      clients: parsed.clients || [],
      reminders: parsed.reminders || [],
      employees: parsed.employees || [],
      settings: parsed.settings || INITIAL_DB.settings
    };
  } catch (err) {
    console.error("Failed to read database file, returning default:", err);
    return INITIAL_DB;
  }
}

function saveDatabase(db: CRMDatabase): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Failed to save database file:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse incoming JSON payloads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Endpoint: Get Complete Application State
  app.get('/api/crm/data', (req: Request, res: Response) => {
    const db = loadDatabase();
    res.json(db);
  });

  // API Endpoint: Update Inventory Items
  app.post('/api/crm/inventory', (req: Request, res: Response) => {
    const db = loadDatabase();
    const batteryItem: InventoryItem = req.body;

    if (!batteryItem.id) {
      batteryItem.id = `inv_${Date.now()}`;
      db.inventory.push(batteryItem);
    } else {
      const idx = db.inventory.findIndex(item => item.id === batteryItem.id);
      if (idx !== -1) {
        db.inventory[idx] = batteryItem;
      } else {
        db.inventory.push(batteryItem);
      }
    }
    saveDatabase(db);
    res.json({ success: true, item: batteryItem, inventory: db.inventory });
  });

  // API Endpoint: Delete Inventory Item
  app.delete('/api/crm/inventory/:id', (req: Request, res: Response) => {
    const db = loadDatabase();
    const itemId = req.params.id;
    db.inventory = db.inventory.filter(item => item.id !== itemId);
    saveDatabase(db);
    res.json({ success: true, inventory: db.inventory });
  });

  // API Endpoint: Create/Update Lead
  app.post('/api/crm/leads', (req: Request, res: Response) => {
    const db = loadDatabase();
    const lead: Lead = req.body;

    if (!lead.id) {
      lead.id = `lead_${Date.now()}`;
      lead.createdAt = new Date().toISOString();
      db.leads.push(lead);
    } else {
      const idx = db.leads.findIndex(l => l.id === lead.id);
      if (idx !== -1) {
        // If transitioning status to 'Won', we can auto-log performance metrics for employee
        if (lead.status === 'Won' && db.leads[idx].status !== 'Won') {
          // Increment employee leads converted if name exists
          const empIdx = db.employees.findIndex(e => e.name === lead.assignedTo);
          if (empIdx !== -1) {
            db.employees[empIdx].leadsConverted += 1;
          }
        }
        
        // --- NEW LOGIC: TRANSITION TO SERVICE LEAD ---
        if (lead.status === 'Service Lead' && db.leads[idx].status !== 'Service Lead') {
          db.clients.push({
            id: `client_${Date.now()}`,
            name: lead.customerName,
            phone: lead.phone,
            email: lead.email,
            address: '',
            productDetails: lead.productInterest,
            installationDate: new Date().toISOString(),
            warrantyExpiration: '',
            lastServiceDate: new Date().toISOString(),
            notes: `Transferred from pipeline: ${lead.notes}`,
            status: 'Transferred to CS'
          });
          lead.status = 'Transferred to CS';
        }
        
        db.leads[idx] = lead;
      } else {
        db.leads.push(lead);
      }
    }
    saveDatabase(db);
    res.json({ success: true, lead, leads: db.leads, employees: db.employees });
  });

  // API Endpoint: Delete Lead
  app.delete('/api/crm/leads/:id', (req: Request, res: Response) => {
    const db = loadDatabase();
    const leadId = req.params.id;
    db.leads = db.leads.filter(l => l.id !== leadId);
    saveDatabase(db);
    res.json({ success: true, leads: db.leads });
  });

  // API Endpoint: Handle New Sale Checkout or Edit Sale (Updates client logs, decreases/reverts inventory counts, credits employee sales)
  app.post('/api/crm/sales', (req: Request, res: Response) => {
    const db = loadDatabase();
    const sale: Sale = req.body;

    if (!sale.id) {
      // --- CREATE NEW SALE ---
      sale.id = `sale_${Date.now()}`;
      sale.invoiceNumber = `INV-2026-${String(db.sales.length + 101).padStart(3, '0')}`;

      // 1. Process Stock Level reduction in inventory
      const productItem = db.inventory.find(item => item.id === sale.productId);
      if (productItem) {
        if (productItem.stockLevel >= sale.quantity) {
          productItem.stockLevel -= sale.quantity;
        } else {
          productItem.stockLevel = 0; // boundary safety
        }
      }

      // 1.5 Process Lead status transition if checkout is converted from a Lead pipeline
      if (sale.leadId) {
        const leadIdx = db.leads.findIndex(l => l.id === sale.leadId);
        if (leadIdx !== -1 && db.leads[leadIdx].status !== 'Won') {
          db.leads[leadIdx].status = 'Won';
          const assignedEmpName = db.leads[leadIdx].assignedTo;
          if (assignedEmpName) {
            const empIdx = db.employees.findIndex(e => e.name === assignedEmpName);
            if (empIdx !== -1) {
              db.employees[empIdx].leadsConverted = (db.employees[empIdx].leadsConverted || 0) + 1;
            }
          }
        }
      }

      // 2. Add or update dynamic sales tracking metric for the chosen employee (Sales Exec commissions)
      if (sale.employeeId) {
        const empIdx = db.employees.findIndex(e => e.name === sale.employeeId);
        if (empIdx !== -1) {
          db.employees[empIdx].salesInvoiced += sale.totalAmount;
        }
      }

      // 3. Register client if they don't already exist, or append installation details to client records
      let isExistingClient = db.clients.find(c => c.phone === sale.clientPhone || c.email === sale.clientEmail);
      const resolvedCapacity = productItem ? (productItem.capacity || "Standard") : 'Standard';
      
      if (isExistingClient) {
        isExistingClient.productDetails = resolvedCapacity;
        isExistingClient.installationDate = sale.installationDate;
        isExistingClient.warrantyExpiration = sale.warrantyExpiration;
        isExistingClient.lastServiceDate = sale.installationDate;
        isExistingClient.notes = `${isExistingClient.notes || ''} | Bought ${sale.productDetails} (Invoice: ${sale.invoiceNumber})`;
      } else {
        isExistingClient = {
          id: `client_${Date.now()}`,
          name: sale.clientName,
          phone: sale.clientPhone,
          email: sale.clientEmail,
          address: sale.clientAddress || '',
          productDetails: resolvedCapacity,
          installationDate: sale.installationDate,
          warrantyExpiration: sale.warrantyExpiration,
          lastServiceDate: sale.installationDate,
          notes: `New Customer profile registered via Invoice ${sale.invoiceNumber}. Product details: ${sale.productDetails}.`
        };
        db.clients.push(isExistingClient);
      }

      // 4. Automatically generate a diagnostic Water Level Check & voltage service reminder for 6 months post installation
      const installDateObj = new Date(sale.installationDate);
      installDateObj.setMonth(installDateObj.getMonth() + 6);
      const serviceDueDate = installDateObj.toISOString().split('T')[0];

      const serviceRem: ServiceReminder = {
        id: `rem_${Date.now()}`,
        clientId: isExistingClient.id,
        clientName: isExistingClient.name,
        clientPhone: isExistingClient.phone,
        type: 'Water Level Top-up',
        dueDate: serviceDueDate,
        status: 'Scheduled',
        notes: `Automated 6-month post-installation health scan and electrolyte topping check (Sale ${sale.invoiceNumber})`
      };
      db.reminders.push(serviceRem);

      // Save all modifications to state
      db.sales.push(sale);
    } else {
      // --- EDIT EXISTING SALE ---
      const saleIdx = db.sales.findIndex(s => s.id === sale.id);
      if (saleIdx !== -1) {
        const oldSale = db.sales[saleIdx];

        // 1. Revert Old Stock Level in inventory
        const oldProductItem = db.inventory.find(item => item.id === oldSale.productId);
        if (oldProductItem) {
          oldProductItem.stockLevel += oldSale.quantity;
        }

        // Apply New Stock Level reduction in inventory
        const newProductItem = db.inventory.find(item => item.id === sale.productId);
        if (newProductItem) {
          if (newProductItem.stockLevel >= sale.quantity) {
            newProductItem.stockLevel -= sale.quantity;
          } else {
            newProductItem.stockLevel = 0; // boundary safety
          }
        }

        // 2. Revert Old Employee Metrics
        if (oldSale.employeeId) {
          const oldEmpIdx = db.employees.findIndex(e => e.name === oldSale.employeeId);
          if (oldEmpIdx !== -1) {
            db.employees[oldEmpIdx].salesInvoiced = Math.max(0, db.employees[oldEmpIdx].salesInvoiced - oldSale.totalAmount);
          }
        }

        // Apply New Employee Metrics
        if (sale.employeeId) {
          const newEmpIdx = db.employees.findIndex(e => e.name === sale.employeeId);
          if (newEmpIdx !== -1) {
            db.employees[newEmpIdx].salesInvoiced += sale.totalAmount;
          }
        }

        // 3. Update Service Reminder due dates if any is associated
        const assocRemIdx = db.reminders.findIndex(rem => rem.notes?.includes(oldSale.invoiceNumber));
        if (assocRemIdx !== -1) {
          const installDateObj = new Date(sale.installationDate);
          installDateObj.setMonth(installDateObj.getMonth() + 6);
          const serviceDueDate = installDateObj.toISOString().split('T')[0];

          db.reminders[assocRemIdx].dueDate = serviceDueDate;
          db.reminders[assocRemIdx].clientName = sale.clientName;
          db.reminders[assocRemIdx].clientPhone = sale.clientPhone;
        }

        // Preserve original invoice number
        sale.invoiceNumber = oldSale.invoiceNumber;

        // 4. Update core record
        db.sales[saleIdx] = sale;
      }
    }

    saveDatabase(db);

    res.json({
      success: true,
      sale,
      sales: db.sales,
      inventory: db.inventory,
      clients: db.clients,
      reminders: db.reminders,
      employees: db.employees,
      leads: db.leads
    });
  });

  // API Endpoint: Delete Sale Invoice & Restore Inventory counts and employee commission credits
  app.delete('/api/crm/sales/:id', (req: Request, res: Response) => {
    const db = loadDatabase();
    const saleId = req.params.id;
    console.log(`Attempting to delete sale with ID: ${saleId}`);
    const saleIdx = db.sales.findIndex(s => s.id === saleId);

    if (saleIdx !== -1) {
      console.log(`Found sale at index: ${saleIdx}`);
      const sale = db.sales[saleIdx];

      // 1. Restore Inventory Stock Level
      const productItem = db.inventory.find(item => item.id === sale.productId);
      if (productItem) {
        productItem.stockLevel += sale.quantity;
      }

      // 2. Deduct Employee Sales Invoiced
      if (sale.employeeId) {
        const empIdx = db.employees.findIndex(e => e.name === sale.employeeId);
        if (empIdx !== -1) {
          db.employees[empIdx].salesInvoiced = Math.max(0, db.employees[empIdx].salesInvoiced - sale.totalAmount);
        }
      }

      // 3. Delete associated Service remind task
      db.reminders = db.reminders.filter(rem => !rem.notes?.includes(sale.invoiceNumber));

      // 4. Filter from sales array
      console.log(`Removing sale from array: ${sale.id}. Sales count before: ${db.sales.length}`);
      db.sales.splice(saleIdx, 1);
      console.log(`Sales count after: ${db.sales.length}`);

      saveDatabase(db);
    } else {
      console.log(`Sale with ID ${saleId} not found`);
    }

    res.json({
      success: true,
      sales: db.sales,
      inventory: db.inventory,
      clients: db.clients,
      reminders: db.reminders,
      employees: db.employees
    });
  });

  // API Endpoint: Direct Client management
  app.post('/api/crm/clients', (req: Request, res: Response) => {
    const db = loadDatabase();
    const client: Client = req.body;

    if (!client.id) {
      client.id = `client_${Date.now()}`;
      db.clients.push(client);
    } else {
      const idx = db.clients.findIndex(c => c.id === client.id);
      if (idx !== -1) {
        db.clients[idx] = client;
      } else {
        db.clients.push(client);
      }
    }
    saveDatabase(db);
    res.json({ success: true, client, clients: db.clients });
  });

  app.delete('/api/crm/clients/:id', (req: Request, res: Response) => {
    const db = loadDatabase();
    const clientId = req.params.id;
    db.clients = db.clients.filter(c => c.id !== clientId);
    // As per the warning on the UI, let's also delete related reminders.
    db.reminders = db.reminders.filter(rem => rem.clientId !== clientId);
    saveDatabase(db);
    res.json({ success: true, clients: db.clients, reminders: db.reminders });
  });

  // API Endpoint: Update/Action Service Reminders
  app.post('/api/crm/reminders', (req: Request, res: Response) => {
    const db = loadDatabase();
    const reminder: ServiceReminder = req.body;

    if (!reminder.id) {
      reminder.id = `rem_${Date.now()}`;
      db.reminders.push(reminder);
    } else {
      const idx = db.reminders.findIndex(rem => rem.id === reminder.id);
      if (idx !== -1) {
        db.reminders[idx] = reminder;
      } else {
        db.reminders.push(reminder);
      }
    }
    saveDatabase(db);
    res.json({ success: true, reminder, reminders: db.reminders });
  });

  app.delete('/api/crm/reminders/:id', (req: Request, res: Response) => {
    const db = loadDatabase();
    const remId = req.params.id;
    db.reminders = db.reminders.filter(rem => rem.id !== remId);
    saveDatabase(db);
    res.json({ success: true, reminders: db.reminders });
  });

  // API Endpoint: Employee Management
  app.post('/api/crm/employees', (req: Request, res: Response) => {
    const db = loadDatabase();
    const employee: Employee = req.body;

    if (!employee.id) {
      employee.id = `emp_${Date.now()}`;
      employee.workedShiftsCount = employee.workedShiftsCount || 0;
      employee.salesInvoiced = employee.salesInvoiced || 0;
      employee.leadsConverted = employee.leadsConverted || 0;
      db.employees.push(employee);
    } else {
      const idx = db.employees.findIndex(emp => emp.id === employee.id);
      if (idx !== -1) {
        // Keep calculated stats constant when updating records
        employee.workedShiftsCount = employee.workedShiftsCount !== undefined ? employee.workedShiftsCount : db.employees[idx].workedShiftsCount;
        employee.salesInvoiced = employee.salesInvoiced !== undefined ? employee.salesInvoiced : db.employees[idx].salesInvoiced;
        employee.leadsConverted = employee.leadsConverted !== undefined ? employee.leadsConverted : db.employees[idx].leadsConverted;
        db.employees[idx] = employee;
      } else {
        db.employees.push(employee);
      }
    }
    saveDatabase(db);
    res.json({ success: true, employee, employees: db.employees });
  });

  // API Endpoint: Delete Employee Record
  app.delete('/api/crm/employees/:id', (req: Request, res: Response) => {
    const db = loadDatabase();
    const empId = req.params.id;
    db.employees = db.employees.filter(emp => emp.id !== empId);
    saveDatabase(db);
    res.json({ success: true, employees: db.employees });
  });

  // API Endpoint: Update System Settings (Company profile information and custom admin roles permissions)
  app.post('/api/crm/settings', (req: Request, res: Response) => {
    console.log("Received settings update:", req.body);
    const db = loadDatabase();
    const settings: CompanySettings = req.body;
    db.settings = settings;
    saveDatabase(db);
    res.json({ success: true, settings: db.settings });
  });

  // API Endpoint: Wipes or Restores the default database records
  app.post('/api/crm/database/reset', (req: Request, res: Response) => {
    const db = loadDatabase();
    const { mode } = req.body; // 'wipe' or 'restore'

    if (mode === 'wipe') {
      db.inventory = [];
      db.leads = [];
      db.sales = [];
      db.clients = [];
      db.reminders = [];
      db.employees = [];
      // Keep corporate settings intact
    } else if (mode === 'restore') {
      // Deep copy to break reference chains
      db.inventory = JSON.parse(JSON.stringify(INITIAL_DB.inventory));
      db.leads = JSON.parse(JSON.stringify(INITIAL_DB.leads));
      db.sales = JSON.parse(JSON.stringify(INITIAL_DB.sales));
      db.clients = JSON.parse(JSON.stringify(INITIAL_DB.clients));
      db.reminders = JSON.parse(JSON.stringify(INITIAL_DB.reminders));
      db.employees = JSON.parse(JSON.stringify(INITIAL_DB.employees));
    }

    saveDatabase(db);
    res.json({ success: true, db });
  });

  // API Endpoint: Restore database from backup payload
  app.post('/api/crm/database/restore', (req: Request, res: Response) => {
    const db = loadDatabase();
    const { backup } = req.body;
    
    if (!backup) {
      return res.status(400).json({ success: false, error: "Backup data is missing" });
    }
    
    try {
      if (Array.isArray(backup.inventory)) db.inventory = backup.inventory;
      if (Array.isArray(backup.leads)) db.leads = backup.leads;
      if (Array.isArray(backup.sales)) db.sales = backup.sales;
      if (Array.isArray(backup.clients)) db.clients = backup.clients;
      if (Array.isArray(backup.reminders)) db.reminders = backup.reminders;
      if (Array.isArray(backup.employees)) db.employees = backup.employees;
      if (backup.settings) db.settings = backup.settings;
      
      saveDatabase(db);
      res.json({ success: true, db });
    } catch (err) {
      res.status(500).json({ success: false, error: "Failed to parse and apply database backup." });
    }
  });

  // Vite development middleware versus production assets server
  if (process.env.NODE_ENV !== "production") {
    // Dynamically load Vite development middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Server static distributions
    const distPath = typeof __dirname !== 'undefined' ? __dirname : path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind server listener exclusively to port 3000 as requested by environment constraints
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoltCRM full-stack backend running successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
