import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Table, Card, Row, Col, Badge } from 'react-bootstrap';
import { decryptData } from '../utils/encryption';
import { FaBox, FaCheckCircle, FaTruck, FaWarehouse } from 'react-icons/fa';

export default function Dashboard() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [summary, setSummary] = useState({
        total: 0,
        available: 0,
        distributed: 0
    });

    useEffect(() => {
        const stocksRef = ref(db, 'stocks');
        const unsubscribe = onValue(stocksRef, (snapshot) => {
            const data = snapshot.val();
            const loadedStocks = [];
            let total = 0;
            let available = 0;
            let distributed = 0;

            if (data) {
                for (const key in data) {
                    const item = data[key];
                    total++;
                    if (item.status === 'รับเข้า') available++;
                    if (item.status === 'จำหน่าย') distributed++;

                    loadedStocks.push({
                        id: key,
                        ...item,
                        building: decryptData(item.building),
                        department: decryptData(item.department),
                        serialNumber: decryptData(item.serialNumber),
                        assetId: decryptData(item.assetId),
                        brandModel: decryptData(item.brandModel),
                        status: item.status
                    });
                }
            }
            // Sort by timestamp desc
            loadedStocks.sort((a, b) => b.timestamp - a.timestamp);

            setStocks(loadedStocks);
            setSummary({ total, available, distributed });
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return (
        <div>
            <h2 className="mb-4 text-primary fw-bold"><FaWarehouse className="me-2" /> ภาพรวมระบบ (Dashboard)</h2>

            <Row className="mb-4">
                <Col md={4} className="mb-3">
                    <Card className="text-white bg-primary shadow h-100 border-0">
                        <Card.Body className="d-flex align-items-center justify-content-between p-4">
                            <div>
                                <h6 className="opacity-75">พัสดุทั้งหมด (Total)</h6>
                                <h2 className="mb-0 fw-bold">{summary.total}</h2>
                            </div>
                            <FaBox size={40} className="opacity-50" />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-3">
                    <Card className="text-white bg-success shadow h-100 border-0">
                        <Card.Body className="d-flex align-items-center justify-content-between p-4">
                            <div>
                                <h6 className="opacity-75">คงเหลือ (Available)</h6>
                                <h2 className="mb-0 fw-bold">{summary.available}</h2>
                                <small>สถานะ "รับเข้า"</small>
                            </div>
                            <FaCheckCircle size={40} className="opacity-50" />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-3">
                    <Card className="text-white bg-warning shadow h-100 border-0">
                        <Card.Body className="d-flex align-items-center justify-content-between p-4">
                            <div>
                                <h6 className="opacity-75 text-dark">จำหน่ายแล้ว (Distributed)</h6>
                                <h2 className="mb-0 fw-bold text-dark">{summary.distributed}</h2>
                                <small className="text-dark">สถานะ "จำหน่าย"</small>
                            </div>
                            <FaTruck size={40} className="opacity-50 text-dark" />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <h4 className="mb-3 text-dark fw-bold">รายการพัสดุล่าสุด</h4>

            <Card className="shadow-sm border-0 overflow-hidden">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead>
                                <tr>
                                    <th className="py-3 px-4">วันที่</th>
                                    <th className="py-3">Asset ID</th>
                                    <th className="py-3">ยี่ห้อ/รุ่น</th>
                                    <th className="py-3">หน่วยงาน</th>
                                    <th className="py-3 text-center">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-4">กำลังโหลดข้อมูล...</td></tr>
                                ) : stocks.slice(0, 10).map((stock) => (
                                    <tr key={stock.id} className="align-middle">
                                        <td className="px-4 text-muted">{stock.importDate}</td>
                                        <td className="fw-bold text-primary">{stock.assetId}</td>
                                        <td>{stock.brandModel}</td>
                                        <td>{stock.department}</td>
                                        <td className="text-center">
                                            <Badge
                                                bg={stock.status === 'รับเข้า' ? 'success' : 'warning'}
                                                className={`px-3 py-2 ${stock.status === 'จำหน่าย' ? 'text-dark' : ''}`}
                                            >
                                                {stock.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}



