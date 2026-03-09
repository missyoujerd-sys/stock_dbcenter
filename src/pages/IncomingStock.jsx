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
import { FaSave, FaHome, FaCalendarAlt, FaList, FaBarcode, FaTag, FaBox, FaBuilding, FaStickyNote, FaChevronLeft, FaChevronRight, FaClipboardList, FaCamera, FaSignature, FaTrash, FaEraser } from 'react-icons/fa';
import ItemDetailModal from '../components/ItemDetailModal';

registerLocale('th', th);

export default function IncomingStock() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

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
        "คอมพิวเตอร์ PC-Notebook":
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
            "จอคอมพิวเตอร์ LG "
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

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            setSuccess('บันทึกข้อมูลสำเร็จ!');
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

            <div className="latest-panel">
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
                                    </Form.Label>
                                    <div className="inc-input-group" style={{ alignItems: 'flex-start' }}>
                                        <span className="inc-input-icon" style={{ paddingTop: '0.55rem' }}><FaStickyNote /></span>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleChange}
                                            className="inc-input"
                                            placeholder="บันทึกหมายเหตุ (ถ้ามี)"
                                            style={{ resize: 'none' }}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* ── Photo & Signature Row ── */}
                        <Row className="mb-3">
                            {/* Photo capture */}
                            <Col md={6}>
                                <div className="inc-media-label">
                                    <FaCamera className="me-2" /> ให้ถ่ายรูปได้เฉพาะเลขครุภัณฑ์/ยี่ห้อ เท่านั้น
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
                                    capture="environment"
                                    style={{ display: 'none' }}
                                    onChange={handlePhotoChange}
                                />
                            </Col>

                            {/* Signature pad */}
                            <Col md={6}>
                                <div className="inc-sig-card">
                                    {/* Header */}
                                    <div className="inc-sig-card-header">
                                        <span className="inc-media-label" style={{ width: 'auto', marginBottom: 0 }}>
                                            <FaSignature className="me-2" />ลายเซ็นเจ้าหน้าที่
                                        </span>
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
                                                onChange={(e) => setOfficerName(e.target.value)}
                                                placeholder="ระบุชื่อ-นามสกุล"
                                                list="officer-names-list"
                                            />
                                            <datalist id="officer-names-list">
                                                <option value="Admin IT" />
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
        </>
    );
}





