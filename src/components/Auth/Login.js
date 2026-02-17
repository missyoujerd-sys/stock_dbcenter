import React, { useRef, useState } from 'react';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

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
        } catch {
            setError('ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
        }

        setLoading(false);
    }

    return (
        <Container
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: '100vh' }}
        >
            <div className="w-100" style={{ maxWidth: '400px' }}>
                <Card className="shadow-sm">
                    <Card.Body>
                        <h2 className="text-center mb-4">เข้าสู่ระบบ</h2>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            <Form.Group id="email" className="mb-3">
                                <Form.Label>อีเมล</Form.Label>
                                <Form.Control type="email" ref={emailRef} required />
                            </Form.Group>
                            <Form.Group id="password" className="mb-4">
                                <Form.Label>รหัสผ่าน</Form.Label>
                                <Form.Control type="password" ref={passwordRef} required />
                            </Form.Group>
                            <Button disabled={loading} className="w-100" type="submit">
                                เข้าสู่ระบบ
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
                <div className="w-100 text-center mt-2">
                    ยังไม่มีบัญชีใช่ไหม? <Link to="/register">ลงทะเบียน</Link>
                </div>
            </div>
        </Container>
    );
}
