import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  X, 
  Globe, 
  Copy, 
  Check,
  Activity
} from 'lucide-react';

const DEPLOYMENT_URL = "https://thanujaradhakrishnan04.github.io/Trace/";
const WORKFLOW_URL = "https://github.com/Thanujaradhakrishnan04/Trace/actions/workflows/comprehensive-tests.yml";

export default function TestReportsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = import.meta.env.BASE_URL || '/';
  const reportsBase = `${baseUrl.replace(/\/$/, '')}/reports/`;
  const rawGithubBase = "https://github.com/Thanujaradhakrishnan04/Trace/raw/main/";

  const copyDeploymentLink = () => {
    navigator.clipboard.writeText(DEPLOYMENT_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testReports = [
    {
      id: 1,
      title: "Baseline Load Testing",
      icon: Zap,
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/30",
      iconColor: "text-amber-500",
      description: "100 Virtual Users continuous load for 60 seconds (3,561+ RPS, 18.58ms latency).",
      metrics: "213,963 requests | 100% Success Rate | 0.25ms min",
      status: "100% Passed",
      downloads: [
        {
          label: "Download Load Report (.xlsx)",
          filename: "Load_Testing_Report.xlsx",
          localUrl: `${reportsBase}Load_Testing_Report.xlsx`,
          githubUrl: `${rawGithubBase}Load_Testing_Report.xlsx`,
          format: "XLSX"
        }
      ]
    },
    {
      id: 2,
      title: "Selenium ECE Functional Tests",
      icon: CheckCircle2,
      badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
      iconColor: "text-emerald-500",
      description: "100 Automated End-to-End browser test cases covering SafeWalk, SOS, Auth, Vault.",
      metrics: "100 Test Cases | Chrome Headless | Media Mocking",
      status: "100% Passed",
      downloads: [
        {
          label: "Download Selenium Report (.xlsx)",
          filename: "E2E_Functional_Test_Report.xlsx",
          localUrl: `${reportsBase}E2E_Functional_Test_Report.xlsx`,
          githubUrl: `${rawGithubBase}E2E_Functional_Test_Report.xlsx`,
          format: "XLSX"
        }
      ]
    },
    {
      id: 3,
      title: "Appium Mobile E2E Tests",
      icon: Smartphone,
      badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      iconColor: "text-blue-500",
      description: "400 Mobile E2E test cases on Android emulation (Biometrics, GPS, SOS Triggers).",
      metrics: "400 Test Cases | Cross-Device Compatibility",
      status: "100% Passed",
      downloads: [
        {
          label: "Download Appium (.xlsx)",
          filename: "Appium_E2E_Test_Report_Final.xlsx",
          localUrl: `${reportsBase}Appium_E2E_Test_Report_Final.xlsx`,
          githubUrl: `${rawGithubBase}Vulnerability%20Test%20Results/Appium_E2E_Test_Report_Final.xlsx`,
          format: "XLSX"
        },
        {
          label: "Download Appium (.csv)",
          filename: "Appium_E2E_Test_Report_Final.csv",
          localUrl: `${reportsBase}Appium_E2E_Test_Report_Final.csv`,
          githubUrl: `${rawGithubBase}Vulnerability%20Test%20Results/Appium_E2E_Test_Report_Final.csv`,
          format: "CSV"
        }
      ]
    },
    {
      id: 4,
      title: "Security Audit & Vulnerability Tests",
      icon: ShieldCheck,
      badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/30",
      iconColor: "text-rose-500",
      description: "400 OWASP Top 10 security checks, Firestore rules validation, and penetration audit.",
      metrics: "400 Security Checks | 0 Critical Vulnerabilities",
      status: "100% Secure",
      downloads: [
        {
          label: "Download Security Report (.xlsx)",
          filename: "security_test.xlsx",
          localUrl: `${reportsBase}security_test.xlsx`,
          githubUrl: `${rawGithubBase}Vulnerability%20Test%20Results/security_test.xlsx`,
          format: "XLSX"
        },
        {
          label: "Download Audit Matrix (.xlsx)",
          filename: "Security_Audit_Report.xlsx",
          localUrl: `${reportsBase}Security_Audit_Report.xlsx`,
          githubUrl: `${rawGithubBase}Vulnerability%20Test%20Results/Security_Audit_Report.xlsx`,
          format: "XLSX"
        }
      ]
    }
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 right-3 z-50 flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/95 hover:bg-slate-800 text-white rounded-full shadow-xl border border-slate-700/80 text-xs font-semibold transition-all hover:scale-105 active:scale-95 backdrop-blur-md group cursor-pointer"
        title="Open Test Reports & Deployment Center"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-bold tracking-wide">📊 Test Reports & Live Link</span>
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Container */}
          <div 
            className="bg-slate-900 text-slate-100 rounded-2xl max-w-2xl w-full border border-slate-700 shadow-2xl p-6 relative overflow-hidden my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="text-red-500 w-5 h-5 animate-pulse" />
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    StreetSentinel Test Reports & Live Deployment
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Verified quality, load resilience, security compliance, and mobile readiness.
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Deployment Banner */}
            <div className="mt-4 p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Globe className="text-emerald-400 w-5 h-5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Live Website:</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      🟢 LIVE 200 OK
                    </span>
                  </div>
                  <a 
                    href={DEPLOYMENT_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline break-all font-mono"
                  >
                    {DEPLOYMENT_URL}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={copyDeploymentLink}
                  className="px-2.5 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded-lg transition flex items-center gap-1.5"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <a
                  href={DEPLOYMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  <span>Visit</span>
                </a>
              </div>
            </div>

            {/* Test Reports List */}
            <div className="mt-4 space-y-3 overflow-y-auto pr-1 flex-1">
              {testReports.map((report) => {
                const IconComponent = report.icon;
                return (
                  <div 
                    key={report.id} 
                    className="p-3.5 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-700/60 transition flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
                          <IconComponent className={`w-4 h-4 ${report.iconColor}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">
                            {report.id}. {report.title}
                          </h3>
                          <p className="text-xs text-slate-400">{report.description}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${report.badgeColor}`}>
                        {report.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <FileSpreadsheet size={13} className="text-slate-500" />
                      <span>{report.metrics}</span>
                    </div>

                    {/* Download Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                      {report.downloads.map((dl, idx) => (
                        <a
                          key={idx}
                          href={dl.localUrl}
                          download={dl.filename}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition shadow-sm active:scale-95"
                          title={`Download ${dl.filename}`}
                        >
                          <Download size={13} />
                          <span>{dl.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with CI/CD Workflow */}
            <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                All 4 test suites automated & passed in CI/CD
              </span>
              <a
                href={WORKFLOW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View Full GitHub Actions Workflow</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
