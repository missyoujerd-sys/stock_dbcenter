import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { Table, Button, Form, Modal, Alert, Row, Col } from 'react-bootstrap';
import { decryptData, encryptData } from '../utils/encryption'; // encryptData needed for updating distributor
import { useAuth } from '../contexts/AuthContext';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';
import { FaFileExcel, FaTruck, FaSearch, FaHome, FaInfoCircle, FaBox, FaPlus, FaTrash, FaCheck, FaSync, FaEdit, FaLock, FaUnlock } from 'react-icons/fa';
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
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Edit states
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [passwordShake, setPasswordShake] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        assetId: '', brandModel: '', serialNumber: '', department: '', category: '', remarks: ''
    });
    const [itemToDelete, setItemToDelete] = useState(null);
    const [adminPassword, setAdminPassword] = useState('101988');
    const [isAssetIdUnlocked, setIsAssetIdUnlocked] = useState(false);
    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const handleEditClick = (e, stock) => {
        e.stopPropagation();
        setItemToEdit(stock);
        setIsAssetIdUnlocked(false);
        setEditFormData({
            assetId: stock.assetId || '',
            brandModel: stock.brandModel || '',
            serialNumber: stock.serialNumber || '',
            department: stock.department || '',
            category: stock.category || '',
            remarks: stock.remarks || ''
        });
        setShowEditModal(true);
    };

    const handlePasswordSubmit = async () => {
        if (passwordInput === adminPassword) {
            setShowPasswordModal(false);
            setPasswordInput('');
            setPasswordError(false);
            setIsAssetIdUnlocked(true);
        } else {
            setPasswordError(true);
            setPasswordShake(true);
            setPasswordInput('');
            setTimeout(() => setPasswordShake(false), 600);
        }
    };

    const handleSaveEdit = async () => {
        if (!itemToEdit) return;
        try {
            const stockRef = ref(db, `stocks/${itemToEdit.id}`);
            await update(stockRef, {
                assetId: encryptData(editFormData.assetId),
                brandModel: encryptData(editFormData.brandModel),
                serialNumber: encryptData(editFormData.serialNumber),
                department: encryptData(editFormData.department),
                category: encryptData(editFormData.category),
                remarks: encryptData(editFormData.remarks)
            });
            setShowEditModal(false);
            setItemToEdit(null);
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const [boxes, setBoxes] = useState([{ id: 1, name: 'กล่องที่ 1', items: [] }]);
    const [activeBoxId, setActiveBoxId] = useState(1);
    const [nextBoxId, setNextBoxId] = useState(2);
    const [customBoxName, setCustomBoxName] = useState('');
    const isBoxInitialized = useRef(false);

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
        const passRef = ref(db, 'settings/adminPassword');
        onValue(passRef, (snapshot) => {
            if (snapshot.exists()) {
                setAdminPassword(snapshot.val());
            }
        });

        const stocksRef = ref(db, 'stocks');
        const unsubscribe = onValue(stocksRef, (snapshot) => {
            const data = snapshot.val();
            const loadedStocks = [];
            let total = 0, available = 0, distributed = 0;
            let maxBoxIdInDb = 0;

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
                        if (item.distributionBox) {
                            const match = item.distributionBox.match(/\d+/);
                            if (match) {
                                const num = parseInt(match[0]);
                                if (num > maxBoxIdInDb) maxBoxIdInDb = num;
                            }
                        }
                    }
                }
            }
            setStocks(loadedStocks);
            setSummary({ total, available, distributed });
            setLoading(false);

            if (!isBoxInitialized.current) {
                const startingId = maxBoxIdInDb + 1;
                setBoxes([{ id: startingId, name: `กล่องที่ ${startingId}`, items: [] }]);
                setActiveBoxId(startingId);
                setNextBoxId(startingId + 1);
                isBoxInitialized.current = true;
            }
        });

        return unsubscribe;
    }, []);

    const handleInfoClick = (e, item) => {
        e.stopPropagation();
        setSelectedItem(item);
        setShowDetailModal(true);
    };

    const handleAddBox = () => {
        const newId = nextBoxId;
        let finalName = customBoxName.trim();
        
        if (!finalName) {
             finalName = `กล่องที่ ${newId}`;
        } else if (/^\d+$/.test(finalName)) {
             finalName = `กล่องที่ ${finalName}`;
        }

        if (boxes.some(b => b.name === finalName)) {
             alert('ชื่อหรือหมายเลขกล่องซ้ำกันครับ กรุณาระบุใหม่');
             return;
        }

        setBoxes([...boxes, { id: newId, name: finalName, items: [] }]);
        setNextBoxId(newId + 1);
        setActiveBoxId(newId);
        setCustomBoxName('');
    };

    const handleRemoveBox = (boxId) => {
        if (boxes.length <= 1) return;
        const updatedBoxes = boxes.filter(b => b.id !== boxId);
        setBoxes(updatedBoxes);
        if (activeBoxId === boxId) {
            setActiveBoxId(updatedBoxes[0].id);
        }
    };

    const getAssignedBox = (id) => {
        for (const box of boxes) {
            const idx = box.items.findIndex(i => i.id === id);
            if (idx !== -1) {
                return { box, order: idx + 1 };
            }
        }
        return null;
    };

    const toggleSelect = (id) => {
        setBoxes(prev => {
            const newBoxes = [...prev];
            let foundBoxIdx = -1;
            
            newBoxes.forEach((box, bIdx) => {
                const iIdx = box.items.findIndex(i => i.id === id);
                if (iIdx !== -1) {
                    foundBoxIdx = bIdx;
                }
            });

            if (foundBoxIdx !== -1) {
                // Remove from current box immutably
                newBoxes[foundBoxIdx] = {
                    ...newBoxes[foundBoxIdx],
                    items: newBoxes[foundBoxIdx].items.filter(i => i.id !== id)
                };
            } else {
                // Add to active box immutably
                const activeIdx = newBoxes.findIndex(b => b.id === activeBoxId);
                if (activeIdx !== -1) {
                    const stockItem = stocks.find(s => s.id === id);
                    if (stockItem) {
                        newBoxes[activeIdx] = {
                            ...newBoxes[activeIdx],
                            items: [...newBoxes[activeIdx].items, stockItem]
                        };
                    }
                }
            }
            return newBoxes;
        });
    };

    const toggleSelectAll = () => {
        const filteredIds = filteredStocks.map(s => s.id);
        const allSelected = filteredIds.length > 0 && filteredIds.every(id => {
            return boxes.some(b => b.items.some(i => i.id === id));
        });

        if (allSelected) {
            // Remove all filtered from boxes
            setBoxes(prev => prev.map(box => ({
                ...box,
                items: box.items.filter(i => !filteredIds.includes(i.id))
            })));
        } else {
            // Add all filtered to active box (that are not already in any box)
            setBoxes(prev => {
                const newBoxes = [...prev];
                const activeIdx = newBoxes.findIndex(b => b.id === activeBoxId);
                if (activeIdx === -1) return newBoxes;

                const itemsToAdd = filteredStocks.filter(stock => 
                    !newBoxes.some(b => b.items.some(i => i.id === stock.id))
                );
                
                newBoxes[activeIdx].items = [...newBoxes[activeIdx].items, ...itemsToAdd];
                return newBoxes;
            });
        }
    };

    const allSelectedItemsCount = boxes.reduce((acc, box) => acc + box.items.length, 0);

    const handleShowDistribute = (stock) => {
        if (stock) {
            setSelectedStock(stock);
            if (!getAssignedBox(stock.id)) {
                 toggleSelect(stock.id);
            }
        }
        setDistributeDate(new Date().toISOString().split('T')[0]);
        setShowModal(true);
    };

    const handleShowBulkDistribute = () => {
        if (allSelectedItemsCount === 0) return;
        setSelectedStock(null);
        setDistributeDate(new Date().toISOString().split('T')[0]);
        setShowModal(true);
    };

    const handleDistribute = async (exportExcel = true) => {
        if (allSelectedItemsCount === 0) return;
        setDistributeError('');

        try {
            const itemsToDistribute = boxes.flatMap(b => b.items.map(item => ({...item, distributionBox: b.name})));

            for (const stock of itemsToDistribute) {
                const stockRef = ref(db, `stocks/${stock.id}`);
                await update(stockRef, {
                    status: 'จำหน่าย',
                    distributionDate: distributeDate,
                    distributor: encryptData(currentUser.email),
                    qt_distributed: 1,
                    qt_balance: 0,
                    distributionBox: stock.distributionBox
                });
            }

            // Generate Excel if requested
            if (exportExcel) {
                generateExcel(itemsToDistribute, distributeDate);
            }

            setBoxes([{ id: nextBoxId, name: `กล่องที่ ${nextBoxId}`, items: [] }]);
            setActiveBoxId(nextBoxId);
            setNextBoxId(nextBoxId + 1);
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
        // This is critical because ExcelJS only sets border on the top-left cell
        const mc = (range, val, opts = {}) => {
            ws.mergeCells(range);
            const borderToUse = opts.border || AB;
            sc(range.split(':')[0], val, { border: borderToUse, ...opts });
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
                    cell.border = borderToUse;
                    if (opts.fill) cell.fill = opts.fill;
                }
            }
        };

        const HFILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
        const YFILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };

        // ═══════ ROW 1: Title ═══════
        const boxNumberText = selectedStocks.length > 0 && selectedStocks[0].distributionBox ? selectedStocks[0].distributionBox : '';
        ws.getRow(1).height = 38;
        mc('A1:B1', boxNumberText, { font: { bold: true, size: 16, color: { argb: 'FFDC3545' }, underline: 'double' }, align: { horizontal: 'left', vertical: 'top' }, border: {} });
        mc('C1:I1', 'ใบเบิกหรือใบส่งคืน', { font: { bold: true, size: 22 }, align: { horizontal: 'center', vertical: 'middle' }, border: {} });
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
            const boxInfo = stock.distributionBox ? `[${stock.distributionBox}] ` : '';
            const itemDesc = `${boxInfo}${catName} ${bModel}`;

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
        mc(`A${R}:F${R}`, 'ผู้รับพัสดุ', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc(`G${R}:K${R}`, 'ผู้ตรวจสอบ ..................................................', { font: { size: 14 }, align: { horizontal: 'left' } });

        // Row 4: ได้รับของ + ผู้อนุมัติ
        R++; ws.getRow(R).height = 22;
        mc(`A${R}:F${R}`, 'ได้รับของตามจำนวนและรายการที่จ่ายเรียบร้อยแล้ว', { font: { size: 14 }, align: { horizontal: 'left' } });
        mc(`G${R}:K${R}`, 'ผู้อนุมัติจ่าย/รับคืน ..................................................', { font: { size: 14 }, align: { horizontal: 'left' } });

        // --- Left side vertical blank block ---
        const blankTop = R + 1;
        const blankBottom = R + 4;
        mc(`A${blankTop}:F${blankBottom}`, '', { border: { top: TN, left: TN, right: TN } }); // Merge all 4 rows on the left into one clean box

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
        mc(`A${R}:F${R}`, `ผู้มีสิทธิเบิก/ส่งคืน  นาย ณรงค์ รวมสุข`, { font: { size: 14 }, align: { horizontal: 'center' }, border: { left: TN, right: TN, bottom: TN } });
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

    const renderBoxManagerWidget = () => (
        <div className="box-manager-widget" style={{ 
            background: 'linear-gradient(to bottom, #ffffff, #f8fafc)', 
            backdropFilter: 'blur(20px)', 
            borderRadius: '1rem', 
            padding: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0,0,0,0.03)',
            width: '100%',
            maxWidth: '100%',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorative background glow */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(13,110,253,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }}></div>

            <div className="d-flex justify-content-between align-items-center mb-2" style={{ position: 'relative', zIndex: 1 }}>
                <div className="d-flex align-items-center gap-2">
                    <div className="d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                        <img src="/open-box.png" alt="box" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <h6 className="mb-0 fw-bold" style={{ fontFamily: 'Prompt, sans-serif', color: '#1e293b', fontSize: '0.95rem' }}>จัดการกล่องพัสดุ</h6>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>จัดเตรียมพัสดุเพื่อจำหน่าย</div>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-1">
                    <Form.Control
                        size="sm"
                        placeholder="ระบุเลขกล่อง..."
                        value={customBoxName}
                        onChange={(e) => setCustomBoxName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBox(); } }}
                        style={{ width: '90px', fontSize: '0.75rem', borderRadius: '20px', border: '1px solid #bfdbfe', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                    />
                    <Button variant="primary" size="sm" onClick={handleAddBox} className="rounded-pill px-2 py-1 d-flex align-items-center gap-1 shadow-sm" style={{ 
                        fontSize: '0.75rem', fontWeight: '600', 
                        background: 'linear-gradient(135deg, #ffffff, #f8fafc)', 
                        color: '#3b82f6', border: '1px solid #bfdbfe', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff, #f8fafc)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <FaPlus size={10} /> เพิ่ม
                    </Button>
                </div>
            </div>
            
            <div className="d-flex gap-2 mb-2 mt-2" style={{ overflowX: 'auto', paddingBottom: '4px', position: 'relative', zIndex: 1 }}>
                {boxes.map(box => (
                    <div 
                        key={box.id} 
                        onClick={() => setActiveBoxId(box.id)}
                        className={`box-tab px-3 py-2 rounded-pill d-flex align-items-center gap-2 ${activeBoxId === box.id ? 'shadow' : ''}`}
                        style={{ 
                            cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', whiteSpace: 'nowrap',
                            background: activeBoxId === box.id ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#f1f5f9',
                            color: activeBoxId === box.id ? '#ffffff' : '#64748b',
                            border: activeBoxId === box.id ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
                            transform: activeBoxId === box.id ? 'scale(1.02)' : 'scale(1)'
                        }}
                    >
                        <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{box.name}</span>
                        <div className="d-flex align-items-center gap-1" style={{ 
                            background: activeBoxId === box.id ? 'rgba(255,255,255,0.25)' : '#cbd5e1',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            boxShadow: activeBoxId === box.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                        }}>
                            <img src="/open-box.png" alt="box" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                            <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 'bold',
                                color: activeBoxId === box.id ? '#ffffff' : '#475569'
                            }}>
                                {box.items.length}
                            </span>
                        </div>
                        {boxes.length > 1 && activeBoxId === box.id && (
                            <div className="ms-1 d-flex align-items-center justify-content-center rounded-circle" style={{ width: '22px', height: '22px', background: 'rgba(255,255,255,0.15)', transition: 'background 0.2s' }} 
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.8)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                            >
                                <FaTrash size={10} className="text-white" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleRemoveBox(box.id); }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="active-box-content p-2 rounded-3" style={{ 
                maxHeight: '120px', overflowY: 'auto', 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                position: 'relative', zIndex: 1 
            }}>
                {boxes.find(b => b.id === activeBoxId)?.items.length === 0 ? (
                    <div className="text-center text-muted py-2 d-flex flex-column align-items-center" style={{ animation: 'fadeIn 0.5s ease' }}>
                        <div className="mb-2 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                            <img src="/open-box.png" alt="empty box" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: '0.8' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>ยังไม่มีพัสดุในกล่องนี้</span>
                        <small style={{ fontSize: '0.7rem', color: '#94a3b8' }}>เลือกพัสดุจากตารางเพื่อจัดลงกล่อง</small>
                    </div>
                ) : (
                    boxes.find(b => b.id === activeBoxId)?.items.map((item, idx) => (
                        <div key={item.id} className="d-flex justify-content-between align-items-center p-2 mb-2 bg-white rounded-3 shadow-sm" style={{ 
                            borderLeft: '4px solid #3b82f6',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            cursor: 'default'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)'; }}
                        >
                            <div className="d-flex align-items-center gap-3">
                                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ 
                                    width: '26px', height: '26px', 
                                    background: '#eff6ff', color: '#2563eb', 
                                    fontSize: '0.8rem', fontWeight: '700',
                                    border: '1px solid #bfdbfe'
                                }}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>{item.assetId}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{item.brandModel}</div>
                                </div>
                            </div>
                            <Button variant="link" className="text-danger p-2 text-decoration-none rounded-circle" style={{ background: '#fef2f2', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                                onClick={() => toggleSelect(item.id)}>
                                <FaTrash size={12} />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <>
            <div className="d-flex flex-column flex-xl-row gap-4 w-100 mb-4 align-items-start">
                <div style={{ flex: '1 1 auto', width: '100%', minWidth: 0 }}>
                    <div className="page-header-container d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                        <div className="page-title-badge">
                            <div className="page-icon-box">
                                <FaTruck />
                            </div>
                            <h2 className="page-title-text">
                                จำหน่ายพัสดุ <small>(Distribution)</small>
                            </h2>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            {allSelectedItemsCount > 0 && (
                                <Button variant="primary" className="logout-btn-custom px-4 shadow-lg" size="lg" onClick={handleShowBulkDistribute} style={{ borderRadius: '50px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaTruck />
                                    จำหน่ายพัสดุในกล่อง ({allSelectedItemsCount})
                                </Button>
                            )}
                        </div>
                    </div>

                    <StatusSummaryBar />
                </div>
                <div style={{ flex: '0 0 auto', width: '100%', maxWidth: '320px' }}>
                    {renderBoxManagerWidget()}
                </div>
            </div>


            <div className="section-header-container mt-2">
                <div className="section-accent"></div>
                <h4 className="section-title-text">
                    รายการพัสดุรอจำหน่าย
                    <span className="section-title-badge">งานซ่อมบำรุงคอมพิวเตอร์</span>
                </h4>
            </div>

            <div className="latest-panel latest-panel--dark">
                <div className="latest-panel-header">
                    <div className="latest-panel-title-wrap">
                        <div className="latest-panel-dot" style={{ backgroundColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.25)' }}></div>
                        <span className="latest-panel-title">รายการพัสดุรอจำหน่าย</span>
                        <span className="latest-panel-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}>งานซ่อมบำรุงคอมพิวเตอร์</span>
                    </div>
                    {/* ── ป้ายกลาง ── */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 18px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1.5px solid rgba(239, 68, 68, 0.3)',
                        marginLeft: '8px',
                    }}>
                        <span style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: '#f87171',
                            fontFamily: 'Prompt, sans-serif',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.02em',
                        }}>🖨️ เลือกครุภัณฑ์จำหน่ายลงกล่อง</span>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <button className="btn-glossy-refresh" onClick={handleRefresh} title="รีเฟรชข้อมูล">
                            <FaSync size={18} className={isRefreshing ? 'spin-animation' : ''} />
                        </button>
                        <span className="latest-panel-count" style={{ color: '#ff4d4f', fontWeight: 'bold', textShadow: '0 0 5px rgba(255, 77, 79, 0.3)' }}>{loading ? '...' : `${filteredStocks.length} รายการ`}</span>
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
                                        checked={filteredStocks.length > 0 && filteredStocks.every(s => !!getAssignedBox(s.id))}
                                        onChange={toggleSelectAll}
                                        className="db-check-custom"
                                    />
                                </th>
                                <th style={{ width: '90px', textAlign: 'center' }}>ลำดับ (กล่อง)</th>
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
                            {loading || isRefreshing ? (
                                <tr><td colSpan="10" className="latest-empty">กำลังโหลดข้อมูล...</td></tr>
                            ) : filteredStocks.length === 0 ? (
                                <tr><td colSpan="10" className="latest-empty">ไม่พบรายการสินค้าที่สามารถจำหน่ายได้</td></tr>
                            ) : (
                                filteredStocks.map((stock, idx) => (
                                    <tr
                                        key={stock.id}
                                        className={`latest-row latest-row--${idx % 2 === 0 ? 'even' : 'odd'}`}
                                    >
                                        <td style={{ paddingLeft: '1.5rem' }}>
                                            <Form.Check
                                                type="checkbox"
                                                checked={!!getAssignedBox(stock.id)}
                                                onChange={() => toggleSelect(stock.id)}
                                            />
                                        </td>
                                        <td className="text-center font-semibold text-slate-500" style={{ textAlign: 'center' }}>
                                            {getAssignedBox(stock.id) ? (
                                                <span className="badge bg-success rounded-pill px-2 py-1 shadow-sm d-flex align-items-center justify-content-center mx-auto" style={{ width: 'fit-content', gap: '4px', fontSize: '0.75rem' }}>
                                                    <FaBox size={10} /> {getAssignedBox(stock.id).box.name} (#{getAssignedBox(stock.id).order})
                                                </span>
                                            ) : (
                                                idx + 1
                                            )}
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
                                            <div className="d-flex justify-content-center gap-2">
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={(e) => handleEditClick(e, stock)}
                                                    title="แก้ไขข้อมูล"
                                                    className="rounded-circle p-1"
                                                    style={{ width: '32px', height: '32px' }}
                                                >
                                                    <FaEdit />
                                                </Button>
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
                                            </div>
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
                        <span className="text-secondary fw-semibold" style={{ fontSize: '0.9rem' }}>รายการที่เลือกแยกตามกล่อง</span>
                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 shadow-sm border border-primary border-opacity-25">
                            {allSelectedItemsCount} รายการ
                        </span>
                    </div>
                    
                    <div className="selected-items-box mb-4 p-3 rounded-4 shadow-sm" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', maxHeight: '220px', overflowY: 'auto' }}>
                        {boxes.filter(b => b.items.length > 0).map(box => (
                            <div key={box.id} className="mb-3 bg-white p-2 rounded-3 shadow-sm" style={{ borderLeft: '4px solid #0d6efd' }}>
                                <h6 className="text-primary fw-bold mb-2 border-bottom pb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
                                    <FaBox /> {box.name} <span className="badge bg-secondary rounded-pill ms-auto" style={{ fontSize: '0.7rem' }}>{box.items.length} รายการ</span>
                                </h6>
                                {box.items.map((s, index) => (
                                    <div key={s.id} className={`d-flex align-items-center py-2 ${index !== box.items.length - 1 ? 'border-bottom border-light' : ''}`}>
                                        <div className="me-3 text-secondary">
                                            <div className="badge bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '24px', height: '24px', padding: '0' }}>{index + 1}</div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="fw-semibold text-dark" style={{ fontSize: '0.90rem' }}>{s.assetId}</div>
                                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>{s.brandModel.trim().replace(/-$/, '').trim()}</div>
                                        </div>
                                    </div>
                                ))}
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

                    <div className="p-3 rounded-4" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)', border: '1px dashed rgba(13, 110, 253, 0.3)' }}>
                        <div className="d-flex align-items-start gap-3">
                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle mt-1">
                                <FaInfoCircle className="text-primary" size={20} />
                            </div>
                            <div>
                                <h6 className="fw-bold text-primary mb-1" style={{ fontSize: '0.95rem' }}>ตัวเลือกการจำหน่าย</h6>
                                <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                                    ระบบจะเปลี่ยนสถานะพัสดุเป็น <strong>"จำหน่าย"</strong> โดยท่านสามารถเลือกได้ว่าจะ <strong className="text-success">บันทึกและดาวน์โหลด Excel</strong> หรือ <strong className="text-primary">บันทึกจำหน่ายลงในรายการไว้ก่อน</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3 d-flex flex-column align-items-center gap-3">
                    <div className="text-center w-100 bounce-animation">
                        <span className="fw-bold text-primary" style={{ fontSize: '1rem' }}>
                            ✨เลือกรูปแบบการจำหน่ายด้านล่างนี้ได้เลยครับ✨
                        </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-pill fw-semibold border-0 bg-white shadow-sm" style={{ transition: 'all 0.2s' }}>
                            ยกเลิก
                        </Button>
                        <div className="d-flex gap-2 flex-wrap justify-content-end">
                            <Button variant="primary" onClick={() => handleDistribute(false)} className="px-3 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-2 distribute-btn" style={{ transition: 'all 0.2s', border: 'none' }}>
                                <FaTruck /> จำหน่ายลงรายการไว้ก่อน
                            </Button>
                            <Button variant="success" onClick={() => handleDistribute(true)} className="px-3 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-2 distribute-btn" style={{ transition: 'all 0.2s', border: 'none' }}>
                                <FaFileExcel /> จำหน่าย & โหลด Excel
                            </Button>
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>

            {/* Password Modal */}
            <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered size="sm" className="luxury-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">ใส่รหัสผ่าน</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    <Form.Group>
                        <Form.Control
                            type="password"
                            placeholder="Password..."
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handlePasswordSubmit();
                                }
                            }}
                            className={`p-2 rounded-3 text-center ${passwordError ? 'border-danger' : ''} ${passwordShake ? 'shake-animation' : ''}`}
                            style={{ backgroundColor: '#f8f9fa', fontSize: '1.2rem', letterSpacing: '2px' }}
                            autoFocus
                        />
                        {passwordError && <div className="text-danger mt-2 text-center" style={{ fontSize: '0.85rem' }}>รหัสผ่านไม่ถูกต้อง!</div>}
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 d-flex justify-content-center">
                    <Button variant="primary" onClick={handlePasswordSubmit} className="w-100 rounded-pill fw-bold">ยืนยัน</Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg" className="luxury-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold text-primary"><FaEdit className="me-2"/>แก้ไขข้อมูลพัสดุ</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3 px-4">
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    เลขครุภัณฑ์
                                    {!isAssetIdUnlocked && <span className="text-danger ms-2" style={{ fontSize: '0.8rem' }}>(ห้ามเปลี่ยนเลขครุภัณฑ์)</span>}
                                </Form.Label>
                                <div className="d-flex gap-2">
                                    <Form.Control 
                                        value={editFormData.assetId} 
                                        onChange={e => setEditFormData({...editFormData, assetId: e.target.value})} 
                                        disabled={!isAssetIdUnlocked}
                                        style={!isAssetIdUnlocked ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {}}
                                    />
                                    {!isAssetIdUnlocked ? (
                                        <Button variant="outline-danger" onClick={() => {
                                            setPasswordInput('');
                                            setPasswordError(false);
                                            setShowPasswordModal(true);
                                        }} title="ปลดล็อคเพื่อแก้ไข">
                                            <FaLock />
                                        </Button>
                                    ) : (
                                        <Button variant="outline-success" disabled title="ปลดล็อคแล้ว">
                                            <FaUnlock />
                                        </Button>
                                    )}
                                </div>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Serial Number</Form.Label>
                                <Form.Control value={editFormData.serialNumber} onChange={e => setEditFormData({...editFormData, serialNumber: e.target.value})} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">ยี่ห้อ/รุ่น</Form.Label>
                                <Form.Control value={editFormData.brandModel} onChange={e => setEditFormData({...editFormData, brandModel: e.target.value})} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">ประเภทครุภัณฑ์</Form.Label>
                                <Form.Control value={editFormData.category} onChange={e => setEditFormData({...editFormData, category: e.target.value})} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">หน่วยงาน</Form.Label>
                                <Form.Control value={editFormData.department} onChange={e => setEditFormData({...editFormData, department: e.target.value})} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">หมายเหตุ</Form.Label>
                                <Form.Control as="textarea" rows={1} value={editFormData.remarks} onChange={e => setEditFormData({...editFormData, remarks: e.target.value})} />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="outline-secondary" onClick={() => setShowEditModal(false)} className="rounded-pill px-4">ยกเลิก</Button>
                    <Button variant="primary" onClick={handleSaveEdit} className="rounded-pill px-4 fw-bold">บันทึกการแก้ไข</Button>
                </Modal.Footer>
            </Modal>
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
                .shake-animation {
                    animation: shake 0.5s;
                }
                @keyframes shake {
                    0% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    50% { transform: translateX(5px); }
                    75% { transform: translateX(-5px); }
                    100% { transform: translateX(0); }
                }
                .btn-glossy-refresh {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 50% 10%, #c4ff4d 0%, #4ade80 40%, #166534 100%);
                    border: 2.5px solid #ffffff;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.5), inset 0 4px 6px rgba(255,255,255,0.9);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    padding: 0;
                    flex-shrink: 0;
                    filter: drop-shadow(0 0 4px rgba(74, 222, 128, 0.5));
                }
                .btn-glossy-refresh:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 12px rgba(0,0,0,0.6), inset 0 4px 6px rgba(255,255,255,1);
                    background: radial-gradient(circle at 50% 10%, #d9ff80 0%, #4ade80 45%, #15803d 100%);
                    filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.8));
                }
                .btn-glossy-refresh:active {
                    transform: scale(0.95);
                    box-shadow: 0 2px 3px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.5);
                }
                .spin-animation {
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
