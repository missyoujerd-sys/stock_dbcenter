import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { Card, Row, Col, Table, Badge, Button } from 'react-bootstrap';
import { FaLaptopCode, FaArrowDown, FaArrowUp, FaServer, FaKeyboard, FaMouse, FaBoxOpen } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function ItDashboard() {
    const [stats, setStats] = useState({ total: 0, received: 0, issued: 0 });
    const [recentTx, setRecentTx] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const itRef = ref(db, 'it_equipment_tx');
        const unsubscribe = onValue(itRef, (snapshot) => {
            const data = snapshot.val();
            let totalIn = 0;
            let totalOut = 0;
            const txList = [];

            if (data) {
                for (const key in data) {
                    const tx = data[key];
                    txList.push({ id: key, ...tx });
                    if (tx.type === 'IN') {
                        totalIn += Number(tx.quantity);
                    } else if (tx.type === 'OUT') {
                        totalOut += Number(tx.quantity);
                    }
                }
            }
            
            // Current Stock = Total In - Total Out
            setStats({ total: totalIn - totalOut, received: totalIn, issued: totalOut });
            
            // Sort by timestamp desc and take latest 10
            txList.sort((a, b) => b.timestamp - a.timestamp);
            setRecentTx(txList.slice(0, 10));
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const glassCardStyle = {
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        borderRadius: '20px'
    };

    return (
        <div className="container-fluid py-4" style={{ fontFamily: 'Inter, Prompt, sans-serif', minHeight: '100vh', background: 'radial-gradient(circle at 50% -20%, #ffffff 0%, #f3f4f6 50%, #e2e8f0 100%)' }}>
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: '#1e293b', letterSpacing: '-0.5px' }}>
                        <FaLaptopCode className="me-2 text-primary" />
                        IT-Hardware
                    </h2>
                    <p className="text-muted mb-0">ระบบบริหารจัดการอุปกรณ์ไอที (Hardware)</p>
                </div>
                <div className="d-flex gap-2">
                    <Link to="/it-equipment/receive">
                        <Button className="rounded-pill px-4 shadow-sm border-0 d-flex align-items-center gap-2" style={{ background: 'linear-gradient(45deg, #10b981, #34d399)', transition: 'all 0.3s' }}>
                            <FaArrowDown /> รับเข้าอุปกรณ์ (Receive)
                        </Button>
                    </Link>
                    <Link to="/it-equipment/issue">
                        <Button className="rounded-pill px-4 shadow-sm border-0 d-flex align-items-center gap-2" style={{ background: 'linear-gradient(45deg, #ef4444, #f87171)', transition: 'all 0.3s' }}>
                            <FaArrowUp /> เบิกจ่ายอุปกรณ์ (Issue)
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <Row className="mb-4 g-4">
                <Col md={4}>
                    <Card style={{ ...glassCardStyle, borderLeft: '5px solid #3b82f6' }} className="h-100 overflow-hidden">
                        <Card.Body className="p-4 d-flex align-items-center position-relative">
                            <div className="position-absolute end-0 top-50 translate-middle-y opacity-10 pe-3">
                                <FaBoxOpen size={80} color="#3b82f6" />
                            </div>
                            <div>
                                <p className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: '0.85rem' }}>อุปกรณ์คงเหลือ (Current Stock)</p>
                                <h1 className="fw-black mb-0 text-primary" style={{ fontSize: '3.5rem', fontWeight: '900' }}>{stats.total} <span className="fs-5 text-muted fw-normal">ชิ้น</span></h1>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card style={{ ...glassCardStyle, borderLeft: '5px solid #10b981' }} className="h-100 overflow-hidden">
                        <Card.Body className="p-4 d-flex align-items-center position-relative">
                            <div className="position-absolute end-0 top-50 translate-middle-y opacity-10 pe-3">
                                <FaArrowDown size={80} color="#10b981" />
                            </div>
                            <div>
                                <p className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: '0.85rem' }}>รับเข้าทั้งหมด (Total Received)</p>
                                <h1 className="fw-black mb-0 text-success" style={{ fontSize: '3.5rem', fontWeight: '900' }}>{stats.received} <span className="fs-5 text-muted fw-normal">ชิ้น</span></h1>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card style={{ ...glassCardStyle, borderLeft: '5px solid #ef4444' }} className="h-100 overflow-hidden">
                        <Card.Body className="p-4 d-flex align-items-center position-relative">
                            <div className="position-absolute end-0 top-50 translate-middle-y opacity-10 pe-3">
                                <FaArrowUp size={80} color="#ef4444" />
                            </div>
                            <div>
                                <p className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: '0.85rem' }}>เบิกออกทั้งหมด (Total Issued)</p>
                                <h1 className="fw-black mb-0 text-danger" style={{ fontSize: '3.5rem', fontWeight: '900' }}>{stats.issued} <span className="fs-5 text-muted fw-normal">ชิ้น</span></h1>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Quick Actions & Recent Transactions */}
            <Row className="g-4">
                <Col md={12}>
                    <Card style={glassCardStyle}>
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4" style={{ color: '#334155' }}>ความเคลื่อนไหวล่าสุด (Recent Activity)</h5>
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th className="text-muted py-3 border-0">วันที่ทำรายการ</th>
                                            <th className="text-muted py-3 border-0">ประเภท</th>
                                            <th className="text-muted py-3 border-0">อุปกรณ์</th>
                                            <th className="text-muted py-3 border-0 text-center">จำนวน</th>
                                            <th className="text-muted py-3 border-0">รายละเอียด/ผู้เบิก</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="5" className="text-center py-4">กำลังโหลดข้อมูล...</td></tr>
                                        ) : recentTx.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-4 text-muted">ยังไม่มีรายการเบิก-จ่ายในระบบ</td></tr>
                                        ) : (
                                            recentTx.map(tx => (
                                                <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td className="py-3 fw-medium" style={{ color: '#475569' }}>
                                                        {new Date(tx.timestamp).toLocaleString('th-TH')}
                                                    </td>
                                                    <td className="py-3">
                                                        {tx.type === 'IN' ? (
                                                            <Badge bg="success" className="px-3 py-2 rounded-pill fw-medium" style={{ backgroundColor: 'rgba(16,185,129,0.1) !important', color: '#10b981' }}>รับเข้า</Badge>
                                                        ) : (
                                                            <Badge bg="danger" className="px-3 py-2 rounded-pill fw-medium" style={{ backgroundColor: 'rgba(239,68,68,0.1) !important', color: '#ef4444' }}>เบิกออก</Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-3 fw-bold text-dark">{tx.equipmentName}</td>
                                                    <td className="py-3 text-center">
                                                        <span className={`fw-bold ${tx.type === 'IN' ? 'text-success' : 'text-danger'}`}>
                                                            {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-muted">{tx.remarks || tx.department || '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
