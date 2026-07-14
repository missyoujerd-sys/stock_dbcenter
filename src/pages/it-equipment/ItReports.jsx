import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, onValue, remove } from 'firebase/database';
import { Card, Nav, Table, Button, Badge } from 'react-bootstrap';
import { FaPrint, FaChartBar, FaBox, FaBuilding, FaExclamationTriangle, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ItReports() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('itlog');
    const [items, setItems] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [itTxList, setItTxList] = useState([]);
    
    useEffect(() => {
        // Fetch Items (for stock and reorder point)
        const itemsRef = ref(db, 'office_items');
        onValue(itemsRef, (snapshot) => {
            const data = snapshot.val();
            const list = [];
            if (data) {
                for (let key in data) {
                    list.push({ id: key, ...data[key] });
                }
            } else {
                // Mock data if db is empty for preview
                list.push(
                    { id: 'IT001', code: 'IT001', name: 'เมาส์', unit: 'อัน', price: 200, reorderPoint: 5, stock: 12 },
                    { id: 'IT002', code: 'IT002', name: 'คีย์บอร์ด', unit: 'อัน', price: 350, reorderPoint: 5, stock: 3 },
                    { id: 'IT003', code: 'IT003', name: 'กระดาษ A4', unit: 'รีม', price: 120, reorderPoint: 10, stock: 50 }
                );
            }
            setItems(list);
        });

        // Fetch Transactions (for daily log and department reports)
        const txRef = ref(db, 'document_lines');
        onValue(txRef, (snapshot) => {
            const data = snapshot.val();
            const list = [];
            if (data) {
                for (let key in data) {
                    list.push({ id: key, ...data[key] });
                }
            }
            setTransactions(list);
        });

        // Fetch Documents
        const docRef = ref(db, 'documents');
        onValue(docRef, (snapshot) => {
            const data = snapshot.val();
            const list = [];
            if (data) {
                for (let key in data) {
                    list.push({ id: key, ...data[key] });
                }
            }
            setDocuments(list);
        });

        // Fetch IT Equipment Transactions (from ItDashboard saves)
        const itTxRef = ref(db, 'it_equipment_tx');
        onValue(itTxRef, (snapshot) => {
            const data = snapshot.val();
            const list = [];
            if (data) {
                for (let key in data) {
                    list.push({ id: key, ...data[key] });
                }
            }
            // Sort by timestamp descending
            list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setItTxList(list);
        });
    }, []);

    const printPage = () => {
        window.print();
    };

    const handleDeleteItem = async (id) => {
        if (window.confirm('คุณต้องการลบรายการวัสดุนี้ออกจากระบบหรือไม่?')) {
            try {
                await remove(ref(db, `office_items/${id}`));
                alert('ลบรายการสำเร็จ');
            } catch (error) {
                console.error("Error deleting item:", error);
                alert('เกิดข้อผิดพลาดในการลบ');
            }
        }
    };

    const handleDeleteTx = async (id) => {
        if (window.confirm('ต้องการลบประวัติการเบิกจ่ายนี้หรือไม่?')) {
            try {
                await remove(ref(db, `it_equipment_tx/${id}`));
                alert('ลบประวัติการเบิกจ่ายสำเร็จ');
            } catch (error) {
                console.error('Error:', error);
                alert('เกิดข้อผิดพลาด');
            }
        }
    };

    // Calculate Stock
    const getStockData = () => {
        return items.map(item => {
            const itemTxs = transactions.filter(tx => tx.itemCode === item.code);
            const totalIssued = itemTxs.reduce((sum, tx) => sum + (Number(tx.qty) || 0), 0);
            const currentStock = (item.stock || 0) - totalIssued;
            return {
                ...item,
                currentStock: currentStock
            };
        });
    };

    // Department Issue Report
    const getDeptData = () => {
        const deptMap = {};
        documents.forEach(doc => {
            if (doc.type === 'ISSUE') {
                const docLines = transactions.filter(tx => tx.docId === doc.id);
                const dept = 'แผนกทั่วไป'; 
                
                if (!deptMap[dept]) deptMap[dept] = [];
                docLines.forEach(line => {
                    deptMap[dept].push({
                        date: doc.docDate,
                        docNo: doc.docNo,
                        itemName: line.itemName,
                        qty: line.qty,
                        total: line.total
                    });
                });
            }
        });
        return deptMap;
    };

    // Join Document and Lines
    const getDailyLog = () => {
        const log = [];
        transactions.forEach(tx => {
            const doc = documents.find(d => d.id === tx.docId);
            if (doc) {
                log.push({
                    date: doc.docDate,
                    docNo: doc.docNo,
                    type: doc.type,
                    itemName: tx.itemName,
                    qty: tx.qty,
                    price: tx.price,
                    total: tx.total
                });
            }
        });
        return log.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const isAdmin = currentUser?.role === 'admin';

    return (
        <div className="container-fluid py-5 report-container" style={{ 
            fontFamily: 'Inter, Prompt, sans-serif', 
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)'
        }}>
            <div className="mx-auto" style={{ maxWidth: '1200px' }}>
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center mb-5 no-print p-4 rounded-4 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary text-white p-3 rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '60px', height: '60px' }}>
                            <FaChartBar size={28} />
                        </div>
                        <div>
                            <h2 className="fw-bold mb-1" style={{ color: '#1e293b', letterSpacing: '-0.5px' }}>
                                ระบบรายงาน
                            </h2>
                            <p className="text-muted mb-0">สรุปข้อมูลเบิกจ่ายและวิเคราะห์คลังสินค้า (Premium Analytics Dashboard)</p>
                        </div>
                    </div>
                    <div className="d-flex gap-3">
                        <Link to="/it-equipment">
                            <Button variant="light" className="rounded-pill px-4 py-2 shadow-sm fw-bold text-secondary d-flex align-items-center gap-2 border-0" style={{ transition: 'all 0.3s' }}>
                                <FaArrowLeft /> กลับหน้าเบิกจ่าย
                            </Button>
                        </Link>
                        <Button className="rounded-pill px-4 py-2 shadow-sm border-0 fw-bold text-white d-flex align-items-center gap-2" 
                                style={{ background: 'linear-gradient(45deg, #3b82f6, #60a5fa)', transition: 'all 0.3s', letterSpacing: '0.5px' }} 
                                onClick={printPage}>
                            <FaPrint /> พิมพ์รายงาน
                        </Button>
                    </div>
                </div>

                {/* Navigation Cards */}
                <Card className="border-0 shadow-lg rounded-4 overflow-hidden mb-5 no-print" style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)' }}>
                    <Card.Header className="bg-transparent border-bottom-0 p-0">
                        <Nav variant="tabs" className="px-3 pt-3 flex-nowrap overflow-auto border-0 gap-2">
                            <Nav.Item>
                                <Nav.Link 
                                    active={activeTab === 'stock'} 
                                    onClick={() => setActiveTab('stock')} 
                                    className={`fw-bold rounded-top-3 px-4 py-3 border-0 transition-all ${activeTab === 'stock' ? 'text-primary bg-white shadow-sm' : 'text-muted hover-bg-light'}`}
                                    style={activeTab === 'stock' ? { borderBottom: '3px solid #3b82f6 !important' } : {}}
                                >
                                    <FaBox className="me-2 mb-1" /> รายงานวัสดุคงเหลือ
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link 
                                    active={activeTab === 'log'} 
                                    onClick={() => setActiveTab('log')} 
                                    className={`fw-bold rounded-top-3 px-4 py-3 border-0 transition-all ${activeTab === 'log' ? 'text-primary bg-white shadow-sm' : 'text-muted hover-bg-light'}`}
                                >
                                    📝 ใบคุมยอด / รายวัน
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link 
                                    active={activeTab === 'dept'} 
                                    onClick={() => setActiveTab('dept')} 
                                    className={`fw-bold rounded-top-3 px-4 py-3 border-0 transition-all ${activeTab === 'dept' ? 'text-primary bg-white shadow-sm' : 'text-muted hover-bg-light'}`}
                                >
                                    <FaBuilding className="me-2 mb-1" /> รายงานแยกตามหน่วยงาน
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link 
                                    active={activeTab === 'reorder'} 
                                    onClick={() => setActiveTab('reorder')} 
                                    className={`fw-bold rounded-top-3 px-4 py-3 border-0 transition-all ${activeTab === 'reorder' ? 'text-danger bg-white shadow-sm' : 'text-muted hover-bg-light'}`}
                                >
                                    <FaExclamationTriangle className="me-2 mb-1" /> วัสดุถึงจุดสั่งซื้อ
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link 
                                    active={activeTab === 'itlog'} 
                                    onClick={() => setActiveTab('itlog')} 
                                    className={`fw-bold rounded-top-3 px-4 py-3 border-0 transition-all ${activeTab === 'itlog' ? 'text-primary bg-white shadow-sm' : 'text-muted hover-bg-light'}`}
                                >
                                    💻 ประวัติเบิกจ่าย IT
                                    {itTxList.length > 0 && (
                                        <Badge bg="primary" className="ms-2 rounded-pill" style={{ fontSize: '0.7rem' }}>{itTxList.length}</Badge>
                                    )}
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Card.Header>
                </Card>

                {/* Content Section */}
                <div className="print-section bg-white p-5 rounded-4 shadow-lg border-0" style={{ position: 'relative' }}>
                    
                    {activeTab === 'itlog' && (
                        <div className="animate-fade-in">
                            <div className="text-center mb-5">
                                <h3 className="fw-bold text-dark print-title" style={{ letterSpacing: '0.5px' }}>💻 ประวัติการเบิกจ่ายวัสดุ IT Equipment</h3>
                                <div style={{ width: '60px', height: '4px', background: 'linear-gradient(90deg, #6366f1, #818cf8)', margin: '0 auto', borderRadius: '2px' }}></div>
                                <p className="text-muted mt-2" style={{ fontSize: '0.9rem' }}>รวบรวมรายการเบิกจ่ายทั้งหมด {itTxList.length} รายการ</p>
                            </div>

                            {itTxList.length === 0 ? (
                                <div className="text-center py-5">
                                    <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>📦</div>
                                    <h5 className="text-muted">ยังไม่มีประวัติการเบิกจ่าย</h5>
                                    <p className="text-muted">เมื่อมีการบันทึกข้อมูลจากหน้าเบิกจ่าย จะแสดงที่นี่โดยอัตโนมัติ</p>
                                </div>
                            ) : (
                                itTxList.map((tx, txIdx) => (
                                    <div key={tx.id} className="mb-4 p-4 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h6 className="fw-bold text-primary mb-1">📄 เลขที่: {tx.docNo}</h6>
                                                <small className="text-muted">วันที่: {tx.requestDate} | ผู้เบิก: <strong>{tx.requester}</strong> | ผู้จ่าย: {tx.dispenser}</small>
                                                {tx.department && <div><small className="text-muted">หน่วยงาน: {tx.department}</small></div>}
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <Badge bg="danger" className="rounded-pill px-3 py-2">เบิกจ่าย OUT</Badge>
                                                {isAdmin && (
                                                    <Button variant="outline-danger" size="sm" className="rounded-circle no-print" style={{ width: '32px', height: '32px', padding: '0' }} onClick={() => handleDeleteTx(tx.id)}>
                                                        <FaTrash size={12} />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        {tx.items && tx.items.length > 0 && (
                                            <Table responsive size="sm" className="align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                                                <thead style={{ background: '#e2e8f0', color: '#475569' }}>
                                                    <tr>
                                                        <th className="py-2 border-0">ลำดับ</th>
                                                        <th className="py-2 border-0">รหัสวัสดุ</th>
                                                        <th className="py-2 border-0">ชื่อวัสดุ</th>
                                                        <th className="py-2 border-0 text-center">หน่วยนับ</th>
                                                        <th className="py-2 border-0 text-end">ราคาต่อหน่วย</th>
                                                        <th className="py-2 border-0 text-end">จำนวนเงิน</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tx.items.map((it, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px dashed #cbd5e1' }}>
                                                            <td className="py-2 text-center text-muted">{i + 1}</td>
                                                            <td className="py-2 text-muted" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{it.code}</td>
                                                            <td className="py-2 fw-bold text-dark">{it.name}</td>
                                                            <td className="py-2 text-center text-muted">{it.unit || 'ชิ้น'}</td>
                                                            <td className="py-2 text-end text-muted">฿{Number(it.unitPrice || 0).toLocaleString()}</td>
                                                            <td className="py-2 text-end fw-bold text-primary">฿{(Number(it.qty || 1) * Number(it.unitPrice || 0)).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr style={{ background: '#f1f5f9' }}>
                                                        <td colSpan="5" className="py-2 text-end fw-bold text-dark">รวมทั้งสิ้น ({tx.items.length} รายการ)</td>
                                                        <td className="py-2 text-end fw-bold text-danger">฿{tx.items.reduce((s, it) => s + (Number(it.qty || 1) * Number(it.unitPrice || 0)), 0).toFixed(2)}</td>
                                                    </tr>
                                                </tfoot>
                                            </Table>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'stock' && (
                        <div className="animate-fade-in">
                            <div className="text-center mb-5">
                                <h3 className="fw-bold text-dark print-title" style={{ letterSpacing: '0.5px' }}>รายงานวัสดุสำนักงานคงเหลือ (Current Stock)</h3>
                                <div style={{ width: '60px', height: '4px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', margin: '0 auto', borderRadius: '2px' }}></div>
                            </div>
                            
                            <Table responsive hover className="align-middle border-light" style={{ fontSize: '0.95rem' }}>
                                <thead style={{ background: '#f8fafc', color: '#475569' }}>
                                    <tr>
                                        <th className="py-3 border-0 rounded-start-2">รหัสวัสดุ</th>
                                        <th className="py-3 border-0">ชื่อวัสดุ</th>
                                        <th className="py-3 border-0 text-center">หน่วยนับ</th>
                                        <th className="py-3 border-0 text-end">ราคาต่อหน่วย</th>
                                        <th className="py-3 border-0 text-end">ยอดคงเหลือ</th>
                                        <th className="py-3 border-0 text-end">มูลค่าคงเหลือ</th>
                                        {isAdmin && <th className="py-3 border-0 text-center text-danger rounded-end-2 no-print">ลบ</th>}
                                    </tr>
                                </thead>
                                <tbody className="border-top-0">
                                    {getStockData().map(item => {
                                        const isLowStock = item.currentStock <= item.reorderPoint;
                                        return (
                                            <tr key={item.id} style={{ transition: 'all 0.2s', borderBottom: '1px solid #f1f5f9' }}>
                                                <td className="py-3 text-muted">{item.code}</td>
                                                <td className="py-3 fw-bold text-dark">
                                                    {item.name}
                                                    {isLowStock && <Badge bg="danger" className="ms-2 rounded-pill shadow-sm">ใกล้หมด!</Badge>}
                                                </td>
                                                <td className="py-3 text-center text-muted">{item.unit}</td>
                                                <td className="py-3 text-end text-muted">฿{Number(item.price).toLocaleString()}</td>
                                                <td className={`py-3 text-end fw-bold ${isLowStock ? 'text-danger' : 'text-primary'}`} style={{ fontSize: '1.1rem' }}>
                                                    {item.currentStock}
                                                </td>
                                                <td className="py-3 text-end text-success fw-bold">฿{(item.currentStock * item.price).toLocaleString()}</td>
                                                {isAdmin && (
                                                    <td className="py-3 text-center no-print">
                                                        <Button variant="outline-danger" size="sm" className="rounded-circle shadow-sm" style={{ width: '32px', height: '32px', padding: '0' }} onClick={() => handleDeleteItem(item.id)}>
                                                            <FaTrash size={12} />
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )}

                    {activeTab === 'log' && (
                        <div className="animate-fade-in">
                            <div className="text-center mb-5">
                                <h3 className="fw-bold text-dark print-title" style={{ letterSpacing: '0.5px' }}>ใบคุมยอดวัสดุสำนักงาน (รายละเอียด รายรับ-รายจ่าย)</h3>
                                <div style={{ width: '60px', height: '4px', background: 'linear-gradient(90deg, #10b981, #34d399)', margin: '0 auto', borderRadius: '2px' }}></div>
                            </div>
                            <Table responsive hover className="align-middle border-light">
                                <thead style={{ background: '#f8fafc', color: '#475569' }}>
                                    <tr>
                                        <th className="py-3 border-0 rounded-start-2">วันที่</th>
                                        <th className="py-3 border-0">เลขที่เอกสาร</th>
                                        <th className="py-3 border-0 text-center">ประเภท</th>
                                        <th className="py-3 border-0">รายการวัสดุ</th>
                                        <th className="py-3 border-0 text-end">จำนวน</th>
                                        <th className="py-3 border-0 text-end rounded-end-2">มูลค่ารวม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getDailyLog().length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-5 text-muted">ไม่มีข้อมูลความเคลื่อนไหว</td></tr>
                                    ) : (
                                        getDailyLog().map((log, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td className="py-3 text-muted">{log.date}</td>
                                                <td className="py-3 text-primary fw-bold">{log.docNo}</td>
                                                <td className="py-3 text-center">
                                                    <span className={`badge px-3 py-2 rounded-pill shadow-sm ${log.type === 'IN' ? 'bg-success' : 'bg-danger'}`}>
                                                        {log.type === 'IN' ? 'รายรับ' : 'รายจ่าย'}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-dark fw-bold">{log.itemName}</td>
                                                <td className={`py-3 text-end fw-bold ${log.type === 'IN' ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.1rem' }}>
                                                    {log.type === 'IN' ? '+' : '-'}{log.qty}
                                                </td>
                                                <td className="py-3 text-end text-muted">฿{Number(log.total).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    )}

                    {activeTab === 'dept' && (
                        <div className="animate-fade-in">
                            <div className="text-center mb-5">
                                <h3 className="fw-bold text-dark print-title" style={{ letterSpacing: '0.5px' }}>รายงานการเบิกวัสดุแยกตามหน่วยงาน</h3>
                                <div style={{ width: '60px', height: '4px', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', margin: '0 auto', borderRadius: '2px' }}></div>
                            </div>
                            {Object.keys(getDeptData()).length === 0 ? (
                                <p className="text-center py-5 text-muted">ไม่มีข้อมูลการเบิกจ่าย</p>
                            ) : (
                                Object.keys(getDeptData()).map(dept => (
                                    <div key={dept} className="mb-5 p-4 rounded-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <h5 className="fw-bold text-primary mb-4 d-flex align-items-center gap-2">
                                            <FaBuilding className="text-warning" /> แผนก: {dept}
                                        </h5>
                                        <Table responsive hover size="sm" className="align-middle">
                                            <thead style={{ color: '#64748b' }}>
                                                <tr>
                                                    <th className="py-2 border-0">วันที่เบิก</th>
                                                    <th className="py-2 border-0">เลขที่เอกสาร</th>
                                                    <th className="py-2 border-0">รายการวัสดุ</th>
                                                    <th className="py-2 border-0 text-end">จำนวนที่เบิก</th>
                                                    <th className="py-2 border-0 text-end">มูลค่ารวม</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getDeptData()[dept].map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px dashed #cbd5e1' }}>
                                                        <td className="py-2 text-muted">{item.date}</td>
                                                        <td className="py-2 text-dark">{item.docNo}</td>
                                                        <td className="py-2 text-dark fw-bold">{item.itemName}</td>
                                                        <td className="py-2 text-end text-primary fw-bold">{item.qty}</td>
                                                        <td className="py-2 text-end text-muted">฿{Number(item.total).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-white shadow-sm rounded-3">
                                                    <td colSpan="3" className="py-3 text-end fw-bold text-dark rounded-start-3">รวมทั้งสิ้น</td>
                                                    <td className="py-3 text-end text-danger fw-bold" style={{ fontSize: '1.2rem' }}>
                                                        {getDeptData()[dept].reduce((sum, i) => sum + Number(i.qty), 0)}
                                                    </td>
                                                    <td className="py-3 text-end text-danger fw-bold rounded-end-3" style={{ fontSize: '1.2rem' }}>
                                                        ฿{getDeptData()[dept].reduce((sum, i) => sum + Number(i.total), 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'reorder' && (
                        <div className="animate-fade-in">
                            <div className="text-center mb-5">
                                <h3 className="fw-bold text-danger print-title" style={{ letterSpacing: '0.5px' }}>รายงานวัสดุถึงจุดสั่งซื้อ (Reorder Point)</h3>
                                <div style={{ width: '60px', height: '4px', background: 'linear-gradient(90deg, #ef4444, #f87171)', margin: '0 auto', borderRadius: '2px' }}></div>
                            </div>
                            <Table responsive hover className="align-middle border-light">
                                <thead style={{ background: '#fef2f2', color: '#991b1b' }}>
                                    <tr>
                                        <th className="py-3 border-0 rounded-start-2">รหัสวัสดุ</th>
                                        <th className="py-3 border-0">ชื่อวัสดุ</th>
                                        <th className="py-3 border-0 text-center">หน่วยนับ</th>
                                        <th className="py-3 border-0 text-end">จุดสั่งซื้อ (Min)</th>
                                        <th className="py-3 border-0 text-end">ยอดคงเหลือปัจจุบัน</th>
                                        <th className="py-3 border-0 text-center rounded-end-2">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getStockData().filter(item => item.currentStock <= item.reorderPoint).length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <div className="d-flex flex-column align-items-center justify-content-center">
                                                    <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '50px', height: '50px' }}>
                                                        <FaBox size={24} />
                                                    </div>
                                                    <h5 className="text-success fw-bold">ไม่มีวัสดุที่ต้องสั่งซื้อเพิ่มเติมในขณะนี้</h5>
                                                    <p className="text-muted">สต๊อกสินค้าทั้งหมดอยู่ในเกณฑ์ปกติ</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        getStockData().filter(item => item.currentStock <= item.reorderPoint).map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #fee2e2', background: '#fffcfc' }}>
                                                <td className="py-3 text-muted">{item.code}</td>
                                                <td className="py-3 fw-bold text-dark">{item.name}</td>
                                                <td className="py-3 text-center text-muted">{item.unit}</td>
                                                <td className="py-3 text-end text-secondary fw-bold">{item.reorderPoint}</td>
                                                <td className="py-3 text-end fw-bold text-danger" style={{ fontSize: '1.2rem' }}>{item.currentStock}</td>
                                                <td className="py-3 text-center">
                                                    <Badge bg="danger" className="px-3 py-2 rounded-pill shadow-sm" style={{ letterSpacing: '0.5px' }}>
                                                        <FaExclamationTriangle className="me-1" /> ต้องสั่งซื้อเพิ่ม
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            <style>
                {`
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .hover-bg-light:hover {
                    background-color: #f8fafc;
                }
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-section, .print-section * {
                        visibility: visible;
                    }
                    .print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0 !important;
                        box-shadow: none !important;
                        background: white !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
                `}
            </style>
        </div>
    );
}
