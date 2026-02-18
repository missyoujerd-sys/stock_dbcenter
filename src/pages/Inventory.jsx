import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Table, Card, Row, Col, Badge, Button, Form } from 'react-bootstrap';
import { decryptData } from '../utils/encryption';
import { FaWarehouse, FaSearch, FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ItemDetailModal from '../components/ItemDetailModal';

export default function Inventory() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const stocksRef = ref(db, 'stocks');
        const unsubscribe = onValue(stocksRef, (snapshot) => {
            const data = snapshot.val();
            const loadedStocks = [];

            if (data) {
                for (const key in data) {
                    const item = data[key];
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
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleRowClick = (item) => {
        setSelectedItem(item);
        setShowDetailModal(true);
    };

    const filteredStocks = stocks.filter(stock =>
        stock.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.brandModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid py-2">
            <div className="page-header-container d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="page-title-badge">
                    <div className="page-icon-box">
                        <FaWarehouse />
                    </div>
                    <h2 className="page-title-text">
                        คลังพัสดุทั้งหมด <small>(Inventory)</small>
                    </h2>
                </div>

                <Button
                    variant="warning"
                    className="logout-btn-custom border-warning text-dark px-4"
                    size="sm"
                    onClick={() => navigate('/')}
                >
                    <FaHome className="me-2" /> กลับเมนูหลัก
                </Button>
            </div>

            <div className="section-header-container mt-2">
                <div className="section-accent"></div>
                <h4 className="section-title-text">
                    ข้อมูลพัสดุในระบบ
                    <span className="section-title-badge">INVENTORY DATA</span>
                </h4>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-white py-3 d-flex flex-wrap justify-content-end align-items-center">
                    <div className="w-100 w-md-auto" style={{ maxWidth: '350px' }}>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                                <FaSearch className="text-muted" />
                            </span>
                            <Form.Control
                                type="text"
                                placeholder="ค้นหา Asset ID, ยี่ห้อ, S/N, หน่วยงาน..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-start-0"
                            />
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover striped className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>วันที่</th>
                                    <th>หมายเลขครุภัณฑ์</th>
                                    <th>ยี่ห้อ/รุ่น</th>
                                    <th>S/N</th>
                                    <th>หน่วยงาน/อาคาร</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-5">กำลังโหลดข้อมูล...</td></tr>
                                ) : filteredStocks.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-5 text-muted">ไม่พบข้อมูลพัสดุ</td></tr>
                                ) : (
                                    filteredStocks.map((stock) => (
                                        <tr
                                            key={stock.id}
                                            onClick={() => handleRowClick(stock)}
                                            style={{ cursor: 'pointer' }}
                                            title="คลิกเพื่อดูรายละเอียด"
                                        >
                                            <td>{stock.importDate}</td>
                                            <td className="fw-bold">{stock.assetId}</td>
                                            <td>{stock.brandModel}</td>
                                            <td><small className="text-muted">{stock.serialNumber}</small></td>
                                            <td>
                                                <div>{stock.department}</div>
                                                <small className="text-secondary">{stock.building}</small>
                                            </td>
                                            <td>
                                                <Badge bg={stock.status === 'รับเข้า' ? 'success' : (stock.status === 'จำหน่าย' ? 'danger' : 'warning')}>
                                                    {stock.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
                <Card.Footer className="bg-white py-3 text-muted">
                    <small>แสดงทั้งหมด {filteredStocks.length} รายการ</small>
                </Card.Footer>
            </Card >

            <ItemDetailModal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                item={selectedItem}
            />
        </div >
    );
}
