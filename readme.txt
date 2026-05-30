========================================================================
             BATTERY CRM & INVENTORY SYSTEM - LOCAL DEPLOYMENT
========================================================================

Dear Administrator,

This notepad file contains critical instructions and default parameters 
requested to be kept separate and secure from user-facing dashboards.

------------------------------------------------------------------------
1. LOCAL COMPILATION & EXE PACKAGING INSTRUCTIONS
------------------------------------------------------------------------

To compile this full-stack Battery CRM into a standalone Windows .exe 
installer:

Step 1: Export & Download Codebase
  - Export the codebase ZIP file from the settings menu or system backups.
  - Extract the contents into your preferred workspace folder.

Step 2: Install Local Node Dependencies
  - Open CMD / PowerShell in this extracted directory.
  - Execute the command below to download and install required dependencies:
    
    npm install

Step 3: Compile the Windows Portable Executable
  - Run the electron compiler tool by executing:
    
    npx electron-builder --win portable

Step 4: Execute on Windows
  - Double-click on the resulting portable .exe inside your directory tree.
  - It will immediately deploy on your Windows screen and launch the local 
    Express backend with static asset servers autointegrated with a local 
    persistence database (database.json).


------------------------------------------------------------------------
2. DEFAULT AUTHENTICATION PARAMETERS
------------------------------------------------------------------------

* SYSTEM ADMINISTRATOR AUTHENTICATION:
  - User Identity/Username: admin
  - Security PIN/Passcode:  minda123

* DATABASE TUNING & OPERATIONS PASSCODE:
  - Database Password:      securebase


------------------------------------------------------------------------
3. APPLICATION SPECIFICS
------------------------------------------------------------------------
- Front-end Framework: React 18 with Vite
- Styling Framework:   Tailwind CSS
- Port Configuration:  3000 (standard ingress port)
- Database File:       database.json

Please store this file securely. If any changes are made to the administrative 
access rules, remember to update them here for future technicians' reference.

========================================================================
