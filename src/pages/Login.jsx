import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { C } from '../theme';

export default function Login() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Navigate only once AuthContext's user state actually updates — signIn()
  // resolving doesn't mean onAuthStateChanged (and its role fetch) has finished.
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);
  // Uncontrolled refs so browser autofill values are always readable at submit time.
  // Controlled inputs (value={state}) miss autofill because Chrome doesn't always
  // fire a React change event, leaving state empty while the field looks filled.
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const email = emailRef.current?.value?.trim() ?? '';
    const password = passwordRef.current?.value ?? '';
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err) {
      setError(
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
          ? 'Invalid email or password.'
          : 'Sign in failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.root}>
      <div style={S.card}>
        {/* Brand */}
        <div style={S.brand}>
          <div style={S.logo}>R</div>
          <div>
            <div style={S.brandName}>RERA HAIR FASHION</div>
            <div style={S.brandSub}>Stock Manager</div>
          </div>
        </div>

        <h1 style={S.title}>Sign in</h1>

        <form onSubmit={submit} style={S.form}>
          <label style={S.label}>
            <span style={S.labelText}>Email</span>
            <input
              ref={emailRef}
              style={S.input}
              type="email"
              autoComplete="email"
              defaultValue=""
              onChange={() => setError('')}
              placeholder="you@example.com"
              required
            />
          </label>
          <label style={S.label}>
            <span style={S.labelText}>Password</span>
            <input
              ref={passwordRef}
              style={S.input}
              type="password"
              autoComplete="current-password"
              defaultValue=""
              onChange={() => setError('')}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <div style={S.error}>{error}</div>}

          <button style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

const S = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: C.bg,
    padding: 20,
  },
  card: {
    background: C.card,
    borderRadius: 20,
    padding: '32px 28px',
    width: '100%',
    maxWidth: 400,
    border: '1px solid ' + C.line,
    boxShadow: '0 4px 24px rgba(19,21,28,.07)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: C.ink,
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    fontSize: 22,
    letterSpacing: '-0.5px',
  },
  brandName: {
    fontWeight: 800,
    fontSize: 14,
    letterSpacing: '0.5px',
    color: C.ink,
  },
  brandSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: C.ink,
    letterSpacing: '-0.3px',
    marginBottom: 22,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  label: {
    display: 'block',
    marginBottom: 14,
  },
  labelText: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: C.ink2,
    marginBottom: 6,
    letterSpacing: '0.2px',
  },
  input: {
    width: '100%',
    border: '1px solid ' + C.line,
    borderRadius: 11,
    padding: '12px 14px',
    fontSize: 15,
    color: C.ink,
    background: C.card,
    fontFamily: 'inherit',
  },
  error: {
    background: C.dangerSoft,
    color: C.danger,
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 14,
  },
  btn: {
    width: '100%',
    border: 'none',
    background: C.ink,
    color: '#fff',
    padding: '14px',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};
