import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, remove } from 'firebase/database';
import { Table, Card, Row, Col, Badge, Button, Form } from 'react-bootstrap';
import { decryptData } from '../utils/encryption';
import { FaWarehouse, FaSearch, FaHome, FaTruck, FaTrash } from 'react-icons/fa';
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
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.email === 'bunjerd@nkp.com' || currentUser?.email === '' || currentUser?.email === 'koom@nkp.com'; //เพิ่มสิทธิ์ผู้ดูแลระบบ
    console.log(isAdmin);
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
        if (!window.confirm('ต้องการลบรายการนี้ออกจากระบบ?')) return;
        try {
            await remove(ref(db, `stocks/${stockId}`));
        } catch (err) {
            console.error('ลบไม่สำเร็จ:', err);
            alert('เกิดข้อผิดพลาด ไม่สามารถลบรายการได้');
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

                <Button
                    variant="warning"
                    className="logout-btn-custom border-warning text-dark px-4"
                    size="sm"
                    onClick={() => navigate('/')}
                >
                    <FaHome className="me-2" /> กลับเมนูหลัก
                </Button>
            </div>

            <StatusSummaryBar />

            <div className="latest-panel">
                {/* Panel Header */}
                <div className="latest-panel-header">
                    <div className="latest-panel-title-wrap">
                        <div className="latest-panel-dot"></div>
                        <span className="latest-panel-title">ข้อมูลพัสดุในระบบ</span>
                        <span className="latest-panel-badge">INVENTORY DATA</span>
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
                                <th>วันที่</th>
                                <th>หมายเลขครุภัณฑ์</th>
                                <th>ยี่ห้อ / รุ่น</th>
                                <th>S/N</th>
                                <th>หน่วยงาน / อาคาร</th>
                                <th>สถานะ</th>
                                {isAdmin && <th style={{ width: '60px' }}></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="latest-empty">กำลังโหลดข้อมูล...</td></tr>
                            ) : filteredStocks.length === 0 ? (
                                <tr><td colSpan="7" className="latest-empty">ไม่พบข้อมูลพัสดุ</td></tr>
                            ) : filteredStocks.map((stock, idx) => (
                                <tr
                                    key={stock.id}
                                    onClick={() => handleRowClick(stock)}
                                    className={`latest-row latest-row--${idx % 2 === 0 ? 'even' : 'odd'}`}
                                    title="คลิกเพื่อดูรายละเอียด"
                                >
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
                                    {isAdmin && (
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className="inv-del-btn"
                                                title="ลบรายการนี้"
                                                onClick={(e) => handleDelete(e, stock.id)}
                                            >
                                                <FaTrash />
                                            </button>
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
        </div >
    );
}
