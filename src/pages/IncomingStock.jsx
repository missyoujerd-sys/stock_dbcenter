import React, { useState } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { db } from '../firebase';
import { ref, push, set } from 'firebase/database';
import { encryptData } from '../utils/encryption';
import { useAuth } from '../contexts/AuthContext.jsx';
import { FaSave } from 'react-icons/fa';

export default function IncomingStock() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        surveyDate: new Date().toISOString().split('T')[0],
        building: '',
        department: '',
        serialNumber: '',
        assetId: '',
        brandModel: '',
        remarks: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const stocksRef = ref(db, 'stocks');
            const newStockRef = push(stocksRef);

            const stockData = {
                importDate: formData.surveyDate, // ว/ด/ป สำรวจ
                building: encryptData(formData.building),
                department: encryptData(formData.department),
                serialNumber: encryptData(formData.serialNumber),
                assetId: encryptData(formData.assetId),
                brandModel: encryptData(formData.brandModel),
                remarks: encryptData(formData.remarks),

                qt_received: 1, // Default 1
                qt_distributed: 0,
                qt_balance: 1,

                status: 'รับเข้า',
                distributor: '', // Empty initially
                distributionDate: '',

                receiverId: currentUser.uid,
                timestamp: Date.now()
            };

            await set(newStockRef, stockData);
            setSuccess('บันทึกข้อมูลสำเร็จ!');
            setFormData({
                surveyDate: new Date().toISOString().split('T')[0],
                building: '',
                department: '',
                serialNumber: '',
                assetId: '',
                brandModel: '',
                remarks: ''
            });
        } catch (err) {
            console.error("Error saving stock:", err);
            setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }

        setLoading(false);
    };

    return (
        <Card className="shadow-sm border-0">
            <Card.Header as="h5" className="bg-white py-4 text-dark border-0 fw-bold px-4">
                รับเข้า Stock (Incoming)
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="surveyDate">
                                <Form.Label>ว/ด/ป สำรวจ</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="surveyDate"
                                    value={formData.surveyDate}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="assetId">
                                <Form.Label>หมายเลขครุภัณฑ์ (Asset ID)</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="assetId"
                                    value={formData.assetId}
                                    onChange={handleChange}
                                    placeholder="ระบุหมายเลขครุภัณฑ์"
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="brandModel">
                                <Form.Label>ยี่ห้อ / รุ่น</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="brandModel"
                                    value={formData.brandModel}
                                    onChange={handleChange}
                                    placeholder="ระบุยี่ห้อ/รุ่น"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="serialNumber">
                                <Form.Label>S/N (Serial Number)</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="serialNumber"
                                    value={formData.serialNumber}
                                    onChange={handleChange}
                                    placeholder="ระบุ Serial Number"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="department">
                                <Form.Label>หน่วยงาน</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    placeholder="ระบุหน่วยงาน"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="building">
                                <Form.Label>อาคาร</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="building"
                                    value={formData.building}
                                    onChange={handleChange}
                                    placeholder="ระบุอาคาร"
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-4">
                        <Col md={12}>
                            <Form.Group controlId="remarks">
                                <Form.Label>หมายเหตุ</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <Button variant="primary" type="submit" disabled={loading} size="lg">
                            <FaSave className="me-2" /> บันทึกรับเข้า (Incoming)
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}
