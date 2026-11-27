import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  Globe,
  ScanLine,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { buildAutoLoginUrl } from '../utils/autoLoginQr';

const THEMES = {
  gold: {
    name: 'Obsidian Gold (หรูหรา)',
    cardBg: 'linear-gradient(155deg, #070a14 0%, #111827 52%, #1b1628 100%)',
    border: '2px solid rgba(251, 191, 36, 0.55)',
    glowTop: 'radial-gradient(circle, rgba(251,191,36,0.22) 0%, transparent 70%)',
    glowBottom: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
    accentText: '#fde68a',
    accentBadgeBg: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))',
    accentBadgeBorder: '1px solid rgba(251,191,36,0.45)',
    qrBorder: '3px solid #fbbf24',
    qrDark: '#0f172a',
    pillBg: 'rgba(255,255,255,0.06)',
  },
  sapphire: {
    name: 'Royal Sapphire (ทางการ)',
    cardBg: 'linear-gradient(155deg, #071226 0%, #0f2554 55%, #1e1b4b 100%)',
    border: '2px solid rgba(96, 165, 250, 0.55)',
    glowTop: 'radial-gradient(circle, rgba(56,189,248,0.24) 0%, transparent 70%)',
    glowBottom: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)',
    accentText: '#93c5fd',
    accentBadgeBg: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(59,130,246,0.1))',
    accentBadgeBorder: '1px solid rgba(96,165,250,0.45)',
    qrBorder: '3px solid #60a5fa',
    qrDark: '#1e3a8a',
    pillBg: 'rgba(255,255,255,0.08)',
  },
  emerald: {
    name: 'Emerald Executive (พรีเมียม)',
    cardBg: 'linear-gradient(155deg, #041918 0%, #072f2c 55%, #0f172a 100%)',
    border: '2px solid rgba(52, 211, 153, 0.5)',
    glowTop: 'radial-gradient(circle, rgba(16,185,129,0.24) 0%, transparent 70%)',
    glowBottom: 'radial-gradient(circle, rgba(251,191,36,0.16) 0%, transparent 70%)',
    accentText: '#6ee7b7',
    accentBadgeBg: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.1))',
    accentBadgeBorder: '1px solid rgba(52,211,153,0.45)',
    qrBorder: '3px solid #34d399',
    qrDark: '#064e3b',
    pillBg: 'rgba(255,255,255,0.07)',
  },
};

export default function QrAutoLogin() {
  const posterRef = useRef(null);
  const [baseUrl, setBaseUrl] = useState(() => window.location.origin);
  const [username, setUsername] = useState('itt');
  const [password, setPassword] = useState('itt123456');
  const [themeKey, setThemeKey] = useState('gold');
  const [showPasswordOnCard, setShowPasswordOnCard] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const theme = THEMES[themeKey] || THEMES.gold;

  const autoLoginUrl = useMemo(
    () => buildAutoLoginUrl(baseUrl, username, password),
    [baseUrl, username, password]
  );

  const isLocalhost = useMemo(() => {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(baseUrl.trim());
  }, [baseUrl]);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(autoLoginUrl, {
      width: 720,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: theme.qrDark,
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [autoLoginUrl, theme.qrDark]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(autoLoginUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const handleDownloadPng = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `QR_AutoLogin_${username || 'user'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download QR poster failed:', err);
      alert('ไม่สามารถดาวน์โหลดรูปภาพได้');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-['Prompt']">
      {/* Print Styles to isolate the Luxury QR Card cleanly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #luxury-qr-poster,
          #luxury-qr-poster * {
            visibility: visible !important;
          }
          #luxury-qr-poster {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 430px !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-amber-500 mb-1">
            <Sparkles size={14} /> Executive QR Access Pass
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white m-0">
            QR Code เข้าสู่ระบบอัตโนมัติ (สิทธิ์ User)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-0">
            สำหรับสแกนเข้าใช้งานระบบค้นหา Jop ยิงบาร์โค้ดอัตโนมัติ (บัญชี: {username})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Luxury QR Card Poster */}
        <div className="lg:col-span-6 flex justify-center">
          <div
            id="luxury-qr-poster"
            ref={posterRef}
            style={{
              width: '100%',
              maxWidth: '430px',
              borderRadius: '32px',
              background: theme.cardBg,
              border: theme.border,
              boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255,255,255,0.2)',
              padding: '32px 28px',
              position: 'relative',
              overflow: 'hidden',
              color: '#ffffff',
            }}
          >
            {/* Atmospheric Glows */}
            <div style={{ position: 'absolute', top: '-90px', right: '-90px', width: '260px', height: '260px', background: theme.glowTop, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-90px', left: '-90px', width: '260px', height: '260px', background: theme.glowBottom, pointerEvents: 'none' }} />

            {/* Subtle Corner Brackets */}
            <div style={{ position: 'absolute', top: 16, left: 16, width: 22, height: 22, borderTop: `2px solid ${theme.accentText}`, borderLeft: `2px solid ${theme.accentText}`, borderTopLeftRadius: 8, opacity: 0.7 }} />
            <div style={{ position: 'absolute', top: 16, right: 16, width: 22, height: 22, borderTop: `2px solid ${theme.accentText}`, borderRight: `2px solid ${theme.accentText}`, borderTopRightRadius: 8, opacity: 0.7 }} />
            <div style={{ position: 'absolute', bottom: 16, left: 16, width: 22, height: 22, borderBottom: `2px solid ${theme.accentText}`, borderLeft: `2px solid ${theme.accentText}`, borderBottomLeftRadius: 8, opacity: 0.7 }} />
            <div style={{ position: 'absolute', bottom: 16, right: 16, width: 22, height: 22, borderBottom: `2px solid ${theme.accentText}`, borderRight: `2px solid ${theme.accentText}`, borderBottomRightRadius: 8, opacity: 0.7 }} />

            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              {/* Hospital Header Crest */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ffffff', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,0,0,0.35)' }}>
                  <img src="/โลโก้ ร.พ ข้างขวา.png" alt="Hospital Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.03em' }}>
                    โรงพยาบาลนครพิงค์
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: theme.accentText, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                    IT REPAIR • BARCODE JOP
                  </div>
                </div>
              </div>

              {/* Headline */}
              <h2 style={{ fontSize: '23px', fontWeight: 900, margin: '0 0 6px 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
                สแกนเข้าใช้งานอัตโนมัติ
              </h2>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '999px',
                background: theme.accentBadgeBg,
                border: theme.accentBadgeBorder,
                fontSize: '11px',
                fontWeight: 700,
                color: theme.accentText,
                marginBottom: '22px'
              }}>
                <ScanLine size={13} />
                ระบบค้นหา Jop งานซ่อมบำรุงคอมพิวเตอร์
              </div>

              {/* Elevated Crystal QR Frame */}
              <div style={{
                background: '#ffffff',
                borderRadius: '26px',
                padding: '16px',
                display: 'inline-block',
                border: theme.qrBorder,
                boxShadow: '0 20px 45px rgba(0,0,0,0.45)',
                position: 'relative',
                marginBottom: '22px',
              }}>
                {qrDataUrl ? (
                  <div style={{ position: 'relative', width: '236px', height: '236px' }}>
                    <img
                      src={qrDataUrl}
                      alt="QR Auto Login"
                      style={{ width: '100%', height: '100%', display: 'block', borderRadius: '12px' }}
                    />
                    {/* Center Hospital Medallion (within H error correction budget) */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      padding: '4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.22)',
                      border: `2px solid ${theme.qrDark}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <img src="/โลโก้ ร.พ.png" alt="Crest" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '236px', height: '236px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    กำลังสร้าง QR...
                  </div>
                )}
              </div>

              {/* Account Metadata Card */}
              <div style={{
                background: theme.pillBg,
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '18px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                textAlign: 'left',
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase' }}>
                    บัญชีเข้าใช้งาน
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck size={14} style={{ color: theme.accentText }} />
                    {username}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase' }}>
                    สิทธิ์การใช้งาน
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: theme.accentText }}>
                    User (ค้นหา Jop)
                  </div>
                </div>
                {showPasswordOnCard && (
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>รหัสผ่าน:</span>
                    <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 800, color: '#ffffff' }}>{password}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.06em' }}>
                NAKORNPING HOSPITAL • AUTO-LOGIN ACCESS PASS
              </div>
            </div>
          </div>
        </div>

        {/* Right: Controls & Customization */}
        <div className="lg:col-span-6 space-y-5 print:hidden">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-lg space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <QrCode size={20} className="text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-black text-slate-800 dark:text-white m-0">
                ปรับแต่งและนำออก QR Code
              </h3>
            </div>

            {/* Theme selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                เลือกธีมความหรูหราของการ์ด
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setThemeKey(key)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer text-left ${
                      themeKey === key
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Globe size={13} /> URL ปลายทางของระบบ (สำหรับมือถือสแกน)
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-mono outline-none focus:border-blue-500"
              />
              {isLocalhost && (
                <div className="mt-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    ตอนนี้ URL เป็น <code>localhost</code> หากนำมือถือสแกน กรุณาเปลี่ยนเป็น IP เครื่อง (เช่น <code>http://192.168.x.x:5173</code>) หรือโดเมนจริงของโรงพยาบาล
                  </span>
                </div>
              )}
            </div>

            {/* Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  User สำหรับ Auto-Login
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPasswordOnCard ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-mono outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordOnCard((v) => !v)}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer border-0 bg-transparent"
                    title="แสดง/ซ่อนรหัสผ่านบนการ์ด"
                  >
                    {showPasswordOnCard ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPasswordOnCard}
                onChange={(e) => setShowPasswordOnCard(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              แสดงรหัสผ่านบนป้าย QR (ปิดไว้จะปลอดภัยกว่าเมื่อนำไปติดหน้างาน)
            </label>

            {/* Primary Export & Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={downloading || !qrDataUrl}
                onClick={handleDownloadPng}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-white font-extrabold text-sm shadow-lg shadow-amber-500/25 cursor-pointer border-0 transition-all"
              >
                <Download size={18} />
                {downloading ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลดภาพ HD (PNG)'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 cursor-pointer border-0 transition-all"
              >
                <Printer size={18} />
                พิมพ์ป้าย QR (Print / PDF)
              </button>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm cursor-pointer border border-slate-200 dark:border-slate-700 transition-all"
              >
                {copied ? <Check size={17} className="text-emerald-500" /> : <Copy size={17} />}
                {copied ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์ Auto-Login'}
              </button>

              <a
                href={autoLoginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-sm no-underline border border-emerald-200 dark:border-emerald-500/30 transition-all"
              >
                <ExternalLink size={17} />
                ทดสอบลิงก์เข้าใช้งาน
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 p-4 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
            <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold">การทำงานเมื่อ User สแกน QR Code</div>
              <p className="m-0 leading-relaxed opacity-90">
                ระบบจะเข้ารหัส token ใน URL อัตโนมัติ เมื่ออุปกรณ์สแกนเปิดลิงก์ ระบบจะล็อกอินบัญชี <strong>{username}</strong> ให้อัตโนมัติ
                ซ่อนเมนูอื่นทั้งหมด และเปิดหน้า <strong>ค้นหา Jop</strong> พร้อมใช้งานยิงบาร์โค้ดทันที
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
