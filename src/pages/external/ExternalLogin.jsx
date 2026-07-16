import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExternalAuth } from '../../contexts/ExternalAuthContext';

export default function ExternalLogin() {
  const { loginExternal } = useExternalAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [company, setCompany]     = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const fn = firstName.trim();
    const ln = lastName.trim();

    if (!fn || !ln) {
      setError('กรุณากรอกชื่อจริงและนามสกุลให้ครบถ้วน');
      return;
    }
    if (/[a-zA-Z]/.test(fn) || /[a-zA-Z]/.test(ln)) {
      // Allow both Thai and English names — no block
    }

    setLoading(true);
    loginExternal(fn, ln, company);
    navigate('/external/repair');
  }

  return (
    <div style={styles.page}>
      {/* Ambient blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Top gradient bar */}
        <div style={styles.topBar} />

        {/* Icon */}
        <div style={styles.iconWrap}>
          <span style={{ fontSize: '2rem' }}>🔧</span>
        </div>

        <h1 style={styles.title}>ระบบรับซ่อมอุปกรณ์ IT</h1>
        <p style={styles.subtitle}>สำหรับบริษัทภายนอก / External Company</p>
        <p style={styles.hint}>กรุณากรอกชื่อ-นามสกุล เพื่อเข้าสู่ระบบ</p>

        {error && (
          <div style={styles.errorBox}>
            <span style={{ marginRight: 8 }}>⚠️</span>{error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>ชื่อจริง <span style={{ color: '#f97316' }}>*</span></label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="เช่น สมชาย"
              required
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = '#f97316')}
              onBlur={(e)  => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>นามสกุล <span style={{ color: '#f97316' }}>*</span></label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="เช่น ใจดี"
              required
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = '#f97316')}
              onBlur={(e)  => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>บริษัท / หน่วยงาน <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(ไม่บังคับ)</span></label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="เช่น บริษัท ABC จำกัด"
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = '#f97316')}
              onBlur={(e)  => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.background = 'linear-gradient(135deg,#ea580c,#c2410c)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'linear-gradient(135deg,#f97316,#ea580c)'; }}
          >
            {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🔧 เข้าสู่ระบบ'}
          </button>
        </form>

        <p style={styles.footer}>ระบบนี้ใช้เฉพาะบริษัทภายนอกที่ส่งอุปกรณ์ซ่อมเท่านั้น</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c1a2e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '"Prompt", "Noto Sans Thai", Arial, sans-serif',
  },
  blob1: {
    position: 'absolute', top: '-10%', left: '-10%',
    width: '45%', height: '45%',
    background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
    borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-10%', right: '-10%',
    width: '40%', height: '40%',
    background: 'radial-gradient(circle, rgba(234,88,12,0.12) 0%, transparent 70%)',
    borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    background: 'rgba(255,255,255,0.97)',
    borderRadius: '24px',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '5px',
    background: 'linear-gradient(90deg, #f97316, #ea580c, #c2410c)',
  },
  iconWrap: {
    width: '72px', height: '72px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #fed7aa, #fdba74)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '1rem', marginTop: '0.75rem',
    boxShadow: '0 8px 25px rgba(249,115,22,0.3)',
  },
  title: {
    fontSize: '1.5rem', fontWeight: 900, color: '#0f172a',
    margin: '0 0 4px', textAlign: 'center', letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.85rem', color: '#f97316', fontWeight: 700,
    margin: '0 0 4px', textAlign: 'center',
    background: 'linear-gradient(90deg, #f97316, #ea580c)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  hint: {
    fontSize: '0.82rem', color: '#64748b', margin: '0 0 1.5rem',
    textAlign: 'center',
  },
  errorBox: {
    width: '100%', padding: '0.75rem 1rem', marginBottom: '1rem',
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: '12px', color: '#dc2626',
    fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center',
  },
  fieldGroup: { width: '100%', marginBottom: '1rem' },
  label: {
    display: 'block', fontSize: '0.82rem', fontWeight: 700,
    color: '#374151', marginBottom: '6px',
  },
  input: {
    width: '100%', padding: '0.75rem 1rem',
    borderRadius: '12px', border: '2px solid #e2e8f0',
    fontSize: '0.95rem', fontWeight: 500, color: '#1e293b',
    background: '#f8fafc', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    fontFamily: '"Prompt", "Noto Sans Thai", Arial, sans-serif',
  },
  submitBtn: {
    width: '100%', padding: '0.9rem',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    color: 'white', fontWeight: 800, fontSize: '1rem',
    border: 'none', borderRadius: '14px', cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(249,115,22,0.4)',
    transition: 'all 0.2s', marginTop: '0.5rem',
    fontFamily: '"Prompt", "Noto Sans Thai", Arial, sans-serif',
  },
  footer: {
    marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8',
    textAlign: 'center', lineHeight: 1.5,
  },
};
