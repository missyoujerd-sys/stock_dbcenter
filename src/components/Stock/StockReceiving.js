import React, { useRef, useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { database } from '../../services/firebase';
import { ref, push, set } from 'firebase/database';
import { encryptData } from '../../services/encryption';
import { useAuth } from '../../contexts/AuthContext';
import NavigationBar from '../Layout/Navbar';

export default function StockReceiving() {
    const sourceRef = useRef();
    const destinationRef = useRef();
    const itemNameRef = useRef();
    const quantityRef = useRef();
    const { currentUser } = useAuth();
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setMessage('');
            setLoading(true);

            const stockData = {
                source: sourceRef.current.value,
                destination: destinationRef.current.value,
                itemName: itemNameRef.current.value,
                quantity: Number(quantityRef.current.value),
                status: 'รับเข้า',
                dateReceived: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                userId: currentUser.uid,
                timestamp: Date.now()
            };

            // Encrypt sensitive data
            const encryptedData = encryptData(stockData);

            if (!encryptedData) {
                throw new Error('Encryption failed');
            }

            // Save to Firebase
            const newStockRef = push(ref(database, 'stocks'));
            await set(newStockRef, {
                encryptedData: encryptedData,
                timestamp: stockData.timestamp,
                userId: stockData.userId
            });

            setMessage('บันทึกข้อมูลสำเร็จ');
            e.target.reset();

            // Optional: Redirect or just show success message
            // navigate('/stock-list');
        } catch (error) {
            console.error(error);
            setError('ไม่สามารถบันทึกข้อมูลได้: ' + error.message);
        }

        setLoading(false);
    }

    return (
        <>
            <NavigationBar />
            <Container>
                <Row className="justify-content-md-center">
                    <Col md={8}>
                        <Card className="shadow-sm">
                            <Card.Header as="h4" className="bg-primary text-white">รับเข้า Stock</Card.Header>
                            <Card.Body>
                                {error && <Alert variant="danger">{error}</Alert>}
                                {message && <Alert variant="success">{message}</Alert>}

                                <Form onSubmit={handleSubmit}>
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group id="source">
                                                <Form.Label>จาก (Source)</Form.Label>
                                                <Form.Control type="text" ref={sourceRef} required placeholder="ระบุต้นทางที่มาของครุภัณฑ์" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group id="destination">
                                                <Form.Label>ถึง (Destination)</Form.Label>
                                                <Form.Control type="text" ref={destinationRef} required placeholder="ระบุปลายทางที่เก็บครุภัณฑ์รอจำหน่าย" />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group id="itemName" className="mb-3">
                                        <Form.Label>ชื่อ/รุ่น/เลขครุภัณฑ์ (Item Name)</Form.Label>
                                        <Form.Control type="text" ref={itemNameRef} required placeholder="ระบุชื่อ/รุ่น/เลขครุภัณฑ์" />
                                    </Form.Group>

                                    <Form.Group id="quantity" className="mb-4">
                                        <Form.Label>จำนวน (Quantity)</Form.Label>
                                        <Form.Control type="number" ref={quantityRef} required min="1" placeholder="0" />
                                    </Form.Group>

                                    <div className="d-grid gap-2">
                                        <Button disabled={loading} variant="primary" size="lg" type="submit">
                                            บันทึกข้อมูลรับเข้า
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}
