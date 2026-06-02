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
                <span className="login-bg-word login-bg-word--2">NKP</span>
           </div>

            <div className="login-card">
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
                                color: 'rgba(255, 255, 255, 0.7)',
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
                                flex: 1,
                                borderRadius: '12px',
                                border: '2px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '1.2rem',
                                padding: '1rem',
                                transition: 'all 0.3s ease',
                                background: 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            ลืมรหัสผ่าน
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
