import React, { useState } from 'react';
import { 
  Shield, Lock, Mail, Scale, CheckCircle2, AlertTriangle, 
  ArrowRight, Eye, EyeOff, Phone, User, Check, X 
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In Form States
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'inspector' | 'admin'>('inspector');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Real-Time Google-Style Password Strength Checker
  const checkPasswordStrength = (pass: string) => {
    const hasMinLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass);

    const score = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    return {
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      score, // 0 to 5
      isStrong: score >= 5
    };
  };

  const strength = checkPasswordStrength(signUpPassword);

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return { label: 'Very Weak', color: '#ef4444', width: '20%' };
      case 2:
        return { label: 'Weak', color: '#f97316', width: '40%' };
      case 3:
        return { label: 'Fair', color: '#f59e0b', width: '60%' };
      case 4:
        return { label: 'Good', color: '#3b82f6', width: '80%' };
      case 5:
        return { label: 'Strong (Google Standard)', color: '#10b981', width: '100%' };
      default:
        return { label: '', color: '#64748b', width: '0%' };
    }
  };

  const strengthMeta = getStrengthLabel(strength.score);

  // Handle Sign In Submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInIdentifier || !signInPassword) {
      setError('Please enter your email or Indian phone number and password');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.login(signInIdentifier, signInPassword);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Client-side validations
    if (!firstName.trim() || !lastName.trim() || !signUpEmail.trim() || !signUpPhone.trim() || !signUpPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    const cleanPhone = signUpPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || !/^[6-9]\d{9}$/.test(cleanPhone.slice(-10))) {
      setError('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
      return;
    }

    if (!strength.isStrong) {
      setError('Password does not satisfy enterprise security requirements. See checklist below.');
      return;
    }

    if (signUpPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: signUpEmail.trim(),
        phone: signUpPhone.trim(),
        password: signUpPassword,
        role: selectedRole
      });

      setSuccessMsg('Account created successfully! Redirecting...');
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
      padding: '30px 20px',
      background: 'radial-gradient(circle at 50% 15%, rgba(37, 99, 235, 0.18) 0%, rgba(7, 10, 18, 1) 75%)'
    }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>
        {/* Emblem Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '62px',
            height: '62px',
            margin: '0 auto 14px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)'
          }}>
            <Scale size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>
            Legal Metrology Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            National Packaged Commodities Enforcement &amp; Compliance System
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            color: '#34d399',
            fontWeight: 600
          }}>
            <Shield size={12} />
            <span>Enterprise Security • Salted Bcrypt Encryption Active</span>
          </div>
        </div>

        {/* Main Auth Card */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          {/* Sign In vs Sign Up Tab Switcher */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-glass-heavy)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '24px'
          }}>
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                background: mode === 'signin' ? 'var(--accent-blue)' : 'transparent',
                color: mode === 'signin' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                background: mode === 'signup' ? 'var(--accent-blue)' : 'transparent',
                color: mode === 'signup' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div style={{
              background: 'var(--status-noncompliant-bg)',
              border: '1px solid var(--status-noncompliant-border)',
              color: '#fca5a5',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              lineHeight: 1.4
            }}>
              <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'var(--status-compliant-bg)',
              border: '1px solid var(--status-compliant-border)',
              color: '#34d399',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: SIGN IN */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  GOVERNMENT EMAIL OR INDIAN MOBILE NUMBER
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="officer@gov.in or 9876543210"
                    autoComplete="username"
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    PASSWORD
                  </label>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type={showSignInPassword ? "text" : "password"}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter your secure password"
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 38px',
                      background: 'var(--bg-glass-heavy)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '10px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                New Officer?{' '}
                <span 
                  onClick={() => { setMode('signup'); setError(null); }}
                  style={{ color: '#60a5fa', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Create an account
                </span>
              </div>
            </form>
          ) : (
            /* MODE 2: SIGN UP */
            <form onSubmit={handleSignUp}>
              {/* Name Row: First Name & Last Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    FIRST NAME *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-glass-heavy)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    LAST NAME *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-glass-heavy)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  OFFICIAL EMAIL ADDRESS *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="officer.name@gov.in"
                    autoComplete="email"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 38px',
                      background: 'var(--bg-glass-heavy)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Indian Phone Number Input */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  INDIAN MOBILE NUMBER *
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{
                    padding: '9px 10px',
                    background: 'var(--bg-glass-heavy)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '8px',
                    color: '#60a5fa',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>🇮🇳 +91</span>
                  </div>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="tel"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      placeholder="98765 43210 (10 Digits)"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-glass-heavy)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Password Input with Google Strength Meter */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  PASSWORD (GOOGLE-GRADE PROTECTION) *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <input
                    type={showSignUpPassword ? "text" : "password"}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Create a strong password"
                    style={{
                      width: '100%',
                      padding: '9px 40px 9px 38px',
                      background: 'var(--bg-glass-heavy)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '9px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showSignUpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {signUpPassword && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                      <span style={{ color: strengthMeta.color, fontWeight: 700 }}>{strengthMeta.label}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        width: strengthMeta.width,
                        height: '100%',
                        background: strengthMeta.color,
                        transition: 'all 0.3s ease'
                      }} />
                    </div>

                    {/* Requirement Checklist */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '4px',
                      marginTop: '8px',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: strength.hasMinLength ? '#34d399' : 'inherit' }}>
                        {strength.hasMinLength ? <Check size={12} color="#10b981" /> : <X size={12} />} 8+ characters
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: strength.hasUpper ? '#34d399' : 'inherit' }}>
                        {strength.hasUpper ? <Check size={12} color="#10b981" /> : <X size={12} />} Uppercase (A-Z)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: strength.hasLower ? '#34d399' : 'inherit' }}>
                        {strength.hasLower ? <Check size={12} color="#10b981" /> : <X size={12} />} Lowercase (a-z)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: strength.hasNumber ? '#34d399' : 'inherit' }}>
                        {strength.hasNumber ? <Check size={12} color="#10b981" /> : <X size={12} />} Number (0-9)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: strength.hasSpecial ? '#34d399' : 'inherit' }}>
                        {strength.hasSpecial ? <Check size={12} color="#10b981" /> : <X size={12} />} Special symbol (!@#$)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  CONFIRM PASSWORD *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    style={{
                      width: '100%',
                      padding: '9px 40px 9px 38px',
                      background: 'var(--bg-glass-heavy)',
                      border: `1px solid ${confirmPassword && confirmPassword !== signUpPassword ? 'rgba(239, 68, 68, 0.6)' : 'var(--border-card)'}`,
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '9px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== signUpPassword && (
                  <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '4px' }}>
                    Passwords do not match.
                  </div>
                )}
              </div>

              {/* Officer Role Selector */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  OFFICER DESIGNATION / ROLE *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--bg-glass-heavy)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="inspector">Legal Metrology Inspector (Enforcement Officer)</option>
                  <option value="admin">Joint Controller / Admin (Headquarters)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !strength.isStrong}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              >
                {loading ? 'Securing & Registering...' : 'Create Protected Account'}
                <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <span 
                  onClick={() => { setMode('signin'); setError(null); }}
                  style={{ color: '#60a5fa', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Sign In
                </span>
              </div>
            </form>
          )}
        </div>

        {/* Security Standards Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <span>🛡️ 256-Bit TLS Protected</span>
          <span>•</span>
          <span>🔑 12-Round Bcrypt Salt</span>
          <span>•</span>
          <span>⚖️ Sec. 36 Directorate Standards</span>
        </div>
      </div>
    </div>
  );
};
