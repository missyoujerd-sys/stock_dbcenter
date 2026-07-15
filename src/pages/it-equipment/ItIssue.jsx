import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, push, onValue } from 'firebase/database';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FaArrowUp, FaCheckCircle, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

export default function ItIssue() {
    const navigate = useNavigate();
    const [availableItems, setAvailableItems] = useState([]);
    
    const [formData, setFormData] = useState({
        equipmentName: '',
        quantity: 1,
        department: '',
        receiver: '',
        remarks: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch current stock to show suggestions (optional, but good for premium feel)
        const itRef = ref(db, 'it_equipment_tx');
        onValue(itRef, (snapshot) => {
            const data = snapshot.val();
            const itemsMap = new Map();
            
            if (data) {
                for (const key in data) {
                    const tx = data[key];
                    const eqName = tx.equipmentName;
                    const currentQty = itemsMap.get(eqName) || 0;
                    if (tx.type === 'IN') {
                        itemsMap.set(eqName, currentQty + tx.quantity);
                    } else if (tx.type === 'OUT') {
                        itemsMap.set(eqName, currentQty - tx.quantity);
                    }
                }
            }
            
            const available = [];
            itemsMap.forEach((qty, name) => {
                if (qty > 0) available.push({ name, qty });
            });
            setAvailableItems(available);
        });
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectEquipment = (e) => {
        setFormData({ ...formData, equipmentName: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        if (!formData.equipmentName.trim()) {
            setError('กรุณาระบุชื่ออุปกรณ์ที่ต้องการเบิก');
            setLoading(false);
            return;
        }
        if (formData.quantity < 1) {
            setError('จำนวนต้องมากกว่า 0');
            setLoading(false);
            return;
        }
        
        // Check stock
        const selectedItem = availableItems.find(item => item.name === formData.equipmentName.trim());
        if (!selectedItem || selectedItem.qty < formData.quantity) {
            setError(`จำนวนอุปกรณ์ในคลังไม่เพียงพอ (คงเหลือ: ${selectedItem ? selectedItem.qty : 0})`);
            setLoading(false);
            return;
        }

        try {
            const txRef = ref(db, 'it_equipment_tx');
            await push(txRef, {
                type: 'OUT',
                timestamp: Date.now(),
                equipmentName: formData.equipmentName.trim(),
                quantity: Number(formData.quantity),
                department: formData.department.trim(),
                receiver: formData.receiver.trim(),
                remarks: formData.remarks.trim(),
            });

            setSuccess(true);
            setFormData({ equipmentName: '', quantity: 1, department: '', receiver: '', remarks: '' });
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
                    <h2 className="fw-bold mb-0 text-danger d-flex align-items-center gap-2">
                        <FaArrowUp /> เบิกจ่ายอุปกรณ์ IT
                    </h2>
                </div>
            </div>

            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card style={glassCardStyle}>
                        <Card.Body className="p-5">
                            {error && <Alert variant="danger" className="rounded-3"><FaExclamationTriangle className="me-2"/> {error}</Alert>}
                            {success && <Alert variant="success" className="rounded-3"><FaCheckCircle className="me-2"/> บันทึกการเบิกจ่ายสำเร็จ</Alert>}
                            
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-muted small">เลือกอุปกรณ์ที่มีในคลัง (Available Equipment) *</Form.Label>
                                    <Form.Select 
                                        name="equipmentSelect" 
                                        onChange={handleSelectEquipment}
                                        value={formData.equipmentName}
                                        className="py-2 px-3 border-0 bg-light rounded-3 mb-2"
                                        style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}
                                    >
                                        <option value="">-- เลือกอุปกรณ์ --</option>
                                        {availableItems.map((item, idx) => (
                                            <option key={idx} value={item.name}>{item.name} (คงเหลือ: {item.qty})</option>
                                        ))}
                                    </Form.Select>
                                    
                                    <Form.Control 
                                        type="text" 
                                        name="equipmentName" 
                                        value={formData.equipmentName} 
                                        onChange={handleChange} 
                                        placeholder="หรือพิมพ์ชื่ออุปกรณ์เอง..."
                                        className="py-2 px-3 border-0 bg-light rounded-3"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-muted small">จำนวนที่เบิก *</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        name="quantity" 
                                        min="1"
                                        value={formData.quantity} 
                                        onChange={handleChange} 
                                        className="py-2 px-3 border-0 bg-light rounded-3 fw-bold text-danger w-50"
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold text-muted small">แผนกที่ขอเบิก</Form.Label>
                                            <Form.Control 
                                                type="text" 
                                                name="department" 
                                                value={formData.department} 
                                                onChange={handleChange} 
                                                className="py-2 px-3 border-0 bg-light rounded-3"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold text-muted small">ผู้รับอุปกรณ์</Form.Label>
                                            <Form.Control 
                                                type="text" 
                                                name="receiver" 
                                                value={formData.receiver} 
                                                onChange={handleChange} 
                                                className="py-2 px-3 border-0 bg-light rounded-3"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-5">
                                    <Form.Label className="fw-bold text-muted small">หมายเหตุ (เหตุผลการเบิก)</Form.Label>
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
                                    style={{ background: 'linear-gradient(45deg, #ef4444, #f87171)' }}
                                    disabled={loading}
                                >
                                    {loading ? 'กำลังบันทึก...' : 'ยืนยันการเบิกจ่าย'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
