import React, { useRef, useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';

export default function Login() {
    let userRef = useRef();
    const passwordRef = useRef();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            if (userRef.current.value.includes('@')) {
                userRef = userRef.current.value;
            } else {
                userRef = userRef.current.value + '@nkp.com';
            }
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
            <div className="login-card">
                <h1 className="login-title">Login</h1>
                <h2 className="login-subtitle">ระบบจัดการ Stock อุปกรณ์รอจำหน่าย</h2>

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

                    <div className="login-input-group">
                        <FaLock className="login-input-icon" />
                        <Form.Control
                            type="password"
                            ref={passwordRef}
                            required
                            placeholder="Password"
                            className="login-input"
                        />
                    </div>

                    <Button disabled={loading} className="login-submit-btn" type="submit">
                        LOGIN
                    </Button>
                </Form>


            </div>
        </div>
    );
}

