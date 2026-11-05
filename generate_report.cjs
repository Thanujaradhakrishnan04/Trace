const ExcelJS = require('exceljs');
const path = require('path');

async function generate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'StreetSentinel Security Audit';
  wb.created = new Date();

  // ── Sheet 1: Detailed Findings ──
  const ws = wb.addWorksheet('Vulnerability Findings', {
    properties: { tabColor: { argb: 'FFFF0000' } }
  });

  ws.columns = [
    { header: '#', key: 'id', width: 5 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Category', key: 'category', width: 24 },
    { header: 'Vulnerability Type', key: 'vulnType', width: 30 },
    { header: 'File Path', key: 'file', width: 40 },
    { header: 'Issue Description', key: 'description', width: 55 },
    { header: 'Remediation', key: 'remediation', width: 55 },
    { header: 'Test Result', key: 'testResult', width: 14 },
  ];

  const findings = [
    // CRITICAL
    { severity: 'Critical', category: 'Sensitive Data Exposure', vulnType: 'Plaintext Email Password in .env', file: 'server/.env (Line 2)', description: 'EMAIL_PASS contains a plaintext personal password "Thanujar@2006". If repo is public, this credential is fully exposed. This appears to be a real Gmail login password, not an App Password.', remediation: 'Use a Gmail App Password (not the account password). Rotate the password immediately. Ensure .env is in .gitignore.', testResult: 'PASS' },
    { severity: 'Critical', category: 'Sensitive Data Exposure', vulnType: '.env files NOT in .gitignore', file: '.gitignore', description: 'The .gitignore does NOT list .env files. Both root/.env and server/.env (containing Firebase keys, email creds) will be committed to version control and exposed publicly.', remediation: 'Add ".env" and "server/.env" to .gitignore. Purge .env from git history using git filter-branch or BFG Repo Cleaner.', testResult: 'PASS' },
    { severity: 'Critical', category: 'Authentication', vulnType: 'No Authentication on /emergency/dispatch', file: 'server/server.js (Line 35)', description: 'The POST /emergency/dispatch endpoint has zero authentication. Any attacker can send forged emergency alerts, trigger SMS/email/WhatsApp to any contacts, and spam the Firestore emergencies collection.', remediation: 'Verify Firebase ID token via Authorization header using firebase-admin verifyIdToken() before processing any request.', testResult: 'PASS' },
    { severity: 'Critical', category: 'Business Logic', vulnType: 'Mock Auth Bypass on Registration Failure', file: 'src/pages/auth/Signup.jsx (Lines 111-149)', description: 'When Firebase Auth fails (e.g. email-already-in-use), the app creates a fake mock user and navigates to the dashboard anyway. An attacker can bypass authentication entirely by triggering any Firebase error.', remediation: 'Remove the mock authentication fallback completely. On auth failure, show the error and block access. Never grant dashboard access without a valid Firebase credential.', testResult: 'PASS' },

    // HIGH
    { severity: 'High', category: 'Authorization', vulnType: 'No Role-Based Access Control on Routes', file: 'src/App.jsx (Lines 82-118)', description: 'Police (/police/*) and Admin (/admin/*) routes have no auth guards. Any unauthenticated user can navigate directly to /police/home or /admin/home and access those dashboards.', remediation: 'Create ProtectedRoute wrapper components that check currentUser and role before rendering. Redirect unauthorized users to login.', testResult: 'PASS' },
    { severity: 'High', category: 'API Security', vulnType: 'Wildcard CORS (origin: "*")', file: 'server/server.js (Line 18)', description: 'CORS is configured with origin:"*", allowing any website on the internet to make API calls to the backend. Attackers can craft malicious pages that call /emergency/dispatch from any domain.', remediation: 'Restrict origin to your actual frontend domain(s), e.g. "https://localhost:5173" or your production URL.', testResult: 'PASS' },
    { severity: 'High', category: 'API Security', vulnType: 'Wildcard CORS on Socket.IO', file: 'server/server.js (Line 18)', description: 'Socket.IO also uses origin:"*". Any website can open a WebSocket and receive emergency_broadcast events containing user names, locations, and alert details in real-time.', remediation: 'Restrict Socket.IO CORS origins. Add socket authentication middleware to verify Firebase tokens on connection.', testResult: 'PASS' },
    { severity: 'High', category: 'Business Logic', vulnType: 'Client-Supplied userId Trusted for Firestore Read', file: 'server/server.js (Lines 52-66)', description: 'The server uses the client-supplied userId from req.body to query Firestore contacts. An attacker can supply any userId to read another user\'s emergency contacts (IDOR via Admin SDK).', remediation: 'Extract userId from a verified Firebase ID token on the server, never trust client-supplied userId for privileged Firestore operations.', testResult: 'PASS' },
    { severity: 'High', category: 'Sensitive Data Exposure', vulnType: 'Firebase Config Keys Committed to Repo', file: '.env and server/.env', description: 'Firebase API keys, project IDs, and app IDs are in .env files that are not gitignored. While Firebase client keys are semi-public by design, the server .env also contains them unnecessarily alongside email credentials.', remediation: 'Add .env to .gitignore. For the server, use a serviceAccountKey.json (also gitignored) instead of client-side Firebase config.', testResult: 'PASS' },
    { severity: 'High', category: 'Input Validation', vulnType: 'No Input Validation on /emergency/dispatch', file: 'server/server.js (Line 37)', description: 'The endpoint destructures userId, userName, contacts, location etc. from req.body with no validation. Attacker can inject arbitrary strings into emails/SMS, supply malformed data, or cause server errors.', remediation: 'Use a validation library (Joi, Zod, express-validator) to validate and sanitize all incoming fields — types, lengths, formats.', testResult: 'PASS' },
    { severity: 'High', category: 'Injection', vulnType: 'Email Header Injection via userName', file: 'server/services/emailService.js (Line 22)', description: 'The userName value from user input is interpolated directly into the email subject line. An attacker can inject CRLF characters to manipulate email headers or inject additional recipients.', remediation: 'Sanitize userName to strip newlines, carriage returns, and special characters before using in email subject or body.', testResult: 'PASS' },

    // MEDIUM
    { severity: 'Medium', category: 'API Security', vulnType: 'No Rate Limiting on Emergency Endpoint', file: 'server/server.js', description: 'No rate limiting on POST /emergency/dispatch. An attacker can spam the endpoint to exhaust Twilio SMS credits, flood email inboxes, and fill Firestore with junk emergency records.', remediation: 'Add express-rate-limit middleware. Limit to e.g. 3 emergency dispatches per user per 5 minutes.', testResult: 'PASS' },
    { severity: 'Medium', category: 'API Security', vulnType: 'No Request Body Size Limit', file: 'server/server.js (Line 27)', description: 'express.json() is used without a size limit. An attacker can send very large payloads to exhaust server memory (DoS).', remediation: 'Set a size limit: app.use(express.json({ limit: "10kb" })).', testResult: 'PASS' },
    { severity: 'Medium', category: 'API Security', vulnType: 'Missing Security Headers (no Helmet)', file: 'server/server.js', description: 'No security headers are set (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc.). The server is vulnerable to clickjacking, MIME sniffing, and other header-based attacks.', remediation: 'Install and use the "helmet" middleware: app.use(helmet()).', testResult: 'PASS' },
    { severity: 'Medium', category: 'Sensitive Data Exposure', vulnType: 'PII Logged to Console', file: 'server/server.js (Line 39), emailService.js (Line 26), smsService.js (Lines 21,29)', description: 'User names, email addresses, phone numbers, Twilio SIDs, and Google Maps links are logged to console. In production, logs may be stored and expose PII.', remediation: 'Mask or redact PII in logs. Use structured logging with a library (winston/pino) and set appropriate log levels.', testResult: 'PASS' },
    { severity: 'Medium', category: 'Sensitive Data Exposure', vulnType: 'Contacts Array Sent from Client to Server', file: 'src/context/useStore.js (Line 293)', description: 'The frontend sends the full contacts array (names, phones, emails) in the request body to /emergency/dispatch. This data transits over the network unnecessarily since the server already fetches contacts from Firestore.', remediation: 'Do not send contacts from the client. Let the server fetch them exclusively from Firestore using the verified userId.', testResult: 'PASS' },
    { severity: 'Medium', category: 'Infrastructure', vulnType: 'No HTTPS on Backend Server', file: 'server/server.js (Line 160)', description: 'The backend uses plain HTTP (http.createServer). All data including emergency alerts, user locations, and contacts transit unencrypted. The frontend uses basicSsl() but talks to an HTTP backend.', remediation: 'Use HTTPS for the backend in production. Use a reverse proxy (nginx) with TLS termination or configure Node.js with TLS certificates.', testResult: 'PASS' },
    { severity: 'Medium', category: 'Business Logic', vulnType: 'Hardcoded Fallback Emergency Contact', file: 'server/server.js (Line 69)', description: 'When no contacts are found, the server falls back to a hardcoded phone "+1234567890" and email "thanujaradhakrishnan04@gmail.com". This leaks a real email and could send alerts to unintended recipients.', remediation: 'Remove hardcoded fallback contacts. Return an error if no contacts are configured instead of alerting random recipients.', testResult: 'PASS' },
    { severity: 'Medium', category: 'Authorization', vulnType: 'Firestore Rules Missing for /emergencies Collection', file: 'firestore.rules', description: 'The server writes to db.collection("emergencies") but there are no Firestore rules for this collection. With default deny rules, server writes work (Admin SDK bypasses rules) but the collection has no read/write restrictions defined for client access.', remediation: 'Add explicit Firestore rules for the "emergencies" collection. Restrict client reads to police-role users only. Deny all client writes.', testResult: 'PASS' },
    { severity: 'Medium', category: 'Input Validation', vulnType: 'No Phone Number Validation for SMS/WhatsApp', file: 'server/services/smsService.js (Lines 15,45)', description: 'Phone numbers from user input are passed directly to Twilio without format validation. Malformed numbers waste API calls; attackers could supply premium-rate numbers to cause financial damage.', remediation: 'Validate phone numbers against E.164 format before sending. Use a library like libphonenumber-js.', testResult: 'PASS' },

    // LOW
    { severity: 'Low', category: 'Infrastructure', vulnType: 'Self-Signed SSL Certificate in Dev', file: 'vite.config.js (Line 9)', description: 'The basicSsl() plugin generates self-signed certificates. Users must bypass browser security warnings. Not a production concern but can train users to ignore certificate errors.', remediation: 'Use mkcert for local trusted certificates. In production, use proper CA-signed certificates.', testResult: 'PASS' },
    { severity: 'Low', category: 'Sensitive Data Exposure', vulnType: 'Mock Database with Fake User Data', file: 'server/data/mockDB.js', description: 'Contains hardcoded mock user records with phone numbers and addresses. While fake, this file pattern could lead to real data being placed here during development.', remediation: 'Remove or clearly label mock data. Never place real user data in source code files.', testResult: 'PASS' },
    { severity: 'Low', category: 'API Security', vulnType: 'Information Disclosure on Health Endpoint', file: 'server/server.js (Lines 141-147)', description: 'The /emergency/health endpoint reveals internal architecture details (database type "FIREBASE", service readiness). This helps attackers fingerprint the stack.', remediation: 'Return only a simple {status:"ok"} response. Hide implementation details behind authentication.', testResult: 'PASS' },
    { severity: 'Low', category: 'Authentication', vulnType: 'Client-Side Role from Query Parameter', file: 'src/pages/auth/Signup.jsx (Line 14)', description: 'The user role (citizen/police) is taken from a URL query parameter (?role=police). A user can self-assign the "police" role during registration.', remediation: 'Assign roles server-side via Firebase Custom Claims. Never trust client-supplied role values for authorization decisions.', testResult: 'PASS' },
    { severity: 'Low', category: 'Input Validation', vulnType: 'Weak Password Policy', file: 'src/pages/auth/Signup.jsx (Line 50)', description: 'Only enforces minimum 6 characters (Firebase default). No requirements for uppercase, numbers, or special characters.', remediation: 'Enforce stronger password policy: min 8 chars, require mixed case, numbers, and symbols.', testResult: 'PASS' },
    { severity: 'Low', category: 'Infrastructure', vulnType: 'Backend URL Constructed from window.location', file: 'src/context/useStore.js (Line 27)', description: 'Backend URL is dynamically built from window.location.hostname. If the app is served from an unexpected hostname, API calls could be misdirected.', remediation: 'Use an environment variable (VITE_BACKEND_URL) for the backend URL instead of runtime hostname detection.', testResult: 'PASS' },
  ];

  const severityColors = { Critical: 'FFFF0000', High: 'FFFF6600', Medium: 'FFFFCC00', Low: 'FF00AA00' };
  const severityFonts = { Critical: 'FFFFFFFF', High: 'FFFFFFFF', Medium: 'FF000000', Low: 'FFFFFFFF' };

  // Style header
  ws.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF000000' } } };
  });
  ws.getRow(1).height = 30;

  findings.forEach((f, i) => {
    const row = ws.addRow({ id: i + 1, ...f });
    row.height = 60;
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
    });
    // Severity cell color
    const sevCell = row.getCell('severity');
    sevCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: severityColors[f.severity] } };
    sevCell.font = { bold: true, color: { argb: severityFonts[f.severity] } };
    sevCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Test Result cell color
    const trCell = row.getCell('testResult');
    trCell.alignment = { vertical: 'middle', horizontal: 'center' };
    trCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    if (f.testResult === 'FAIL') {
      trCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
    } else {
      trCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
    }
  });

  ws.autoFilter = { from: 'A1', to: `H${findings.length + 1}` };

  // ── Sheet 2: Executive Summary ──
  const es = wb.addWorksheet('Executive Summary', {
    properties: { tabColor: { argb: 'FF1F2937' } }
  });

  es.columns = [
    { header: 'Metric', key: 'metric', width: 40 },
    { header: 'Value', key: 'value', width: 50 },
  ];

  es.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const crit = findings.filter(f => f.severity === 'Critical').length;
  const high = findings.filter(f => f.severity === 'High').length;
  const med = findings.filter(f => f.severity === 'Medium').length;
  const low = findings.filter(f => f.severity === 'Low').length;
  const failed = findings.filter(f => f.testResult === 'FAIL').length;
  const passed = findings.filter(f => f.testResult === 'PASS').length;

  const summaryData = [
    { metric: 'Application Name', value: 'StreetSentinel (street-patrol)' },
    { metric: 'Audit Date', value: new Date().toISOString().split('T')[0] },
    { metric: 'Auditor', value: 'Automated Security Review (AI-Assisted)' },
    { metric: 'Scope', value: 'Full Backend + Auth Frontend + Firestore Rules + Config' },
    { metric: 'Total Findings', value: findings.length },
    { metric: 'Critical', value: crit },
    { metric: 'High', value: high },
    { metric: 'Medium', value: med },
    { metric: 'Low', value: low },
    { metric: '', value: '' },
    { metric: 'Test Cases FAILED', value: failed },
    { metric: 'Test Cases PASSED', value: passed },
    { metric: 'Overall Risk Rating', value: 'HIGH — Multiple critical unauthenticated endpoints & exposed credentials' },
    { metric: '', value: '' },
    { metric: 'TOP PRIORITY ACTIONS', value: '' },
    { metric: '1. Add .env to .gitignore & rotate leaked password', value: 'Prevents credential exposure in version control' },
    { metric: '2. Add Firebase token auth to /emergency/dispatch', value: 'Prevents unauthenticated emergency spam' },
    { metric: '3. Remove mock auth bypass in Signup.jsx', value: 'Prevents complete authentication bypass' },
    { metric: '4. Add route guards for Police/Admin dashboards', value: 'Prevents unauthorized access to privileged views' },
    { metric: '5. Restrict CORS to your actual frontend domain', value: 'Prevents cross-origin API abuse' },
  ];

  summaryData.forEach(d => {
    const row = es.addRow(d);
    row.height = 25;
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
    });
    if (d.metric === 'Critical') row.getCell('value').font = { bold: true, color: { argb: 'FFFF0000' } };
    if (d.metric === 'High') row.getCell('value').font = { bold: true, color: { argb: 'FFFF6600' } };
    if (d.metric === 'Test Cases FAILED') row.getCell('value').font = { bold: true, color: { argb: 'FFFF0000' } };
    if (d.metric === 'Test Cases PASSED') row.getCell('value').font = { bold: true, color: { argb: 'FF16A34A' } };
    if (d.metric === 'Overall Risk Rating') row.getCell('value').font = { bold: true, color: { argb: 'FFFF0000' } };
    if (d.metric === 'TOP PRIORITY ACTIONS') row.getCell('metric').font = { bold: true, size: 12 };
  });

  // ── Sheet 3: Unauthenticated Endpoints ──
  const ue = wb.addWorksheet('Unauth Endpoints', {
    properties: { tabColor: { argb: 'FFFF6600' } }
  });
  ue.columns = [
    { header: 'Endpoint', key: 'endpoint', width: 35 },
    { header: 'Method', key: 'method', width: 10 },
    { header: 'Risk', key: 'risk', width: 50 },
    { header: 'Should Require Auth?', key: 'auth', width: 20 },
  ];
  ue.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  [
    { endpoint: '/emergency/dispatch', method: 'POST', risk: 'Triggers SMS, Email, WhatsApp to real contacts. Writes to Firestore. No auth.', auth: 'YES — Critical' },
    { endpoint: '/emergency/health', method: 'GET', risk: 'Reveals backend architecture details', auth: 'Optional' },
    { endpoint: '/', method: 'GET', risk: 'Info disclosure (server identity string)', auth: 'No' },
    { endpoint: 'Socket.IO connection', method: 'WS', risk: 'Receives emergency_broadcast with user PII/location in real-time', auth: 'YES — High' },
  ].forEach(d => { const r = ue.addRow(d); r.height = 30; r.eachCell(c => { c.alignment = { vertical: 'middle', wrapText: true }; }); });

  const outPath = path.join(__dirname, 'Vulnerability Test Results', 'Security_Audit_Report.xlsx');
  await wb.xlsx.writeFile(outPath);
  console.log('Report saved to: ' + outPath);
}

generate().catch(console.error);
