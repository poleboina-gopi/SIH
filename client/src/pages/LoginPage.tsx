import React, { useState } from 'react';
import { 
  Shield, Lock, Mail, Scale, CheckCircle2, AlertTriangle, 
  ArrowRight, Eye, EyeOff, Phone, User, Check, X 
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

// Mathematically accurate 24-Spoke Indian Ashoka Chakra Vector Component
const AshokaChakra: React.FC<{ size?: number; color?: string; spinning?: boolean }> = ({ 
  size = 42, 
  color = "#38bdf8",
  spinning = false 
}) => {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        animation: spinning ? 'spinChakra 36s linear infinite' : 'none',
        filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))'
      }}
    >
      {/* Outer circular band */}
      <circle cx="50" cy="50" r="46" stroke={color} strokeWidth="3.5" />
      {/* Central hub */}
      <circle cx="50" cy="50" r="9" fill={color} />
      <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
      {/* 24 Radial Spokes */}
      {spokes.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x2 = 50 + 44 * Math.cos(rad);
        const y2 = 50 + 44 * Math.sin(rad);
        return (
          <line
            key={angle}
            x1="50"
            y1="50"
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        );
      })}
      {/* 24 peripheral teeth dots */}
      {spokes.map((angle) => {
        const rad = ((angle + 7.5) * Math.PI) / 180;
        const cx = 50 + 42.5 * Math.cos(rad);
        const cy = 50 + 42.5 * Math.sin(rad);
        return (
          <circle key={`dot-${angle}`} cx={cx} cy={cy} r="1.4" fill={color} />
        );
      })}
    </svg>
  );
};

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
        return { label: 'Good', color: '#38bdf8', width: '80%' };
      case 5:
        return { label: 'Strong (Statutory Standard)', color: '#10b981', width: '100%' };
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

      setSuccessMsg('Officer account registered successfully! Redirecting...');
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
      padding: '40px 20px 60px',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 12% 15%, rgba(255, 103, 31, 0.18) 0%, transparent 48%), radial-gradient(circle at 88% 85%, rgba(19, 136, 8, 0.18) 0%, transparent 48%), radial-gradient(circle at 50% 40%, rgba(30, 58, 138, 0.25) 0%, transparent 65%), #050813'
    }}>
      {/* Keyframe animation for subtle rotating chakra */}
      <style>{`
        @keyframes spinChakra {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmerTiranga {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Top Fixed National Tricolor Ribbon */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #FF671F 0%, #FF9933 33.3%, #FFFFFF 33.3%, #F8FAFC 66.6%, #138808 66.6%, #10B981 100%)',
        boxShadow: '0 0 16px rgba(255, 103, 31, 0.7), 0 0 16px rgba(19, 136, 8, 0.7)',
        zIndex: 100
      }} />

      <div style={{ maxWidth: '540px', width: '100%', position: 'relative', zIndex: 10 }}>
        {/* National Emblem & Directorate Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          
          {/* Sovereign Emblem Crest */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginBottom: '14px'
          }}>
            {/* Outer Tricolor Glow Ring */}
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              padding: '2.5px',
              background: 'linear-gradient(135deg, #FF671F 0%, #FFFFFF 50%, #138808 100%)',
              boxShadow: '0 8px 32px -4px rgba(255, 103, 31, 0.3), 0 8px 32px -4px rgba(19, 136, 8, 0.3), inset 0 0 12px rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Inner Dark Glass Disc */}
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #090e24 0%, #040611 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {/* Ashoka Chakra in background */}
                <AshokaChakra size={64} color="rgba(56, 189, 248, 0.55)" spinning={true} />
                {/* Legal Scales of Justice overlay */}
                <div style={{
                  position: 'absolute',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.25) 0%, rgba(19, 136, 8, 0.25) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.6)'
                }}>
                  <Scale size={20} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.8))' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Satyameva Jayate Motto */}
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.22em',
            color: '#fbbf24',
            textTransform: 'uppercase',
            marginBottom: '4px',
            fontFamily: 'serif'
          }}>
            सत्यमेव जयते • TRUTH ALONE TRIUMPHS
          </div>

          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#e2e8f0',
            textTransform: 'uppercase',
            marginBottom: '2px'
          }}>
            GOVERNMENT OF INDIA • भारत सरकार
          </div>

          <div style={{
            fontSize: '0.72rem',
            color: '#94a3b8',
            letterSpacing: '0.03em',
            marginBottom: '10px'
          }}>
            Ministry of Consumer Affairs, Food &amp; Public Distribution
          </div>

          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            margin: '0 0 4px 0',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Legal Metrology Portal
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Central Packaged Commodities Enforcement &amp; Compliance System
          </p>

          {/* Tricolor Indicator Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '10px',
            background: 'rgba(9, 14, 30, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '4px 14px',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            color: '#e2e8f0',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)'
          }}>
            <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#FF671F', boxShadow: '0 0 6px #FF671F' }} />
            <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 0 6px #FFFFFF' }} />
            <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#138808', boxShadow: '0 0 6px #138808' }} />
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>SEC. 36 STATUTORY CLEARANCE ACTIVE</span>
          </div>
        </div>

        {/* Main Auth Card with Tricolor Specular Rim */}
        <div style={{
          position: 'relative',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'linear-gradient(180deg, rgba(14, 22, 44, 0.92) 0%, rgba(7, 11, 25, 0.96) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.85), 0 0 40px -10px rgba(255, 103, 31, 0.12), 0 0 40px -10px rgba(19, 136, 8, 0.12)',
          overflow: 'hidden',
          padding: '30px 32px'
        }}>
          {/* Top Tricolor Strip on Card */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #FF671F 0%, #FFFFFF 50%, #138808 100%)',
            boxShadow: '0 0 10px rgba(255, 103, 31, 0.4)'
          }} />

          {/* Sign In vs Sign Up Tab Switcher */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(5, 8, 19, 0.8)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '22px'
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
                background: mode === 'signin' 
                  ? 'linear-gradient(135deg, #FF671F 0%, #ea580c 100%)' 
                  : 'transparent',
                color: mode === 'signin' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: mode === 'signin' ? '0 4px 14px rgba(255, 103, 31, 0.45)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>🇮🇳</span>
              <span>Officer Sign In</span>
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
                background: mode === 'signup' 
                  ? 'linear-gradient(135deg, #138808 0%, #059669 100%)' 
                  : 'transparent',
                color: mode === 'signup' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: mode === 'signup' ? '0 4px 14px rgba(19, 136, 8, 0.45)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>Register Account</span>
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
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(135deg, #FF671F 0%, #f97316 50%, #ea580c 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px -4px rgba(255, 103, 31, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.02em'
                }}
              >
                {loading ? 'Authenticating Officer...' : 'Sign In to Statutory Portal'}
                <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                New Officer?{' '}
                <span 
                  onClick={() => { setMode('signup'); setError(null); }}
                  style={{ color: '#38bdf8', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
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
                      background: 'rgba(5, 8, 19, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
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
                      background: 'rgba(5, 8, 19, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
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
                      background: 'rgba(5, 8, 19, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
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
                    background: 'linear-gradient(135deg, rgba(255, 103, 31, 0.15) 0%, rgba(19, 136, 8, 0.15) 100%)',
                    border: '1px solid rgba(255, 103, 31, 0.4)',
                    borderRadius: '8px',
                    color: '#fed7aa',
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
                        background: 'rgba(5, 8, 19, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
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
                  PASSWORD (STATUTORY ENFORCEMENT STANDARD) *
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
                      background: 'rgba(5, 8, 19, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
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
                      background: 'rgba(5, 8, 19, 0.85)',
                      border: `1px solid ${confirmPassword && confirmPassword !== signUpPassword ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.12)'}`,
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
                    background: 'rgba(5, 8, 19, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
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
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: (loading || !strength.isStrong) ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(135deg, #138808 0%, #10b981 50%, #059669 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px -4px rgba(19, 136, 8, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.2s ease',
                  opacity: (!strength.isStrong && !loading) ? 0.6 : 1,
                  letterSpacing: '0.02em'
                }}
              >
                {loading ? 'Securing & Registering...' : 'Register Official Officer Account'}
                <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <span 
                  onClick={() => { setMode('signin'); setError(null); }}
                  style={{ color: '#38bdf8', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Sign In
                </span>
              </div>
            </form>
          )}
        </div>

        {/* Security Standards & Sovereign Portal Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fed7aa', fontWeight: 600 }}>
              <span>🇮🇳</span> National Informatics Standards
            </span>
            <span>•</span>
            <span style={{ color: '#bae6fd', fontWeight: 600 }}>⚖️ Legal Metrology Act, 2009</span>
            <span>•</span>
            <span style={{ color: '#bbf7d0', fontWeight: 600 }}>🛡️ Rule 6 &amp; 7 Statutory Enforcement</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', letterSpacing: '0.02em' }}>
            Directorate of Legal Metrology • Department of Consumer Affairs • Govt. of India
          </div>
        </div>
      </div>
    </div>
  );
};
