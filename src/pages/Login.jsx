import React, { useRef, useState } from 'react';
import { Form, Button, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, get, update } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaExclamation } from 'react-icons/fa';

export default function Login() {
    let userRef = useRef();
    const passwordRef = useRef();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    // Forgot Password States
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotUser, setForgotUser] = useState('');
    const [forgotMessage, setForgotMessage] = useState('');
    const [isForgotSuccess, setIsForgotSuccess] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);

            let email = userRef.current.value;
            if (!email.includes('@')) {
                email = email + '@nkp.com';
            }

            const escapedEmail = email.replace(/\./g, ',');
            const userStatusRef = ref(db, `users_status/${escapedEmail}`);
            const snapshot = await get(userStatusRef);
            const userStatus = snapshot.val() || { failedAttempts: 0, locked: false };

            if (userStatus.locked) {
                setError('บัญชีของคุณถูกระงับเนื่องจากใส่รหัสผ่านผิดเกิน 3 ครั้ง กรุณากด "ลืมรหัสผ่าน"');
                setShowErrorModal(true);
                setLoading(false);
                return;
            }

            await login(email, passwordRef.current.value);

            if (userStatus.failedAttempts > 0) {
                await update(userStatusRef, { failedAttempts: 0 });
            }

            navigate('/');
        } catch (err) {
            console.error(err);

            if (err.message === 'ท่านไม่มีชื่อในระบบ') {
                setError(err.message);
                setShowErrorModal(true);
                setLoading(false);
                return;
            }

            let email = userRef.current.value;
            if (!email.includes('@')) { email = email + '@nkp.com'; }
            const escapedEmail = email.replace(/\./g, ',');
            const userStatusRef = ref(db, `users_status/${escapedEmail}`);

            const snapshot = await get(userStatusRef);
            const userStatus = snapshot.val() || { failedAttempts: 0 };
            const newAttempts = (userStatus.failedAttempts || 0) + 1;

            if (newAttempts >= 3) {
                await update(userStatusRef, { failedAttempts: newAttempts, locked: true });
                setError('คุณใส่รหัสผ่านผิดเกิน 3 ครั้ง บัญชีถูกระงับแล้ว กรุณากด "ลืมรหัสผ่าน"');
            } else {
                await update(userStatusRef, { failedAttempts: newAttempts });
                setError(`ชื่อล็อกอินหรือรหัสผ่านไม่ถูกต้อง (ผิด ${newAttempts}/3 ครั้ง)`);
            }

            setShowErrorModal(true);
        }

        setLoading(false);
    }

    async function handleForgotSubmit(e) {
        e.preventDefault();
        setForgotMessage('');
        if (!forgotUser.trim()) {
            setForgotMessage('กรุณาระบุชื่อผู้ใช้งาน');
            return;
        }

        let email = forgotUser;
        if (!email.includes('@')) { email = email + '@nkp.com'; }
        const escapedEmail = email.replace(/\./g, ',');

        try {
            await update(ref(db, `users_status/${escapedEmail}`), {
                resetRequested: true,
                email: email,
                timestamp: Date.now()
            });
            setIsForgotSuccess(true);
            setForgotMessage('ส่งคำขอสำเร็จแล้ว กรุณาแจ้ง/รอแอดมินดำเนินการ');
        } catch (error) {
            setForgotMessage('เกิดข้อผิดพลาดในการส่งคำขอ');
        }
    }

    return (
        <div className="login-page">
            {/* Dimensional Background Text */}
            <div className="login-bg-text" aria-hidden="true">
                <span className="login-bg-word login-bg-word--1">NKP</span>
                <span className="login-bg-word login-bg-word--2">NKP</span>
           </div>

            <div className="login-card overflow-hidden" style={{ position: 'relative' }}>
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
                            คุณใช้ภาษาไทยนะครับ
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', fontFamily: 'Prompt, sans-serif' }}>
                            ผมเปลี่ยนเป็นภาษาอังกฤษให้แล้วนะครับ
                        </div>
                    </div>
                </div>

                {/* Mourning Ribbons */}
                <div className="mourning-ribbon top-left"></div>
                <div className="mourning-ribbon top-right"></div>
                <h4 className="login-title">ระบบจัดการ Stock</h4>
                <h4 className="login-subtitle"> ห้องซ่อมบำรุงคอมพิวเตอร์ </h4>

                <Form onSubmit={handleSubmit}>
                    <div className="login-input-group">
                        <FaUser className="login-input-icon" />
                        <Form.Control
                            type="text"
                            ref={userRef}
                            required
                            placeholder="User"
                            className="login-input"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="login-input-group" style={{ position: 'relative' }}>
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

                    <div className="d-flex gap-3 w-100 mt-2">
                        <Button disabled={loading} className="login-submit-btn" type="submit" style={{ flex: 1 }}>
                            LOGIN
                        </Button>
                        <Button
                            variant="outline-light"
                            type="button"
                            onClick={() => {
                                setForgotUser('');
                                setForgotMessage('');
                                setIsForgotSuccess(false);
                                setShowForgotModal(true);
                            }}
                            style={{
                                flex: 1.0,
                                borderRadius: '10px',
                                border: '1px solid rgba(226, 188, 63, 0.88)',
                                color: '#f8f8f5ff',
                                fontWeight: '200',
                                fontSize: '1.2rem',
                                padding: '1rem',
                                transition: 'all 0.5s ease',
                                background: 'rgba(196, 136, 47, 0.7)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(224, 193, 14, 0.74)'; e.currentTarget.style.borderColor = 'rgba(214, 16, 148, 0.71)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(126, 138, 97, 0.7)'; e.currentTarget.style.borderColor = 'rgba(145, 224, 99, 0.96)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            บัญชีถูกล็อก
                        </Button>
                    </div>
                </Form>

                <div className="login-footer-info">
                    *มีปัญหาในการใช้งานโทร 2299 ต่อ 1117*
                </div>
            </div>

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

            {/* Forgot Password Modal - styled like reference image */}
            {showForgotModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', padding: '2rem',
                        width: '100%', maxWidth: '360px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Gradient top bar */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                            background: 'linear-gradient(to right, #a855f7, #ec4899, #ef4444)',
                            borderRadius: '24px 24px 0 0'
                        }} />

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            {/* Icon */}
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: '#f3e8ff', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', marginBottom: '1rem', marginTop: '0.5rem'
                            }}>
                                <span style={{ fontSize: '2rem' }}>🔑</span>
                            </div>

                            <h3 style={{
                                fontSize: '1.25rem', fontWeight: '900', color: '#1e293b',
                                fontFamily: 'Prompt, sans-serif', marginBottom: '0.25rem'
                            }}>ลืมรหัสผ่าน / บัญชีถูกล็อก</h3>
                            <p style={{
                                fontSize: '0.85rem', color: '#64748b',
                                fontFamily: 'Prompt, sans-serif', marginBottom: '1.5rem'
                            }}>สำหรับส่งคำขอให้ Admin ปลดล็อก</p>

                            {isForgotSuccess ? (
                                <div style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: '1rem', fontFamily: 'Prompt, sans-serif' }}>
                                    ✅ {forgotMessage}
                                </div>
                            ) : (
                                <form onSubmit={handleForgotSubmit} style={{ width: '100%' }}>
                                    <input
                                        type="text"
                                        value={forgotUser}
                                        onChange={(e) => setForgotUser(e.target.value)}
                                        placeholder="Username (เช่น somchai)"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem 1rem',
                                            borderRadius: '14px',
                                            textAlign: 'center',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            border: '2px solid #e2e8f0',
                                            outline: 'none',
                                            fontFamily: 'Prompt, sans-serif',
                                            background: '#f8fafc',
                                            color: '#1e293b',
                                            marginBottom: '0.75rem',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#c084fc'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                    {forgotMessage && (
                                        <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.75rem', fontFamily: 'Prompt, sans-serif' }}>
                                            {forgotMessage}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(false)}
                                            style={{
                                                flex: 1, padding: '0.8rem', borderRadius: '14px',
                                                background: '#f1f5f9', color: '#475569',
                                                fontWeight: 'bold', border: 'none', cursor: 'pointer',
                                                fontFamily: 'Prompt, sans-serif', fontSize: '1rem'
                                            }}
                                        >
                                            ปิด
                                        </button>
                                        <button
                                            type="submit"
                                            style={{
                                                flex: 1, padding: '0.8rem', borderRadius: '14px',
                                                background: 'linear-gradient(to right, #a855f7, #db2777)',
                                                color: 'white', fontWeight: 'bold', border: 'none',
                                                cursor: 'pointer', fontFamily: 'Prompt, sans-serif',
                                                fontSize: '1rem', boxShadow: '0 4px 15px rgba(168,85,247,0.4)'
                                            }}
                                        >
                                            ส่งคำขอ
                                        </button>
                                    </div>
                                </form>
                            )}

                            {isForgotSuccess && (
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(false)}
                                    style={{
                                        width: '100%', padding: '0.8rem', borderRadius: '14px',
                                        background: '#f1f5f9', color: '#475569',
                                        fontWeight: 'bold', border: 'none', cursor: 'pointer',
                                        fontFamily: 'Prompt, sans-serif', fontSize: '1rem', marginTop: '1rem'
                                    }}
                                >
                                    ปิด
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
