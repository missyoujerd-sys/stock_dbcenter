import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Table, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { decryptData } from '../utils/encryption';
import { FaBox, FaCheckCircle, FaTruck, FaWarehouse, FaPlusSquare, FaClipboardList, FaHome, FaInfoCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
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
            <h2 className="mb-4 text-primary fw-bold"><FaWarehouse className="me-2" /> ภาพรวมระบบ (Dashboard)</h2>

            <Row className="mb-2">
                <Col xs={12} md={6} lg={4} className="mb-3">
                    <Card className="text-white bg-primary shadow h-100 border-0">
                        <Card.Body className="d-flex align-items-center justify-content-between">
                            <div>
                                <h6 className="opacity-75">พัสดุทั้งหมด (Total)</h6>
                                <h2 className="mb-0 fw-bold">{summary.total}</h2>
                            </div>
                            <FaBox size={40} className="opacity-50" />
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={6} lg={4} className="mb-3">
                    <Card className="text-white bg-success shadow h-100 border-0">
                        <Card.Body className="d-flex align-items-center justify-content-between">
                            <div>
                                <h6 className="opacity-75">คงเหลือ (Available)</h6>
                                <h2 className="mb-0 fw-bold">{summary.available}</h2>
                                <small>สถานะ "รับเข้า"</small>
                            </div>
                            <FaCheckCircle size={40} className="opacity-50" />
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={12} lg={4} className="mb-3">
                    <Card className="text-white bg-danger shadow h-100 border-0">
                        <Card.Body className="d-flex align-items-center justify-content-between">
                            <div>
                                <h6 className="opacity-75">จำหน่ายแล้ว (Distributed)</h6>
                                <h2 className="mb-0 fw-bold">{summary.distributed}</h2>
                                <small>สถานะ "จำหน่าย"</small>
                            </div>
                            <FaTruck size={40} className="opacity-50" />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <h4 className="mb-3 mt-4 text-dark fw-bold">เมนูด่วนกดเลย (Quick Menu)</h4>
            <Row className="mb-4">
                <Col xs={12} md={4} className="mb-3">
                    <Link to="/incoming" className="text-decoration-none">
                        <Card className="h-100 text-center py-4 shadow-sm border-0 quick-menu-card quick-menu-incoming">
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                                <div className="quick-menu-icon-wrapper mb-3">
                                    <FaPlusSquare size={48} className="text-success" />
                                </div>
                                <h5 className="text-success fw-bold mb-0">รับอุปกรณ์รอจำหน่ายเข้า</h5>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
                <Col xs={12} md={4} className="mb-3">
                    <Link to="/distribution" className="text-decoration-none">
                        <Card className="h-100 text-center py-4 shadow-sm border-0 quick-menu-card quick-menu-distribution">
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                                <div className="quick-menu-icon-wrapper mb-3">
                                    <FaTruck size={48} className="text-yellow-dark" />
                                </div>
                                <h5 className="text-yellow-dark fw-bold mb-0">รอจำหน่ายออก</h5>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
                <Col xs={12} md={4} className="mb-3">
                    <Link to="/inventory" className="text-decoration-none">
                        <Card className="h-100 text-center py-4 shadow-sm border-0 quick-menu-card quick-menu-inventory">
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                                <div className="quick-menu-icon-wrapper mb-3">
                                    <FaClipboardList size={48} className="text-purple" />
                                </div>
                                <h5 className="text-purple fw-bold mb-0">ดูรายการทั้งหมด</h5>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
            </Row>

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 text-primary fw-bold">รายการพัสดุล่าสุด</h5>
                    <Button
                        variant="success"
                        size="sm"
                        className="rounded-pill px-3 shadow-sm"
                        onClick={handleExportExcel}
                    >
                        <FaFileExcel className="me-1" /> Export Excel
                    </Button>
                </Card.Header>
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
                                    <th>หมายเหตุ</th>
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
                                        <td><small className="text-muted">{stock.remarks || '-'}</small></td>
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
