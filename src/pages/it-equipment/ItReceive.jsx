import React, { useState } from 'react';
import { db } from '../../firebase';
import { ref, push } from 'firebase/database';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FaArrowDown, FaCheckCircle, FaLaptopCode, FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

export default function ItReceive() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        equipmentName: '',
        serialNumber: '',
        quantity: 1,
        supplier: '',
        remarks: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        if (!formData.equipmentName.trim()) {
            setError('กรุณาระบุชื่ออุปกรณ์');
            setLoading(false);
            return;
        }
        if (formData.quantity < 1) {
            setError('จำนวนต้องมากกว่า 0');
            setLoading(false);
            return;
        }

        try {
            const txRef = ref(db, 'it_equipment_tx');
            await push(txRef, {
                type: 'IN',
                timestamp: Date.now(),
                equipmentName: formData.equipmentName.trim(),
                serialNumber: formData.serialNumber.trim(),
                quantity: Number(formData.quantity),
                supplier: formData.supplier.trim(),
                remarks: formData.remarks.trim(),
            });

            setSuccess(true);
            setFormData({ equipmentName: '', serialNumber: '', quantity: 1, supplier: '', remarks: '' });
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const glassCardStyle = {
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        borderRadius: '20px'
    };

    return (
        <div className="container-fluid py-4" style={{ fontFamily: 'Inter, Prompt, sans-serif', minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4fd 0%, #fef5f9 100%)' }}>
            <div className="d-flex align-items-center mb-4 gap-3">
                <Button variant="light" onClick={() => navigate('/it-equipment')} className="rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <FaArrowLeft />
                </Button>
                <div>
                    <h2 className="fw-bold mb-0 text-success d-flex align-items-center gap-2">
                        <FaArrowDown /> รับเข้าอุปกรณ์ IT
                    </h2>
                </div>
            </div>

            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card style={glassCardStyle}>
                        <Card.Body className="p-5">
                            {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
                            {success && <Alert variant="success" className="rounded-3"><FaCheckCircle className="me-2"/> บันทึกการรับเข้าสำเร็จ</Alert>}
                            
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-muted small">ชื่ออุปกรณ์ / รุ่น (Equipment Name) *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="equipmentName" 
                                        value={formData.equipmentName} 
                                        onChange={handleChange} 
                                        placeholder="เช่น จอ Dell 24 นิ้ว, เมาส์ Logitech"
                                        className="py-2 px-3 border-0 bg-light rounded-3"
                                        style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold text-muted small">หมายเลข S/N (ถ้ามี)</Form.Label>
                                            <Form.Control 
                                                type="text" 
                                                name="serialNumber" 
                                                value={formData.serialNumber} 
                                                onChange={handleChange} 
                                                className="py-2 px-3 border-0 bg-light rounded-3"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold text-muted small">จำนวนที่รับเข้า *</Form.Label>
                                            <Form.Control 
                                                type="number" 
                                                name="quantity" 
                                                min="1"
                                                value={formData.quantity} 
                                                onChange={handleChange} 
                                                className="py-2 px-3 border-0 bg-light rounded-3 fw-bold text-primary"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-muted small">บริษัท/ผู้ส่งมอบ (Supplier)</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="supplier" 
                                        value={formData.supplier} 
                                        onChange={handleChange} 
                                        className="py-2 px-3 border-0 bg-light rounded-3"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-5">
                                    <Form.Label className="fw-bold text-muted small">หมายเหตุ (Remarks)</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={3}
                                        name="remarks" 
                                        value={formData.remarks} 
                                        onChange={handleChange} 
                                        className="py-2 px-3 border-0 bg-light rounded-3"
                                    />
                                </Form.Group>

                                <Button 
                                    type="submit" 
                                    className="w-100 rounded-pill py-3 fw-bold fs-5 shadow-sm border-0" 
                                    style={{ background: 'linear-gradient(45deg, #10b981, #34d399)' }}
                                    disabled={loading}
                                >
                                    {loading ? 'กำลังบันทึก...' : 'ยืนยันการรับเข้า'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
