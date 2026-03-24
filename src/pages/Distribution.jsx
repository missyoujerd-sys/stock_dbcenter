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
        
        selectedStocks.forEach((stock, index) => {
            const worksheet = workbook.addWorksheet(`Label ${index + 1}`);

            // Page Setup for Zebra Sticker (101.6mm x 72.4mm / 4" x 3")
            worksheet.pageSetup = {
                paperSize: 256, // Custom
                orientation: 'landscape',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 1,
                margins: { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 }
            };

            // Set column widths
            worksheet.columns = [
                { width: 18 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, 
                { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
            ];

            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

            // Top Right: Date & Time
            worksheet.mergeCells('I1:J1');
            worksheet.getCell('I1').value = `วันที่: ${date}`;
            worksheet.getCell('I1').font = { size: 10 };
            worksheet.getCell('I1').alignment = { horizontal: 'right' };

            worksheet.mergeCells('I2:J2');
            worksheet.getCell('I2').value = `เวลา: ${timeStr}`;
            worksheet.getCell('I2').font = { size: 10 };
            worksheet.getCell('I2').alignment = { horizontal: 'right' };

            // Header: จำหน่าย
            worksheet.mergeCells('A2:H3');
            const titleCell = worksheet.getCell('A2');
            titleCell.value = 'จำหน่าย';
            titleCell.font = { size: 20, bold: true, underline: true };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

            // List information
            const startRow = 5;
            const fields = [
                { label: 'หน่วยงาน:', value: `${stock.department}  เบอร์โทร. 2299` },
                { label: 'ประเภทครุภัณฑ์:', value: stock.category || '-' },
                { label: 'Serial Number:', value: stock.serialNumber || '-' },
                { label: 'เลขครุภัณฑ์:', value: stock.assetId || '-' },
                { label: 'ยี่ห้อ/รุ่น:', value: stock.brandModel || '-' },
                { label: 'หมายเหตุ:', value: stock.remarks || '-' }
            ];

            fields.forEach((f, i) => {
                const r = startRow + (i * 1.5); // Spacing
                worksheet.getCell(`A${Math.floor(r)}`).value = f.label;
                worksheet.getCell(`A${Math.floor(r)}`).font = { size: 11, bold: true };
                
                worksheet.mergeCells(`C${Math.floor(r)}:J${Math.floor(r)}`);
                const valCell = worksheet.getCell(`C${Math.floor(r)}`);
                valCell.value = f.value;
                valCell.font = { size: 11 };
                valCell.alignment = { horizontal: 'left' };
                // Add dotted line effect under value
                valCell.border = { bottom: { style: 'dotted' } };
            });

            // Footer: Signature
            const footerRow = 15;
            worksheet.mergeCells(`F${footerRow}:J${footerRow}`);
            worksheet.getCell(`F${footerRow}`).value = `(..........................................)`;
            worksheet.getCell(`F${footerRow}`).alignment = { horizontal: 'center' };

            worksheet.mergeCells(`F${footerRow + 1}:J${footerRow + 1}`);
            worksheet.getCell(`F${footerRow + 1}`).value = `${stock.officerName || '................................'}`;
            worksheet.getCell(`F${footerRow + 1}`).alignment = { horizontal: 'center' };

            worksheet.mergeCells(`F${footerRow + 2}:J${footerRow + 2}`);
            worksheet.getCell(`F${footerRow + 2}`).value = `${date}`;
            worksheet.getCell(`F${footerRow + 2}`).alignment = { horizontal: 'center' };

            worksheet.mergeCells(`F${footerRow + 3}:J${footerRow + 3}`);
            worksheet.getCell(`F${footerRow + 3}`).value = `เจ้าหน้าที่คอมพิวเตอร์`;
            worksheet.getCell(`F${footerRow + 3}`).alignment = { horizontal: 'center' };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Labels_Distribution_${date}.xlsx`);
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
                    <span className="section-title-badge">PENDING DISTRIBUTION</span>
                </h4>
            </div>

            <div className="latest-panel">
                <div className="latest-panel-header">
                    <div className="latest-panel-title-wrap">
                        <div className="latest-panel-dot"></div>
                        <span className="latest-panel-title">รายการพัสดุรอจำหน่าย</span>
                        <span className="latest-panel-badge">PENDING DISTRIBUTION</span>
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
                                {s.assetId} - {s.brandModel.trim().replace(/-$/, '').trim()}
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
        </>
    );
}
