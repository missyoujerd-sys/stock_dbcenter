import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Table, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { decryptData } from '../utils/encryption';
import { useNavigate, Link } from 'react-router-dom';
import {
    FaWarehouse, FaBox, FaCheckCircle,
    FaFileImport, FaFileExport, FaListAlt, FaArrowCircleRight, FaSearch, FaPrint, FaFileExcel, FaTruck
} from 'react-icons/fa';
import ItemDetailModal from '../components/ItemDetailModal';
import MultiPrintModal from '../components/MultiPrintModal';
import logoSvg from '../assets/logo.svg';
import qmIncomingSvg from '../assets/qm-incoming.svg';
import qmDistributionSvg from '../assets/qm-distribution.svg';
import qmInventorySvg from '../assets/qm-inventory.svg';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function Dashboard() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTermDist, setSearchTermDist] = useState('');
    
    const [selectedStocks, setSelectedStocks] = useState([]);
    const [showMultiPrintModal, setShowMultiPrintModal] = useState(false);
    const [selectedDistributed, setSelectedDistributed] = useState([]);

    const [summary, setSummary] = useState({
        total: 0,
        available: 0,
        distributed: 0
    });

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(date);
    };

    const formatTime = (date) => {
        return new Intl.DateTimeFormat('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date);
    };

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

    const incomingStocks = stocks.filter(stock => stock.status === 'รับเข้า');
    const distributedStocks = stocks.filter(stock => stock.status === 'จำหน่าย');

    const filteredIncoming = incomingStocks.filter(stock => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (stock.assetId || '').toLowerCase().includes(term) ||
               (stock.serialNumber || '').toLowerCase().includes(term) ||
               (stock.brandModel || '').toLowerCase().includes(term);
    }).slice(0, 50);

    const filteredDistributed = distributedStocks.filter(stock => {
        if (!searchTermDist) return true;
        const term = searchTermDist.toLowerCase();
        return (stock.assetId || '').toLowerCase().includes(term) ||
               (stock.serialNumber || '').toLowerCase().includes(term) ||
               (stock.brandModel || '').toLowerCase().includes(term);
    }).slice(0, 50);

    // Keep backward‑compat alias
    const displayStocks = filteredIncoming;

    const handleSelectStock = (e, stock) => {
        e.stopPropagation();
        if (e.target.checked) {
            setSelectedStocks(prev => [...prev, stock]);
        } else {
            setSelectedStocks(prev => prev.filter(s => s.id !== stock.id));
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStocks(filteredIncoming);
        } else {
            setSelectedStocks([]);
        }
    };

    const handleSelectDistributed = (e, stock) => {
        e.stopPropagation();
        if (e.target.checked) {
            setSelectedDistributed(prev => [...prev, stock]);
        } else {
            setSelectedDistributed(prev => prev.filter(s => s.id !== stock.id));
        }
    };

    const handleSelectAllDistributed = (e) => {
        if (e.target.checked) {
            setSelectedDistributed(filteredDistributed);
        } else {
            setSelectedDistributed([]);
        }
    };

    const handlePrintSelected = () => {
        setShowMultiPrintModal(true);
    };

    const generateExcelDistributed = async (selectedStocksList) => {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'StockDBCenter';
        const ws = workbook.addWorksheet('ใบเบิกหรือใบส่งคืน');
        const date = new Date().toISOString().split('T')[0];

        ws.pageSetup = {
            paperSize: 9, orientation: 'portrait',
            fitToPage: true, fitToWidth: 1, fitToHeight: 1,
            margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
        };
        ws.columns = [
            { width: 5 }, { width: 17 }, { width: 22 }, { width: 6 }, { width: 7 },
            { width: 7 }, { width: 8 }, { width: 7 }, { width: 9 }, { width: 9 }, { width: 12 },
        ];

        const FN = 'TH SarabunPSK';
        const TN = { style: 'thin', color: { argb: 'FF000000' } };
        const AB = { top: TN, bottom: TN, left: TN, right: TN };
        const COLS = ['A','B','C','D','E','F','G','H','I','J','K'];

        const sc = (addr, val, { font = {}, align = {}, fill, border, numFmt } = {}) => {
            const c = ws.getCell(addr);
            c.value = val;
            c.font = { name: FN, size: 14, ...font };
            c.alignment = { wrapText: true, vertical: 'middle', ...align };
            if (fill) c.fill = fill;
            c.border = border || AB;
            if (numFmt) c.numFmt = numFmt;
        };
        const mc = (range, val, opts = {}) => {
            ws.mergeCells(range);
            sc(range.split(':')[0], val, { border: AB, ...opts });
            const [start, end] = range.split(':');
            const sc1 = start.replace(/[0-9]/g, '');
            const sr1 = parseInt(start.replace(/[A-Z]/gi, ''));
            const ec1 = end.replace(/[0-9]/g, '');
            const er1 = parseInt(end.replace(/[A-Z]/gi, ''));
            const ci1 = COLS.indexOf(sc1); const ci2 = COLS.indexOf(ec1);
            for (let r = sr1; r <= er1; r++)
                for (let ci = ci1; ci <= ci2; ci++) {
                    const cell = ws.getCell(`${COLS[ci]}${r}`);
                    cell.border = AB;
                    if (opts.fill) cell.fill = opts.fill;
                }
        };
        const YFILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };

        ws.getRow(1).height = 38;
        mc('A1:I1', 'ใบเบิกหรือใบส่งคืน', { font: { bold: true, size: 22 }, align: { horizontal: 'center' }, border: {} });
        mc('J1:K1', 'แบบ พ.3101\nรพ.นครพิงค์', { font: { size: 12 }, align: { horizontal: 'right', wrapText: true }, border: {} });
        ws.getRow(2).height = 22;
        mc('A2:E2', 'แผ่นที่ ............. ของจำนวน ............. แผ่น', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc('F2:K2', 'เลขที่ใบเบิกหรือใบส่งคืน .....................', { font: { size: 14 }, align: { horizontal: 'left' } });
        ws.getRow(3).height = 22;
        mc('A3:E3', 'จาก ...................................................................', { font: { size: 14 }, align: { horizontal: 'left' } });
        sc('F3', '□', { font: { size: 14 }, align: { horizontal: 'center' } });
        sc('G3', 'เบิก', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc('H3:K3', 'ทะเบียนเอกสาร ...............................', { font: { size: 14 }, align: { horizontal: 'left' } });
        ws.getRow(4).height = 22;
        mc('A4:E4', 'ศูนย์คอมพิวเตอร์', { font: { size: 14 }, align: { horizontal: 'left' } });
        sc('F4', '☑', { font: { size: 14 }, align: { horizontal: 'center' } });
        sc('G4', 'ส่งคืน', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc('H4:K4', '');
        ws.getRow(5).height = 22;
        mc('A5:E5', 'ถึง ...................................................................', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc('F5:H5', `วันที่ต้องการ  ${date}`, { font: { size: 14 }, align: { horizontal: 'left' } });
        mc('I5:K5', 'ประเภทเงิน ..............................', { font: { size: 14 }, align: { horizontal: 'left' } });
        ws.getRow(6).height = 20;
        mc('A6:E6', 'คลังพัสดุ', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc('F6:K6', '');
        ws.getRow(7).height = 24;
        mc('A7:F7', 'ประเภทพัสดุและ/หรือครุภัณฑ์ที่เกี่ยวข้อง', { font: { size: 14, bold: true }, align: { horizontal: 'left' } });
        sc('G7', 'ขั้นต้น', { font: { size: 12 }, align: { horizontal: 'center' } });
        sc('H7', 'ทดแทน', { font: { size: 12 }, align: { horizontal: 'center' } });
        sc('I7', 'ยืม', { font: { size: 12 }, align: { horizontal: 'center' } });
        mc('J7:K7', 'หมายเหตุ', { font: { size: 12 }, align: { horizontal: 'center' } });
        ws.getRow(8).height = 22;
        mc('A8:F8', 'คอมพิวเตอร์และอุปกรณ์ต่อพ่วง', { font: { size: 14 }, align: { horizontal: 'left' } });
        sc('G8', '☑', { font: { size: 14 }, align: { horizontal: 'center' } });
        sc('H8', '□', { font: { size: 14 }, align: { horizontal: 'center' } });
        sc('I8', '□', { font: { size: 14 }, align: { horizontal: 'center' } });
        mc('J8:K8', '');
        ws.getRow(9).height = 38;
        [['A9','ลำดับ'],['B9','หมายเลขครุภัณฑ์ / SN'],['C9','รายการ'],
         ['D9','รหัส'],['E9','หน่วยนับ'],['F9','จำนวน'],
         ['G9','จ่ายหรือคืน'],['H9','ค้างจ่าย'],['I9','ราคา หน่วย\nละ'],['J9','ราคารวม'],
        ].forEach(([addr, label]) => sc(addr, label, { font: { bold: true, size: 14 }, align: { horizontal: 'center', wrapText: true } }));
        sc('K9', 'ลงชื่อผู้จำหน่าย', { font: { bold: true, size: 14 }, align: { horizontal: 'center', wrapText: true }, fill: YFILL });

        const DATA_START = 10;
        const MIN_ROWS = Math.max(selectedStocksList.length, 5);
        selectedStocksList.forEach((stock, i) => {
            const r = DATA_START + i;
            ws.getRow(r).height = 45;
            const assetLine = stock.assetId || '-';
            const snLine = stock.serialNumber || '';
            const assetAndSN = snLine ? `${assetLine}\n${snLine}` : assetLine;
            const catName = stock.category || 'จอคอมพิวเตอร์';
            const bModel = stock.brandModel || '-';
            sc(`A${r}`, i + 1, { align: { horizontal: 'center' } });
            sc(`B${r}`, assetAndSN, { font: { size: 13 }, align: { horizontal: 'left', wrapText: true, vertical: 'top' } });
            sc(`C${r}`, `${catName} ${bModel}`, { font: { size: 13 }, align: { horizontal: 'left', wrapText: true, vertical: 'top' } });
            sc(`D${r}`, 'ชม.', { align: { horizontal: 'center' } });
            sc(`E${r}`, stock.unit || 'เครื่อง', { align: { horizontal: 'center' } });
            sc(`F${r}`, 1, { align: { horizontal: 'center' } });
            sc(`G${r}`, 1, { align: { horizontal: 'center' } });
            sc(`H${r}`, '');
            sc(`I${r}`, stock.price ? Number(stock.price) : '', { align: { horizontal: 'right' }, numFmt: '#,##0.00' });
            sc(`J${r}`, stock.price ? Number(stock.price) : '', { align: { horizontal: 'right' }, numFmt: '#,##0.00' });
            sc(`K${r}`, 'บรรเจิด', { align: { horizontal: 'center' } });
        });
        for (let i = selectedStocksList.length; i < MIN_ROWS; i++) {
            const r = DATA_START + i;
            ws.getRow(r).height = 30;
            COLS.forEach(col => sc(`${col}${r}`, ''));
        }
        let R = DATA_START + MIN_ROWS;
        ws.getRow(R).height = 22; mc(`A${R}:F${R}`, 'หลักฐานที่ใช้ในการเบิก/ส่งคืน', { font: { size: 14 }, align: { horizontal: 'left' } }); mc(`G${R}:H${R}`, 'รวมแผ่นนี้', { font: { size: 13 }, align: { horizontal: 'left' } }); mc(`I${R}:K${R}`, '');
        R++; ws.getRow(R).height = 22; mc(`A${R}:F${R}`, 'ให้บุคคลต่อไปนี้เป็นผู้รับพัสดุแทนได้', { font: { size: 14 }, align: { horizontal: 'left' } }); mc(`G${R}:H${R}`, 'รวมทั้งสิ้น', { font: { size: 13 }, align: { horizontal: 'left' } }); mc(`I${R}:K${R}`, '');
        R++; ws.getRow(R).height = 22; mc(`A${R}:F${R}`, 'ผู้มีสิทธิเบิก/ส่งคืน  นาย ณรงค์ รวมสุข', { font: { size: 14 }, align: { horizontal: 'left' } }); mc(`G${R}:K${R}`, 'ผู้ตรวจสอบ ..................................................', { font: { size: 14 }, align: { horizontal: 'left' } });
        R++; ws.getRow(R).height = 22; mc(`A${R}:F${R}`, 'ได้รับของตามจำนวนและรายการที่จ่ายเรียบร้อยแล้ว', { font: { size: 14 }, align: { horizontal: 'left' } }); mc(`G${R}:K${R}`, 'ผู้อนุมัติจ่าย/รับคืน ..................................................', { font: { size: 14 }, align: { horizontal: 'left' } });
        const blankTop = R + 1; const blankBottom = R + 4;
        mc(`A${blankTop}:F${blankBottom}`, '');
        R++; ws.getRow(R).height = 22; mc(`G${R}:K${R}`, 'ผู้จ่าย ..................................................', { font: { size: 14 }, align: { horizontal: 'left' } });
        R++; ws.getRow(R).height = 22; mc(`G${R}:H${R}`, 'รหัสจ่าย', { font: { size: 13 }, align: { horizontal: 'left' } }); mc(`I${R}:J${R}`, 'ค. ครึ่งคราว', { font: { size: 13 }, align: { horizontal: 'left' } }); sc(`K${R}`, '');
        R++; ws.getRow(R).height = 22; mc(`G${R}:H${R}`, ''); mc(`I${R}:J${R}`, 'ป. ประจำ', { font: { size: 13 }, align: { horizontal: 'left' } }); sc(`K${R}`, '');
        R++; ws.getRow(R).height = 22; mc(`G${R}:H${R}`, 'รหัสคืน', { font: { size: 13 }, align: { horizontal: 'left' } }); mc(`I${R}:J${R}`, 'ช. ใช้การได้', { font: { size: 13 }, align: { horizontal: 'left' } }); sc(`K${R}`, '');
        R++; ws.getRow(R).height = 22; mc(`A${R}:F${R}`, 'ผู้รับพัสดุ', { font: { size: 14 }, align: { horizontal: 'left' } }); mc(`G${R}:H${R}`, ''); mc(`I${R}:J${R}`, 'ชม. ใช้การไม่ได้', { font: { size: 13 }, align: { horizontal: 'left' } }); sc(`K${R}`, '');

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `ใบเบิกหรือใบส่งคืน_${date}.xlsx`);
    };

    return (
        <div>
            {/* ── Hero Banner ── */}
            <div className="db-hero-banner mb-4">
                {/* Title block */}
                <div className="db-hero-title-block">
                    {/* Hospital Logo (Left-aligned with background) */}
                    <div className="db-hero-logo-wrap" style={{ 
                        background: 'rgba(255,255,255,0.85)', 
                        padding: '12px 20px', 
                        borderRadius: '20px', 
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,1)',
                        border: '1px solid rgba(255,255,255,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <img src="/cnkp-logo-transparent.png" alt="Nakornping Hospital Logo" style={{ height: '55px', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <div className="db-hero-org">กลุ่มงานเทคโนโลยีสารสนเทศ·ฝ่ายดูแลพัสดุอุปกรณ์ครุภัณฑ์รอจำหน่าย</div>
                        <h1 className="db-hero-title">ภาพรวมระบบ</h1>
                        <div className="db-hero-sub">STOCK DASHBOARD ห้องซ่อมบำรุงคอมพิวเตอร์</div>
                    </div>
                </div>

                {/* Stat chips */}
                <div className="db-hero-chips">
                    <div className="db-chip" style={{ borderLeft: '4px solid #60a5fa' }}>
                        <div className="db-chip-top">
                            <div className="db-chip-dot" style={{ backgroundColor: '#60a5fa', boxShadow: '0 0 10px rgba(96,165,250,0.8)' }}></div>
                            <span className="db-chip-label" style={{ color: '#93c5fd' }}>วัน/เวลาปัจจุบัน</span>
                        </div>
                        <div className="db-chip-value" style={{ fontSize: '1.4rem' }}>{formatDate(currentTime)}</div>
                        <div className="db-chip-sub" style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#bfdbfe', letterSpacing: '1.5px', marginTop: '2px' }}>{formatTime(currentTime)}</div>
                    </div>
                    <div className="db-chip db-chip--total">
                        <div className="db-chip-top">
                            <div className="db-chip-dot db-chip-dot--total"></div>
                            <span className="db-chip-label">พัสดุทั้งหมด</span>
                        </div>
                        <div className="db-chip-value">{loading ? '—' : summary.total}</div>
                        <div className="db-chip-sub">TOTAL ASSETS</div>
                    </div>
                    <div className="db-chip db-chip--available">
                        <div className="db-chip-top">
                            <div className="db-chip-dot db-chip-dot--available"></div>
                            <span className="db-chip-label">พร้อมจำหน่าย</span>
                        </div>
                        <div className="db-chip-value db-chip-value--available">{loading ? '—' : summary.available}</div>
                        <div className="db-chip-sub">AVAILABLE</div>
                    </div>
                    <div className="db-chip db-chip--distributed">
                        <div className="db-chip-top">
                            <div className="db-chip-dot db-chip-dot--distributed"></div>
                            <span className="db-chip-label">จำหน่ายแล้ว</span>
                        </div>
                        <div className="db-chip-value db-chip-value--distributed">{loading ? '—' : summary.distributed}</div>
                        <div className="db-chip-sub">DISTRIBUTED</div>
                    </div>
                </div>
            </div>

            <div className="section-header-container mt-4">
                <div className="section-accent"></div>
                <h4 className="section-title-text">
                    เมนูด่วน
                    <span className="section-title-badge">QUICK MENU</span>
                </h4>
            </div>
            <div className="qm-grid mb-4">
                <Link to="/incoming" className="text-decoration-none">
                    <div className="qm-card qm-card--incoming">
                        <div className="qm-illu-wrap" style={{ mixBlendMode: 'multiply' }}>
                            <img src="/รับเข้าสต๊อก.png" alt="incoming" className="qm-illu-img" style={{ filter: 'brightness(1.0) contrast(1.0)' }} />
                        </div>
                        <div className="qm-card-inner">
                            <div className="qm-body">
                                <div className="qm-label"><h4>รับพัสดุรอจำหน่ายเข้าระบบ</h4></div>
                                <div className="qm-title">รับพัสดุเข้าระบบ</div>
                                <div className="qm-desc">บันทึกการรับพัสดุครุภัณฑ์เข้าคลัง<br />เพื่อรอดำเนินการจำหน่ายต่อไป</div>
                            </div>
                        </div>
                        <div className="qm-card-footer">
                            <span className="qm-footer-text">คงเหลือพร้อมจำหน่าย: {summary.available} รายการ</span>
                            <FaArrowCircleRight />
                        </div>
                    </div>
                </Link>
                <Link to="/distribution" className="text-decoration-none">
                    <div className="qm-card qm-card--distribution">
                        <div className="qm-illu-wrap" style={{ mixBlendMode: 'multiply' }}>
                            <img src="/เตรียมจำหน่าย.png" alt="distribution" className="qm-illu-img" style={{ filter: 'brightness(1.0) contrast(1.0)' }} />
                        </div>
                        <div className="qm-card-inner">
                            <div className="qm-body">
                                <div className="qm-label"><h4>รายการพัสดุรอจำหน่าย</h4></div>
                                <div className="qm-title">จำหน่ายพัสดุออก</div>
                                <div className="qm-desc">จัดการเอกสารและรายการพัสดุ<br />ที่รอดำเนินการจำหน่ายออกจากระบบ</div>
                            </div>
                        </div>
                        <div className="qm-card-footer">
                            <span className="qm-footer-text">จำหน่ายแล้ว: {summary.distributed} รายการ</span>
                            <FaArrowCircleRight />
                        </div>
                    </div>
                </Link>
                <Link to="/inventory" className="text-decoration-none">
                    <div className="qm-card qm-card--inventory">
                        <div className="qm-illu-wrap" style={{ mixBlendMode: 'normal' }}>
                            <img src="/รายงานทั้งหมด.png" alt="inventory" className="qm-illu-img" style={{ filter: 'brightness(1.0) contrast(1.1)' }} />
                        </div>
                        <div className="qm-card-inner">
                            <div className="qm-body">
                                <div className="qm-label"><h4>ข้อมูลพัสดุในระบบทั้งหมด</h4></div>
                                <div className="qm-title">รายงานพัสดุทั้งหมด</div>
                                <div className="qm-desc">ตรวจสอบและค้นหาข้อมูลพัสดุ<br />ครุภัณฑ์ทั้งหมดในระบบคลัง</div>
                            </div>
                        </div>
                        <div className="qm-card-footer">
                            <span className="qm-footer-text">รายการทั้งหมด: {summary.total} รายการ</span>
                            <FaArrowCircleRight />
                        </div>
                    </div>
                </Link>
            </div>

            {/* ══ TABLE 1: รับเข้า ══ */}
            <div className="section-header-container mt-2">
                <div className="section-accent"></div>
                <h4 className="section-title-text">
                    รายการพัสดุรับเข้า
                    <span className="section-title-badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>รับเข้า (AVAILABLE)</span>
                </h4>
            </div>
            <div className="latest-panel">
                <div className="latest-panel-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', backgroundColor: '#fca5a5' }}>
                    <div className="latest-panel-title-wrap">
                        <div className="latest-panel-dot" style={{ backgroundColor: '#b91c1c' }}></div>
                        <span className="latest-panel-title">รายการพัสดุรอจำหน่าย</span>
                        <span className="latest-panel-badge" style={{ backgroundColor: '#ffffff', color: '#b91c1c', border: '1px solid #ef4444' }}>AVAILABLE</span>
                    </div>
                    {selectedStocks.length > 0 && (
                        <div style={{ marginLeft: '15px' }}>
                            <Button variant="primary" size="sm" onClick={handlePrintSelected} className="d-flex align-items-center gap-2 shadow-sm" style={{ borderRadius: '8px' }}>
                                <FaPrint /> พิมพ์ที่เลือก ({selectedStocks.length})
                            </Button>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: 'auto' }}>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="ค้นหา ครุภัณฑ์ / SN..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '6px 12px 6px 35px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: '#f8fafc', outline: 'none', width: '240px', fontSize: '0.9rem', transition: 'all 0.2s ease' }}
                                onFocus={(e) => { e.target.style.border = '1px solid #4ade80'; }}
                                onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; }}
                            />
                        </div>
                        <span className="latest-panel-count">{loading ? '...' : `${filteredIncoming.length} รายการ`}</span>
                    </div>
                </div>
                <div className="latest-table-wrap">
                    <table className="latest-table">
                        <thead>
                            <tr>
                                <th style={{ width: '90px', textAlign: 'center' }}>
                                    <div className="d-flex flex-column align-items-center justify-content-center gap-1">
                                        <label className="d-flex align-items-center gap-1 mb-0" style={{ cursor: 'pointer' }}>
                                            <input type="checkbox" className="form-check-input m-0" style={{ cursor: 'pointer' }}
                                                onChange={handleSelectAll}
                                                checked={filteredIncoming.length > 0 && selectedStocks.length === filteredIncoming.length}
                                            />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'normal', whiteSpace: 'nowrap' }}>เลือกทั้งหมด</span>
                                        </label>
                                        <span style={{ fontSize: '0.85rem' }}>ลำดับ</span>
                                    </div>
                                </th>
                                <th>วันที่</th>
                                <th>หมายเลขครุภัณฑ์</th>
                                <th>ยี่ห้อ / รุ่น</th>
                                <th>หน่วยงาน</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="latest-empty">กำลังโหลดข้อมูล...</td></tr>
                            ) : filteredIncoming.length === 0 ? (
                                <tr><td colSpan="6" className="latest-empty">ไม่พบรายการพัสดุรับเข้า</td></tr>
                            ) : filteredIncoming.map((stock, idx) => (
                                <tr key={stock.id} onClick={() => handleRowClick(stock)}
                                    className={`latest-row latest-row--${idx % 2 === 0 ? 'even' : 'odd'}`}
                                    title="คลิกเพื่อดูรายละเอียด">
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="d-flex align-items-center justify-content-center gap-2">
                                            <input type="checkbox" className="form-check-input" style={{ cursor: 'pointer' }}
                                                checked={selectedStocks.some(s => s.id === stock.id)}
                                                onChange={(e) => handleSelectStock(e, stock)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <span>{idx + 1}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="latest-date">{stock.importDate}</div>
                                        {stock.timestamp && (
                                            <div className="latest-time">{new Date(stock.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })} น.</div>
                                        )}
                                    </td>
                                    <td className="latest-asset-id">{stock.assetId || '—'}</td>
                                    <td className="latest-brand">{stock.brandModel}</td>
                                    <td className="latest-dept">{stock.department}</td>
                                    <td><span className="latest-status latest-status--in">รับเข้า</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══ TABLE 2: จำหน่าย ══ */}
            <div className="section-header-container mt-4">
                <div className="section-accent"></div>
                <h4 className="section-title-text">
                    รายการพัสดุจำหน่ายแล้ว
                    <span className="section-title-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>จำหน่าย (DISTRIBUTED)</span>
                </h4>
            </div>
            <div className="latest-panel">
                <div className="latest-panel-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', backgroundColor: '#ffb74d' }}>
                    <div className="latest-panel-title-wrap">
                        <div className="latest-panel-dot" style={{ backgroundColor: '#f87171' }}></div>
                        <span className="latest-panel-title">รายการพัสดุจำหน่ายแล้ว</span>
                        <span className="latest-panel-badge" style={{ color: '#f87171' }}>DISTRIBUTED</span>
                    </div>
                    {selectedDistributed.length > 0 && (
                        <div style={{ marginLeft: '15px' }}>
                            <Button
                                size="sm"
                                onClick={() => generateExcelDistributed(selectedDistributed)}
                                className="d-flex align-items-center gap-2 shadow-sm"
                                style={{ borderRadius: '8px', background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none', color: '#fff', fontWeight: 600 }}
                            >
                                <FaFileExcel /> Export Excel ใบเบิก ({selectedDistributed.length})
                            </Button>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: 'auto' }}>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="ค้นหา ครุภัณฑ์ / SN..."
                                value={searchTermDist}
                                onChange={(e) => setSearchTermDist(e.target.value)}
                                style={{ padding: '6px 12px 6px 35px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: '#f8fafc', outline: 'none', width: '240px', fontSize: '0.9rem', transition: 'all 0.2s ease' }}
                                onFocus={(e) => { e.target.style.border = '1px solid #f87171'; }}
                                onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; }}
                            />
                        </div>
                        <span className="latest-panel-count">{loading ? '...' : `${filteredDistributed.length} รายการ`}</span>
                    </div>
                </div>
                <div className="latest-table-wrap">
                    <table className="latest-table">
                        <thead>
                            <tr>
                                <th style={{ width: '90px', textAlign: 'center' }}>
                                    <div className="d-flex flex-column align-items-center justify-content-center gap-1">
                                        <label className="d-flex align-items-center gap-1 mb-0" style={{ cursor: 'pointer' }}>
                                            <input type="checkbox" className="form-check-input m-0" style={{ cursor: 'pointer' }}
                                                onChange={handleSelectAllDistributed}
                                                checked={filteredDistributed.length > 0 && selectedDistributed.length === filteredDistributed.length}
                                            />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'normal', whiteSpace: 'nowrap' }}>เลือกทั้งหมด</span>
                                        </label>
                                        <span style={{ fontSize: '0.85rem' }}>ลำดับ</span>
                                    </div>
                                </th>
                                <th>วันที่จำหน่าย</th>
                                <th>หมายเลขครุภัณฑ์</th>
                                <th>ยี่ห้อ / รุ่น</th>
                                <th>หน่วยงาน</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="latest-empty">กำลังโหลดข้อมูล...</td></tr>
                            ) : filteredDistributed.length === 0 ? (
                                <tr><td colSpan="6" className="latest-empty">ไม่พบรายการพัสดุจำหน่าย</td></tr>
                            ) : filteredDistributed.map((stock, idx) => (
                                <tr key={stock.id} onClick={() => handleRowClick(stock)}
                                    className={`latest-row latest-row--${idx % 2 === 0 ? 'even' : 'odd'}`}
                                    title="คลิกเพื่อดูรายละเอียด">
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="d-flex align-items-center justify-content-center gap-2">
                                            <input type="checkbox" className="form-check-input" style={{ cursor: 'pointer' }}
                                                checked={selectedDistributed.some(s => s.id === stock.id)}
                                                onChange={(e) => handleSelectDistributed(e, stock)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <span>{idx + 1}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="latest-date">{stock.distributionDate || stock.importDate}</div>
                                        {stock.timestamp && (
                                            <div className="latest-time">{new Date(stock.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })} น.</div>
                                        )}
                                    </td>
                                    <td className="latest-asset-id">{stock.assetId || '—'}</td>
                                    <td className="latest-brand">{stock.brandModel}</td>
                                    <td className="latest-dept">{stock.department}</td>
                                    <td><span className="latest-status latest-status--out">จำหน่าย</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ItemDetailModal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                item={selectedItem}
            />

            <MultiPrintModal
                show={showMultiPrintModal}
                onHide={() => setShowMultiPrintModal(false)}
                items={selectedStocks}
            />
        </div>
    );
}
