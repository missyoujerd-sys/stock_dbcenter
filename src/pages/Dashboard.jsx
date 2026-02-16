import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Table, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { decryptData } from '../utils/encryption';
import { Link } from 'react-router-dom';
import { FaBox, FaCheckCircle, FaTruck, FaWarehouse, FaPlusSquare, FaClipboardList, FaHome, FaFileExcel } from 'react-icons/fa';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

    const handleExportExcel = async () => {
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
            { width: 10 },    // G: จ่ายหรือคืน
            { width: 10 },    // H: ค้างจ่าย
            { width: 12 },    // I: ราคา หน่วยละ
            { width: 12 },    // J: ราคารวม/หมายเหตุ
            { width: 15 }     // K: ลงชื่อผู้จ่าย
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

        // Header Section
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
        worksheet.getCell('E5').value = CHECKED;
        worksheet.getCell('F5').value = 'ส่งคืน';
        worksheet.getCell('E5').alignment = { horizontal: 'center' };

        // 6: To / Date / Fund type
        worksheet.mergeCells('A6:D6');
        worksheet.getCell('A6').value = 'ถึง ....................................................................';
        worksheet.mergeCells('E6:G6');
        worksheet.getCell('E6').value = `วันที่ต้องการ   ${new Date().toLocaleDateString('th-TH')}`;
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

            if (i === 10) { // ลงชื่อผู้จำหน่าย (orange)
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFA500' }
                };
            }
        });
        hRow.height = 30;

        // Add rows
        const dataCount = Math.min(stocks.length, 50);
        const targetRows = Math.max(dataCount, 15);

        for (let i = 0; i < targetRows; i++) {
            const stock = i < dataCount ? stocks[i] : null;
            const rowNumber = headerIndex + 1 + i;
            const row = worksheet.getRow(rowNumber);

            if (stock) {
                row.getCell(1).value = i + 1;
                row.getCell(2).value = `${stock.assetId}\n${stock.serialNumber || ''}`;
                row.getCell(3).value = stock.brandModel;
                row.getCell(4).value = "ชม.";
                row.getCell(5).value = "เครื่อง";
                row.getCell(6).value = 1;
                row.getCell(7).value = (stock.status === 'จำหน่าย' ? 1 : '');
                row.getCell(8).value = "";
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

        // Footer Section
        let lastRow = headerIndex + targetRows + 1;

        worksheet.mergeCells(`A${lastRow}:G${lastRow}`);
        worksheet.getCell(`A${lastRow}`).value = 'หลักฐานที่ใช้ในการเบิก/ส่งคืน';
        worksheet.mergeCells(`H${lastRow}:I${lastRow}`);
        worksheet.getCell(`H${lastRow}`).value = 'รวมแผ่นนี้';
        applyBorders(lastRow, 1, lastRow, 11);

        lastRow++;
        worksheet.mergeCells(`H${lastRow}:I${lastRow}`);
        worksheet.getCell(`H${lastRow}`).value = 'รวมทั้งสิ้น';
        applyBorders(lastRow, 8, lastRow, 11);

        lastRow++;
        worksheet.mergeCells(`A${lastRow}:G${lastRow + 1}`);
        worksheet.getCell(`A${lastRow}`).value = 'ให้บุคคลต่อไปนี้เป็นผู้รับพัสดุแทนได้';
        worksheet.mergeCells(`H${lastRow}:K${lastRow}`);
        worksheet.getCell(`H${lastRow}`).value = 'ผู้ตรวจสอบ ..............................................................';
        lastRow++;
        worksheet.mergeCells(`H${lastRow}:K${lastRow}`);
        worksheet.getCell(`H${lastRow}`).value = 'ผู้อนุมัติจ่าย/รับคืน .....................................................';

        lastRow++;
        worksheet.mergeCells(`A${lastRow}:G${lastRow + 1}`);
        worksheet.getCell(`A${lastRow}`).value = `ผู้มีสิทธิเบิก/ส่งคืน   นาย ณรงค์ รวมสุข`;
        worksheet.mergeCells(`H${lastRow}:K${lastRow + 1}`);
        worksheet.getCell(`H${lastRow}`).value = 'ผู้จ่าย .....................................................................';
        worksheet.getCell(`H${lastRow}`).alignment = { vertical: 'top' };

        lastRow += 2;
        worksheet.mergeCells(`A${lastRow}:G${lastRow + 2}`);
        worksheet.getCell(`A${lastRow}`).value = 'ได้รับของตามจำนวนและรายการที่จ่ายเรียบร้อยแล้ว';
        worksheet.getCell(`A${lastRow}`).alignment = { vertical: 'top' };

        worksheet.getCell(`H${lastRow}`).value = 'รหัสจ่าย';
        worksheet.getCell(`J${lastRow}`).value = 'ค.  ครั้งคราว';
        lastRow++;
        worksheet.getCell(`J${lastRow}`).value = 'ป.  ประจำ';
        lastRow++;
        worksheet.getCell(`H${lastRow}`).value = 'รหัสคืน';
        worksheet.getCell(`J${lastRow}`).value = 'ช.  ใช้การได้';
        lastRow++;
        worksheet.getCell(`J${lastRow}`).value = 'ชม.  ใช้การไม่ได้';

        lastRow++;
        worksheet.getCell(`A${lastRow}`).value = 'ผู้รับพัสดุ';

        applyBorders(headerIndex + Math.min(stocks.length, 50) + 1, 1, lastRow + 1, 11);

        // Generate and Save
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Stock_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div>
            <h2 className="mb-4 text-primary fw-bold"><FaWarehouse className="me-2" /> ภาพรวมระบบครับ (Dashboard)</h2>

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

            <h4 className="mb-3 mt-4 text-dark fw-bold">เมนูด่วนกดเลยครับ (Quick Menu)</h4>
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
                                    <th>หมายเลขพัสดุ</th>
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
                                    <tr key={stock.id}>
                                        <td>{stock.importDate}</td>
                                        <td>{stock.assetId}</td>
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
        </div>
    );
}
