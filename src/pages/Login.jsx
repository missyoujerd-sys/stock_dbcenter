import React, { useEffect, useRef, useState } from 'react';
import { Form, Button, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, get, update } from 'firebase/database';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaExclamation, FaQrcode, FaCheckCircle, FaChevronDown, FaChevronUp, FaUserShield } from 'react-icons/fa';
import QRCode from 'qrcode';
import { buildAutoLoginUrl, decodeAutoLoginToken, isAdmin2Email } from '../utils/autoLoginQr';
import PartnerCompanyModal from '../components/PartnerCompanyModal';

export default function Login() {
    let userRef = useRef();
    const passwordRef = useRef();
    const { currentUser, login, logout, selectPartnerCompany } = useAuth();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginQrUrl, setLoginQrUrl] = useState('');
    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [showStaffLogin, setShowStaffLogin] = useState(false);
    const [pendingQrCreds, setPendingQrCreds] = useState(null);
    const [selectingCompanyId, setSelectingCompanyId] = useState(null);
    const [partnerModalError, setPartnerModalError] = useState('');
    const [autoLoginState, setAutoLoginState] = useState({
        active: false,
        username: '',
        statusText: 'กำลังตรวจสอบสิทธิ์เข้าใช้งาน...',
        success: false
    });
    const autoLoginStartedRef = useRef(false);

    // Thai Keyboard Detection States
    const [showThaiWarning, setShowThaiWarning] = useState(false);
    const warningTimeoutRef = useRef(null);

    const thaiCharMap = {
        'ๅ': '1', '/': '2', '-': '3', 'ภ': '4', 'ถ': '5', 'ุ': '6', 'ึ': '7', 'ค': '8', 'ต': '9', 'จ': '0', 'ข': '-', 'ช': '=',
        'ๆ': 'q', 'ไ': 'w', 'ำ': 'e', 'พ': 'r', 'ะ': 't', 'ั': 'y', 'ี': 'u', 'ร': 'i', 'น': 'o', 'ย': 'p', 'บ': '[', 'ล': ']', 'ฃ': '\\',
        'ฟ': 'a', 'ห': 's', 'ก': 'd', 'ด': 'f', 'เ': 'g', '้': 'h', '่': 'j', 'า': 'k', 'ส': 'l', 'ว': ';', 'ง': '\'',
        'ผ': 'z', 'ป': 'x', 'แ': 'c', 'อ': 'v', 'ิ': 'b', 'ื': 'n', 'ท': 'm', 'ม': ',', 'ใ': '.', 'ฝ': '/',
        '+': '!', '๑': '@', '๒': '#', '๓': '$', '๔': '%', 'ู': '^', '฿': '&', '๕': '*', '๖': '(', '๗': ')', '๘': '_', '๙': '+',
        '๐': 'Q', '"': 'W', 'ฎ': 'E', 'ฑ': 'R', 'ธ': 'T', 'ํ': 'Y', '๊': 'U', 'ณ': 'I', 'ฯ': 'O', 'ญ': 'P', 'ฐ': '{', ',': '}', 'ฅ': '|',
        'ฤ': 'A', 'ฆ': 'S', 'ฏ': 'D', 'โ': 'F', 'ฌ': 'G', '็': 'H', '๋': 'J', 'ษ': 'K', 'ศ': 'L', 'ซ': ':', '.': '"',
        '(': 'Z', ')': 'X', 'ฉ': 'C', 'ฮ': 'V', 'ฺ': 'B', '์': 'N', '?': 'M', 'ฒ': '<', 'ฬ': '>', 'ฦ': '?'
    };

    const handleInputChange = (e) => {
        let val = e.target.value;
        const hasThai = /[\u0E00-\u0E7F]/.test(val);
        
        if (hasThai) {
            const cursorStart = e.target.selectionStart;
            const cursorEnd = e.target.selectionEnd;
            
            let converted = '';
            for (let i = 0; i < val.length; i++) {
                converted += thaiCharMap[val[i]] || val[i];
            }
            e.target.value = converted;
            e.target.setSelectionRange(cursorStart, cursorEnd);
            
            setShowThaiWarning(true);
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
            warningTimeoutRef.current = setTimeout(() => {
                setShowThaiWarning(false);
            }, 4000);
        }
    };

    const navigate = useNavigate();

    async function authenticateAccount(rawUsername, rawPassword) {
        let email = (rawUsername || '').trim();
        if (!email.includes('@')) {
            email = email + '@nkp.com';
        }

        const escapedEmail = email.replace(/\./g, ',');
        const userStatusRef = ref(db, `users_status/${escapedEmail}`);
        const snapshot = await get(userStatusRef);
        const userStatus = snapshot.val() || { failedAttempts: 0, locked: false };

        if (userStatus.locked) {
            const lockedErr = new Error('บัญชีของคุณถูกระงับเนื่องจากใส่รหัสผ่านผิดเกิน 3 ครั้ง กรุณากด "ลืมรหัสผ่าน"');
            lockedErr.isLocked = true;
            throw lockedErr;
        }

        try {
            if (currentUser && currentUser.email?.toLowerCase() !== email.toLowerCase()) {
                await logout();
            }
            if (!currentUser || currentUser.email?.toLowerCase() !== email.toLowerCase()) {
                await login(email, rawPassword);
            }
            if (userStatus.failedAttempts > 0) {
                await update(userStatusRef, { failedAttempts: 0 });
            }
            return email;
        } catch (err) {
            if (err.message === 'ท่านไม่มีชื่อในระบบ') {
                throw err;
            }
            const latestSnap = await get(userStatusRef);
            const latestStatus = latestSnap.val() || { failedAttempts: 0 };
            const newAttempts = (latestStatus.failedAttempts || 0) + 1;

            if (newAttempts >= 3) {
                await update(userStatusRef, { failedAttempts: newAttempts, locked: true });
                throw new Error('คุณใส่รหัสผ่านผิดเกิน 3 ครั้ง บัญชีถูกระงับแล้ว กรุณากด "ลืมรหัสผ่าน"');
            }
            await update(userStatusRef, { failedAttempts: newAttempts });
            throw new Error(`ชื่อล็อกอินหรือรหัสผ่านไม่ถูกต้อง (ผิด ${newAttempts}/3 ครั้ง)`);
        }
    }

    // Generate QR Code directly on Login page for partner auto-login (user: itt / itt123456)
    useEffect(() => {
        const qrTarget = buildAutoLoginUrl(window.location.origin, 'itt', 'itt123456');
        QRCode.toDataURL(qrTarget, {
            width: 560,
            margin: 1,
            errorCorrectionLevel: 'H',
            color: {
                dark: '#0b2545',
                light: '#ffffff',
            },
        })
            .then(setLoginQrUrl)
            .catch((err) => console.error('Login QR error:', err));
    }, []);

    useEffect(() => {
        const qrToken = searchParams.get('qr');
        const legacyAuto = searchParams.get('auto');
        let creds = qrToken ? decodeAutoLoginToken(qrToken) : null;

        if (!creds && legacyAuto === '1') {
            const u = searchParams.get('u');
            const p = searchParams.get('p');
            if (u && p) creds = { username: u, password: p };
        }

        if (!creds || autoLoginStartedRef.current) return;
        autoLoginStartedRef.current = true;

        // Immediately prompt mandatory Partner Company selection with Hospital Logo when QR is scanned
        setPendingQrCreds(creds);
        setPartnerModalError('');
        setShowPartnerModal(true);
    }, [searchParams]);

    async function handleSelectPartnerAndLogin(company) {
        const creds = pendingQrCreds || { username: 'itt', password: 'itt123456' };
        setSelectingCompanyId(company.id);
        setPartnerModalError('');

        try {
            selectPartnerCompany(company);
            const signedEmail = await authenticateAccount(creds.username, creds.password);
            setShowPartnerModal(false);
            setAutoLoginState({
                active: true,
                username: `${creds.username} (${company.name})`,
                statusText: 'เข้าสู่ระบบสำเร็จ! กำลังเปิดหน้าค้นหา Jop...',
                success: true
            });
            const dest = isAdmin2Email(signedEmail) ? '/' : '/job-search';
            setTimeout(() => navigate(dest, { replace: true }), 450);
        } catch (err) {
            console.error('QR partner login error:', err);
            setPartnerModalError(err.message || 'ไม่สามารถเข้าสู่ระบบอัตโนมัติได้');
        } finally {
            setSelectingCompanyId(null);
        }
    }

    function handleOpenQrPartnerLogin() {
        setPendingQrCreds({ username: 'itt', password: 'itt123456' });
        setPartnerModalError('');
        setShowPartnerModal(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            const signedEmail = await authenticateAccount(userRef.current.value, passwordRef.current.value);
            navigate(isAdmin2Email(signedEmail) ? '/' : '/job-search');
        } catch (err) {
            console.error(err);
            setError(err.message || 'ไม่สามารถเข้าสู่ระบบได้');
            setShowErrorModal(true);
        }

        setLoading(false);
    }

    return (
        <div className="login-page">
            {/* Dimensional Background Text */}
            <div className="login-bg-text" aria-hidden="true">
                <span className="login-bg-word login-bg-word--1">NKP</span>
                <span className="login-bg-word login-bg-word--2">NKP</span>
           </div>

            {autoLoginState.active ? (
                <div
                    className="login-card overflow-hidden"
                    style={{
                        position: 'relative',
                        background: 'linear-gradient(145deg, rgba(15,23,42,0.96), rgba(30,41,59,0.95))',
                        border: '1px solid rgba(251, 191, 36, 0.35)',
                        boxShadow: '0 30px 70px -15px rgba(15,23,42,0.7), 0 0 40px rgba(59,130,246,0.2)',
                        color: '#f8fafc',
                        padding: '3rem 2.25rem'
                    }}
                >
                    <div style={{
                        width: '84px',
                        height: '84px',
                        margin: '0 auto 1.25rem',
                        borderRadius: '24px',
                        background: autoLoginState.success
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : 'linear-gradient(135deg, #f59e0b, #2563eb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 12px 30px rgba(37,99,235,0.35)'
                    }}>
                        {autoLoginState.success ? (
                            <FaCheckCircle size={38} color="#ffffff" />
                        ) : (
                            <FaQrcode size={38} color="#ffffff" className="animate-pulse" />
                        )}
                    </div>
                    <h4 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.4rem', color: '#ffffff' }}>
                        QR Auto-Login
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                        {autoLoginState.statusText}
                    </p>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 18px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#fde68a'
                    }}>
                        <FaUser size={13} />
                        <span>บัญชี: {autoLoginState.username}</span>
                    </div>
                </div>
            ) : (
            <div className="login-card overflow-hidden" style={{ position: 'relative', padding: '2.5rem 2.25rem 2rem' }}>
                {/* Beautiful Thai Warning Toast */}
                <div style={{
                    position: 'absolute',
                    top: showThaiWarning ? '20px' : '-80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '12px 24px',
                    borderRadius: '50px',
                    boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3), 0 8px 10px -6px rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 100,
                    transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    opacity: showThaiWarning ? 1 : 0,
                    pointerEvents: 'none',
                    width: 'max-content'
                }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        background: '#f34009ff',
                        borderRadius: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px',
                        flexShrink: 0
                    }}>
                        <FaExclamation />
                    </div>
                    <div>
                        <div style={{ color: '#1e293b', fontWeight: '800', fontSize: '1.2rem', fontFamily: 'Prompt, sans-serif' }}>
                            ยังไม่ได้เปลี่ยนภาษา
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', fontFamily: 'Prompt, sans-serif' }}>
                            เปลี่ยนภาษาอังกฤษให้แล้ว
                        </div>
                    </div>
                </div>

                {/* Mourning Ribbons */}
                <div className="mourning-ribbon top-left"></div>
                <div className="mourning-ribbon top-right"></div>

                {/* 2. Large Luxury QR Code Showcase at Top (Primary Entry for Partner Companies) */}
                <div
                    onClick={handleOpenQrPartnerLogin}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleOpenQrPartnerLogin()}
                    style={{
                        position: 'relative',
                        marginTop: '0.35rem',
                        padding: '24px 20px 22px',
                        borderRadius: '28px',
                        background: 'linear-gradient(155deg, #07162e 0%, #0e2e5c 52%, #0a362a 100%)',
                        border: '2px solid rgba(251, 191, 36, 0.65)',
                        boxShadow: '0 24px 50px -12px rgba(7, 22, 46, 0.65), 0 0 32px rgba(251, 191, 36, 0.14), inset 0 1px 0 rgba(255,255,255,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        overflow: 'hidden',
                        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 28px 56px -12px rgba(7, 22, 46, 0.75), 0 0 28px rgba(251,191,36,0.32)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 24px 50px -12px rgba(7, 22, 46, 0.65), 0 0 32px rgba(251, 191, 36, 0.14), inset 0 1px 0 rgba(255,255,255,0.2)';
                    }}
                >
                    {/* Subtle Corner Gold Accents */}
                    <div style={{ position: 'absolute', top: 12, left: 12, width: 16, height: 16, borderTop: '2px solid rgba(253,230,138,0.65)', borderLeft: '2px solid rgba(253,230,138,0.65)', borderTopLeftRadius: 6 }} />
                    <div style={{ position: 'absolute', top: 12, right: 12, width: 16, height: 16, borderTop: '2px solid rgba(253,230,138,0.65)', borderRight: '2px solid rgba(253,230,138,0.65)', borderTopRightRadius: 6 }} />
                    <div style={{ position: 'absolute', bottom: 12, left: 12, width: 16, height: 16, borderBottom: '2px solid rgba(253,230,138,0.65)', borderLeft: '2px solid rgba(253,230,138,0.65)', borderBottomLeftRadius: 6 }} />
                    <div style={{ position: 'absolute', bottom: 12, right: 12, width: 16, height: 16, borderBottom: '2px solid rgba(253,230,138,0.65)', borderRight: '2px solid rgba(253,230,138,0.65)', borderBottomRightRadius: 6 }} />

                    {/* Official Crest Title */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            letterSpacing: '0.18em',
                            color: '#93c5fd',
                            textTransform: 'uppercase',
                        }}>
                            NAKORNPING HOSPITAL
                        </span>
                        <span style={{
                            fontSize: '1.15rem',
                            fontWeight: 900,
                            color: '#ffffff',
                            letterSpacing: '0.01em',
                        }}>
                            โรงพยาบาลนครพิงค์
                        </span>
                    </div>

                    {/* Large Crystal QR Code Frame */}
                    <div style={{
                        position: 'relative',
                        width: '196px',
                        height: '196px',
                        borderRadius: '22px',
                        background: '#ffffff',
                        padding: '10px',
                        border: '3px solid #fbbf24',
                        boxShadow: '0 14px 32px rgba(0,0,0,0.45), 0 0 0 4px rgba(251, 191, 36, 0.16)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {loginQrUrl ? (
                            <>
                                <img
                                    src={loginQrUrl}
                                    alt="QR Code สำหรับบริษัทคู่ค้า ร.พ.นครพิงค์"
                                    style={{ width: '100%', height: '100%', display: 'block', borderRadius: '12px' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: '#ffffff',
                                    padding: '3px',
                                    border: '2px solid #0b2545',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.28)',
                                }}>
                                    <img src="/โลโก้ ร.พ ข้างขวา.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                            </>
                        ) : (
                            <FaQrcode size={54} color="#0b2545" />
                        )}
                    </div>

                    {/* Prominent Label Below QR */}
                    <div style={{
                        padding: '8px 20px',
                        borderRadius: '999px',
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.12))',
                        border: '1.5px solid rgba(251, 191, 36, 0.55)',
                        color: '#fde68a',
                        fontSize: '0.98rem',
                        fontWeight: 800,
                        letterSpacing: '0.02em',
                        lineHeight: 1.35,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    }}>
                        สำหรับบริษัทคู่ค้า ร.พ.นครพิงค์
                    </div>
                </div>

                <div className="login-footer-info" style={{ marginTop: '1.25rem' }}>
                    *มีปัญหาในการใช้งานโทร 2299 ต่อ 1117*
                </div>

                {/* 1. Hidden Collapsible Staff Login Menu at Bottom */}
                <div style={{ marginTop: '1rem', borderTop: '1px dashed rgba(148, 163, 184, 0.35)', paddingTop: '0.9rem' }}>
                    <button
                        type="button"
                        onClick={() => setShowStaffLogin((v) => !v)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '7px 16px',
                            borderRadius: '999px',
                            background: showStaffLogin ? '#0f172a' : 'rgba(15, 23, 42, 0.06)',
                            color: showStaffLogin ? '#fde68a' : '#475569',
                            border: showStaffLogin ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(148, 163, 184, 0.35)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <FaUserShield size={13} />
                        <span>สำหรับเจ้าหน้าที่</span>
                        {showStaffLogin ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                    </button>

                    {showStaffLogin && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1.25rem 1rem 1rem',
                            borderRadius: '20px',
                            background: 'rgba(248, 250, 252, 0.92)',
                            border: '1px solid rgba(203, 213, 225, 0.75)',
                            boxShadow: 'inset 0 2px 6px rgba(15, 23, 42, 0.04)',
                        }}>
                            <h4 style={{
                                fontSize: '1.35rem',
                                fontWeight: 900,
                                color: '#1e293b',
                                marginBottom: '0.35rem',
                            }}>
                                ระบบจัดการ Stock
                            </h4>
                            <div style={{
                                display: 'inline-block',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#64748b',
                                background: 'rgba(15, 23, 42, 0.05)',
                                padding: '0.3rem 0.9rem',
                                borderRadius: '999px',
                                marginBottom: '1.1rem',
                            }}>
                                ห้องซ่อมบำรุงคอมพิวเตอร์
                            </div>

                            <Form onSubmit={handleSubmit}>
                                <div className="login-input-group" style={{ marginBottom: '0.9rem' }}>
                                    <FaUser className="login-input-icon" />
                                    <Form.Control
                                        type="text"
                                        ref={userRef}
                                        required
                                        autoFocus
                                        placeholder="User"
                                        className="login-input"
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="login-input-group" style={{ position: 'relative', marginBottom: '1rem' }}>
                                    <FaLock className="login-input-icon" />
                                    <Form.Control
                                        type={showPassword ? 'text' : 'password'}
                                        ref={passwordRef}
                                        required
                                        placeholder="Password"
                                        className="login-input"
                                        style={{ paddingRight: '40px' }}
                                        onChange={handleInputChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '15px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'rgba(226, 205, 18, 0.7)',
                                            cursor: 'pointer',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>

                                <Button disabled={loading} className="login-submit-btn w-100" type="submit">
                                    LOGIN
                                </Button>
                            </Form>
                        </div>
                    )}
                </div>
            </div>
            )}

            {/* Error Popup Modal */}
            <Modal
                show={showErrorModal}
                onHide={() => setShowErrorModal(false)}
                centered
                className="login-error-modal"
            >
                <Modal.Body className="text-center p-5">
                    <div className="login-error-icon-wrap mb-4">
                        <FaExclamation className="login-error-icon" />
                    </div>
                    <h3 className="login-error-title fw-bold mb-3">ผลการตรวจสอบ!</h3>
                    <p className="login-error-message mb-4">{error}</p>
                    <Button
                        variant="primary"
                        onClick={() => setShowErrorModal(false)}
                        className="login-error-btn px-5 py-2"
                    >
                        ตกลง
                    </Button>
                </Modal.Body>
            </Modal>

            {/* Mandatory Partner Company Selection Popup (Hospital Logo Notification) */}
            <PartnerCompanyModal
                isOpen={showPartnerModal}
                onSelectCompany={handleSelectPartnerAndLogin}
                onCancel={() => {
                    setShowPartnerModal(false);
                    setPendingQrCreds(null);
                    setPartnerModalError('');
                }}
                loadingCompanyId={selectingCompanyId}
                errorText={partnerModalError}
            />
        </div>
    );
}
