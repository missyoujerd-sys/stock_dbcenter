import React, { useRef, useState } from 'react';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { database } from '../../services/firebase';
import { ref, set } from 'firebase/database';

export default function Register() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();
    const { signup } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError('รหัสผ่านไม่ตรงกัน');
        }

        try {
            setError('');
            setLoading(true);
            const userCredential = await signup(emailRef.current.value, passwordRef.current.value);
            const user = userCredential.user;

            // Save user data to Realtime Database
            await set(ref(database, 'users/' + user.uid), {
                email: user.email,
                role: 'user',
                createdAt: new Date().toISOString()
            });

            navigate('/');
        } catch (error) {
            console.error(error);
            setError('ไม่สามารถสร้างบัญชีได้: ' + error.message);
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
                        <h2 className="text-center mb-4">ลงทะเบียน</h2>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            <Form.Group id="email" className="mb-3">
                                <Form.Label>อีเมล</Form.Label>
                                <Form.Control type="email" ref={emailRef} required />
                            </Form.Group>
                            <Form.Group id="password" className="mb-3">
                                <Form.Label>รหัสผ่าน</Form.Label>
                                <Form.Control type="password" ref={passwordRef} required />
                            </Form.Group>
                            <Form.Group id="password-confirm" className="mb-4">
                                <Form.Label>ยืนยันรหัสผ่าน</Form.Label>
                                <Form.Control type="password" ref={passwordConfirmRef} required />
                            </Form.Group>
                            <Button disabled={loading} className="w-100" type="submit">
                                ลงทะเบียน
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
                <div className="w-100 text-center mt-2">
                    มีบัญชีแล้วใช่ไหม? <Link to="/login">เข้าสู่ระบบ</Link>
                </div>
            </div>
        </Container>
    );
}
