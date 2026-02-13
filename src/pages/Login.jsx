import React, { useRef, useState } from 'react';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSignInAlt } from 'react-icons/fa';

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
        <div className="auth-background d-flex align-items-center justify-content-center">
            <Container>
                <div className="mx-auto" style={{ maxWidth: "400px" }}>
                    <Card className="auth-card border-0 p-3">
                        <Card.Body>
                            <div className="text-center mb-4">
                                <h2 className="mb-3 text-primary fw-bold">เข้าสู่ระบบ</h2>
                                <p className="text-muted">ระบบจัดการ Stock พัสดุครุภัณฑ์</p>
                            </div>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group id="email" className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" ref={emailRef} required placeholder="name@example.com" />
                                </Form.Group>
                                <Form.Group id="password" className="mb-4">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" ref={passwordRef} required placeholder="*******" />
                                </Form.Group>
                                <Button disabled={loading} className="w-100" type="submit" size="lg">
                                    <FaSignInAlt className="me-2" /> เข้าสู่ระบบ
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </div>
            </Container>
        </div>
    );
}
