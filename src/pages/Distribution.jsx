import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { Table, Button, Form, Card, Badge, Modal, Alert, Row, Col } from 'react-bootstrap';
import { decryptData, encryptData } from '../utils/encryption'; // encryptData needed for updating distributor
import { useAuth } from '../contexts/AuthContext';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { FaFileExcel, FaTruck, FaSearch } from 'react-icons/fa';

export default function Distribution() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStock, setSelectedStock] = useState(null); // Keep for single edit if needed, but we'll use selectedIds
    const [selectedIds, setSelectedIds] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [distributeDate, setDistributeDate] = useState(new Date().toISOString().split('T')[0]);
    const [distributeError, setDistributeError] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        const stocksRef = ref(db, 'stocks');
        const unsubscribe = onValue(stocksRef, (snapshot) => {
            const data = snapshot.val();
            const loadedStocks = [];
            if (data) {
                for (const key in data) {
                    const item = data[key];
                    // Only show items that are currently "Available" (รับเข้า)
                    if (item.status === 'รับเข้า') {
                        loadedStocks.push({
                            id: key,
                            ...item,
                            // Decrypt fields
                            building: decryptData(item.building),
                            department: decryptData(item.department),
                            serialNumber: decryptData(item.serialNumber),
                            assetId: decryptData(item.assetId),
                            brandModel: decryptData(item.brandModel),
                            remarks: decryptData(item.remarks),
                            // Dates are plain text
                        });
                    }
                }
            }
            setStocks(loadedStocks);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredStocks.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredStocks.map(s => s.id));
        }
    };

    const handleShowDistribute = (stock) => {
        if (stock) {
            setSelectedStock(stock);
            setSelectedIds([stock.id]);
        }
        setDistributeDate(new Date().toISOString().split('T')[0]);
        setShowModal(true);
    };

    const handleShowBulkDistribute = () => {
        if (selectedIds.length === 0) return;
        setSelectedStock(null);
        setDistributeDate(new Date().toISOString().split('T')[0]);
        setShowModal(true);
    };

    const handleDistribute = async () => {
        if (selectedIds.length === 0) return;
        setDistributeError('');

        try {
            const selectedStocks = stocks.filter(s => selectedIds.includes(s.id));

            for (const stock of selectedStocks) {
                const stockRef = ref(db, `stocks/${stock.id}`);
                await update(stockRef, {
                    status: 'จำหน่าย',
                    distributionDate: distributeDate,
                    distributor: encryptData(currentUser.email),
                    qt_distributed: 1,
                    qt_balance: 0
                });
            }

            // Generate Excel for all selected items
            generateExcel(selectedStocks, distributeDate);

            setSelectedIds([]);
            setShowModal(false);
        } catch (err) {
            console.error(err);
            setDistributeError('เกิดข้อผิดพลาดในการบันทึกการจำหน่าย');
        }
    };

    const generateExcel = async (selectedStocks, date) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('ใบเบิกหรือใบส่งคืน');

        // Set column widths
        worksheet.columns = [
            { width: 5 },  // ลำดับ
            { width: 30 }, // หมายเลขครุภัณฑ์ / SN
            { width: 30 }, // รายการ
            { width: 10 }, // รหัส
            { width: 10 }, // หน่วยนับ
            { width: 10 }, // จำนวน
            { width: 15 }, // จ่ายหรือคืน ค้างจ่าย
            { width: 15 }, // ราคา หน่วยละ
            { width: 15 }, // ราคารวม
            { width: 15 }  // ลงชื่อผู้จำหน่าย
        ];

        // Helper for borders and centering
        const addBorders = (rowNumber, cols) => {
            const row = worksheet.getRow(rowNumber);
            cols.forEach(col => {
                const cell = row.getCell(col);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        };

        // Header Rows
        worksheet.mergeCells('D1:I2');
        const titleCell = worksheet.getCell('D1');
        titleCell.value = 'ใบเบิกหรือใบส่งคืน';
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.getCell('J1').value = 'แบบ พ.3101';
        worksheet.getCell('J2').value = 'รพ.นครพิงค์';

        worksheet.mergeCells('A3:B3');
        worksheet.getCell('A3').value = 'แผ่นที่ ...............';
        worksheet.getCell('C3').value = 'ของจำนวน ............... แผ่น';
        worksheet.mergeCells('F3:J3');
        worksheet.getCell('F3').value = 'เลขที่ใบเบิกหรือใบส่งคืน ..............................';

        worksheet.mergeCells('A4:D4');
        worksheet.getCell('A4').value = 'จาก ....................................................................';
        worksheet.getCell('E4').value = 'FALSE';
        worksheet.getCell('F4').value = 'เบิก';
        worksheet.mergeCells('G4:J4');
        worksheet.getCell('G4').value = 'ทะเบียนเอกสาร ..............................';

        worksheet.mergeCells('A5:D5');
        worksheet.getCell('A5').value = 'ศูนย์คอมพิวเตอร์';
        worksheet.getCell('E5').value = 'TRUE';
        worksheet.getCell('F5').value = 'ส่งคืน';

        worksheet.mergeCells('A6:D6');
        worksheet.getCell('A6').value = 'ถึง ....................................................................';
        worksheet.getCell('F6').value = 'วันที่ต้องการ .........................';
        worksheet.getCell('G6').value = date;
        worksheet.mergeCells('H6:J6');
        worksheet.getCell('H6').value = 'ประเภทเงิน .........................';

        worksheet.mergeCells('A7:D7');
        worksheet.getCell('A7').value = 'คลังพัสดุ';

        worksheet.mergeCells('A8:G8');
        worksheet.getCell('A8').value = 'ประเภทพัสดุและ/หรือครุภัณฑ์ที่เกี่ยวข้อง';
        worksheet.getCell('H8').value = 'ขั้นต้น';
        worksheet.getCell('I8').value = 'ทดแทน';
        worksheet.getCell('J8').value = 'ยืม';

        worksheet.mergeCells('A9:G9');
        worksheet.getCell('A9').value = selectedStocks.map(s => s.brandModel).join(", ").substring(0, 100);
        worksheet.getCell('H9').value = 'หมายเหตุ';

        // Table Header
        const headerRow = [
            "ลำดับ", "หมายเลขครุภัณฑ์ / SN", "รายการ", "รหัส", "หน่วยนับ", "จำนวน", "จ่ายหรือคืน ค้างจ่าย", "ราคา หน่วยละ", "ราคารวม", "ลงชื่อผู้จำหน่าย"
        ];
        worksheet.addRow(headerRow);
        const headerIndex = 10;
        addBorders(headerIndex, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        worksheet.getRow(headerIndex).font = { bold: true };
        worksheet.getRow(headerIndex).alignment = { horizontal: 'center' };

        // Data Rows
        selectedStocks.forEach((stock, index) => {
            const rowData = [
                index + 1,
                `${stock.assetId}${stock.serialNumber ? ' / ' + stock.serialNumber : ''}`,
                stock.brandModel,
                "ชม",
                "เครื่อง",
                1,
                "",
                "",
                "",
                "บรรเจิด"
            ];
            const newRow = worksheet.addRow(rowData);
            addBorders(newRow.number, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        });

        // Generate and Save
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `Export_${date}.xlsx`;
        saveAs(new Blob([buffer]), fileName);
    };

    const filteredStocks = stocks.filter(stock =>
        stock.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.brandModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="shadow-sm">
            <Card.Header className="bg-white py-3 d-md-flex justify-content-between align-items-center">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <h5 className="mb-0 text-primary fw-bold me-3"><FaTruck className="me-2" /> รายการพัสดุรอจำหน่าย</h5>
                    {selectedIds.length > 0 && (
                        <Button variant="primary" size="sm" onClick={handleShowBulkDistribute}>
                            จำหน่ายที่เลือก ({selectedIds.length})
                        </Button>
                    )}
                </div>
                <div className="mt-3 mt-md-0 w-100" style={{ maxWidth: '300px' }}>
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0"><FaSearch className="text-muted" /></span>
                        <Form.Control
                            type="text"
                            placeholder="ค้นหา ID, ยี่ห้อ, S/N..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-start-0"
                        />
                    </div>
                </div>
            </Card.Header>
            <Card.Body className="p-0">
                <div className="table-responsive">
                    <Table hover striped className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <Form.Check
                                        type="checkbox"
                                        checked={selectedIds.length === filteredStocks.length && filteredStocks.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>วันที่สำรวจ</th>
                                <th>Asset ID</th>
                                <th>ยี่ห้อ/รุ่น</th>
                                <th>S/N</th>
                                <th>หน่วยงาน</th>
                                <th>สถานะ</th>
                                <th className="text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-4">กำลังโหลดข้อมูล...</td></tr>
                            ) : filteredStocks.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-4 text-muted">ไม่พบรายการสินค้าที่สามารถจำหน่ายได้</td></tr>
                            ) : (
                                filteredStocks.map((stock) => (
                                    <tr key={stock.id}>
                                        <td>
                                            <Form.Check
                                                type="checkbox"
                                                checked={selectedIds.includes(stock.id)}
                                                onChange={() => toggleSelect(stock.id)}
                                            />
                                        </td>
                                        <td>{stock.importDate}</td>
                                        <td>{stock.assetId}</td>
                                        <td>{stock.brandModel}</td>
                                        <td><small className="text-muted">{stock.serialNumber}</small></td>
                                        <td>{stock.department}</td>
                                        <td><Badge bg="success">รับเข้า (Available)</Badge></td>
                                        <td className="text-center">
                                            <Button variant="outline-warning" size="sm" onClick={() => handleShowDistribute(stock)}>
                                                <FaTruck className="me-1" /> จำหน่าย
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>

            {/* Modal for Distribution */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>ยืนยันการจำหน่ายพัสดุ</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {distributeError && <Alert variant="danger">{distributeError}</Alert>}
                    <p><strong>จำนวนพัสดุที่เลือก:</strong> {selectedIds.length} รายการ</p>
                    <div className="mb-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {stocks.filter(s => selectedIds.includes(s.id)).map(s => (
                            <div key={s.id} className="small border-bottom py-1">
                                {s.assetId} - {s.brandModel}
                            </div>
                        ))}
                    </div>
                    <hr />
                    <Form.Group className="mb-3">
                        <Form.Label>วันที่จำหน่าย (Distribution Date)</Form.Label>
                        <Form.Control
                            type="date"
                            value={distributeDate}
                            onChange={(e) => setDistributeDate(e.target.value)}
                        />
                    </Form.Group>
                    <Alert variant="info">
                        <FaFileExcel className="me-2" />
                        ระบบจะเปลี่ยนสถานะพัสดุทั้งหมดเป็น "จำหน่าย" และดาวน์โหลดไฟล์ Excel "ใบเบิกหรือใบส่งคืน"
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>ยกเลิก</Button>
                    <Button variant="primary" onClick={handleDistribute}>ยืนยันจำหน่าย</Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
}
