/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
const startupLogs = [];

function log(msg) {
  const line = `[${new Date().toLocaleTimeString()}] INFO: ${msg}`;
  console.log(line);
  startupLogs.push(line);
}

function logError(msg, err) {
  const errorDetails = err ? (err.stack || err.message || String(err)) : '';
  const line = `[${new Date().toLocaleTimeString()}] ERROR: ${msg} -> ${errorDetails}`;
  console.error(line);
  startupLogs.push(line);
}

// Start local Express server inside Electron's Node main context
function startExpressServer() {
  return new Promise((resolve) => {
    try {
      log('Preparing to import server.cjs binary bundle...');
      
      // Resolve path using 100% absolute references
      const serverAbsolutePath = path.join(__dirname, 'dist', 'server.cjs');
      log(`Resolved absolute path for server: ${serverAbsolutePath}`);
      
      // Convert to file:// URL scheme to bypass Windows drive letter protocol failures (e.g., "d:" or "c:")
      const serverUrl = pathToFileURL(serverAbsolutePath).href;
      log(`Converted server URL for ESM dynamic import: ${serverUrl}`);

      import(serverUrl)
        .then(() => {
          log('VoltCRM Express internal server imported successfully.');
          resolve(true);
        })
        .catch((err) => {
          logError('Failed to import Express server bundle dynamic engine', err);
          resolve(false);
        });
    } catch (e) {
      logError('Exception during background Express server invocation initialization', e);
      resolve(false);
    }
  });
}

// Check health-check endpoint before showing window
function waitForServer(url, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    log(`Awaiting local endpoint active verification at ${url}...`);
    
    const interval = setInterval(() => {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          log('Local server live check succeeded. Express port 3000 is active.');
          resolve(true);
        } else {
          log(`Poll received status code: ${res.statusCode}. Server is initiating.`);
        }
      }).on('error', (err) => {
        // Log brief detail of ping failure
        const elapsed = Date.now() - startTime;
        if (elapsed > timeoutMs) {
          clearInterval(interval);
          logError(`Server health check timed out after ${timeoutMs}ms`, err);
          resolve(false);
        }
      });
    }, 400);
  });
}

async function init() {
  // Force NODE_ENV to production inside Electron shell so compiled Express server handles static file serving
  process.env.NODE_ENV = 'production';

  try {
    // Store database in safe, user-writable directory (e.g. AppData/Roaming/VoltChargeCRM)
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'database.json');
    process.env.VOLT_CRM_DB_PATH = dbPath;
    log(`Database file path successfully localized to writable user space: ${dbPath}`);
  } catch (e) {
    logError('Warning: Defaulting database to app directory - AppData resolution had a hitch', e);
  }

  // Start backend
  const serverStarted = await startExpressServer();
  
  // Wait until API is live to prevent rendering white screen of death
  const serverReady = await waitForServer('http://127.0.0.1:3000/api/crm/data');

  createWindow(serverStarted && serverReady);
}

function createWindow(isSuccess) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "VoltCharge CRM Battery Inventory System",
    backgroundColor: '#0f172a', // Tailwind slate-900 background placeholder
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Remove native administrative window menu bar for clean full-screen look
  mainWindow.setMenuBarVisibility(false);

  if (isSuccess) {
    log('Loading application frame dynamically from loopback express interface: http://127.0.0.1:3000');
    mainWindow.loadURL('http://127.0.0.1:3000');
  } else {
    logError('Bypassed loopback interface redirection due to startup collapse. Initiating Diagnostic Troubleshooting Screen.');
    loadDiagnosticScreen();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Serves an elegant offline diagnostic HTML screen directly in the window in case of a startup error
function loadDiagnosticScreen() {
  const diagnosticHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>VoltCharge CRM - Diagnostic Console</title>
      <style>
        body {
          background-color: #0f172a;
          color: #f1f5f9;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 40px;
          margin: 0;
          line-height: 1.6;
        }
        .container {
          max-width: 850px;
          margin: 0 auto;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        }
        h1 {
          color: #ef4444;
          font-size: 24px;
          margin-top: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 2px solid #3b4252;
          padding-bottom: 15px;
        }
        h2 {
          font-size: 16px;
          color: #38bdf8;
          margin-top: 25px;
        }
        p {
          font-size: 14px;
          color: #cbd5e1;
        }
        .suggestion-list {
          padding-left: 20px;
          margin: 15px 0;
          font-size: 14px;
          color: #e2e8f0;
        }
        .suggestion-list li {
          margin-bottom: 8px;
        }
        pre {
          background: #020617;
          color: #34d399;
          padding: 15px;
          border-radius: 8px;
          font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
          font-size: 12px;
          overflow-x: auto;
          border: 1px solid #1e293b;
          max-height: 250px;
        }
        .btn-retry {
          background: #0284c7;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 20px;
          display: inline-block;
          text-decoration: none;
        }
        .btn-retry:hover {
          background: #0369a1;
        }
        .badge {
          background: #ef4444;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>
          <span class="badge">Connection Failure</span>
          VoltCharge CRM System Alert
        </h1>
        <p>The desktop shell was successfully built, but is currently unable to initiate/connect to the background local server on <strong>port 3000</strong>.</p>
        
        <h2>Typical Resolution Guidelines</h2>
        <ul class="suggestion-list">
          <li><strong>Port 3000 Mismatch:</strong> Another application (like another VoltCharge session, VS Code, docker, Skype, etc.) might be occupying port 3000. Close other open commands and restart this application.</li>
          <li><strong>Antivirus Interference:</strong> Security firewalls can occasionally filter dynamic local loopback connections (http://127.0.0.1:3000). Try permitting the application or running as Admin.</li>
          <li><strong>Database Integrity Issue:</strong> Confirm that <code>database.json</code> is located next to the executable, and is not locked/open in another editor.</li>
        </ul>

        <h2>Startup Console Logs</h2>
        <pre>${startupLogs.join('\n')}</pre>

        <button onclick="window.location.reload();" class="btn-retry">Retry Initialization ping</button>
      </div>
    </body>
    </html>
  `;
  
  if (mainWindow) {
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(diagnosticHtml)}`);
  }
}

app.whenReady().then(() => {
  init();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow(false);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
