import React, { useState, useEffect } from 'react';
import { Table, Container, Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import { database } from '../../services/firebase';
import { ref, onValue, update } from 'firebase/database';
import { decryptData, encryptData } from '../../services/encryption';
import { generateExcelFile } from '../../services/excelService';
import { formatDateThai } from '../../utils/dateUtils';
import NavigationBar from '../Layout/Navbar';

export default function StockDispatch() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStocks, setSelectedStocks] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        // Only fetch stocks that are currently "รับเข้า" (In Stock)
        const stocksRef = ref(database, 'stocks');

        const unsubscribe = onValue(stocksRef, (snapshot) => {
            const data = snapshot.val();
            const loadedStocks = [];

            if (data) {
                for (const key in data) {
                    try {
                        const decrypted = decryptData(data[key].encryptedData);
                        // Only show items that are still in stock
                        if (decrypted && decrypted.status === 'รับเข้า') {
                            loadedStocks.push({
                                id: key,
                                ...decrypted,
                                originalTimestamp: data[key].timestamp,
                                userId: data[key].userId,
                                // Keep reference to original encrypted data if needed, 
                                // but we will re-encrypt on update
                            });
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
            }

            // Sort by date received descending
            loadedStocks.sort((a, b) => new Date(b.dateReceived) - new Date(a.dateReceived));

            setStocks(loadedStocks);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleCheckboxChange = (stockId) => {
        setSelectedStocks(prev => {
            if (prev.includes(stockId)) {
                return prev.filter(id => id !== stockId);
            } else {
                return [...prev, stockId];
            }
        });
    };

    const handleDispatch = async () => {
        if (selectedStocks.length === 0) return;

        if (!window.confirm(`คุณต้องการจำหน่ายสินค้า ${selectedStocks.length} รายการ และดาวน์โหลดไฟล์ Excel ใช่หรือไม่?`)) {
            return;
        }

        setSubmitting(true);
        setError('');
        setMessage('');

        try {
            const updates = {};
            const dispatchedItems = [];

            selectedStocks.forEach(stockId => {
                const stockItem = stocks.find(s => s.id === stockId);
                if (stockItem) {
                    // Update status
                    const updatedStock = {
                        ...stockItem,
                        status: 'จำหน่าย'
                    };

                    // Add to list for Excel
                    dispatchedItems.push(updatedStock);

                    // Prepare Firebase update
                    // We must remove the 'id', 'originalTimestamp', 'userId' fields from the data payload 
                    // that goes into encryptedData, or keep them consistent with creating logic.
                    // Creating logic had: source, destination, itemName, quantity, status, dateReceived, userId, timestamp.

                    // Let's keep it consistent
                    const dataToEncrypt = {
                        source: updatedStock.source,
                        destination: updatedStock.destination,
                        itemName: updatedStock.itemName,
                        quantity: updatedStock.quantity,
                        status: 'จำหน่าย',
                        dateReceived: updatedStock.dateReceived,
                        userId: updatedStock.userId,
                        timestamp: updatedStock.originalTimestamp
                    };

                    const newEncryptedData = encryptData(dataToEncrypt);

                    updates[`/stocks/${stockId}`] = {
                        encryptedData: newEncryptedData,
                        timestamp: stockItem.originalTimestamp,
                        userId: stockItem.userId
                    };
                }
            });

            // Perform batch update to Firebase
            await update(ref(database), updates);

            // Generate Excel
            generateExcelFile(dispatchedItems);

            setMessage(`จำหน่ายสินค้า ${selectedStocks.length} รายการสำเร็จ และดาวน์โหลดไฟล์เรียบร้อยแล้ว`);
            setSelectedStocks([]);

        } catch (err) {
            console.error(err);
            setError('เกิดข้อผิดพลาดในการจำหน่ายสินค้า: ' + err.message);
        }

        setSubmitting(false);
    };

    const filteredStocks = stocks.filter(stock => {
        return filterDate ? stock.dateReceived === filterDate : true;
    });

    return (
        <>
            <NavigationBar />
            <Container>
                <Card className="shadow-sm mb-4">
                    <Card.Header as="h4" className="bg-warning text-dark">จำหน่ายออก (Dispatch)</Card.Header>
                    <Card.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {message && <Alert variant="success">{message}</Alert>}

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="d-flex align-items-center">
                                <h5 className="me-3 mb-0">รายการสินค้าที่รอจำหน่าย</h5>
                                <Form.Control
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    placeholder="กรองตามวันที่"
                                    style={{ width: '200px' }}
                                />
                            </div>
                            <Button
                                variant="success"
                                disabled={selectedStocks.length === 0 || submitting}
                                onClick={handleDispatch}
                            >
                                ยืนยันการจำหน่าย ({selectedStocks.length}) <i className="bi bi-file-earmark-excel"></i>
                            </Button>
                        </div>

                        {loading ? (
                            <div className="text-center py-5">Loading...</div>
                        ) : stocks.length === 0 ? (
                            <div className="text-center py-5 text-muted">ไม่พบสินค้าที่รอจำหน่าย</div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '50px' }}>เลือก</th>
                                            <th>วันที่มาถึง</th>
                                            <th>ชื่อ/รุ่น/เลขครุภัณฑ</th>
                                            <th>จำนวน</th>
                                            <th>จาก</th>
                                            <th>ถึง</th>
                                            <th>สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStocks.map(stock => (
                                            <tr key={stock.id} className={selectedStocks.includes(stock.id) ? 'table-warning' : ''}>
                                                <td>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={selectedStocks.includes(stock.id)}
                                                        onChange={() => handleCheckboxChange(stock.id)}
                                                    />
                                                </td>
                                                <td>{formatDateThai(stock.dateReceived)}</td>
                                                <td>{stock.itemName}</td>
                                                <td>{stock.quantity}</td>
                                                <td>{stock.source}</td>
                                                <td>{stock.destination}</td>
                                                <td><Badge bg="success">{stock.status}</Badge></td>
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
