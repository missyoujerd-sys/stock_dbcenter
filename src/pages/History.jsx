import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Table, Card, Row, Col, Badge, Form, InputGroup, Button } from 'react-bootstrap';
import { decryptData } from '../utils/encryption';
import { FaHistory, FaSearch, FaArrowDown, FaArrowUp, FaCalendarAlt } from 'react-icons/fa';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function History() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL'); // ALL, IN, OUT
    const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0 });

    useEffect(() => {
        const stocksRef = ref(db, 'stocks');
        const unsubscribe = onValue(stocksRef, (snapshot) => {
            const data = snapshot.val();
            const txList = [];
            let inCount = 0;
            let outCount = 0;

            if (data) {
                for (const key in data) {
                    const item = data[key];
                    const assetId = decryptData(item.assetId);
                    const serialNumber = decryptData(item.serialNumber);
                    const category = decryptData(item.category || '');
                    const brandModel = decryptData(item.brandModel);
                    
                    // Transaction In (รับเข้า)
                    if (item.importDate) {
                        txList.push({
                            id: `${key}_in`,
                            type: 'IN',
                            date: item.importDate,
                            assetId,
                            serialNumber,
                            itemName: `${category} ${brandModel}`.trim(),
                            quantity: item.qt_received || 1,
                            actor: item.officerName || 'ไม่ระบุ',
                            remarks: decryptData(item.remarks || '-')
                        });
                        inCount++;
                    }

                    // Transaction Out (จำหน่าย)
                    if (item.status === 'จำหน่าย' && item.distributionDate) {
                        txList.push({
                            id: `${key}_out`,
                            type: 'OUT',
                            date: item.distributionDate,
                            assetId,
                            serialNumber,
                            itemName: `${category} ${brandModel}`.trim(),
                            quantity: item.qt_distributed || 1,
                            actor: item.distributor || 'ไม่ระบุ',
                            remarks: item.distributionDepartment || 'ไม่ระบุแผนก'
                        });
                        outCount++;
                    }
                }
            }
            
            // Sort by date (descending)
            txList.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            setTransactions(txList);
            setSummary({ totalIn: inCount, totalOut: outCount });
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const filteredTransactions = transactions.filter(tx => {
        if (filterType !== 'ALL' && tx.type !== filterType) return false;
        
        const term = searchTerm.toLowerCase();
        return (
            tx.assetId.toLowerCase().includes(term) ||
            tx.serialNumber.toLowerCase().includes(term) ||
            tx.itemName.toLowerCase().includes(term) ||
            tx.actor.toLowerCase().includes(term)
        );
    });

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('History');

        worksheet.columns = [
            { header: 'วันที่', key: 'date', width: 15 },
            { header: 'ประเภท', key: 'type', width: 15 },
            { header: 'รหัสครุภัณฑ์', key: 'assetId', width: 20 },
            { header: 'รายการ', key: 'itemName', width: 30 },
            { header: 'จำนวน', key: 'quantity', width: 10 },
            { header: 'ผู้ดำเนินการ', key: 'actor', width: 20 },
            { header: 'หมายเหตุ', key: 'remarks', width: 30 }
        ];

        filteredTransactions.forEach(tx => {
            worksheet.addRow({
                date: tx.date,
                type: tx.type === 'IN' ? 'รับเข้า (Receive)' : 'เบิกออก (Issue)',
                assetId: tx.assetId,
                itemName: tx.itemName,
                quantity: tx.quantity,
                actor: tx.actor,
                remarks: tx.remarks
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `transaction_history.xlsx`);
    };

    return (
        <div className="container-fluid py-4" style={{ fontFamily: 'Prompt, sans-serif' }}>
            {/* Header & Summary */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-0 fw-bold" style={{ color: '#1e293b' }}>
                        <FaHistory className="me-2" />
                        ประวัติการทำรายการ (Transaction History)
                    </h2>
                    <p className="text-muted mt-1 mb-0">ระบบบันทึกประวัติการรับเข้าและเบิกจ่ายพัสดุ</p>
                </div>
                <div className="d-flex gap-3">
                    <Card className="shadow-sm border-0" style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
                        <Card.Body className="py-2 px-4 text-center">
                            <h6 className="mb-0 text-success fw-bold"><FaArrowDown className="me-1"/> รับเข้าทั้งหมด</h6>
                            <h4 className="mb-0 fw-bold">{summary.totalIn} รายการ</h4>
                        </Card.Body>
                    </Card>
                    <Card className="shadow-sm border-0" style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)' }}>
                        <Card.Body className="py-2 px-4 text-center">
                            <h6 className="mb-0 text-danger fw-bold"><FaArrowUp className="me-1"/> เบิกออกทั้งหมด</h6>
                            <h4 className="mb-0 fw-bold">{summary.totalOut} รายการ</h4>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* Filters */}
            <Card className="shadow-sm border-0 mb-4 rounded-4">
                <Card.Body className="p-4">
                    <Row className="align-items-center">
                        <Col md={4}>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0">
                                    <FaSearch className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="ค้นหา: รหัส, รายการ, ผู้ดำเนินการ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border-start-0 bg-light"
                                />
                            </InputGroup>
                        </Col>
                        <Col md={4}>
                            <Form.Select 
                                value={filterType} 
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-light"
                            >
                                <option value="ALL">แสดงทั้งหมด (All Transactions)</option>
                                <option value="IN">เฉพาะรับเข้า (Received Only)</option>
                                <option value="OUT">เฉพาะเบิกออก (Issued Only)</option>
                            </Form.Select>
                        </Col>
                        <Col md={4} className="text-end">
                            <Button variant="success" onClick={exportToExcel} className="rounded-pill px-4">
                                Export to Excel
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Data Table */}
            <Card className="shadow-sm border-0 rounded-4">
                <Card.Body className="p-0">
                    <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <Table hover responsive className="mb-0 align-middle">
                            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc' }}>
                                <tr>
                                    <th className="py-3 px-4 text-secondary">วันที่</th>
                                    <th className="py-3 px-4 text-secondary">ประเภทรายการ</th>
                                    <th className="py-3 px-4 text-secondary">รหัสครุภัณฑ์/S.N.</th>
                                    <th className="py-3 px-4 text-secondary">รายการพัสดุ</th>
                                    <th className="py-3 px-4 text-secondary">จำนวน</th>
                                    <th className="py-3 px-4 text-secondary">ผู้ดำเนินการ</th>
                                    <th className="py-3 px-4 text-secondary">หน่วยงาน/หมายเหตุ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center py-5">กำลังโหลดข้อมูล...</td></tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-5">ไม่พบข้อมูลประวัติการทำรายการ</td></tr>
                                ) : (
                                    filteredTransactions.map(tx => (
                                        <tr key={tx.id}>
                                            <td className="px-4 py-3 text-nowrap">
                                                <FaCalendarAlt className="me-2 text-muted" />
                                                {tx.date}
                                            </td>
                                            <td className="px-4 py-3">
                                                {tx.type === 'IN' ? (
                                                    <Badge bg="success" className="px-3 py-2 rounded-pill fw-normal">
                                                        <FaArrowDown className="me-1" /> รับเข้า (Receive)
                                                    </Badge>
                                                ) : (
                                                    <Badge bg="danger" className="px-3 py-2 rounded-pill fw-normal">
                                                        <FaArrowUp className="me-1" /> เบิกออก (Issue)
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="fw-bold">{tx.assetId || '-'}</div>
                                                <div className="text-muted small">{tx.serialNumber || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 fw-medium text-dark">{tx.itemName}</td>
                                            <td className="px-4 py-3 fw-bold">{tx.quantity}</td>
                                            <td className="px-4 py-3">{tx.actor}</td>
                                            <td className="px-4 py-3 text-muted">{tx.remarks}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}
