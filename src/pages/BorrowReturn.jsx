import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, update, push, set, remove } from 'firebase/database';
import { Table, Button, Form, Modal, Alert, Nav, Tab, Badge, Card, Row, Col } from 'react-bootstrap';
import { decryptData, encryptData } from '../utils/encryption';
import { useAuth } from '../contexts/AuthContext';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ArrowLeftRight, Download, History, Search, Handshake, CornerDownRight, CornerUpLeft, FileSpreadsheet, PlusCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

export default function BorrowReturn() {
    const { currentUser, isAdmin_2 } = useAuth();
    const navigate = useNavigate();

    // Data states
    const [borrowItems, setBorrowItems] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI states
    const [activeTab, setActiveTab] = useState('borrow');
    const [searchTerms, setSearchTerms] = useState({ borrow: '', return: '', history: '' });
    const [exportYear, setExportYear] = useState((new Date().getFullYear() + 543).toString());

    // Action states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBorrowModal, setShowBorrowModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // Form states
    const [newItemData, setNewItemData] = useState({
        assetId: '',
        brandModel: '',
        serialNumber: '',
        department: ''
    });
    
    const [formData, setFormData] = useState({
        borrowerName: '',
        borrowDate: new Date().toISOString().split('T')[0],
        returnerName: '',
        returnDate: new Date().toISOString().split('T')[0],
        remarks: ''
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        // Now fetching from the dedicated borrow_items collection
        const itemsRef = ref(db, 'borrow_items');
        const txRef = ref(db, 'borrow_transactions');

        let loadedItems = false;
        let loadedTx = false;

        const unsubItems = onValue(itemsRef, (snapshot) => {
            const data = snapshot.val();
            const temp = [];
            if (data) {
                for (const key in data) {
                    const item = data[key];
                    temp.push({
                        id: key,
                        ...item,
                        department: decryptData(item.department),
                        serialNumber: item.serialNumber ? decryptData(item.serialNumber) : '-',
                        assetId: decryptData(item.assetId),
                        brandModel: decryptData(item.brandModel),
                    });
                }
            }
            temp.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setBorrowItems(temp);
            loadedItems = true;
            if (loadedTx) setLoading(false);
        });

        const unsubTx = onValue(txRef, (snapshot) => {
            const data = snapshot.val();
            const temp = [];
            if (data) {
                for (const key in data) {
                    const item = data[key];
                    temp.push({
                        id: key,
                        ...item,
                        assetId: decryptData(item.assetId),
                        brandModel: decryptData(item.brandModel),
                        borrowerName: decryptData(item.borrowerName),
                        returnerName: item.returnerName ? decryptData(item.returnerName) : '',
                        remarks: item.remarks ? decryptData(item.remarks) : ''
                    });
                }
            }
            temp.sort((a, b) => b.timestamp - a.timestamp); // newest first
            setTransactions(temp);
            loadedTx = true;
            if (loadedItems) setLoading(false);
        });

        return () => {
            unsubItems();
            unsubTx();
        };
    }, []);

    // -------- Handlers -------- //

    const handleSearchChange = (tab, value) => {
        setSearchTerms(prev => ({ ...prev, [tab]: value }));
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFormError('');
    };

    const handleNewItemChange = (field, value) => {
        setNewItemData(prev => ({ ...prev, [field]: value }));
        setFormError('');
    };

    const confirmAddItem = async () => {
        if (!newItemData.assetId.trim() || !newItemData.brandModel.trim()) {
            setFormError('กรุณาระบุหมายเลขครุภัณฑ์และยี่ห้อ/รุ่น');
            return;
        }

        try {
            const newRef = push(ref(db, 'borrow_items'));
            await set(newRef, {
                assetId: encryptData(newItemData.assetId),
                brandModel: encryptData(newItemData.brandModel),
                serialNumber: encryptData(newItemData.serialNumber || '-'),
                department: encryptData(newItemData.department || '-'),
                status: 'available', // initial status
                importDate: new Date().toISOString().split('T')[0],
                timestamp: Date.now(),
                recordedBy: encryptData(currentUser.email)
            });
            setShowAddModal(false);
            setNewItemData({ assetId: '', brandModel: '', serialNumber: '', department: '' });
        } catch (err) {
            console.error(err);
            setFormError('เกิดข้อผิดพลาด ไม่สามารถเพิ่มพัสดุได้');
        }
    };

    const removeBorrowItem = async (id) => {
        if (!isAdmin_2) {
            alert('ลบได้เฉพาะ Admin เท่านั้น');
            return;
        }
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้ออกจากระบบยืม-คืน? (ประวัติการยืมในอดีตจะยังคงอยู่)')) {
            try {
                await remove(ref(db, `borrow_items/${id}`));
            } catch (err) {
                console.error(err);
                alert('ลบไม่สำเร็จ');
            }
        }
    };

    const openBorrow = (item) => {
        setSelectedItem(item);
        setFormData({
            ...formData,
            borrowerName: '',
            borrowDate: new Date().toISOString().split('T')[0],
            remarks: ''
        });
        setFormError('');
        setShowBorrowModal(true);
    };

    const confirmBorrow = async () => {
        if (!formData.borrowerName.trim()) {
            setFormError('กรุณาระบุชื่อผู้ยืม');
            return;
        }

        try {
            // Create transaction tracking reference
            const txRef = push(ref(db, 'borrow_transactions'));
            
            await set(txRef, {
                itemId: selectedItem.id,
                assetId: encryptData(selectedItem.assetId),
                brandModel: encryptData(selectedItem.brandModel),
                borrowDate: formData.borrowDate,
                borrowerName: encryptData(formData.borrowerName),
                remarks: encryptData(formData.remarks),
                status: 'borrowed', // borrowed | returned
                recordedBy: encryptData(currentUser.email),
                timestamp: Date.now()
            });

            // Update item status in the dedicated borrow_items collection
            const itemRef = ref(db, `borrow_items/${selectedItem.id}`);
            await update(itemRef, {
                status: 'borrowed',
                currentTxId: txRef.key
            });

            setShowBorrowModal(false);
        } catch (err) {
            console.error(err);
            setFormError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const openReturn = (item) => {
        // Find the active transaction to auto-fill the returner name suggestion
        const activeTx = transactions.find(t => t.id === item.currentTxId);
        
        setSelectedItem(item);
        setSelectedTransaction(activeTx);
        
        setFormData({
            ...formData,
            returnerName: activeTx ? activeTx.borrowerName : '',
            returnDate: new Date().toISOString().split('T')[0],
            remarks: ''
        });
        setFormError('');
        setShowReturnModal(true);
    };

    const confirmReturn = async () => {
        if (!formData.returnerName.trim()) {
            setFormError('กรุณาระบุชื่อผู้คืน');
            return;
        }

        try {
            if (selectedTransaction) {
                const txRef = ref(db, `borrow_transactions/${selectedTransaction.id}`);
                
                // Keep old remarks, append new ones if any
                const existingRemarksDec = selectedTransaction.remarks || '';
                const combinedRemarks = [existingRemarksDec, formData.remarks].filter(Boolean).join(' | คืน: ');

                await update(txRef, {
                    returnDate: formData.returnDate,
                    returnerName: encryptData(formData.returnerName),
                    remarks: encryptData(combinedRemarks),
                    status: 'returned',
                    returnRecordedBy: encryptData(currentUser.email)
                });
            }

            // Restore status to available in the dedicated borrow_items table
            const itemRef = ref(db, `borrow_items/${selectedItem.id}`);
            await update(itemRef, {
                status: 'available',
                currentTxId: null
            });

            setShowReturnModal(false);
        } catch (err) {
            console.error(err);
            setFormError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    // -------- Excel Export -------- //
    const formatThaiDateStr = (isoDate) => {
        if (!isoDate) return '';
        const [y, m, d] = isoDate.split('-');
        return `${d}/${m}/${parseInt(y)+543}`;
    };

    const generateLedgerExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'StockDBCenter';
        const ws = workbook.addWorksheet('ทะเบียนยืม-คืน');

        ws.pageSetup = {
            paperSize: 9, orientation: 'landscape',
            fitToPage: true, fitToWidth: 1, fitToHeight: 0,
            margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
        };

        const FN = 'TH SarabunPSK';
        const TN = { style: 'thin', color: { argb: 'FF000000' } };
        const AB = { top: TN, bottom: TN, left: TN, right: TN };

        const sc = (addr, val, { font = {}, align = {}, border } = {}) => {
            const c = ws.getCell(addr);
            c.value = val;
            c.font = { name: FN, size: 14, ...font };
            c.alignment = { vertical: 'middle', wrapText: true, ...align };
            c.border = border || AB;
        };

        const mc = (range, val, opts = {}) => {
            ws.mergeCells(range);
            sc(range.split(':')[0], val, opts);
            const COLS = ['A','B','C','D','E','F','G','H','I'];
            const [start, end] = range.split(':');
            const sc1 = start.replace(/[0-9]/g, '');
            const sr1 = parseInt(start.replace(/[A-Z]/gi, ''));
            const ec1 = end.replace(/[0-9]/g, '');
            const er1 = parseInt(end.replace(/[A-Z]/gi, ''));
            const ci1 = COLS.indexOf(sc1);
            const ci2 = COLS.indexOf(ec1);
            for (let r = sr1; r <= er1; r++) {
                for (let ci = ci1; ci <= ci2; ci++) {
                    ws.getCell(`${COLS[ci]}${r}`).border = AB;
                }
            }
        };

        ws.columns = [
            { width: 8  }, { width: 35 }, { width: 25 }, { width: 10 }, { width: 15 }, 
            { width: 25 }, { width: 15 }, { width: 25 }, { width: 25 }
        ];

        ws.getRow(1).height = 30;
        mc('A1:I1', 'ทะเบียนคุมการยืมใช้พัสดุ', { font: { bold: true, size: 20 }, align: { horizontal: 'center' }, border: {} });
        
        ws.getRow(2).height = 25;
        mc('A2:I2', `ประจำปีงบประมาณ...................${exportYear}....................`, { font: { size: 16 }, align: { horizontal: 'center' }, border: {} });

        ws.getRow(3).height = 10;
        for (let idx of [1,2,3,4,5,6,7,8,9]) ws.getCell(3, idx).border = {};

        ws.getRow(4).height = 25;
        ws.getRow(5).height = 25;
        const headerFont = { bold: true, size: 14 };
        const headerAlign = { horizontal: 'center' };

        mc('A4:A5', 'ลำดับที่', { font: headerFont, align: headerAlign });
        mc('B4:B5', 'รายการ', { font: headerFont, align: headerAlign });
        mc('C4:C5', 'หมายเลขครุภัณฑ์', { font: headerFont, align: headerAlign });
        mc('D4:D5', 'จำนวน', { font: headerFont, align: headerAlign });
        
        mc('E4:F4', 'ยืม', { font: headerFont, align: headerAlign });
        sc('E5', 'วันที่ยืม', { font: headerFont, align: headerAlign });
        sc('F5', 'ชื่อผู้ยืม', { font: headerFont, align: headerAlign });

        mc('G4:H4', 'คืน', { font: headerFont, align: headerAlign });
        sc('G5', 'วันที่คืน', { font: headerFont, align: headerAlign });
        sc('H5', 'ชื่อผู้คืน', { font: headerFont, align: headerAlign });

        mc('I4:I5', 'หมายเหตุ', { font: headerFont, align: headerAlign });

        const exportData = transactions.slice().reverse(); 

        let startRow = 6;
        exportData.forEach((tx, idx) => {
            const r = startRow + idx;
            ws.getRow(r).height = 30;

            sc(`A${r}`, idx + 1, { align: { horizontal: 'center' } });
            sc(`B${r}`, tx.brandModel || '-', { align: { horizontal: 'left' } });
            sc(`C${r}`, tx.assetId || '-', { align: { horizontal: 'center' } });
            sc(`D${r}`, 1, { align: { horizontal: 'center' } });
            
            sc(`E${r}`, formatThaiDateStr(tx.borrowDate) || '', { align: { horizontal: 'center' } });
            sc(`F${r}`, tx.borrowerName || '', { align: { horizontal: 'left' } });
            
            sc(`G${r}`, formatThaiDateStr(tx.returnDate) || '', { align: { horizontal: 'center' } });
            sc(`H${r}`, tx.returnerName || '', { align: { horizontal: 'left' } });
            
            sc(`I${r}`, tx.remarks || '', { align: { horizontal: 'left' } });
        });

        const emptyRows = Math.max(0, 15 - exportData.length);
        for (let i = 0; i < emptyRows; i++) {
            const r = startRow + exportData.length + i;
            ws.getRow(r).height = 30;
            ['A','B','C','D','E','F','G','H','I'].forEach(col => {
                sc(`${col}${r}`, '', { align: { horizontal: 'center' } });
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `ทะเบียนคุมการยืมใช้พัสดุ_${exportYear}.xlsx`);
    };

    // -------- Filter Data -------- //
    
    // Available for borrow: only "available" inside the isolated borrow_items
    const availableItems = borrowItems.filter(s => s.status === 'available' && (
        s.assetId.toLowerCase().includes(searchTerms.borrow.toLowerCase()) || 
        s.brandModel.toLowerCase().includes(searchTerms.borrow.toLowerCase()) ||
        s.serialNumber.toLowerCase().includes(searchTerms.borrow.toLowerCase())
    ));

    // Currently borrowed out: "borrowed"
    const borrowedItems = borrowItems.filter(s => s.status === 'borrowed' && (
        s.assetId.toLowerCase().includes(searchTerms.return.toLowerCase()) || 
        s.brandModel.toLowerCase().includes(searchTerms.return.toLowerCase()) ||
        s.serialNumber.toLowerCase().includes(searchTerms.return.toLowerCase())
    ));

    // Transaction history
    const historyData = transactions.filter(t => 
        t.assetId.toLowerCase().includes(searchTerms.history.toLowerCase()) || 
        t.borrowerName.toLowerCase().includes(searchTerms.history.toLowerCase()) ||
        t.brandModel.toLowerCase().includes(searchTerms.history.toLowerCase())
    );

    return (
        <div className="container-fluid py-2">
            <div className="page-header-container d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="page-title-badge">
                    <div className="page-icon-box" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <ArrowLeftRight className="text-white" />
                    </div>
                    <h2 className="page-title-text">
                        ทะเบียน ยืม-คืนพัสดุ <small>(Borrow/Return System)</small>
                    </h2>
                </div>
                <div>
                     <Button variant="outline-secondary" className="bg-white" onClick={() => navigate('/')}>
                         <FaHome className="me-2" /> กลับหน้าหลัก
                     </Button>
                </div>
            </div>

            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden mt-4">
                    <Card.Header className="bg-white border-bottom border-light pt-3 pb-0 px-4">
                        <Nav variant="tabs" className="border-0 custom-tabs">
                            <Nav.Item>
                                <Nav.Link eventKey="borrow" className="fw-semibold d-flex align-items-center gap-2">
                                    <CornerDownRight size={18} /> ยืมพัสดุ (Borrow)
                                    <Badge bg="primary" pill className="ms-2 opacity-75">{availableItems.length}</Badge>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="return" className="fw-semibold d-flex align-items-center gap-2">
                                    <CornerUpLeft size={18} /> คืนพัสดุ (Return)
                                    <Badge bg="warning" text="dark" pill className="ms-2 opacity-75">{borrowedItems.length}</Badge>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="history" className="fw-semibold d-flex align-items-center gap-2">
                                    <History size={18} /> ประวัติการยืม-คืน (History)
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Card.Header>

                    <Card.Body className="p-0 bg-light">
                        <Tab.Content>
                            
                            {/* --------- TAB: BORROW --------- */}
                            <Tab.Pane eventKey="borrow">
                                <div className="p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <h5 className="mb-0 fw-bold border-start border-4 border-primary ps-3">รายการพัสดุที่สามารถยืมได้</h5>
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm" 
                                                className="d-flex align-items-center gap-2 rounded-pill shadow-sm bg-white"
                                                onClick={() => setShowAddModal(true)}
                                            >
                                                <PlusCircle size={16} /> เพิ่มพัสดุสำหรับให้ยืม
                                            </Button>
                                        </div>
                                        <div className="inv-search-wrap" style={{ minWidth: '300px' }}>
                                            <Search className="inv-search-icon" size={16} />
                                            <input
                                                type="text"
                                                className="inv-search-input py-2"
                                                placeholder="ค้นหาครุภัณฑ์, รุ่น, S/N..."
                                                value={searchTerms.borrow}
                                                onChange={(e) => handleSearchChange('borrow', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="table-responsive rounded-3 shadow-sm bg-white" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                        <Table hover className="mb-0 align-middle custom-hover-table text-nowrap">
                                            <thead className="sticky-top bg-white shadow-sm" style={{ zIndex: 10 }}>
                                                <tr>
                                                    <th>วันที่บันทึก (รับเข้า)</th>
                                                    <th>หมายเลขครุภัณฑ์</th>
                                                    <th>ยี่ห้อ / รุ่น</th>
                                                    <th>S/N</th>
                                                    <th>หน่วยงาน (เดิม)</th>
                                                    <th className="text-center">จัดการ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr><td colSpan="6" className="text-center text-muted py-5">กำลังโหลดข้อมูล...</td></tr>
                                                ) : availableItems.length === 0 ? (
                                                    <tr><td colSpan="6" className="text-center text-muted py-5">รายการจะว่างเปล่า จนกว่าคุณจะกด "เพิ่มพัสดุสำหรับให้ยืม" จากปุ่มด้านบน</td></tr>
                                                ) : (
                                                    availableItems.map((item) => (
                                                        <tr key={item.id} style={{ transition: 'all 0.2s ease' }}>
                                                            <td className="text-muted">{item.importDate}</td>
                                                            <td className="fw-bold">{item.assetId || '—'}</td>
                                                            <td className="text-primary">{item.brandModel}</td>
                                                            <td className="text-secondary font-monospace" style={{ fontSize: '0.85rem' }}>{item.serialNumber}</td>
                                                            <td>{item.department}</td>
                                                            <td className="text-center">
                                                                <div className="d-flex justify-content-center align-items-center gap-2">
                                                                    <Button variant="primary" size="sm" className="px-3 rounded-pill d-flex align-items-center gap-2" onClick={() => openBorrow(item)} style={{ boxShadow: '0 4px 6px rgba(13, 110, 253, 0.15)' }}>
                                                                        <Handshake size={14} /> ทำเรื่องยืม
                                                                    </Button>
                                                                    {isAdmin_2 && (
                                                                        <Button variant="outline-danger" size="sm" className="rounded-circle p-1" style={{ width: '32px', height: '32px' }} onClick={() => removeBorrowItem(item.id)} title="ลบพัสดุนี้ออกจากระบบยืม-คืน">
                                                                            <Trash2 size={16} />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            </Tab.Pane>

                            {/* --------- TAB: RETURN --------- */}
                            <Tab.Pane eventKey="return">
                                <div className="p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0 fw-bold border-start border-4 border-warning ps-3">รายการพัสดุที่ถูกยืมไป</h5>
                                        <div className="inv-search-wrap" style={{ minWidth: '300px' }}>
                                            <Search className="inv-search-icon" size={16} />
                                            <input
                                                type="text"
                                                className="inv-search-input py-2"
                                                placeholder="ค้นหาครุภัณฑ์, รุ่น, S/N..."
                                                value={searchTerms.return}
                                                onChange={(e) => handleSearchChange('return', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="table-responsive rounded-3 shadow-sm bg-white" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                        <Table hover className="mb-0 align-middle custom-hover-table text-nowrap">
                                            <thead className="sticky-top bg-white shadow-sm" style={{ zIndex: 10 }}>
                                                <tr>
                                                    <th>หมายเลขครุภัณฑ์</th>
                                                    <th>ยี่ห้อ / รุ่น</th>
                                                    <th>ผู้ยืมปัจจุบัน</th>
                                                    <th>วันที่ยืม</th>
                                                    <th className="text-center">จัดการ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr><td colSpan="5" className="text-center text-muted py-5">กำลังโหลดข้อมูล...</td></tr>
                                                ) : borrowedItems.length === 0 ? (
                                                    <tr><td colSpan="5" className="text-center text-muted py-5">ไม่มีพัสดุที่ถูกยืมในขณะนี้</td></tr>
                                                ) : (
                                                    borrowedItems.map((item) => {
                                                        const activeTx = transactions.find(t => t.id === item.currentTxId);
                                                        return (
                                                            <tr key={item.id}>
                                                                <td className="fw-bold">{item.assetId || '—'}</td>
                                                                <td className="text-primary">{item.brandModel}</td>
                                                                <td>
                                                                    {activeTx ? (
                                                                        <div className="d-flex flex-column">
                                                                            <span className="fw-semibold text-dark">{activeTx.borrowerName}</span>
                                                                        </div>
                                                                    ) : <span className="text-muted fst-italic">ไม่พบข้อมูลผู้ยืม</span>}
                                                                </td>
                                                                <td className="text-muted">{activeTx ? formatThaiDateStr(activeTx.borrowDate) : '-'}</td>
                                                                <td className="text-center">
                                                                    <Button variant="warning" size="sm" className="px-3 rounded-pill d-flex align-items-center gap-2 mx-auto text-dark" onClick={() => openReturn(item)} style={{ boxShadow: '0 4px 6px rgba(255, 193, 7, 0.2)' }}>
                                                                        <CornerUpLeft size={14} /> ทำเรื่องรับคืน
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            </Tab.Pane>

                            {/* --------- TAB: HISTORY --------- */}
                            <Tab.Pane eventKey="history">
                                <div className="p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3 bg-white p-3 rounded-4 shadow-sm">
                                        <div className="d-flex align-items-center gap-4">
                                           <h5 className="mb-0 fw-bold border-start border-4 border-info ps-3">ประวัติการยืม-คืน</h5>
                                           <div className="d-flex align-items-center gap-2">
                                                <span className="text-muted fw-semibold" style={{ fontSize: '0.9rem' }}>พิมพ์แบบฟอร์มปีงบประมาณ:</span>
                                                <Form.Control 
                                                    type="text" 
                                                    value={exportYear} 
                                                    onChange={(e) => setExportYear(e.target.value)} 
                                                    style={{ width: '80px', textAlign: 'center' }} 
                                                    size="sm"
                                                />
                                                <Button 
                                                    variant="success" 
                                                    size="sm" 
                                                    className="d-flex align-items-center gap-2 px-3 ms-2"
                                                    onClick={generateLedgerExcel}
                                                >
                                                    <FileSpreadsheet size={16} /> ออกรายงาน Excel (พ.3101)
                                                </Button>
                                           </div>
                                        </div>
                                        <div className="inv-search-wrap" style={{ minWidth: '250px' }}>
                                            <Search className="inv-search-icon" size={16} />
                                            <input
                                                type="text"
                                                className="inv-search-input py-2"
                                                placeholder="ค้นหาประวัติ..."
                                                value={searchTerms.history}
                                                onChange={(e) => handleSearchChange('history', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="table-responsive rounded-3 shadow-sm bg-white" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                                        <Table hover bordered className="mb-0 align-middle custom-hover-table text-nowrap" style={{ fontSize: '0.9rem' }}>
                                            <thead className="bg-light sticky-top" style={{ zIndex: 10 }}>
                                                <tr>
                                                    <th className="bg-light align-middle text-center" rowSpan={2} style={{ width: '50px' }}>สถานะ</th>
                                                    <th className="bg-light align-middle" rowSpan={2}>รายการ / ครุภัณฑ์</th>
                                                    <th className="text-center" colSpan={2} style={{ backgroundColor: '#e0f2fe' }}>ข้อมูลการยืม</th>
                                                    <th className="text-center" colSpan={2} style={{ backgroundColor: '#fef3c7' }}>ข้อมูลการคืน</th>
                                                </tr>
                                                <tr>
                                                    <th className="text-center border-top-0" style={{ backgroundColor: '#f0f9ff' }}>ผู้ยืม</th>
                                                    <th className="text-center border-top-0" style={{ backgroundColor: '#f0f9ff' }}>วันที่ยืม</th>
                                                    <th className="text-center border-top-0" style={{ backgroundColor: '#fffbeb' }}>ผู้คืน</th>
                                                    <th className="text-center border-top-0" style={{ backgroundColor: '#fffbeb' }}>วันที่คืน</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr><td colSpan="6" className="text-center text-muted py-5">กำลังโหลดข้อมูล...</td></tr>
                                                ) : historyData.length === 0 ? (
                                                    <tr><td colSpan="6" className="text-center text-muted py-5">ไม่มีประวัติการทำรายการ</td></tr>
                                                ) : (
                                                    historyData.map((tx) => (
                                                        <tr key={tx.id}>
                                                            <td className="text-center">
                                                                {tx.status === 'borrowed' ? (
                                                                    <Badge bg="warning" text="dark" className="rounded-pill">กำลังยืม</Badge>
                                                                ) : (
                                                                    <Badge bg="success" className="rounded-pill">คืนแล้ว</Badge>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="fw-bold">{tx.assetId}</div>
                                                                <div className="text-muted text-truncate" style={{ maxWidth: '250px', fontSize: '0.8rem' }}>{tx.brandModel}</div>
                                                            </td>
                                                            <td className="text-center">{tx.borrowerName}</td>
                                                            <td className="text-center text-muted">{formatThaiDateStr(tx.borrowDate)}</td>
                                                            <td className="text-center">{tx.returnerName || '-'}</td>
                                                            <td className="text-center text-muted">{tx.returnDate ? formatThaiDateStr(tx.returnDate) : '-'}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            </Tab.Pane>
                        </Tab.Content>
                    </Card.Body>
                </Card>
            </Tab.Container>

            {/* --------- MODAL: ADD ITEM --------- */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered className="custom-modal">
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                    <Modal.Title className="fw-bold text-success d-flex align-items-center gap-2">
                        <div className="bg-success bg-opacity-10 p-2 rounded-circle">
                            <PlusCircle size={20} />
                        </div>
                        เพิ่มพัสดุสำหรับระบบยืม-คืน
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {formError && <Alert variant="danger" className="py-2 border-0 rounded-3 shadow-sm">{formError}</Alert>}
                    
                    <Alert variant="info" className="py-2 border-0 rounded-3 small">
                        พัสดุที่เพิ่มที่นี่ จะถูกแยกข้อมูลออกจากคลังพัสดุหลัก เพื่อใช้ในระบบบันทึกผลการยืม-คืนเท่านั้น
                    </Alert>

                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">หมายเลขครุภัณฑ์ <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                                type="text" 
                                value={newItemData.assetId} 
                                onChange={(e) => handleNewItemChange('assetId', e.target.value)} 
                                placeholder="ระบุหมายเลขครุภัณฑ์" 
                                className="py-2 rounded-3 shadow-none border-secondary-subtle focus-ring-success"
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">รายการ / ยี่ห้อ / รุ่น <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                                type="text" 
                                value={newItemData.brandModel} 
                                onChange={(e) => handleNewItemChange('brandModel', e.target.value)} 
                                placeholder="เช่น จอคอมพิวเตอร์ Acer, Notebook HP" 
                                className="py-2 rounded-3 shadow-none border-secondary-subtle focus-ring-success"
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">Serial Number (S/N)</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={newItemData.serialNumber} 
                                        onChange={(e) => handleNewItemChange('serialNumber', e.target.value)} 
                                        placeholder="ถ้ามี" 
                                        className="py-2 rounded-3 shadow-none border-secondary-subtle focus-ring-success"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">หน่วยงาน</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={newItemData.department} 
                                        onChange={(e) => handleNewItemChange('department', e.target.value)} 
                                        placeholder="ถ้ามี" 
                                        className="py-2 rounded-3 shadow-none border-secondary-subtle focus-ring-success"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-top-0 pt-0">
                    <Button variant="light" onClick={() => setShowAddModal(false)} className="rounded-pill px-4">ยกเลิก</Button>
                    <Button variant="success" onClick={confirmAddItem} className="rounded-pill px-4 shadow-sm border-0 d-flex align-items-center gap-2">
                         <PlusCircle size={16} /> บันทึกและเพิ่มรายการ
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* --------- MODAL: BORROW --------- */}
            <Modal show={showBorrowModal} onHide={() => setShowBorrowModal(false)} centered className="custom-modal">
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                    <Modal.Title className="fw-bold text-primary d-flex align-items-center gap-2">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                            <CornerDownRight size={20} />
                        </div>
                        บันทึกการยืมพัสดุ
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {formError && <Alert variant="danger" className="py-2 border-0 rounded-3 shadow-sm">{formError}</Alert>}
                    
                    {selectedItem && (
                        <div className="bg-light p-3 rounded-4 mb-4 border d-flex gap-3 align-items-center shadow-sm">
                            <div className="flex-grow-1 min-w-0">
                                <h6 className="fw-bold mb-1 text-truncate">{selectedItem.assetId}</h6>
                                <p className="mb-0 text-muted small text-truncate">{selectedItem.brandModel}</p>
                            </div>
                        </div>
                    )}

                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">ชื่อผู้ยืม (Borrower Name) <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                                type="text" 
                                value={formData.borrowerName} 
                                onChange={(e) => handleFormChange('borrowerName', e.target.value)} 
                                placeholder="ระบุชื่อ-นามสกุล ผู้ยืม" 
                                className="py-2 rounded-3 shadow-none border-secondary-subtle focus-ring-primary"
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">วันที่ยืม (Borrow Date) <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                                type="date" 
                                value={formData.borrowDate} 
                                onChange={(e) => handleFormChange('borrowDate', e.target.value)} 
                                className="py-2 rounded-3 shadow-none border-secondary-subtle"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">หมายเหตุยืม (Remarks)</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={2} 
                                value={formData.remarks} 
                                onChange={(e) => handleFormChange('remarks', e.target.value)} 
                                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                                className="rounded-3 shadow-none border-secondary-subtle"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-top-0 pt-0">
                    <Button variant="light" onClick={() => setShowBorrowModal(false)} className="rounded-pill px-4">ยกเลิก</Button>
                    <Button variant="primary" onClick={confirmBorrow} className="rounded-pill px-4 shadow-sm border-0 bg-primary">ยืนยันการยืม</Button>
                </Modal.Footer>
            </Modal>

            {/* --------- MODAL: RETURN --------- */}
            <Modal show={showReturnModal} onHide={() => setShowReturnModal(false)} centered className="custom-modal">
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                    <Modal.Title className="fw-bold text-warning d-flex align-items-center gap-2">
                        <div className="bg-warning bg-opacity-10 p-2 rounded-circle text-warning">
                            <CornerUpLeft size={20} />
                        </div>
                        บันทึกการคืนพัสดุ
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {formError && <Alert variant="danger" className="py-2 border-0 rounded-3 shadow-sm">{formError}</Alert>}
                    
                    {selectedItem && (
                        <div className="bg-warning bg-opacity-10 p-3 rounded-4 mb-4 border border-warning border-opacity-25 d-flex gap-3 align-items-center shadow-sm">
                            <div className="flex-grow-1 min-w-0">
                                <h6 className="fw-bold mb-1 text-truncate text-dark">{selectedItem.assetId}</h6>
                                <p className="mb-0 text-muted small text-truncate">{selectedItem.brandModel}</p>
                            </div>
                        </div>
                    )}

                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">ชื่อผู้คืน (Returner Name) <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                                type="text" 
                                value={formData.returnerName} 
                                onChange={(e) => handleFormChange('returnerName', e.target.value)} 
                                placeholder="ระบุชื่อ-นามสกุล ผู้คืน" 
                                className="py-2 rounded-3 shadow-none border-warning-subtle focus-ring-warning"
                                autoFocus
                            />
                            <Form.Text className="text-muted">
                                * โดยปกติคือ <strong>{selectedTransaction?.borrowerName || '-'}</strong> (ผู้ยืม) แต่อาจมีคนอื่นมาคืนแทน
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">วันที่คืน (Return Date) <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                                type="date" 
                                value={formData.returnDate} 
                                onChange={(e) => handleFormChange('returnDate', e.target.value)} 
                                className="py-2 rounded-3 shadow-none border-warning-subtle"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">หมายเหตุคืน (Remarks)</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={2} 
                                value={formData.remarks} 
                                onChange={(e) => handleFormChange('remarks', e.target.value)} 
                                placeholder="สภาพสินค้าตอนคืน หรือหมายเหตุอื่นๆ"
                                className="rounded-3 shadow-none border-warning-subtle"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-top-0 pt-0">
                    <Button variant="light" onClick={() => setShowReturnModal(false)} className="rounded-pill px-4">ยกเลิก</Button>
                    <Button variant="warning" onClick={confirmReturn} className="rounded-pill px-4 shadow-sm border-0 text-dark fw-bold">ยืนยันการรับคืน</Button>
                </Modal.Footer>
            </Modal>

            <style>{`
                .custom-tabs .nav-link {
                    padding: 1rem 1.5rem;
                    color: #64748b;
                    border: none !important;
                    border-bottom: 2px solid transparent !important;
                    transition: all 0.3s ease;
                }
                .custom-tabs .nav-link:hover {
                    color: #0d6efd;
                }
                .custom-tabs .nav-link.active {
                    color: #0d6efd;
                    background: transparent;
                    border-bottom: 2px solid #0d6efd !important;
                }
                
                .custom-hover-table tbody tr:hover td {
                    background-color: #f8fafc !important;
                }
                .custom-modal .modal-content {
                    border-radius: 1rem;
                    border: none;
                    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
                }
                .focus-ring-primary:focus {
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25);
                }
                .focus-ring-warning:focus {
                    border-color: #ffc107;
                    box-shadow: 0 0 0 0.25rem rgba(255,193,7,.25);
                }
                .focus-ring-success:focus {
                    border-color: #198754;
                    box-shadow: 0 0 0 0.25rem rgba(25,135,84,.25);
                }
            `}</style>
        </div>
    );
}
