import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { Table, Button, Form, Card, Badge, Modal, Alert, Row, Col } from 'react-bootstrap';
import { decryptData, encryptData } from '../utils/encryption'; // encryptData needed for updating distributor
import { useAuth } from '../contexts/AuthContext';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';
import { FaFileExcel, FaTruck, FaSearch, FaHome } from 'react-icons/fa';

export default function Distribution() {
    const navigate = useNavigate();
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

        // Page Setup for A4 Printing
        worksheet.pageSetup = {
            paperSize: 9, // A4
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0, // Auto
            margins: {
                left: 0.3, right: 0.3,
                top: 0.3, bottom: 0.3,
                header: 0, footer: 0
            }
        };

        // Set column widths
        worksheet.columns = [
            { width: 8.5 },   // A: ลำดับ
            { width: 25 },    // B: หมายเลขครุภัณฑ์ / SN
            { width: 25 },    // C: รายการ
            { width: 8.5 },   // D: รหัส
            { width: 10 },    // E: หน่วยนับ
            { width: 10 },    // F: จำนวน
            { width: 10 },    // G: จ่าย
            { width: 10 },    // H: ค้างจ่าย
            { width: 12 },    // I: ราคา หน่วยละ
            { width: 12 },    // J: ราคารวม
            { width: 15 }     // K: ลงชื่อผู้จำหน่าย (extra col for layout)
        ];

        // Helper for borders
        const borderStyle = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        const applyBorders = (rowStart, colStart, rowEnd, colEnd) => {
            for (let r = rowStart; r <= rowEnd; r++) {
                for (let c = colStart; c <= colEnd; c++) {
                    worksheet.getRow(r).getCell(c).border = borderStyle;
                }
            }
        };

        // Unicode Checkboxes
        const CHECKED = '\u2611';
        const UNCHECKED = '\u2610';

        // 1-2: Title
        worksheet.mergeCells('A1:I2');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'ใบเบิกหรือใบส่งคืน';
        titleCell.font = { size: 18, bold: true };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.getCell('J1').value = 'แบบ พ.3101';
        worksheet.getCell('J2').value = 'รพ.นครพิงค์';
        worksheet.getCell('J1').alignment = { horizontal: 'right' };
        worksheet.getCell('J2').alignment = { horizontal: 'right' };

        // 3: Sheet info
        worksheet.getCell('A3').value = 'แผ่นที่ ............... ของจำนวน ............... แผ่น';
        worksheet.mergeCells('E3:J3');
        worksheet.getCell('E3').value = 'เลขที่ใบเบิกหรือใบส่งคืน ..............................';

        // 4: From / Requisition
        worksheet.mergeCells('A4:D4');
        worksheet.getCell('A4').value = 'จาก ....................................................................';
        worksheet.getCell('E4').value = UNCHECKED;
        worksheet.getCell('F4').value = 'เบิก';
        worksheet.mergeCells('G4:J4');
        worksheet.getCell('G4').value = 'ทะเบียนเอกสาร ..............................';
        worksheet.getCell('E4').alignment = { horizontal: 'center' };

        // 5: Dept / Return
        worksheet.mergeCells('A5:D5');
        worksheet.getCell('A5').value = 'ศูนย์คอมพิวเตอร์';
        worksheet.getCell('E5').value = CHECKED; // Distribution page is usually for return/dispatch
        worksheet.getCell('F5').value = 'ส่งคืน';
        worksheet.getCell('E5').alignment = { horizontal: 'center' };

        // 6: To / Date / Fund type
        worksheet.mergeCells('A6:D6');
        worksheet.getCell('A6').value = 'ถึง ....................................................................';
        worksheet.mergeCells('E6:G6');
        worksheet.getCell('E6').value = `วันที่ต้องการ   ${date}`;
        worksheet.mergeCells('H6:J6');
        worksheet.getCell('H6').value = 'ประเภทเงิน .........................';

        // 7: Store
        worksheet.mergeCells('A7:D7');
        worksheet.getCell('A7').value = 'คลังพัสดุ';

        // 8-9: Type of asset
        worksheet.mergeCells('A8:F8');
        worksheet.getCell('A8').value = 'ประเภทพัสดุและ/หรือครุภัณฑ์ที่เกี่ยวข้อง';
        worksheet.getCell('A8').font = { bold: true };

        worksheet.getCell('G8').value = 'ขั้นต้น';
        worksheet.getCell('H8').value = 'ทดแทน';
        worksheet.getCell('I8').value = 'ยืม';
        worksheet.getCell('J8').value = 'หมายเหตุ';

        worksheet.mergeCells('A9:F9');
        worksheet.getCell('A9').value = 'คอมพิวเตอร์และอุปกรณ์ต่อพ่วง';

        worksheet.getCell('G9').value = CHECKED;
        worksheet.getCell('H9').value = UNCHECKED;
        worksheet.getCell('I9').value = UNCHECKED;
        worksheet.getCell('G9').alignment = { horizontal: 'center' };
        worksheet.getCell('H9').alignment = { horizontal: 'center' };
        worksheet.getCell('I9').alignment = { horizontal: 'center' };

        // Apply borders for header area boxes if needed, but per image only table and some boxes
        applyBorders(4, 5, 5, 5); // Box for เบิก/ส่งคืน
        applyBorders(8, 7, 9, 9); // Boxes for ขั้นต้น/ทดแทน/ยืม
        applyBorders(8, 10, 9, 10); // Box for หมายเหตุ

        // Table Header
        const headerIndex = 10;
        const headers = [
            "ลำดับ", "หมายเลขครุภัณฑ์ / SN", "รายการ", "รหัส", "หน่วยนับ", "จำนวน", "จ่ายหรือคืน", "ค้างจ่าย", "ราคา หน่วยละ", "ราคารวม/หมายเหตุ", "ลงชื่อผู้จ่าย"
        ];
        const hRow = worksheet.getRow(headerIndex);
        headers.forEach((h, i) => {
            const cell = hRow.getCell(i + 1);
            cell.value = h;
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = borderStyle;

            // Set orange background for the last header as in the image
            if (i === 10) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFA500' } // Orange
                };
            }
        });
        hRow.height = 30;

        // Data Rows
        const dataCount = selectedStocks.length;
        const targetRows = Math.max(dataCount, 15);

        for (let i = 0; i < targetRows; i++) {
            const stock = i < dataCount ? selectedStocks[i] : null;
            const rowNumber = headerIndex + 1 + i;
            const row = worksheet.getRow(rowNumber);

            if (stock) {
                row.getCell(1).value = i + 1;
                row.getCell(2).value = `${stock.assetId}\n${stock.serialNumber || ''}`;
                row.getCell(3).value = stock.brandModel;
                row.getCell(4).value = "ชม.";
                row.getCell(5).value = "เครื่อง";
                row.getCell(6).value = 1;
                row.getCell(7).value = 1; // จ่ายหรือคืน
                row.getCell(8).value = ""; // ค้างจ่าย
                row.getCell(9).value = "";
                row.getCell(10).value = stock.remarks || '-';
                row.getCell(11).value = "";
            } else {
                row.getCell(1).value = i + 1;
            }

            // Apply borders to all columns (1-11)
            for (let c = 1; c <= 11; c++) {
                const cell = row.getCell(c);
                cell.border = borderStyle;
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            }
        }

        // Footer Sections
        let currentFooterRow = headerIndex + targetRows + 1;

        // Sum rows
        worksheet.mergeCells(`A${currentFooterRow}:G${currentFooterRow}`);
        worksheet.getCell(`A${currentFooterRow}`).value = 'หลักฐานที่ใช้ในการเบิก/ส่งคืน';
        worksheet.mergeCells(`H${currentFooterRow}:I${currentFooterRow}`);
        worksheet.getCell(`H${currentFooterRow}`).value = 'รวมแผ่นนี้';
        applyBorders(currentFooterRow, 1, currentFooterRow, 11);

        currentFooterRow++;
        worksheet.mergeCells(`H${currentFooterRow}:I${currentFooterRow}`);
        worksheet.getCell(`H${currentFooterRow}`).value = 'รวมทั้งสิ้น';
        applyBorders(currentFooterRow, 8, currentFooterRow, 11);

        currentFooterRow++;
        worksheet.mergeCells(`A${currentFooterRow}:G${currentFooterRow + 1}`);
        worksheet.getCell(`A${currentFooterRow}`).value = 'ให้บุคคลต่อไปนี้เป็นผู้รับพัสดุแทนได้';
        worksheet.mergeCells(`H${currentFooterRow}:K${currentFooterRow}`);
        worksheet.getCell(`H${currentFooterRow}`).value = 'ผู้ตรวจสอบ ..............................................................';
        currentFooterRow++;
        worksheet.mergeCells(`H${currentFooterRow}:K${currentFooterRow}`);
        worksheet.getCell(`H${currentFooterRow}`).value = 'ผู้อนุมัติจ่าย/รับคืน .....................................................';

        currentFooterRow++;
        worksheet.mergeCells(`A${currentFooterRow}:G${currentFooterRow + 1}`);
        worksheet.getCell(`A${currentFooterRow}`).value = `ผู้มีสิทธิเบิก/ส่งคืน   นาย ณรงค์ รวมสุข`;
        worksheet.mergeCells(`H${currentFooterRow}:K${currentFooterRow + 1}`);
        worksheet.getCell(`H${currentFooterRow}`).value = 'ผู้จ่าย .....................................................................';
        worksheet.getCell(`H${currentFooterRow}`).alignment = { vertical: 'top' };

        currentFooterRow += 2;
        worksheet.mergeCells(`A${currentFooterRow}:G${currentFooterRow + 2}`);
        worksheet.getCell(`A${currentFooterRow}`).value = 'ได้รับของตามจำนวนและรายการที่จ่ายเรียบร้อยแล้ว';
        worksheet.getCell(`A${currentFooterRow}`).alignment = { vertical: 'top' };

        // Codes legend
        worksheet.getCell(`H${currentFooterRow}`).value = 'รหัสจ่าย';
        worksheet.getCell(`J${currentFooterRow}`).value = 'ค.  ครั้งคราว';
        currentFooterRow++;
        worksheet.getCell(`J${currentFooterRow}`).value = 'ป.  ประจำ';
        currentFooterRow++;
        worksheet.getCell(`H${currentFooterRow}`).value = 'รหัสคืน';
        worksheet.getCell(`J${currentFooterRow}`).value = 'ช.  ใช้การได้';
        currentFooterRow++;
        worksheet.getCell(`J${currentFooterRow}`).value = 'ชม.  ใช้การไม่ได้';

        currentFooterRow++;
        worksheet.mergeCells(`A${currentFooterRow}:A${currentFooterRow + 1}`);
        worksheet.getCell(`A${currentFooterRow}`).value = 'ผู้รับพัสดุ';

        // Apply outer borders for footer area if needed
        applyBorders(headerIndex + selectedStocks.length + 1, 1, currentFooterRow + 1, 11);

        // Generate and Save
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `ใบเบิกหรือใบส่งคืน_${date}.xlsx`;
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
                    <Button
                        variant="warning"
                        className="me-2"
                        size="sm"
                        onClick={() => navigate('/')}
                    >
                        <FaHome className="me-1" /> กลับเมนูหลัก
                    </Button>
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
                                <th>หมายเลขพัสดุ</th>
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
                                            <Button className="btn-light-red" size="sm" onClick={() => handleShowDistribute(stock)}>
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
