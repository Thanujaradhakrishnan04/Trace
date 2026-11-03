# 🛡️ StreetSentinel (Street-Patrol)

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-brightgreen?style=for-the-badge&logo=github)](https://thanujaradhakrishnan04.github.io/Trace/)
[![Comprehensive Tests](https://img.shields.io/github/actions/workflow/status/Thanujaradhakrishnan04/Trace/comprehensive-tests.yml?branch=main&label=CI%20%2F%20CD&style=for-the-badge)](https://github.com/Thanujaradhakrishnan04/Trace/actions)
[![Load Testing Status](https://img.shields.io/badge/Load_Testing-3500+_RPS-blue?style=for-the-badge&logo=speedtest)](https://github.com/Thanujaradhakrishnan04/Trace/raw/main/Load_Testing_Report.xlsx)
[![Security Status](https://img.shields.io/badge/Security_Audit-100%25_Secure-success?style=for-the-badge&logo=shield)](https://github.com/Thanujaradhakrishnan04/Trace/raw/main/Vulnerability%20Test%20Results/security_test.xlsx)

## 🌐 Live Website Deployment
🚀 **Live URL:** [https://thanujaradhakrishnan04.github.io/Trace/](https://thanujaradhakrishnan04.github.io/Trace/)

StreetSentinel is an intelligent real-time community safety, SafeWalk tracking, and emergency response platform built with React, Vite, Tailwind CSS, Leaflet, Web Audio API, and Firebase.

---

## ⚡ Baseline Load Testing Benchmark (100 Virtual Users / 1 Minute)

Under expected normal concurrency (100 simultaneous users streaming health and status telemetry continuously for 60 seconds):

| Performance Metric | Measured Value | Standard / SLA Benchmark | Status |
| :--- | :---: | :---: | :---: |
| **Virtual Users (VUs)** | **100 Concurrent Users** | 100 Users Target | ✅ Verified |
| **Duration** | **60 Seconds Continuous** | 1 Full Minute | ✅ Continuous |
| **Total Requests Handled** | **213,963 requests** | > 5,000 requests | 🚀 High Volume |
| **Throughput (RPS)** | **3,561.66 req/sec** | 100+ req/sec | ⚡ **35x Faster** |
| **Average Response Time** | **18.58 ms** | < 250 ms | 🟢 **Ultra Fast** |
| **Fastest Response (Min)** | **0.25 ms** | < 50 ms | ⚡ **Instant** |
| **Slowest Response (Max)** | **371.30 ms** | < 1,500 ms | 🟢 **Well Within SLA** |
| **P50 (Median Latency)** | **8.69 ms** | < 100 ms | 🟢 **Optimal** |
| **P95 Latency** | **87.91 ms** | < 250 ms | 🟢 **Optimal** |
| **P99 Latency** | **178.02 ms** | < 500 ms | 🟢 **Optimal** |
| **Success Rate** | **100.00%** | ≥ 99.5% | ✅ **0 Dropped Requests** |

📊 **Load Testing Excel Report:** [⬇️ **Download Load_Testing_Report.xlsx**](https://github.com/Thanujaradhakrishnan04/Trace/raw/main/Load_Testing_Report.xlsx)

---

## 📊 Automated Test Reports (Direct Download)

All test reports are generated and updated automatically on every push via GitHub Actions CI/CD:

| Test Suite | Report File | Format | Cases / Scope | Status | Direct Download Link |
| :--- | :--- | :---: | :---: | :---: | :--- |
| ⚡ **Baseline Load Testing** | `Load_Testing_Report.xlsx` | Excel (.xlsx) | 100 VUs / 60s (213K+ Reqs) | ✅ 100% Passed | [⬇️ **Download (.xlsx)**](https://github.com/Thanujaradhakrishnan04/Trace/raw/main/Load_Testing_Report.xlsx) |
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

### 3. Run Load Test (100 VUs / 1 Minute)
```bash
node load_test.cjs
```
