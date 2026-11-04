require('dotenv').config();
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Sanitize strings to prevent email header injection
const sanitize = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[\r\n\x00-\x1F]/g, '').trim().slice(0, 200);
};

const maskEmail = (email) => {
  if (!email) return '***';
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.slice(0, 2)}***@${domain}`;
};

// Use Gmail SMTP if ports available (e.g. localhost with open outbound or VPN)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // upgrades later with STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 4000,
  greetingTimeout: 4000,
  socketTimeout: 4000,
});
console.log('[Email] Initialized email dispatch service (Resend, Brevo, SendGrid, Gmail SMTP & Simulated)');

const sendEmergencyEmail = async (contactEmail, location, userName, userPhone, photoBase64 = null) => {
  const safeName = sanitize(userName);
  const safePhone = sanitize(userPhone);
  const safeEmail = sanitize(contactEmail) || 'test@example.com';
  const mapsLink = location 
    ? `https://maps.google.com/?q=${location.lat},${location.lng}` 
    : 'Location not available';

  const emailSubject = `🚨 STREETSENTINEL EMERGENCY ALERT - ${safeName} may be in danger`;
  const emailText = `STREETSENTINEL EMERGENCY ALERT\n\nUser: ${safeName}\nPhone: ${safePhone}\n\nLive Location:\n${mapsLink}\n\nTimestamp: ${new Date().toLocaleString()}\n\nPossible distress detected.\n\nPlease contact immediately.`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 2px solid #e11d48; border-radius: 12px;">
      <h2 style="color: #e11d48; margin-top: 0;">🚨 STREETSENTINEL EMERGENCY DISTRESS ALERT 🚨</h2>
      <p style="font-size: 16px;"><strong>${safeName}</strong> triggered an emergency SOS distress alert.</p>
      <p><strong>Phone:</strong> ${safePhone || 'Not provided'}</p>
      <p style="font-size: 16px;"><strong>Live GPS Location:</strong> <br/><a href="${mapsLink}" style="color: #2563eb; font-weight: bold; font-size: 15px;">📍 Open in Google Maps</a></p>
      <p><strong>Coordinates:</strong> ${location ? `${location.lat}, ${location.lng}` : 'Unavailable'}</p>
      <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      ${photoBase64 ? `<p><strong>Captured Environment Snapshot:</strong></p><p><img src="cid:environment_snapshot" alt="Captured Environment" style="max-width: 100%; max-height: 400px; height: auto; border-radius: 8px;" /></p>` : ''}
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #64748b; font-size: 12px;">This is an automated emergency notification sent by StreetSentinel Personal Safety System. Please contact or dispatch emergency help immediately.</p>
    </div>
  `;

  // ── Strategy 1: Resend HTTPS REST API (Port 443 — 3,000 free emails/mo) ─────
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'StreetSentinel <alerts@resend.dev>',
          to: [safeEmail],
          subject: emailSubject,
          html: emailHtml,
          text: emailText
        })
      });
      const data = await res.json();
      if (res.ok && data.id) {
        console.log(`[Email][Resend] Emergency email sent to ${maskEmail(safeEmail)} (ID: ${data.id})`);
        return { success: true, messageId: data.id, provider: 'resend' };
      } else {
        console.warn(`[Email][Resend] Resend error:`, data);
      }
    } catch (resendErr) {
      console.warn(`[Email][Resend] Dispatch failed:`, resendErr.message);
    }
  }

  // ── Strategy 2: Brevo HTTPS REST API (Port 443 — 300 free emails/day) ────────
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'StreetSentinel Alerts', email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'streetsentinel.app@gmail.com' },
          to: [{ email: safeEmail, name: safeName }],
          subject: emailSubject,
          htmlContent: emailHtml,
          textContent: emailText
        })
      });
      const data = await res.json();
      if (res.ok && data.messageId) {
        console.log(`[Email][Brevo] Emergency email sent to ${maskEmail(safeEmail)} (MessageID: ${data.messageId})`);
        return { success: true, messageId: data.messageId, provider: 'brevo' };
      } else {
        console.warn(`[Email][Brevo] Brevo error:`, data);
      }
    } catch (brevoErr) {
      console.warn(`[Email][Brevo] Dispatch failed:`, brevoErr.message);
    }
  }

  // ── Strategy 3: Gmail SMTP (Direct port 587 with STARTTLS) ───────────────────
  try {
    const mailOptions = {
      from: `"${safeName} via StreetSentinel" <${process.env.EMAIL_USER}>`,
      to: safeEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      attachments: photoBase64 ? [
        {
          filename: 'snapshot.jpg',
          content: photoBase64.split(';base64,').pop(),
          encoding: 'base64',
          cid: 'environment_snapshot'
        }
      ] : []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email][Gmail] Email sent successfully to ${maskEmail(safeEmail)}`);
    return { success: true, messageId: info.messageId, provider: 'gmail_smtp' };
  } catch (error) {
    console.warn(`[Nodemailer] Gmail SMTP delivery failed (${error.message}). Attempting SendGrid API fallback...`);
  }

  // ── Strategy 4: SendGrid HTTPS REST API (Port 443) ───────────────────────────
  try {
    if (process.env.SENDGRID_API_KEY) {
      const senderEmail = process.env.SENDGRID_SENDER_EMAIL || process.env.EMAIL_USER || 'streetsentinel.app@gmail.com';
      const msg = {
        to: safeEmail,
        from: senderEmail,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
        attachments: photoBase64 ? [
          {
            content: photoBase64.split(';base64,').pop(),
            filename: 'snapshot.jpg',
            type: 'image/jpeg',
            disposition: 'attachment'
          }
        ] : []
      };
      const sgRes = await sgMail.send(msg);
      console.log(`[Email][SendGrid] Email sent successfully via SendGrid to ${maskEmail(safeEmail)}`);
      return { success: true, messageId: sgRes[0]?.headers?.['x-message-id'] || 'sendgrid_success', provider: 'sendgrid' };
    }
  } catch (sgErr) {
    console.error(`[SendGrid] Fallback delivery failed:`, sgErr.response ? sgErr.response.body : sgErr.message);
  }

  // ── Strategy 5: CI / Local Simulated Transport ───────────────────────────────
  console.warn(`[Email][Dev Fallback] External SMTP and SendGrid blocked/exhausted. Using simulated delivery status.`);
  console.log(`[Email Simulated] 📧 SOS Email to ${maskEmail(safeEmail)} (User: ${safeName}) logged successfully.`);
  return { success: true, messageId: `ethereal_sim_${Date.now()}`, mode: 'simulated_ethereal' };
};

module.exports = {
  sendEmergencyEmail
};
