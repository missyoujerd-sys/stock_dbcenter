import React, { useState, useEffect } from 'react';
import { Table, Container, Card, Badge, Form, Row, Col } from 'react-bootstrap';
import { database } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';
import { decryptData } from '../../services/encryption';
import { formatDateThai } from '../../utils/dateUtils';
import NavigationBar from '../Layout/Navbar';

export default function StockList() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        const stocksRef = ref(database, 'stocks');

        const unsubscribe = onValue(stocksRef, (snapshot) => {
            const data = snapshot.val();
            const loadedStocks = [];

            if (data) {
                for (const key in data) {
                    const rawData = data[key];
                    try {
                        // Decrypt data
                        const decrypted = decryptData(rawData.encryptedData);
                        if (decrypted) {
                            loadedStocks.push({
                                id: key,
                                ...decrypted,
                                timestamp: rawData.timestamp
                            });
                        }
                    } catch (err) {
                        console.error('Error decrypting stock:', key, err);
                    }
                }
            }

            // Sort by timestamp descending
            loadedStocks.sort((a, b) => b.timestamp - a.timestamp);

            setStocks(loadedStocks);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const filteredStocks = stocks.filter(stock => {
        const matchesDate = filterDate ? stock.dateReceived === filterDate : true;
        const matchesStatus = filterStatus === 'all' ? true : stock.status === filterStatus;
        return matchesDate && matchesStatus;
    });

    return (
        <>
            <NavigationBar />
            <Container>
                <Card className="shadow-sm mb-4">
                    <Card.Header as="h4" className="bg-info text-white">รายการสินค้าคงคลัง</Card.Header>
                    <Card.Body>
                        <Row className="mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>ค้นหาตามวันที่</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>สถานะ</Form.Label>
                                    <Form.Select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="all">ทั้งหมด</option>
                                        <option value="รับเข้า">รับเข้า (In Stock)</option>
                                        <option value="จำหน่าย">จำหน่าย (Dispatched)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        {loading ? (
                            <div className="text-center py-5">Loading...</div>
                        ) : filteredStocks.length === 0 ? (
                            <div className="text-center py-5 text-muted">ไม่พบข้อมูล</div>
                        ) : (
                            <div className="table-responsive">
                                <Table striped hover>
                                    <thead>
                                        <tr>
                                            <th>วันที่</th>
                                            <th>ชื่อ/รุ่น/เลขครุภัณฑ</th>
                                            <th>จาก</th>
                                            <th>ถึง</th>
                                            <th>จำนวน</th>
                                            <th>สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStocks.map(stock => (
                                            <tr key={stock.id}>
                                                <td>{formatDateThai(stock.dateReceived)}</td>
                                                <td>{stock.itemName}</td>
                                                <td>{stock.source}</td>
                                                <td>{stock.destination}</td>
                                                <td>{stock.quantity}</td>
                                                <td>
                                                    <Badge bg={stock.status === 'รับเข้า' ? 'success' : 'secondary'}>
                                                        {stock.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
}
