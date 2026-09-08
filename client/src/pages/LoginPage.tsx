import React, { useState } from 'react';
import { Shield, Lock, Mail, Scale, CheckCircle2, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role: 'inspector' | 'admin') => {
    const creds = role === 'inspector' 
      ? { email: 'inspector@gov.in', pass: 'inspector123' }
      : { email: 'admin@gov.in', pass: 'admin123' };

    setEmail(creds.email);
    setPassword(creds.pass);
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(creds.email, creds.pass);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      background: 'radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.15) 0%, rgba(7, 10, 18, 1) 70%)'
    }}>
      <div style={{ maxWidth: '460px', width: '100%' }}>
        {/* Emblem Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)'
          }}>
            <Scale size={34} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
            Legal Metrology Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Packaged Commodities Compliance &amp; Statutory Enforcement
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            background: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            padding: '2px 10px',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            color: '#facc15',
            fontWeight: 600
          }}>
            <span>⚖️ Legal Metrology (Packaged Commodities) Rules, 2011</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="var(--accent-blue-light)" />
            Official Authentication
          </h2>

          {error && (
            <div style={{
              background: 'var(--status-noncompliant-bg)',
              border: '1px solid var(--status-noncompliant-border)',
              color: '#fca5a5',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} color="#ef4444" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                GOVERNMENT EMAIL ID
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@gov.in"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'var(--bg-glass-heavy)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                SECURE PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'var(--bg-glass-heavy)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Enforcement Portal'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* 1-Click Demo Profiles */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Instant Demo Access (No typing required)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => quickLogin('inspector')}
                disabled={loading}
                className="btn btn-secondary"
                style={{ padding: '10px 8px', fontSize: '0.78rem', justifyContent: 'center' }}
              >
                <Shield size={14} color="#60a5fa" />
                Inspector Demo
              </button>

              <button
                type="button"
                onClick={() => quickLogin('admin')}
                disabled={loading}
                className="btn btn-secondary"
                style={{ padding: '10px 8px', fontSize: '0.78rem', justifyContent: 'center' }}
              >
                <UserCheck size={14} color="#facc15" />
                Admin Demo
              </button>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Footer */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Authorized for Officers under the Legal Metrology Act, 2009.
          <br />Section 36 penalty provisions automated.
        </div>
      </div>
    </div>
  );
};
