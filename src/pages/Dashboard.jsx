import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Table, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { decryptData } from '../utils/encryption';
import { useNavigate, Link } from 'react-router-dom';
import { FaPlusSquare, FaTruck, FaWarehouse, FaClipboardList, FaHome, FaHistory, FaBolt, FaBox, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import ItemDetailModal from '../components/ItemDetailModal';

export default function Dashboard() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

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
                        category: decryptData(item.category || ''),
                        brandModel: decryptData(item.brandModel),
                        computerName: decryptData(item.computerName || ''),
                        remarks: decryptData(item.remarks || '-'),
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

    const handleRowClick = (item) => {
        setSelectedItem(item);
        setShowDetailModal(true);
    };

    return (
        <div>
            <div className="page-header-container">
                <div className="page-title-badge">
                    <div className="page-icon-box">
                        <FaWarehouse />
                    </div>
                    <h2 className="page-title-text">
                        ภาพรวมระบบ <small>(Dashboard)</small>
                    </h2>
                </div>
            </div>

            <Row className="mb-2">
                <Col xs={12} md={6} lg={4} className="mb-3">
                    <Card className="text-white shadow h-100 border-0 summary-card card-summary-total">
                        <Card.Body className="d-flex align-items-center justify-content-between p-4">
                            <div>
                                <h6 className="opacity-75 mb-1 text-uppercase small fw-bold">พัสดุทั้งหมด (Total)</h6>
                                <h2 className="mb-0 fw-bold">{summary.total}</h2>
                            </div>
                            <div className="summary-icon-wrapper">
                                <FaBox size={32} className="text-white" />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={6} lg={4} className="mb-3">
                    <Card className="text-white shadow h-100 border-0 summary-card card-summary-available">
                        <Card.Body className="d-flex align-items-center justify-content-between p-4">
                            <div>
                                <h6 className="opacity-75 mb-1 text-uppercase small fw-bold">คงเหลือ (Available)</h6>
                                <h2 className="mb-0 fw-bold">{summary.available}</h2>
                                <small className="opacity-75">สถานะ "รับเข้า"</small>
                            </div>
                            <div className="summary-icon-wrapper">
                                <FaCheckCircle size={32} className="text-white" />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={12} lg={4} className="mb-3">
                    <Card className="text-white shadow h-100 border-0 summary-card card-summary-distributed">
                        <Card.Body className="d-flex align-items-center justify-content-between p-4">
                            <div>
                                <h6 className="opacity-75 mb-1 text-uppercase small fw-bold">จำหน่ายแล้ว (Distributed)</h6>
                                <h2 className="mb-0 fw-bold">{summary.distributed}</h2>
                                <small className="opacity-75">สถานะ "จำหน่าย"</small>
                            </div>
                            <div className="summary-icon-wrapper">
                                <FaTruck size={32} className="text-white" />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <div className="section-header-container mt-4">
                <div className="section-accent"></div>
                <h4 className="section-title-text">
                    เมนูด่วนกดเลย
                    <span className="section-title-badge">QUICK MENU</span>
                </h4>
            </div>
            <Row className="mb-4">
                <Col xs={12} md={4} className="mb-3">
                    <Link to="/incoming" className="text-decoration-none">
                        <Card className="h-100 text-center py-5 shadow border-0 quick-menu-card card-incoming">
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                                <div className="quick-menu-icon-wrapper">
                                    <FaPlusSquare size={44} className="text-white" />
                                </div>
                                <h5 className="mb-0">รับอุปกรณ์รอจำหน่ายเข้า</h5>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
                <Col xs={12} md={4} className="mb-3">
                    <Link to="/distribution" className="text-decoration-none">
                        <Card className="h-100 text-center py-5 shadow border-0 quick-menu-card card-distribution">
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                                <div className="quick-menu-icon-wrapper">
                                    <FaTruck size={44} className="text-white" />
                                </div>
                                <h5 className="mb-0">รอจำหน่ายออก</h5>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
                <Col xs={12} md={4} className="mb-3">
                    <Link to="/inventory" className="text-decoration-none">
                        <Card className="h-100 text-center py-5 shadow border-0 quick-menu-card card-inventory">
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                                <div className="quick-menu-icon-wrapper">
                                    <FaClipboardList size={44} className="text-white" />
                                </div>
                                <h5 className="mb-0">ดูรายการทั้งหมด</h5>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
            </Row>

            <div className="section-header-container mt-2">
                <div className="section-accent"></div>
                <h4 className="section-title-text">
                    รายการพัสดุล่าสุด
                    <span className="section-title-badge">LATEST ITEMS</span>
                </h4>
            </div>
            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover striped className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>วันที่</th>
                                    <th>หมายเลขครุภัณฑ์</th>
                                    <th>ยี่ห้อ/รุ่น</th>
                                    <th>หน่วยงาน</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-4">กำลังโหลดข้อมูล...</td></tr>
                                ) : stocks.slice(0, 10).map((stock) => (
                                    <tr
                                        key={stock.id}
                                        onClick={() => handleRowClick(stock)}
                                        style={{ cursor: 'pointer' }}
                                        title="คลิกเพื่อดูรายละเอียด"
                                    >
                                        <td>{stock.importDate}</td>
                                        <td className="fw-bold">{stock.assetId}</td>
                                        <td>{stock.brandModel}</td>
                                        <td>{stock.department}</td>
                                        <td>
                                            <Badge bg={stock.status === 'รับเข้า' ? 'success' : (stock.status === 'จำหน่าย' ? 'danger' : 'warning')}>
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

            <ItemDetailModal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                item={selectedItem}
            />
        </div>
    );
}
