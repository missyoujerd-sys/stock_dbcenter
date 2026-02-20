import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Table, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { decryptData } from '../utils/encryption';
import { useNavigate, Link } from 'react-router-dom';
import {
    FaWarehouse, FaBox, FaCheckCircle,
    FaFileImport, FaFileExport, FaListAlt, FaArrowCircleRight
} from 'react-icons/fa';
import ItemDetailModal from '../components/ItemDetailModal';
import logoSvg from '../assets/logo.svg';
import emblemSvg from '../assets/emblem.svg';
import qmIncomingSvg from '../assets/qm-incoming.svg';
import qmDistributionSvg from '../assets/qm-distribution.svg';
import qmInventorySvg from '../assets/qm-inventory.svg';

export default function Dashboard() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

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

    return (
        <div>
            {/* ── Hero Banner ── */}
            <div className="db-hero-banner mb-4">
                {/* Decorative emblem */}
                <img src={emblemSvg} alt="emblem" className="db-hero-emblem" />

                {/* Title block */}
                <div className="db-hero-title-block">
                    <div className="db-hero-logo-wrap">
                        <img src={logoSvg} alt="logo" className="db-hero-logo" />
                    </div>
                    <div>
                        <div className="db-hero-org">กลุ่มงานเทคโนโลยีสารสนเทศ · ฝ่ายดูแลพัสดุอุปกรณ์ครุภัณฑ์รอจำหน่าย</div>
                        <h1 className="db-hero-title">ภาพรวมระบบ</h1>
                        <div className="db-hero-sub">STOCK MANAGEMENT DASHBOARD</div>
                    </div>
                </div>

                {/* Stat chips */}
                <div className="db-hero-chips">
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
                        <div className="qm-illu-wrap">
                            <img src={qmIncomingSvg} alt="incoming" className="qm-illu-img" />
                        </div>
                        <div className="qm-card-inner">
                            <div className="qm-body">
                                <div className="qm-label">รับพัสดุรอจำหน่ายเข้าระบบ</div>
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
                        <div className="qm-illu-wrap">
                            <img src={qmDistributionSvg} alt="distribution" className="qm-illu-img" />
                        </div>
                        <div className="qm-card-inner">
                            <div className="qm-body">
                                <div className="qm-label">รายการพัสดุรอจำหน่าย</div>
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
                        <div className="qm-illu-wrap">
                            <img src={qmInventorySvg} alt="inventory" className="qm-illu-img" />
                        </div>
                        <div className="qm-card-inner">
                            <div className="qm-body">
                                <div className="qm-label">ข้อมูลพัสดุในระบบทั้งหมด</div>
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

            <div className="section-header-container mt-2">
                <div className="section-accent"></div>
                <h4 className="section-title-text">
                    รายการพัสดุล่าสุด
                    <span className="section-title-badge">LATEST ITEMS</span>
                </h4>
            </div>
            <div className="latest-panel">
                <div className="latest-panel-header">
                    <div className="latest-panel-title-wrap">
                        <div className="latest-panel-dot"></div>
                        <span className="latest-panel-title">รายการพัสดุล่าสุด</span>
                        <span className="latest-panel-badge">LATEST ITEMS</span>
                    </div>
                    <span className="latest-panel-count">{loading ? '...' : `${stocks.slice(0, 10).length} รายการ`}</span>
                </div>
                <div className="latest-table-wrap">
                    <table className="latest-table">
                        <thead>
                            <tr>
                                <th>วันที่</th>
                                <th>หมายเลขครุภัณฑ์</th>
                                <th>ยี่ห้อ / รุ่น</th>
                                <th>หน่วยงาน</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="latest-empty">กำลังโหลดข้อมูล...</td></tr>
                            ) : stocks.length === 0 ? (
                                <tr><td colSpan="5" className="latest-empty">ยังไม่มีข้อมูลพัสดุในระบบ</td></tr>
                            ) : stocks.slice(0, 10).map((stock, idx) => (
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
                                    <td className="latest-dept">{stock.department}</td>
                                    <td>
                                        <span className={`latest-status latest-status--${stock.status === 'รับเข้า' ? 'in' : stock.status === 'จำหน่าย' ? 'out' : 'other'}`}>
                                            {stock.status}
                                        </span>
                                    </td>
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
        </div>
    );
}
