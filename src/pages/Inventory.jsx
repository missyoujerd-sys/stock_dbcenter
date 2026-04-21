import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, remove, update } from 'firebase/database';
import { Table, Card, Row, Col, Badge, Button, Form } from 'react-bootstrap';
import { decryptData } from '../utils/encryption';
import { FaWarehouse, FaSearch, FaHome, FaTruck, FaTrash, FaUndo, FaPrint } from 'react-icons/fa';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';
import ItemDetailModal from '../components/ItemDetailModal';
import { useAuth } from '../contexts/AuthContext';
export default function Inventory() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const navigate = useNavigate();
    const { currentUser, isAdmin, isAdmin_2 } = useAuth();
    const [summary, setSummary] = useState({ total: 0, available: 0, distributed: 0 });

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
                    if (item.status === 'รับเข้า') available++;
                    if (item.status === 'จำหน่าย') distributed++;

                    loadedStocks.push({
                        id: key,
                        ...item,
                        department: decryptData(item.department),
                        serialNumber: decryptData(item.serialNumber),
                        assetId: decryptData(item.assetId),
                        category: decryptData(item.category || ''),
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

    const StatusSummaryBar = () => (
        <div className="status-summary-bar">
            <div className="status-badge-pill status-pill-total">
                <div className="status-badge-icon">
                    <FaWarehouse />
                </div>
                <div className="status-badge-info">
                    <span className="status-badge-label">พัสดุทั้งหมด (Total)</span>
                    <span className="status-badge-value">{summary.total}</span>
                </div>
            </div>
            <div className="status-badge-pill status-pill-available">
                <div className="status-badge-icon">
                    <FaWarehouse />
                </div>
                <div className="status-badge-info">
                    <span className="status-badge-label">คงเหลือ (Available)</span>
                    <span className="status-badge-value">{summary.available}</span>
                </div>
            </div>
            <div className="status-badge-pill status-pill-distributed">
                <div className="status-badge-icon">
                    <FaTruck />
                </div>
                <div className="status-badge-info">
                    <span className="status-badge-label">จำหน่ายแล้ว (Distributed)</span>
                    <span className="status-badge-value">{summary.distributed}</span>
                </div>
            </div>
        </div>
    );

    const handleRowClick = (item) => {
        setSelectedItem(item);
        setShowDetailModal(true);
    };

    const handleDelete = async (e, stockId) => {
        e.stopPropagation();
        if (!isAdmin_2) {
            alert('ลบได้เฉพาะ Admin เท่านั้น');
            return;
        }
        if (!window.confirm('ต้องการลบรายการนี้ออกจากระบบ?')) return;
        try {
            await remove(ref(db, `stocks/${stockId}`));
        } catch (err) {
            console.error('ลบไม่สำเร็จ:', err);
            alert('เกิดข้อผิดพลาด ไม่สามารถลบรายการได้');
        }
    };

    const generateExcelLabel = async (stock) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Label');

        // Page Setup for Zebra Sticker (4" x 3")
        worksheet.pageSetup = {
            paperSize: 256,
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 1,
            margins: { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 }
        };

        worksheet.columns = [
            { width: 18 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, 
            { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
        ];

        const now = new Date();
        const dateStr = now.toLocaleDateString('th-TH');
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

        // Top Right: Date & Time
        worksheet.mergeCells('I1:J1');
        worksheet.getCell('I1').value = `วันที่: ${dateStr}`;
        worksheet.getCell('I1').font = { size: 10 };
        worksheet.getCell('I1').alignment = { horizontal: 'right' };

        worksheet.mergeCells('I2:J2');
        worksheet.getCell('I2').value = `เวลา: ${timeStr}`;
        worksheet.getCell('I2').font = { size: 10 };
        worksheet.getCell('I2').alignment = { horizontal: 'right' };

        // Header: คลังพัสดุ
        worksheet.mergeCells('A2:H3');
        const titleCell = worksheet.getCell('A2');
        titleCell.value = stock.status === 'จำหน่าย' ? 'จำหน่าย' : 'คลังพัสดุ';
        titleCell.font = { size: 20, bold: true, underline: true };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Detail
        const fields = [
            { label: 'หน่วยงาน:', value: `${stock.department}  เบอร์โทร. 2299` },
            { label: 'ประเภทครุภัณฑ์:', value: stock.category || '-' },
            { label: 'Serial Number:', value: stock.serialNumber || '-' },
            { label: 'เลขครุภัณฑ์:', value: stock.assetId || '-' },
            { label: 'ยี่ห้อ/รุ่น:', value: stock.brandModel || '-' },
            { label: 'หมายเหตุ:', value: stock.remarks || '-' }
        ];

        fields.forEach((f, i) => {
            const r = 5 + (i * 1.5);
            worksheet.getCell(`A${Math.floor(r)}`).value = f.label;
            worksheet.getCell(`A${Math.floor(r)}`).font = { size: 11, bold: true };
            worksheet.mergeCells(`C${Math.floor(r)}:J${Math.floor(r)}`);
            const vCell = worksheet.getCell(`C${Math.floor(r)}`);
            vCell.value = f.value;
            vCell.font = { size: 11 };
            vCell.alignment = { horizontal: 'left' };
            vCell.border = { bottom: { style: 'dotted' } };
        });

        // Signature
        const fRow = 15;
        worksheet.mergeCells(`F${fRow}:J${fRow}`);
        worksheet.getCell(`F${fRow}`).value = `(..........................................)`;
        worksheet.getCell(`F${fRow}`).alignment = { horizontal: 'center' };
        worksheet.mergeCells(`F${fRow + 1}:J${fRow + 1}`);
        worksheet.getCell(`F${fRow + 1}`).value = `${stock.officerName || '................................'}`;
        worksheet.getCell(`F${fRow + 1}`).alignment = { horizontal: 'center' };
        worksheet.mergeCells(`F${fRow + 2}:J${fRow + 2}`);
        worksheet.getCell(`F${fRow + 2}`).value = `${dateStr}`;
        worksheet.getCell(`F${fRow + 2}`).alignment = { horizontal: 'center' };
        worksheet.mergeCells(`F${fRow + 3}:J${fRow + 3}`);
        worksheet.getCell(`F${fRow + 3}`).value = `เจ้าหน้าที่คอมพิวเตอร์`;
        worksheet.getCell(`F${fRow + 3}`).alignment = { horizontal: 'center' };

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Label_Inventory_${stock.assetId}.xlsx`);
    };

    const handleRevertStatus = async (e, stockId) => {
        e.stopPropagation();
        if (!isAdmin_2) {
            alert('คืนสถานะได้เฉพาะ Admin เท่านั้น');
            return;
        }
        if (!window.confirm('ต้องการคืนสถานะรายการนี้เป็น "รับเข้า" ?')) return;
        try {
            await update(ref(db, `stocks/${stockId}`), {
                status: 'รับเข้า',
                distributionDate: null,
                distributor: null,
                qt_distributed: 0,
                qt_balance: 1
            });
        } catch (err) {
            console.error('คืนสถานะไม่สำเร็จ:', err);
            alert('เกิดข้อผิดพลาด ไม่สามารถคืนสถานะได้');
        }
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
            </div>

            <StatusSummaryBar />

            <div className="latest-panel">
                {/* Panel Header */}
                <div className="latest-panel-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', backgroundColor: '#fca5a5' }}>
                    <div className="latest-panel-title-wrap">
                        <div className="latest-panel-dot" style={{ backgroundColor: '#b91c1c' }}></div>
                        <span className="latest-panel-title">ข้อมูลพัสดุในระบบ</span>
                        <span className="latest-panel-badge" style={{ backgroundColor: '#ffffff', color: '#b91c1c', border: '1px solid #ef4444' }}>INVENTORY DATA</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="latest-panel-count">{loading ? '...' : `${filteredStocks.length} รายการ`}</span>
                        {/* Search */}
                        <div className="inv-search-wrap">
                            <FaSearch className="inv-search-icon" />
                            <input
                                type="text"
                                className="inv-search-input"
                                placeholder="ค้นหา Asset ID, ยี่ห้อ, S/N, หน่วยงาน..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="latest-table-wrap">
                    <table className="latest-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>ลำดับ</th>
                                <th>วันที่</th>
                                <th>หมายเลขครุภัณฑ์</th>
                                <th>ยี่ห้อ / รุ่น</th>
                                <th>S/N</th>
                                <th>หน่วยงาน / อาคาร</th>
                                <th>สถานะ</th>
                                <th>Print</th>
                                 {isAdmin_2 && <th style={{ width: '130px', textAlign: 'center' }}>ลบออกจากฐานข้อมูล</th>}
                                 {isAdmin_2 && <th style={{ width: '100px' }}>คืนสถานะ</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="10" className="latest-empty">กำลังโหลดข้อมูล...</td></tr>
                            ) : filteredStocks.length === 0 ? (
                                <tr><td colSpan="10" className="latest-empty">ไม่พบข้อมูลพัสดุ</td></tr>
                            ) : filteredStocks.map((stock, idx) => (
                                <tr
                                    key={stock.id}
                                    onClick={() => handleRowClick(stock)}
                                    className={`latest-row latest-row--${idx % 2 === 0 ? 'even' : 'odd'}`}
                                    title="คลิกเพื่อดูรายละเอียด"
                                >
                                    <td className="text-center font-semibold text-slate-500" style={{ textAlign: 'center' }}>{idx + 1}</td>
                                    <td>
                                        <div className="latest-date">{stock.importDate}</div>
                                        {stock.timestamp && (
                                            <div className="latest-time">
                                                {new Date(stock.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })} น.
                                            </div>
                                        )}
                                    </td>
                                    <td className="latest-asset-id">{stock.assetId || '—'}</td>
                                    <td className="latest-brand">{stock.brandModel}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{stock.serialNumber}</td>
                                    <td>
                                        <div className="latest-dept">{stock.department}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{stock.building}</div>
                                    </td>
                                    <td>
                                        <span className={`latest-status latest-status--${stock.status === 'รับเข้า' ? 'in' : stock.status === 'จำหน่าย' ? 'out' : 'other'}`}>
                                            {stock.status}
                                        </span>
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                                         <button
                                             className="inv-del-btn"
                                             title="พิมพ์สติกเกอร์"
                                             style={{ color: '#4caf50', borderColor: 'rgba(76,175,80,0.3)' }}
                                             onClick={() => generateExcelLabel(stock)}
                                         >
                                             <FaPrint />
                                         </button>
                                     </td>
                                     {isAdmin_2 && (
                                         <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                                             <button
                                                 className="inv-del-btn"
                                                 title="ลบรายการนี้"
                                                 onClick={(e) => handleDelete(e, stock.id)}
                                             >
                                                 <FaTrash />
                                             </button>
                                         </td>
                                     )}
                                     {isAdmin_2 && (
                                         <td onClick={(e) => e.stopPropagation()}>
                                             {stock.status === 'จำหน่าย' && (
                                                 <button
                                                     className="inv-del-btn"
                                                     title="คืนสถานะเป็น รับเข้า"
                                                     style={{ color: '#4fc3f7', borderColor: 'rgba(79,195,247,0.3)' }}
                                                     onClick={(e) => handleRevertStatus(e, stock.id)}
                                                 >
                                                     <FaUndo />
                                                 </button>
                                             )}
                                         </td>
                                     )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="inv-panel-footer">
                    แสดงทั้งหมด <strong style={{ color: '#f5a623' }}>{filteredStocks.length}</strong> รายการ
                </div>
            </div>


            <ItemDetailModal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                item={selectedItem}
            />

            {/* Floating Back Button */}
            <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 999 }}>
                <Button
                    variant="warning"
                    className="logout-btn-custom border-warning text-dark px-4 shadow-lg"
                    size="md"
                    onClick={() => navigate('/')}
                    style={{ borderRadius: '25px', fontWeight: 'bold' }}
                >
                    <FaHome className="me-2" /> กลับเมนูหลัก
                </Button>
            </div>
        </div >
    );
}
