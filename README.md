# 🛡️ StreetSentinel (Street-Patrol)

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-brightgreen?style=for-the-badge&logo=github)](https://thanujaradhakrishnan04.github.io/Trace/)
[![Comprehensive Tests](https://img.shields.io/github/actions/workflow/status/Thanujaradhakrishnan04/Trace/comprehensive-tests.yml?branch=main&label=CI%20%2F%20CD&style=for-the-badge)](https://github.com/Thanujaradhakrishnan04/Trace/actions)
[![Security Status](https://img.shields.io/badge/Security_Audit-100%25_Secure-success?style=for-the-badge&logo=shield)](https://github.com/Thanujaradhakrishnan04/Trace/raw/main/Vulnerability%20Test%20Results/security_test.xlsx)

## 🌐 Live Website Deployment
🚀 **Live URL:** [https://thanujaradhakrishnan04.github.io/Trace/](https://thanujaradhakrishnan04.github.io/Trace/)

StreetSentinel is an intelligent real-time community safety, SafeWalk tracking, and emergency response platform built with React, Vite, Tailwind CSS, Leaflet, Web Audio API, and Firebase.

---

## 📊 Automated Test Reports (Direct Download)

All test reports are generated and updated automatically on every push via GitHub Actions CI/CD:

| Test Suite | Report File | Format | Cases | Status | Download Link |
| :--- | :--- | :---: | :---: | :---: | :--- |
| 🧪 **ECE / Selenium Tests** | `E2E_Functional_Test_Report.xlsx` | Excel (.xlsx) | 100 Cases | ✅ 100% Passed | [⬇️ **Download (.xlsx)**](https://github.com/Thanujaradhakrishnan04/Trace/raw/main/E2E_Functional_Test_Report.xlsx) |
| 📱 **Appium Mobile Tests** | `Appium_E2E_Test_Report_Final.xlsx` | Excel (.xlsx) | 100 Cases | ✅ 100% Passed | [⬇️ **Download (.xlsx)**](https://github.com/Thanujaradhakrishnan04/Trace/raw/main/Vulnerability%20Test%20Results/Appium_E2E_Test_Report_Final.xlsx) |
| 📱 **Appium Mobile (CSV)** | `Appium_E2E_Test_Report_Final.csv` | CSV (.csv) | 100 Cases | ✅ 100% Passed | [⬇️ **Download (.csv)**](https://github.com/Thanujaradhakrishnan04/Trace/raw/main/Vulnerability%20Test%20Results/Appium_E2E_Test_Report_Final.csv) |
| 🔒 **Security Audit Checks** | `security_test.xlsx` | Excel (.xlsx) | 400 Checks | ✅ 100% Secure | [⬇️ **Download (.xlsx)**](https://github.com/Thanujaradhakrishnan04/Trace/raw/main/Vulnerability%20Test%20Results/security_test.xlsx) |
| 🔒 **Security Audit (Alt)** | `Security_Audit_Report.xlsx` | Excel (.xlsx) | 400 Checks | ✅ 100% Secure | [⬇️ **Download (.xlsx)**](https://github.com/Thanujaradhakrishnan04/Trace/raw/main/Vulnerability%20Test%20Results/Security_Audit_Report.xlsx) |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 20+ / 22+
- npm

### 1. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Start Servers
```bash
# Start Backend (Port 4000)
cd server
node server.js

# Start Frontend (Port 5173) in a new terminal
npm run dev
```

Visit [https://localhost:5173/](https://localhost:5173/) in your browser.
