import React, { useRef, useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login() {
    let userRef = useRef();
    const passwordRef = useRef();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            if (userRef.current.value.includes('@')) { userRef = userRef.current.value; } //เพิ่ม @nkp.com ถ้าไม่มี
            else { userRef = userRef.current.value + '@nkp.com'; } //เพิ่ม @nkp.com ถ้าไม่มี

            await login(userRef, passwordRef.current.value);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบชื่อผู้ใช้งานและรหัสผ่าน');
        }

        setLoading(false);
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

                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

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

                    <Button disabled={loading} className="login-submit-btn" type="submit">
                        LOGIN
                    </Button>
                </Form>


            </div>
        </div>
    );
}

