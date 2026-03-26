import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { Table, Button, Form, Modal, Alert, Row, Col } from 'react-bootstrap';
import { decryptData, encryptData } from '../utils/encryption'; // encryptData needed for updating distributor
import { useAuth } from '../contexts/AuthContext';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';
import { FaFileExcel, FaTruck, FaSearch, FaHome, FaInfoCircle } from 'react-icons/fa';
import ItemDetailModal from '../components/ItemDetailModal';

export default function Distribution() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [distributeDate, setDistributeDate] = useState('');
    const [distributeError, setDistributeError] = useState('');

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [summary, setSummary] = useState({ total: 0, available: 0, distributed: 0 });

    const StatusSummaryBar = () => (
        <div className="status-summary-bar">
            <div className="status-badge-pill status-pill-total">
                <div className="status-badge-icon">
                    <FaHome />
                </div>
                <div className="status-badge-info">
                    <span className="status-badge-label">พัสดุในระบบ (Total)</span>
                    <span className="status-badge-value">{summary.total}</span>
                </div>
            </div>
            <div className="status-badge-pill status-pill-available">
                <div className="status-badge-icon">
                    <FaHome />
                </div>
                <div className="status-badge-info">
                    <span className="status-badge-label">รอจำหน่าย (Pending)</span>
                    <span className="status-badge-value">{summary.available}</span>
                </div>
            </div>
            <div className="status-badge-pill status-pill-distributed">
                <div className="status-badge-icon">
                    <FaTruck />
                </div>
                <div className="status-badge-info">
                    <span className="status-badge-label">จำหน่ายแล้ว (Out)</span>
                    <span className="status-badge-value">{summary.distributed}</span>
                </div>
            </div>
        </div>
    );


    useEffect(() => {
        const stocksRef = ref(db, 'stocks');
        const unsubscribe = onValue(stocksRef, (snapshot) => {
            const data = snapshot.val();
            const loadedStocks = [];
            let total = 0, available = 0, distributed = 0;

            if (data) {
                for (const key in data) {
                    const item = data[key];
                    total++;
                    if (item.status === 'รับเข้า') {
                        available++;
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
                        });
                    } else if (item.status === 'จำหน่าย') {
                        distributed++;
                    }
                }
            }
            setStocks(loadedStocks);
            setSummary({ total, available, distributed });
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleInfoClick = (e, item) => {
        e.stopPropagation();
        setSelectedItem(item);
        setShowDetailModal(true);
    };

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
                    qt_balance: 0,
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

    // ═══════════════════════════════════════════════════════════════════════
    // generateExcel – ใบเบิกหรือใบส่งคืน (แบบ พ.3101)
    // ═══════════════════════════════════════════════════════════════════════
    const generateExcel = async (selectedStocks, date) => {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'StockDBCenter';
        const ws = workbook.addWorksheet('ใบเบิกหรือใบส่งคืน');

        // A4 Portrait – fit to one page
        ws.pageSetup = {
            paperSize: 9, orientation: 'portrait',
            fitToPage: true, fitToWidth: 1, fitToHeight: 1,
            margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
        };

        // Column widths – ~105 chars total = A4 portrait with 0.3" margins
        ws.columns = [
            { width: 5   }, // A ลำดับ
            { width: 17  }, // B หมายเลขครุภัณฑ์/SN
            { width: 22  }, // C รายการ
            { width: 6   }, // D รหัส
            { width: 7   }, // E หน่วยนับ
            { width: 7   }, // F จำนวน
            { width: 8   }, // G จ่ายหรือคืน
            { width: 7   }, // H ค้างจ่าย
            { width: 9   }, // I ราคาหน่วย
            { width: 9   }, // J ราคารวม
            { width: 12  }, // K ลงชื่อผู้จำหน่าย
        ];

        const FN = 'TH SarabunPSK';
        const TN = { style: 'thin', color: { argb: 'FF000000' } };
        const AB = { top: TN, bottom: TN, left: TN, right: TN };
        const COLS = ['A','B','C','D','E','F','G','H','I','J','K'];

        // ── sc: set a single cell with default all-borders ──
        const sc = (addr, val, { font = {}, align = {}, fill, border, numFmt } = {}) => {
            const c = ws.getCell(addr);
            c.value = val;
            c.font = { name: FN, size: 14, ...font };
            c.alignment = { wrapText: true, vertical: 'middle', ...align };
            if (fill) c.fill = fill;
            c.border = border || AB;
            if (numFmt) c.numFmt = numFmt;
        };

        // ── mc: merge cells AND apply border to EVERY cell in the range ──
        // This is critical because ExcelJS only sets border on the top-left cellvc
        const mc = (range, val, opts = {}) => {
            ws.mergeCells(range);
            sc(range.split(':')[0], val, { border: AB, ...opts });
            // Apply border to all cells in merged range
            const [start, end] = range.split(':');
            const sc1 = start.replace(/[0-9]/g, '');
            const sr1 = parseInt(start.replace(/[A-Z]/gi, ''));
            const ec1 = end.replace(/[0-9]/g, '');
            const er1 = parseInt(end.replace(/[A-Z]/gi, ''));
            const ci1 = COLS.indexOf(sc1);
            const ci2 = COLS.indexOf(ec1);
            for (let r = sr1; r <= er1; r++) {
                for (let ci = ci1; ci <= ci2; ci++) {
                    const cell = ws.getCell(`${COLS[ci]}${r}`);
                    cell.border = AB;
                    if (opts.fill) cell.fill = opts.fill;
                }
            }
        };

        const HFILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
        const YFILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };

        // ═══════ ROW 1: Title ═══════
        ws.getRow(1).height = 38;
        mc('A1:I1', 'ใบเบิกหรือใบส่งคืน', { font: { bold: true, size: 22 }, align: { horizontal: 'center' }, border: {} });
        mc('J1:K1', 'แบบ พ.3101\nรพ.นครพิงค์', { font: { size: 12 }, align: { horizontal: 'right', wrapText: true }, border: {} });

        // ═══════ ROW 2 ═══════
        ws.getRow(2).height = 22;
        mc('A2:E2', 'แผ่นที่ ............. ของจำนวน ............. แผ่น', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc('F2:K2', 'เลขที่ใบเบิกหรือใบส่งคืน .....................', { font: { size: 14 }, align: { horizontal: 'left' } });

        // ═══════ ROW 3 ═══════
        ws.getRow(3).height = 22;
        mc('A3:E3', 'จาก ...................................................................', { font: { size: 14 }, align: { horizontal: 'left' } });
        sc('F3', '□', { font: { size: 14 }, align: { horizontal: 'center' } });
        sc('G3', 'เบิก', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc('H3:K3', 'ทะเบียนเอกสาร ...............................', { font: { size: 14 }, align: { horizontal: 'left' } });

        // ═══════ ROW 4 ═══════
        ws.getRow(4).height = 22;
        mc('A4:E4', 'ศูนย์คอมพิวเตอร์', { font: { size: 14 }, align: { horizontal: 'left' } });
        sc('F4', '☑', { font: { size: 14 }, align: { horizontal: 'center' } });
        sc('G4', 'ส่งคืน', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc('H4:K4', '');

        // ═══════ ROW 5 ═══════
        ws.getRow(5).height = 22;
        mc('A5:E5', 'ถึง ...................................................................', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc('F5:H5', `วันที่ต้องการ  ${date}`, { font: { size: 14 }, align: { horizontal: 'left' } });
        mc('I5:K5', 'ประเภทเงิน ..............................', { font: { size: 14 }, align: { horizontal: 'left' } });

        // ═══════ ROW 6 ═══════
        ws.getRow(6).height = 20;
        mc('A6:E6', 'คลังพัสดุ', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc('F6:K6', '');

        // ═══════ ROW 7 ═══════
        ws.getRow(7).height = 24;
        mc('A7:F7', 'ประเภทพัสดุและ/หรือครุภัณฑ์ที่เกี่ยวข้อง', { font: { size: 14, bold: true }, align: { horizontal: 'left' } });
        sc('G7', 'ขั้นต้น', { font: { size: 12 }, align: { horizontal: 'center' } });
        sc('H7', 'ทดแทน', { font: { size: 12 }, align: { horizontal: 'center' } });
        sc('I7', 'ยืม', { font: { size: 12 }, align: { horizontal: 'center' } });
        mc('J7:K7', 'หมายเหตุ', { font: { size: 12 }, align: { horizontal: 'center' } });

        // ═══════ ROW 8 ═══════
        ws.getRow(8).height = 22;
        mc('A8:F8', 'คอมพิวเตอร์และอุปกรณ์ต่อพ่วง', { font: { size: 14 }, align: { horizontal: 'left' } });
        sc('G8', '☑', { font: { size: 14 }, align: { horizontal: 'center' } });
        sc('H8', '□', { font: { size: 14 }, align: { horizontal: 'center' } });
        sc('I8', '□', { font: { size: 14 }, align: { horizontal: 'center' } });
        mc('J8:K8', '');

        // ═══════ ROW 9: Table column headers ═══════
        ws.getRow(9).height = 38;
        [
            ['A9', 'ลำดับ'], ['B9', 'หมายเลขครุภัณฑ์ / SN'], ['C9', 'รายการ'],
            ['D9', 'รหัส'], ['E9', 'หน่วยนับ'], ['F9', 'จำนวน'],
            ['G9', 'จ่ายหรือคืน'], ['H9', 'ค้างจ่าย'],
            ['I9', 'ราคา หน่วย\nละ'], ['J9', 'ราคารวม'],
        ].forEach(([addr, label]) => {
            sc(addr, label, { font: { bold: true, size: 14 }, align: { horizontal: 'center', wrapText: true } });
        });
        sc('K9', 'ลงชื่อผู้จำหน่าย', { font: { bold: true, size: 14 }, align: { horizontal: 'center', wrapText: true }, fill: YFILL });

        // ═══════ DATA ROWS ═══════
        const DATA_START = 10;
        const MIN_ROWS = Math.max(selectedStocks.length, 5);

        selectedStocks.forEach((stock, i) => {
            const r = DATA_START + i;
            ws.getRow(r).height = 45;
            const assetLine = stock.assetId || '-';
            const snLine = stock.serialNumber || '';
            const assetAndSN = snLine ? `${assetLine}\n${snLine}` : assetLine;
            const catName = stock.category || 'จอคอมพิวเตอร์';
            const bModel = stock.brandModel || '-';
            const itemDesc = `${catName} ${bModel}`;

            sc(`A${r}`, i + 1, { align: { horizontal: 'center' } });
            sc(`B${r}`, assetAndSN, { font: { size: 13 }, align: { horizontal: 'left', wrapText: true, vertical: 'top' } });
            sc(`C${r}`, itemDesc, { font: { size: 13 }, align: { horizontal: 'left', wrapText: true, vertical: 'top' } });
            sc(`D${r}`, 'ชม.', { align: { horizontal: 'center' } });
            sc(`E${r}`, stock.unit || 'เครื่อง', { align: { horizontal: 'center' } });
            sc(`F${r}`, 1, { align: { horizontal: 'center' } });
            sc(`G${r}`, 1, { align: { horizontal: 'center' } });
            sc(`H${r}`, '');
            sc(`I${r}`, stock.price ? Number(stock.price) : '', { align: { horizontal: 'right' }, numFmt: '#,##0.00' });
            sc(`J${r}`, stock.price ? Number(stock.price) : '', { align: { horizontal: 'right' }, numFmt: '#,##0.00' });
            sc(`K${r}`, 'บรรเจิด', { align: { horizontal: 'center' } });
        });

        for (let i = selectedStocks.length; i < MIN_ROWS; i++) {
            const r = DATA_START + i;
            ws.getRow(r).height = 30;
            COLS.forEach(col => sc(`${col}${r}`, ''));
        }

        // ═══════ TOTAL ROWS / FOOTER ═══════
        let R = DATA_START + MIN_ROWS;

        // Row 1: หลักฐาน + รวมแผ่นนี้
        ws.getRow(R).height = 22;
        mc(`A${R}:F${R}`, 'หลักฐานที่ใช้ในการเบิก/ส่งคืน', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc(`G${R}:H${R}`, 'รวมแผ่นนี้', { font: { size: 13 }, align: { horizontal: 'left' } });
        mc(`I${R}:K${R}`, '');

        // Row 2: ให้บุคคล + รวมทั้งสิ้น
        R++; ws.getRow(R).height = 22;
        mc(`A${R}:F${R}`, 'ให้บุคคลต่อไปนี้เป็นผู้รับพัสดุแทนได้', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc(`G${R}:H${R}`, 'รวมทั้งสิ้น', { font: { size: 13 }, align: { horizontal: 'left' } });
        mc(`I${R}:K${R}`, '');

        // Row 3: ผู้มีสิทธิ + ผู้ตรวจสอบ
        R++; ws.getRow(R).height = 22;
        mc(`A${R}:F${R}`, `ผู้มีสิทธิเบิก/ส่งคืน  นาย ณรงค์ รวมสุข`, { font: { size: 14 }, align: { horizontal: 'left' } });
        mc(`G${R}:K${R}`, 'ผู้ตรวจสอบ ..................................................', { font: { size: 14 }, align: { horizontal: 'left' } });

        // Row 4: ได้รับของ + ผู้อนุมัติ
        R++; ws.getRow(R).height = 22;
        mc(`A${R}:F${R}`, 'ได้รับของตามจำนวนและรายการที่จ่ายเรียบร้อยแล้ว', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc(`G${R}:K${R}`, 'ผู้อนุมัติจ่าย/รับคืน ..................................................', { font: { size: 14 }, align: { horizontal: 'left' } });

        // --- Left side vertical blank block ---
        const blankTop = R + 1;
        const blankBottom = R + 4;
        mc(`A${blankTop}:F${blankBottom}`, ''); // Merge all 4 rows on the left into one clean box

        // Row 5: ผู้จ่าย
        R++; ws.getRow(R).height = 22;
        mc(`G${R}:K${R}`, 'ผู้จ่าย ..................................................', { font: { size: 14 }, align: { horizontal: 'left' } });

        // Row 6: รหัสจ่าย + ค.ครึ่งคราว
        R++; ws.getRow(R).height = 22;
        mc(`G${R}:H${R}`, 'รหัสจ่าย', { font: { size: 13 }, align: { horizontal: 'left' } });
        mc(`I${R}:J${R}`, 'ค. ครึ่งคราว', { font: { size: 13 }, align: { horizontal: 'left' } });
        sc(`K${R}`, '');

        // Row 7: ป.ประจำ
        R++; ws.getRow(R).height = 22;
        mc(`G${R}:H${R}`, '');
        mc(`I${R}:J${R}`, 'ป. ประจำ', { font: { size: 13 }, align: { horizontal: 'left' } });
        sc(`K${R}`, '');

        // Row 8: รหัสคืน + ช.ใช้การได้
        R++; ws.getRow(R).height = 22;
        mc(`G${R}:H${R}`, 'รหัสคืน', { font: { size: 13 }, align: { horizontal: 'left' } });
        mc(`I${R}:J${R}`, 'ช. ใช้การได้', { font: { size: 13 }, align: { horizontal: 'left' } });
        sc(`K${R}`, '');

        // Row 9: ผู้รับพัสดุ + ชม.ใช้การไม่ได้
        R++; ws.getRow(R).height = 22;
        mc(`A${R}:F${R}`, 'ผู้รับพัสดุ', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc(`G${R}:H${R}`, '');
        mc(`I${R}:J${R}`, 'ชม. ใช้การไม่ได้', { font: { size: 13 }, align: { horizontal: 'left' } });
        sc(`K${R}`, '');


        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `ใบเบิกหรือใบส่งคืน_${date}.xlsx`);
    };

    const filteredStocks = stocks.filter(stock =>
        stock.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.brandModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="page-header-container d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="page-title-badge">
                    <div className="page-icon-box">
                        <FaTruck />
                    </div>
                    <h2 className="page-title-text">
                        จำหน่ายพัสดุ <small>(Distribution)</small>
                    </h2>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {selectedIds.length > 0 && (
                        <Button variant="primary" className="logout-btn-custom px-4" size="sm" onClick={handleShowBulkDistribute}>
                            จำหน่ายที่เลือก ({selectedIds.length})
                        </Button>
                    )}
                </div>
            </div>

            <StatusSummaryBar />


            <div className="section-header-container mt-2">
                <div className="section-accent"></div>
                <h4 className="section-title-text">
                    รายการพัสดุรอจำหน่าย
                    <span className="section-title-badge">งานซ่อมบำรุงคอมพิวเตอร์</span>
                </h4>
            </div>

            <div className="latest-panel">
                <div className="latest-panel-header">
                    <div className="latest-panel-title-wrap">
                        <div className="latest-panel-dot"></div>
                        <span className="latest-panel-title">รายการพัสดุรอจำหน่าย</span>
                        <span className="latest-panel-badge">งานซ่อมบำรุงคอมพิวเตอร์</span>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <span className="latest-panel-count">{loading ? '...' : `${filteredStocks.length} รายการ`}</span>
                        <div className="inv-search-wrap">
                            <FaSearch className="inv-search-icon" />
                            <input
                                type="text"
                                className="inv-search-input"
                                placeholder="ค้นหา ID, ยี่ห้อ, S/N..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="latest-table-wrap">
                    <table className="latest-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px', paddingLeft: '1.5rem' }}>
                                    <Form.Check
                                        type="checkbox"
                                        checked={selectedIds.length === filteredStocks.length && filteredStocks.length > 0}
                                        onChange={toggleSelectAll}
                                        className="db-check-custom"
                                    />
                                </th>
                                <th>วันที่สำรวจ</th>
                                <th>หมายเลขครุภัณฑ์</th>
                                <th>ยี่ห้อ/รุ่น</th>
                                <th>S/N</th>
                                <th>หน่วยงาน</th>
                                <th>สถานะ</th>
                                <th className="text-center">จัดการ</th>
                                <th className="text-center">รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9" className="latest-empty">กำลังโหลดข้อมูล...</td></tr>
                            ) : filteredStocks.length === 0 ? (
                                <tr><td colSpan="9" className="latest-empty">ไม่พบรายการสินค้าที่สามารถจำหน่ายได้</td></tr>
                            ) : (
                                filteredStocks.map((stock, idx) => (
                                    <tr
                                        key={stock.id}
                                        className={`latest-row latest-row--${idx % 2 === 0 ? 'even' : 'odd'}`}
                                    >
                                        <td style={{ paddingLeft: '1.5rem' }}>
                                            <Form.Check
                                                type="checkbox"
                                                checked={selectedIds.includes(stock.id)}
                                                onChange={() => toggleSelect(stock.id)}
                                            />
                                        </td>
                                        <td>{stock.importDate}</td>
                                        <td className="latest-asset-id">{stock.assetId}</td>
                                        <td className="latest-brand">{stock.brandModel}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{stock.serialNumber}</td>
                                        <td className="latest-dept">{stock.department}</td>
                                        <td>
                                            <span className="latest-status latest-status--in">
                                                รับเข้า (Available)
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <Button variant="outline-warning" size="sm" onClick={() => handleShowDistribute(stock)} className="px-3">
                                                <FaTruck className="me-1" /> จำหน่าย
                                            </Button>
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={(e) => handleInfoClick(e, stock)}
                                                title="ดูรายละเอียด"
                                                className="rounded-circle p-1"
                                                style={{ width: '32px', height: '32px' }}
                                            >
                                                <FaInfoCircle />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 d-flex justify-content-between align-items-center" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <button
                        type="button"
                        className="inc-btn inc-btn--back"
                        onClick={() => navigate('/')}
                        style={{ margin: 0 }}
                    >
                        <FaHome className="inc-btn-icon" />
                        <span>กลับเมนูหลัก</span>
                    </button>
                    <div>
                        {/* Empty space for alignment if needed */}
                    </div>
                </div>
            </div>

            <ItemDetailModal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                item={selectedItem}
            />

            {/* Modal for Distribution */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered className="luxury-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold d-flex align-items-center gap-3">
                        <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                            <FaTruck size={18} />
                        </div>
                        ยืนยันการจำหน่ายพัสดุ
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3 px-4 pb-4">
                    {distributeError && <Alert variant="danger" className="border-0 shadow-sm rounded-3">{distributeError}</Alert>}
                    
                    <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                        <span className="text-secondary fw-semibold" style={{ fontSize: '0.9rem' }}>รายการที่เลือก</span>
                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 shadow-sm border border-primary border-opacity-25">
                            {selectedIds.length} รายการ
                        </span>
                    </div>
                    
                    <div className="selected-items-box mb-4 p-3 rounded-4 shadow-sm" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', maxHeight: '180px', overflowY: 'auto' }}>
                        {stocks.filter(s => selectedIds.includes(s.id)).map((s, index) => (
                            <div key={s.id} className={`d-flex align-items-center py-2 ${index !== selectedIds.length - 1 ? 'border-bottom border-light' : ''}`}>
                                <div className="me-3 text-secondary">
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0d6efd', boxShadow: '0 0 5px rgba(13,110,253,0.5)' }}></div>
                                </div>
                                <div className="flex-grow-1">
                                    <div className="fw-semibold text-dark" style={{ fontSize: '0.95rem' }}>{s.assetId}</div>
                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{s.brandModel.trim().replace(/-$/, '').trim()}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: '0.9rem' }}>
                            วันที่จำหน่าย (Distribution Date)
                        </Form.Label>
                        <Form.Control
                            type="date"
                            value={distributeDate}
                            onChange={(e) => setDistributeDate(e.target.value)}
                            className="p-2 rounded-3"
                            style={{ border: '1px solid #ced4da', boxShadow: 'none', transition: 'all 0.2s', backgroundColor: '#fff', cursor: 'pointer' }}
                        />
                    </Form.Group>



                    <div className="p-3 rounded-4" style={{ backgroundColor: 'rgba(25, 135, 84, 0.05)', border: '1px dashed rgba(25, 135, 84, 0.3)' }}>
                        <div className="d-flex align-items-start gap-3">
                            <div className="bg-success bg-opacity-10 p-2 rounded-circle mt-1">
                                <FaFileExcel className="text-success" size={20} />
                            </div>
                            <div>
                                <h6 className="fw-bold text-success mb-1" style={{ fontSize: '0.95rem' }}>ดาวน์โหลดเอกสารอัตโนมัติ</h6>
                                <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                                    ระบบจะเปลี่ยนสถานะพัสดุเป็น <strong>"จำหน่าย"</strong> และจะดาวน์โหลดไฟล์ <strong className="text-success">Excel ใบเบิก/ส่งคืน</strong> ทันทีเมื่อกดยืนยัน
                                </p>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3 d-flex flex-column align-items-center gap-3">
                    <div className="text-center w-100 bounce-animation">
                        <span className="fw-bold text-primary" style={{ fontSize: '1rem' }}>
                            ✨ ถ้าเช็ครายละเอียดถูกต้องแล้วกดยืนยันได้เลยครับผม ✨
                        </span>
                    </div>
                    <div className="d-flex justify-content-end gap-2 w-100">
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-pill fw-semibold border-0 bg-white shadow-sm" style={{ transition: 'all 0.2s' }}>
                            ยกเลิก
                        </Button>
                        <Button variant="primary" onClick={handleDistribute} className="px-4 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-2 distribute-btn" style={{ transition: 'all 0.2s', background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)', border: 'none' }}>
                            <FaTruck /> ยืนยันการจำหน่าย
                        </Button>
                    </div>
                </Modal.Footer>
                <style>{`
                    .luxury-modal .modal-content {
                        border: none;
                        border-radius: 1rem;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .luxury-modal .form-control:focus {
                        border-color: #0d6efd;
                        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
                    }
                    .distribute-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 15px rgba(13, 110, 253, 0.3) !important;
                    }
                    .bounce-animation {
                        animation: bounce 2s infinite;
                    }
                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                        40% { transform: translateY(-5px); }
                        60% { transform: translateY(-3px); }
                    }
                    .alert-shake {
                        animation: hardShake 0.4s ease-in-out forwards;
                    }
                    .error-shake {
                        animation: softShake 0.4s ease-in-out forwards;
                    }
                    @keyframes hardShake {
                        0%, 100% { transform: translateX(0); }
                        20%, 60% { transform: translateX(-8px); }
                        40%, 80% { transform: translateX(8px); }
                    }
                    @keyframes softShake {
                        0%, 100% { transform: translateX(0); }
                        20%, 60% { transform: translateX(-3px); }
                        40%, 80% { transform: translateX(3px); }
                    }
                `}</style>
            </Modal>
        </>
    );
}
