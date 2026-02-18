import React, { useRef, useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';

export default function Login() {
    const emailRef = useRef();
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
            await login(emailRef.current.value, passwordRef.current.value);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
        }

        setLoading(false);
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">Login</h1>

                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <div className="login-input-group">
                        <FaUser className="login-input-icon" />
                        <Form.Control
                            type="text"
                            ref={emailRef}
                            required
                            placeholder="Username"
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

                    <div className="login-options">
                        <label className="remember-me">
                            <input type="checkbox" className="remember-checkbox" />
                            <span>Remember me</span>
                        </label>
                        <Link to="/forgot-password" title="Forgot password?" className="forgot-link">
                            Forgot your password?
                        </Link>
                    </div>

                    <Button disabled={loading} className="login-submit-btn" type="submit">
                        LOGIN
                    </Button>
                </Form>

                <div className="forgot-password-footer">
                    <Link to="/forgot-password" style={{ color: 'inherit', textDecoration: 'none' }}>
                        Forgot your password?
                    </Link>
                </div>
            </div>
        </div>
    );
}

