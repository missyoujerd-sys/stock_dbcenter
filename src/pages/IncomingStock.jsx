import React, { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Form, Button, Card, Row, Col, Alert, Table, Badge, InputGroup } from 'react-bootstrap';
import { db } from '../firebase';
import { ref, push, set, onValue } from 'firebase/database';
import { encryptData, decryptData } from '../utils/encryption';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { th, enUS } from 'date-fns/locale';
import { format } from 'date-fns';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { FaSave, FaHome, FaCalendarAlt, FaList, FaBarcode, FaTag, FaBox, FaBuilding, FaStickyNote, FaChevronLeft, FaChevronRight, FaClipboardList, FaCamera, FaSignature, FaTrash, FaEraser } from 'react-icons/fa';
import ItemDetailModal from '../components/ItemDetailModal';

registerLocale('th', th);

const REMARK_OPTIONS = [
    'เครื่องเกิดการซ็อตไฟไม่เข้า',
    'เมนบอร์ดไหม้ใช้งานไม่ได้',
    'จอลายเป็นเส้นซ่อมไม่ได้',
    'เครื่องอายุมากไม่มีอะไหล่ขายแล้ว',
    'ซ่อมไม่คุ้มเพราะอะไหล่แพงพอๆกับซื้อเครื่องใหม่',
];

export default function IncomingStock() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [remarkError, setRemarkError] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const [stocksLoading, setStocksLoading] = useState(true);
    const [stocks, setStocks] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const serialInputRef = useRef(null);
    const sigCanvasRef = useRef(null);
    const sigDrawing = useRef(false);
    const sigLastPos = useRef(null);
    const photoInputRef = useRef(null);

    const [photoData, setPhotoData] = useState('');      // base64 photo
    const [signatureData, setSignatureData] = useState(''); // base64 signature
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrResult, setOcrResult] = useState('');
    const [officerName, setOfficerName] = useState('');
    const [officerDate, setOfficerDate] = useState(
        new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
    );

    const [formData, setFormData] = useState({
        surveyDate: new Date().toISOString().split('T')[0],
        building: '',
        department: '',
        serialNumber: '',
        assetId: '',
        category: '',
        brand: '',
        model: '',
        computerName: '',
        remarks: ''
    });

    const CATEGORY_OPTIONS = {
        "คอมพิวเตอร์ PC":
            ["HP", "Dell", "Lenovo", "Acer", "Asus", "Samsung", "MSI", "Apple"],
            
        "Notebook":
            ["HP", "Dell", "Lenovo", "Acer", "Asus", "Samsung", "MSI", "Apple"],
       
       
        "จอคอมพิวเตอร์": [
            "จอคอมพิวเตอร์ Acer",
            "จอคอมพิวเตอร์ Asus",
            "จอคอมพิวเตอร์ AOC ",
            "จอคอมพิวเตอร์ ZOWIE",
            "จอคอมพิวเตอร์ BenQ ",
            "จอคอมพิวเตอร์ Xiaomi ",
            "จอคอมพิวเตอร์ Viewsonic ",
            "จอคอมพิวเตอร์ SAMSUNG ",
            "จอคอมพิวเตอร์ MSI ",
            "จอคอมพิวเตอร์ Alienware ",
            "จอคอมพิวเตอร์ LG ",
            "จอคอมพิวเตอร์ Lenovo ",
        ],
        "TV": ["LG", "Samsung", "Philips"],
        "Tablet": ["Samsung", "Apple"],
        "Printer": [
            "เครื่องพิมพ์ประเภทหัวเข็ม (Dot Matrix Printer)",
            "เครื่องพิมพ์อิงค์เจ็ท (Inkjet Printer)",
            "เครื่องพิมพ์เลเซอร์ (Laser Printer)",
            "เครื่องพิมพ์ความร้อน (Thermal Printer)",
            "เครื่องพิมพ์พล็อตเตอร์ (Plotter Printer)"
        ],
        "UPS (เครื่องสำรองไฟ)": ["APC", "Eaton", "Delta", "Cyberpower", "Vertiv", "Chuphotic", "Cleanline", "Leonics", "Syndome", "Zircon"],

        "สแกนเนอร์": [
            "สแกนเนอร์ Canon PIXMA ",
            "สแกนเนอร์ Epson Scaner ",
            "สแกนเนอร์ FUJITSU ",
            "สแกนเนอร์ Brother ",
            "สแกนเนอร์ Aibecy ",
            "สแกนเนอร์ Canon Laserjet",
            "สแกนเนอร์ HP Laserjet ",
            "สแกนเนอร์ Brother Scanner ",],

        "Switc Hub": [
            "TP-Link",
            "D-Link",
            "DGS",
            "Cisco",
            "LINKSYS",
            "HIKVISION",
            "Zyxel",],
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRemarksChange = (value) => {
        // กรองอักขระต้องห้าม: ตัวเลข 0-9, - * / \ .
        const filtered = value.replace(/[0-9\-\*\/\\\.]/g, '');
        setFormData(prev => ({ ...prev, remarks: filtered }));
        if (filtered.trim()) setRemarkError(false);
    };

    /* ── Photo capture + OCR ── */
    const rotateToLandscape = (dataUrl) =>
        new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const { naturalWidth: w, naturalHeight: h } = img;
                if (h > w) {
                    // รูปแนวตั้ง → หมุน 90° ทวนเข็ม (CCW) เพื่อให้ตัวอักษรถูกทิศ
                    const canvas = document.createElement('canvas');
                    canvas.width = h;
                    canvas.height = w;
                    const ctx = canvas.getContext('2d');
                    ctx.translate(h / 2, w / 2);
                    ctx.rotate(-Math.PI / 2);
                    ctx.drawImage(img, -w / 2, -h / 2);
                    resolve(canvas.toDataURL('image/jpeg', 0.92));
                } else {
                    resolve(dataUrl); // แนวนอนอยู่แล้ว ไม่ต้องหมุน
                }
            };
            img.src = dataUrl;
        });

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const rawUrl = evt.target.result;
            const dataUrl = await rotateToLandscape(rawUrl);
            setPhotoData(dataUrl);
            setOcrLoading(true);
            setOcrResult('');
            try {
                const result = await Tesseract.recognize(dataUrl, 'eng', {
                    logger: () => { },
                });
                const text = result.data.text;
                console.log('OCR raw text:', text); // debug

                // ── 1) ดึงเลขครุภัณฑ์ (ตัวเลข + ขีด/สแลช) ──
                const numMatches = text.match(/\d[\d\-\/]{2,}\d/g);
                if (numMatches && numMatches.length > 0) {
                    const extracted = numMatches.reduce((a, b) => (b.length > a.length ? b : a));
                    setOcrResult(extracted);
                    setFormData((prev) => ({ ...prev, assetId: extracted }));
                } else {
                    setOcrResult('ไม่พบตัวเลข');
                }

                // ── 2) ดึงข้อความภาษาอังกฤษจากรูป → ใส่ช่องยี่ห้อตรงๆ ──
                const skipWords = new Set([
                    'NPH', 'NPIL', 'SN', 'NO', 'IN', 'PC', 'OF', 'THE', 'AND', 'FOR',
                    'TYPE', 'MADE', 'MODEL', 'SERIAL', 'NUMBER', 'LABEL',
                    'INPUT', 'OUTPUT', 'CLASS', 'UNIT', 'WATT', 'VOLT',
                ]);
                const brandText = text
                    .replace(/[^A-Za-z ]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .split(' ')
                    .filter(w => w.length >= 4 && !skipWords.has(w.toUpperCase()))
                    .join(' ');
                if (brandText) {
                    setFormData((prev) => ({ ...prev, brand: brandText }));
                }
            } catch (err) {
                console.error('OCR error:', err);
                setOcrResult('OCR ผิดพลาด');
            } finally {
                setOcrLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };



    /* ── Signature pad helpers ── */
    const getSigPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };
    const sigStart = (e) => {
        e.preventDefault();
        sigDrawing.current = true;
        sigLastPos.current = getSigPos(e, sigCanvasRef.current);
    };
    const sigMove = (e) => {
        e.preventDefault();
        if (!sigDrawing.current) return;
        const canvas = sigCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getSigPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(sigLastPos.current.x, sigLastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        sigLastPos.current = pos;
    };
    const sigEnd = () => {
        sigDrawing.current = false;
        setSignatureData(sigCanvasRef.current.toDataURL('image/png'));
    };
    const clearSignature = () => {
        const canvas = sigCanvasRef.current;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        setSignatureData('');
    };

    const saveSignatureLocally = () => {
        if (!officerName.trim()) {
            alert('กรุณาระบุชื่อเจ้าหน้าที่ก่อนบันทึกลายเซ็น');
            return;
        }
        if (!signatureData) {
            alert('กรุณาเซ็นชื่อก่อนบันทึก');
            return;
        }
        localStorage.setItem(`saved_sig_${officerName.trim()}`, signatureData);
        alert(`บันทึกลายเซ็นของ ${officerName} เรียบร้อยแล้ว ระบบจะจดจำไว้ใช้งานครั้งต่อไป`);
        window.location.reload();
    };

    const handleOfficerNameChange = (e) => {
        const val = e.target.value;
        setOfficerName(val);
        const savedSig = localStorage.getItem(`saved_sig_${val.trim()}`);
        if (savedSig) {
            setSignatureData(savedSig);
            if (sigCanvasRef.current) {
                const canvas = sigCanvasRef.current;
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = savedSig;
            }
        }
    };

    const generateExcelLabel = async (stockData) => {
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

        // Header: รับเข้า
        worksheet.mergeCells('A2:H3');
        const titleCell = worksheet.getCell('A2');
        titleCell.value = 'รับเข้า';
        titleCell.font = { size: 20, bold: true, underline: true };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Detail
        const fields = [
            { label: 'หน่วยงาน:', value: `${decryptData(stockData.department)}  เบอร์โทร. 2299` },
            { label: 'ประเภทครุภัณฑ์:', value: decryptData(stockData.category) || '-' },
            { label: 'Serial Number:', value: decryptData(stockData.serialNumber) || '-' },
            { label: 'เลขครุภัณฑ์:', value: decryptData(stockData.assetId) || '-' },
            { label: 'ยี่ห้อ/รุ่น:', value: decryptData(stockData.brandModel) || '-' },
            { label: 'หมายเหตุ:', value: decryptData(stockData.remarks) || '-' }
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
        worksheet.getCell(`F${fRow + 1}`).value = `${stockData.officerName || '................................'}`;
        worksheet.getCell(`F${fRow + 1}`).alignment = { horizontal: 'center' };
        worksheet.mergeCells(`F${fRow + 2}:J${fRow + 2}`);
        worksheet.getCell(`F${fRow + 2}`).value = `${dateStr}`;
        worksheet.getCell(`F${fRow + 2}`).alignment = { horizontal: 'center' };
        worksheet.mergeCells(`F${fRow + 3}:J${fRow + 3}`);
        worksheet.getCell(`F${fRow + 3}`).value = `เจ้าหน้าที่คอมพิวเตอร์`;
        worksheet.getCell(`F${fRow + 3}`).alignment = { horizontal: 'center' };

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Label_Incoming_${decryptData(stockData.assetId)}.xlsx`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.remarks.trim()) {
            setRemarkError(true);
            setShowErrorPopup(true);
            const el = document.getElementById('remarks');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const stocksRef = ref(db, 'stocks');
            const newStockRef = push(stocksRef);

            const stockData = {
                importDate: formData.surveyDate, // ว/ด/ป สำรวจ
                building: encryptData(formData.building),
                department: encryptData(formData.department),
                serialNumber: encryptData(formData.serialNumber),
                assetId: encryptData(formData.assetId),
                category: encryptData(formData.category),
                brandModel: encryptData(`${formData.category} ${formData.brand} ${formData.model}`.trim().replace(/-$/, '').trim()),
                computerName: encryptData(formData.computerName),
                remarks: encryptData(formData.remarks),
                photoData: photoData || '',
                signatureData: signatureData || '',
                officerName: officerName || '',
                officerDate: officerDate || '',

                qt_received: 1, // Default 1
                qt_distributed: 0,
                qt_balance: 1,

                status: 'รับเข้า',
                distributor: '', // Empty initially
                distributionDate: '',

                receiverId: currentUser.uid,
                timestamp: Date.now()
            };

            await set(newStockRef, stockData);

            setShowSuccessPopup(true);
            setFormData({
                surveyDate: new Date().toISOString().split('T')[0],
                building: '',
                department: '',
                serialNumber: '',
                assetId: '',
                category: '',
                brand: '',
                model: '',
                computerName: '',
                remarks: ''
            });
            setPhotoData('');
            setSignatureData('');
            setOfficerName('');
            setOfficerDate(new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }));
            clearSignature();
        } catch (err) {
            console.error("Error saving stock:", err);
            setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }

        setLoading(false);
    };

    useEffect(() => {
        const stocksRef = ref(db, 'stocks');
        const unsubscribe = onValue(stocksRef, (snapshot) => {
            const data = snapshot.val();
            const loadedStocks = [];

            if (data) {
                for (const key in data) {
                    const item = data[key];
                    loadedStocks.push({
                        id: key,
                        ...item,
                        building: decryptData(item.building),
                        department: decryptData(item.department),
                        serialNumber: decryptData(item.serialNumber),
                        assetId: decryptData(item.assetId),
                        category: decryptData(item.category || ''),
                        brandModel: decryptData(item.brandModel).trim().replace(/-$/, '').trim(),
                        computerName: decryptData(item.computerName || ''),
                        remarks: decryptData(item.remarks || '-'),
                        status: item.status
                    });
                }
            }
            // Sort by timestamp desc
            loadedStocks.sort((a, b) => b.timestamp - a.timestamp);
            setStocks(loadedStocks);
            setStocksLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleRowClick = (item) => {
        setSelectedItem(item);
        setShowDetailModal(true);
    };

    return (
        <>
            <div className="page-header-container">
                <div className="page-title-badge">
                    <div className="page-icon-box">
                        <FaClipboardList />
                    </div>
                    <h2 className="page-title-text">
                        รับเข้าพัสดุเตรียมจำหน่าย <small>(Incoming Stock)</small>
                    </h2>
                </div>
            </div>

            <div className="latest-panel latest-panel--blue">
                {/* Panel Header */}
                <div className="latest-panel-header">
                    <div className="latest-panel-title-wrap">
                        <div className="latest-panel-dot"></div>
                        <span className="latest-panel-title">กรอกข้อมูลพัสดุให้ครบถ้วน</span>
                        <span className="latest-panel-badge">INCOMING STOCK FORM</span>
                    </div>
                </div>

                {/* Form Body */}
                <div className="inc-form-body">
                    {error && <div className="inc-alert inc-alert--danger">{error}</div>}
                    {success && <div className="inc-alert inc-alert--success">{success}</div>}

                    <Form onSubmit={handleSubmit}>
                        <Row className="mb-4">
                            <Col md={6}>
                                <Form.Group controlId="surveyDate">
                                    <Form.Label className="inc-label">
                                        <FaCalendarAlt className="me-2" /> ว/ด/ป สำรวจ
                                    </Form.Label>
                                    <div className="inc-input-group">
                                        <span className="inc-input-icon"><FaCalendarAlt /></span>
                                        <div className="flex-grow-1">
                                            <DatePicker
                                                selected={formData.surveyDate ? new Date(formData.surveyDate) : null}
                                                onChange={(date) => {
                                                    if (date) {
                                                        const year = date.getFullYear();
                                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                                        const day = String(date.getDate()).padStart(2, '0');
                                                        setFormData({ ...formData, surveyDate: `${year}-${month}-${day}` });
                                                    }
                                                }}
                                                dateFormat="dd/MM/yyyy"
                                                locale="th"
                                                className="inc-datepicker-input"
                                                wrapperClassName="w-100"
                                                placeholderText="เลือกวันที่"
                                                calendarClassName="shadow-lg border-0"
                                                renderCustomHeader={({
                                                    date,
                                                    decreaseMonth,
                                                    increaseMonth,
                                                    prevMonthButtonDisabled,
                                                    nextMonthButtonDisabled,
                                                }) => (
                                                    <div className="d-flex flex-column align-items-center p-3 bg-light rounded-top">
                                                        <div className="d-flex justify-content-between align-items-center w-100">
                                                            <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="btn btn-sm btn-light border-0">
                                                                <span className="h5 mb-0 text-muted">{"<"}</span>
                                                            </button>
                                                            <div className="text-center">
                                                                <div className="h4 mb-0 fw-bold text-dark">
                                                                    {date.toLocaleString("th-TH", { month: "long" })}
                                                                </div>
                                                                <div className="text-primary fw-bold text-uppercase small" style={{ letterSpacing: '1px' }}>
                                                                    {date.toLocaleString("en-US", { month: "long" })}
                                                                </div>
                                                            </div>
                                                            <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="btn btn-sm btn-light border-0">
                                                                <span className="h5 mb-0 text-muted">{">"}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="category">
                                    <Form.Label className="inc-label">
                                        <FaList className="me-2" /> หมวดหมู่ (Category)
                                    </Form.Label>
                                    <div className="inc-input-group">
                                        <span className="inc-input-icon"><FaList /></span>
                                        <Form.Select
                                            name="category"
                                            value={formData.category}
                                            onChange={(e) => {
                                                setFormData({
                                                    ...formData,
                                                    category: e.target.value,
                                                    brand: '',
                                                    model: ''
                                                });
                                            }}
                                            required
                                            className="inc-select"
                                        >
                                            <option value="">-- กรุณาเลือกหมวดหมู่ --</option>
                                            {Object.keys(CATEGORY_OPTIONS).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                            <option value="อื่นๆ">อื่นๆ</option>
                                        </Form.Select>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-4">
                            <Col md={4}>
                                <Form.Group controlId="assetId">
                                    <Form.Label className="inc-label">
                                        <FaBarcode className="me-2" /> เลขครุภัณฑ์
                                    </Form.Label>
                                    <div className="inc-input-group">
                                        <span className="inc-input-icon"><FaBarcode /></span>
                                        <Form.Control
                                            type="text"
                                            name="assetId"
                                            value={formData.assetId}
                                            onChange={handleChange}
                                            placeholder="ระบุหมายเลขครุภัณฑ์"
                                            required
                                            className="inc-input"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group controlId="brand">
                                    <Form.Label className="inc-label">
                                        <FaTag className="me-2" /> ยี่ห้อ / ประเภท
                                    </Form.Label>
                                    <div className="inc-input-group">
                                        <span className="inc-input-icon"><FaTag /></span>
                                        <input
                                            type="text"
                                            name="brand"
                                            list="brand-suggestions"
                                            value={formData.brand}
                                            onChange={handleChange}
                                            placeholder="พิมพ์หรือเลือกยี่ห้อ/ประเภท"
                                            required
                                            className="inc-input"
                                            autoComplete="off"
                                        />
                                        <datalist id="brand-suggestions">
                                            {(CATEGORY_OPTIONS[formData.category] || []).map(opt => (
                                                <option key={opt} value={opt} />
                                            ))}
                                        </datalist>
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group controlId="model">
                                    <Form.Label className="inc-label">
                                        <FaBox className="me-2" /> รุ่น (Model)
                                    </Form.Label>
                                    <div className="inc-input-group">
                                        <span className="inc-input-icon"><FaBox /></span>
                                        <Form.Control
                                            type="text"
                                            name="model"
                                            value={formData.model}
                                            onChange={handleChange}
                                            placeholder="ระบุรุ่น (ถ้ามี)"
                                            className="inc-input"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-4">
                            <Col md={4}>
                                <Form.Group controlId="serialNumber">
                                    <Form.Label className="inc-label">
                                        <FaBarcode className="me-2" /> S/N (Serial Number)
                                    </Form.Label>
                                    <div className="inc-input-group">
                                        <span className="inc-input-icon">#</span>
                                        <Form.Control
                                            type="text"
                                            name="serialNumber"
                                            value={formData.serialNumber}
                                            onChange={handleChange}
                                            placeholder="ระบุ Serial Number"
                                            className="inc-input"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group controlId="department">
                                    <Form.Label className="inc-label">
                                        <FaBuilding className="me-2" /> หน่วยงาน
                                    </Form.Label>
                                    <div className="inc-input-group">
                                        <span className="inc-input-icon"><FaBuilding /></span>
                                        <Form.Control
                                            type="text"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            placeholder="ระบุหน่วยงาน"
                                            required
                                            className="inc-input"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group controlId="remarks">
                                    <Form.Label className="inc-label">
                                        <FaStickyNote className="me-2" /> หมายเหตุ
                                        <span style={{ color: '#ef4444', marginLeft: '6px' }}>*</span>
                                    </Form.Label>
                                    <div className="inc-input-group" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '6px' }}>
                                        {/* Dropdown ตัวเลือกสำเร็จรูป */}
                                        <div style={{ width: '100%' }}>
                                            <Form.Select
                                                size="sm"
                                                className={`inc-select${remarkError ? ' border-danger' : ''}`}
                                                value={REMARK_OPTIONS.includes(formData.remarks) ? formData.remarks : ''}
                                                onChange={(e) => handleRemarksChange(e.target.value)}
                                            >
                                                <option value="">-- เลือกหมายเหตุ --</option>
                                                {REMARK_OPTIONS.map((opt, i) => (
                                                    <option key={i} value={opt}>{opt}</option>
                                                ))}
                                            </Form.Select>
                                        </div>
                                        {/* Input พิมพ์เพิ่มเติม */}
                                        <div className="inc-input-group" style={{ width: '100%', marginBottom: 0 }}>
                                            <span className="inc-input-icon" style={{ paddingTop: '0.55rem' }}><FaStickyNote /></span>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                id="remarks"
                                                name="remarks"
                                                value={formData.remarks}
                                                onChange={(e) => handleRemarksChange(e.target.value)}
                                                className={`inc-input${remarkError ? ' border-danger' : ''}`}
                                                placeholder={remarkError ? '⚠ ช่องนี้หัวหน้า IT ให้กรอกด้วย!' : 'หรือพิมพ์หมายเหตุอื่นๆ...'}
                                                style={{ resize: 'none' }}
                                            />
                                        </div>
                                        {/* ข้อความแจ้งเตือน */}
                                        {remarkError && (
                                            <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', paddingLeft: '6px' }}>
                                                ⚠ หัวหน้า IT ให้กรอกด้วย!
                                            </div>
                                        )}
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* ── Photo & Signature Row ── */}
                        <Row className="mb-3">
                            {/* Photo capture */}
                            <Col md={6}>
                                <div className="inc-media-label">
                                    <FaCamera className="me-2" /> เลือกหมวดหมู่ก่อนเสมอและค่อยถ่ายรูปเลขครุภัณฑ์
                                </div>
                                <div
                                    className="inc-photo-box"
                                    onClick={() => !ocrLoading && photoInputRef.current.click()}
                                >
                                    {photoData ? (
                                        <>
                                            <img src={photoData} alt="preview" className="inc-photo-preview" />
                                            <button
                                                type="button"
                                                className="inc-photo-clear"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPhotoData('');
                                                    setOcrResult('');
                                                    photoInputRef.current.value = '';
                                                }}
                                            >
                                                <FaTrash />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="inc-photo-placeholder">
                                            <FaCamera className="inc-photo-icon" />
                                            <span>แตะเพื่อถ่ายรูป / เลือกไฟล์</span>
                                        </div>
                                    )}
                                </div>

                                {/* OCR status */}
                                {ocrLoading && (
                                    <div className="inc-ocr-status inc-ocr-status--loading">
                                        <span className="inc-ocr-spinner" />
                                        <span>กำลังอ่านตัวเลขจากรูป...</span>
                                    </div>
                                )}
                                {!ocrLoading && ocrResult && (
                                    <div className={`inc-ocr-status ${ocrResult === 'ไม่พบตัวเลข' || ocrResult === 'OCR ผิดพลาด' ? 'inc-ocr-status--warn' : 'inc-ocr-status--ok'}`}>
                                        {ocrResult === 'ไม่พบตัวเลข' || ocrResult === 'OCR ผิดพลาด'
                                            ? `⚠️ ${ocrResult}`
                                            : `✅ อ่านได้: ${ocrResult} → ใส่ในช่องเลขครุภัณฑ์แล้ว`
                                        }
                                    </div>
                                )}

                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handlePhotoChange}
                                />
                            </Col>

                            {/* Signature pad */}
                            <Col md={6}>
                                <div className="inc-sig-card">
                                    {/* Header */}
                                    <div className="inc-sig-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="inc-media-label" style={{ width: 'auto', marginBottom: 0 }}>
                                                <FaSignature className="me-2" />ลายเซ็นเจ้าหน้าที่
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-success shadow-sm"
                                                style={{ 
                                                    borderRadius: '20px', 
                                                    fontWeight: '400', 
                                                    fontSize: '0.83rem',
                                                    padding: '0.26rem 0.9rem',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.42rem',
                                                    letterSpacing: '1.1px'
                                                }}
                                                onClick={saveSignatureLocally}
                                            >
                                                <FaSave /> เพิ่มลายเซ็น
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            className="inc-sig-clear-btn"
                                            onClick={clearSignature}
                                        >
                                            <FaEraser className="me-1" /> ล้าง
                                        </button>
                                    </div>

                                    {/* Canvas */}
                                    <div className="inc-sig-box">
                                        <canvas
                                            ref={sigCanvasRef}
                                            width={700}
                                            height={150}
                                            className="inc-sig-canvas"
                                            onMouseDown={sigStart}
                                            onMouseMove={sigMove}
                                            onMouseUp={sigEnd}
                                            onMouseLeave={sigEnd}
                                            onTouchStart={sigStart}
                                            onTouchMove={sigMove}
                                            onTouchEnd={sigEnd}
                                        />
                                        {!signatureData && (
                                            <div className="inc-sig-hint">เซ็นชื่อในช่องนี้</div>
                                        )}
                                    </div>

                                    {/* Officer info */}
                                    <div className="inc-sig-footer">
                                        <div className="inc-sig-footer-field">
                                            <label className="inc-sig-footer-label">ชื่อเจ้าหน้าที่</label>
                                            <input
                                                type="text"
                                                className="inc-sig-footer-input"
                                                value={officerName}
                                                onChange={handleOfficerNameChange}
                                                placeholder="ระบุชื่อ-นามสกุล"
                                                list="officer-names-list"
                                            />
                                            <datalist id="officer-names-list">
                                                <option value="จันทกานต์ จันทร์ตาใหม่" />
                                                <option value="ฉันทวัฒน์ สุทธิพงษ์" />
                                                <option value="ณรงค์ รวมสุข" />
                                                <option value="ณัฐวุฒิ อินต๊ะผัด" />
                                                <option value="ทรงกลด สิงห์สันต์" />
                                                <option value="ธนากร ลุงหม่อง" />
                                                <option value="บรรเจิด สลักพิศพักตร์" />
                                                <option value="พัชชามาศ กาแก้ว" />
                                                <option value="ภาณุพงศ์ เชื่อมชิต" />
                                                <option value="มนตรี เครือซุย" />
                                                <option value="รสริน อุทิศเวทศักดิ์" />
                                                <option value="ศิวาพร ยอดเมือง" />
                                                <option value="อณุศักดิ์ เวียงนาค" />
                                                <option value="อาจารีย์ โสภากร" />
                                            </datalist>
                                        </div>
                                        <div className="inc-sig-footer-divider"></div>
                                        <div className="inc-sig-footer-field">
                                            <label className="inc-sig-footer-label">วันที่</label>
                                            <div className="inc-sig-footer-date">{officerDate}</div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <div className="inc-action-bar">
                            <button
                                type="button"
                                className="inc-btn inc-btn--back"
                                onClick={() => navigate('/')}
                            >
                                <FaHome className="inc-btn-icon" />
                                <span>กลับเมนูหลัก</span>
                            </button>
                            <button
                                type="submit"
                                className="inc-btn inc-btn--save"
                                disabled={loading}
                            >
                                <FaSave className="inc-btn-icon" />
                                <span>{loading ? 'กำลังบันทึก...' : 'บันทึกรับเข้า (Incoming)'}</span>
                            </button>
                        </div>
                    </Form>
                </div>
            </div>

            <ItemDetailModal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                item={selectedItem}
            />

            {/* ── Success Popup ── */}
            {showSuccessPopup && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.25s ease'
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, #0f2b4a 0%, #1a3a5c 60%, #0d2137 100%)',
                        border: '1.5px solid rgba(56,189,248,0.35)',
                        borderRadius: '24px',
                        boxShadow: '0 8px 60px rgba(56,189,248,0.25), 0 2px 20px rgba(0,0,0,0.6)',
                        padding: '48px 52px 40px',
                        maxWidth: '420px',
                        width: '90%',
                        textAlign: 'center',
                        animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)'
                    }}>
                        {/* Icon */}
                        <div style={{
                            width: '88px', height: '88px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            boxShadow: '0 0 0 14px rgba(34,197,94,0.15), 0 4px 24px rgba(34,197,94,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                            fontSize: '2.6rem',
                            animation: 'bounceIn 0.5s 0.15s both'
                        }}>
                            ✓
                        </div>

                        {/* Title */}
                        <div style={{
                            fontSize: '1.65rem',
                            fontWeight: '800',
                            color: '#f0f9ff',
                            letterSpacing: '0.5px',
                            marginBottom: '10px',
                            textShadow: '0 2px 12px rgba(56,189,248,0.3)'
                        }}>บันทึกข้อมูลสำเร็จ!</div>

                        {/* Sub */}
                        <div style={{
                            color: '#94d1f5',
                            fontSize: '0.97rem',
                            marginBottom: '32px',
                            lineHeight: 1.6
                        }}>ข้อมูลพัสดุรับเข้าได้ถูกบันทึก<br/>เข้าระบบเรียบร้อยแล้ว</div>

                        {/* Button */}
                        <button
                            onClick={() => setShowSuccessPopup(false)}
                            style={{
                                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                border: 'none',
                                borderRadius: '50px',
                                color: '#fff',
                                fontWeight: '700',
                                fontSize: '1.05rem',
                                padding: '12px 48px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(34,197,94,0.45)',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                                letterSpacing: '0.5px'
                            }}
                            onMouseOver={e => { e.currentTarget.style.transform='scale(1.06)'; e.currentTarget.style.boxShadow='0 6px 28px rgba(34,197,94,0.6)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(34,197,94,0.45)'; }}
                        >ตกลง</button>

                        <style>{`
                            @keyframes fadeIn { from{opacity:0} to{opacity:1} }
                            @keyframes popIn { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
                            @keyframes bounceIn { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
                        `}</style>
                    </div>
                </div>
            )}

            {/* ── Error Popup (Scary Warning) ── */}
            {showErrorPopup && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease'
                }}>
                    <div className="alert-shake" style={{
                        background: 'linear-gradient(145deg, #2a0a0a 0%, #1a0505 100%)',
                        border: '2px solid rgba(255, 77, 79, 0.6)',
                        borderRadius: '24px',
                        boxShadow: '0 8px 60px rgba(255, 77, 79, 0.4), 0 2px 20px rgba(0,0,0,0.8)',
                        padding: '40px 48px',
                        maxWidth: '420px',
                        width: '90%',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #ff4d4f, #820014, #ff4d4f)', backgroundSize: '200% 100%', animation: 'gradientMove 2s infinite linear' }}></div>
                        
                        {/* Icon */}
                        <div style={{
                            width: '88px', height: '88px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            boxShadow: '0 0 0 14px rgba(239,68,68,0.15), 0 4px 24px rgba(239,68,68,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                            fontSize: '2.8rem',
                            animation: 'bounceIn 0.4s 0.1s both',
                            color: '#fff'
                        }}>
                            ⚠️
                        </div>

                        {/* Title */}
                        <div style={{
                            fontSize: '1.45rem',
                            fontWeight: '800',
                            color: '#ff4d4f',
                            letterSpacing: '0.5px',
                            marginBottom: '12px',
                            textShadow: '0 2px 12px rgba(239,68,68,0.5)',
                            lineHeight: '1.4'
                        }}>
                            หัวหน้า IT<br/>ให้ใส่ทุกครั้งไม่งั้นจะบันทึกไม่ได้!
                        </div>

                        {/* Sub */}
                        <div style={{
                            color: '#fca5a5',
                            fontSize: '0.95rem',
                            marginBottom: '32px',
                            lineHeight: 1.5
                        }}>
                            กรุณาระบุหมายเหตุการรับเข้าพัสดุในช่อง<br/>
                            <strong className="text-white">"-- เลือกหมายเหตุ --"</strong> หรือพิมพ์เพิ่มเติม
                        </div>

                        {/* Button */}
                        <button
                            onClick={() => {
                                setShowErrorPopup(false);
                                const el = document.getElementById('remarks');
                                if (el) {
                                    el.focus();
                                }
                            }}
                            style={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                border: 'none',
                                borderRadius: '50px',
                                color: '#fff',
                                fontWeight: '700',
                                fontSize: '1.05rem',
                                padding: '12px 48px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(239,68,68,0.5)',
                                transition: 'all 0.2s',
                                letterSpacing: '0.5px',
                                width: '100%'
                            }}
                            onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 28px rgba(239,68,68,0.6)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(239,68,68,0.5)'; }}
                        >รับทราบ</button>

                        <style>{`
                            @keyframes hardShake {
                                0%, 100% { transform: translateX(0); }
                                20%, 60% { transform: translateX(-10px); }
                                40%, 80% { transform: translateX(10px); }
                            }
                            .alert-shake {
                                animation: hardShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                            }
                            @keyframes gradientMove {
                                0% { background-position: 100% 0; }
                                100% { background-position: -100% 0; }
                            }
                        `}</style>
                    </div>
                </div>
            )}
        </>
    );
}





