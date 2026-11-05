import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.jsx'

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global Error Caught by Boundary:", error, errorInfo);
  }

  handleCleanReset = async () => {
    try {
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      try {
        localStorage.removeItem('sentinel_contacts');
        localStorage.removeItem('sentinel_vault_records');
      } catch (e) {}
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    const targetUrl = import.meta.env.BASE_URL || '/';
    window.location.href = targetUrl;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#ef4444' }}>
            StreetSentinel System Recovery
          </h1>
          <p style={{ maxWidth: '440px', color: '#94a3b8', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
            A runtime synchronization event occurred. Tap below to launch a clean, verified session of StreetSentinel.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleCleanReset}
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239,68,68,0.4)'
              }}
            >
              Enter StreetSentinel
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>

          {this.state.error && (
            <details style={{ marginTop: '24px', maxWidth: '520px', textAlign: 'left', background: 'rgba(0,0,0,0.5)', padding: '12px 16px', borderRadius: '10px', fontSize: '11px', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
              <summary style={{ cursor: 'pointer', color: '#94a3b8', fontWeight: 'bold' }}>Diagnostics Details</summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '8px' }}>
                {this.state.error.toString()}
                {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// Service Worker Management:
// In Capacitor native mobile platform, assets are bundled locally; registering sw.js causes WebView caching loops.
if (Capacitor.isNativePlatform()) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    }).catch(() => {});
  }
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/';
    const swUrl = `${base.replace(/\/$/, '')}/sw.js`;
    navigator.serviceWorker.register(swUrl)
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)
