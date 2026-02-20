import React, { useState, useEffect, useRef } from 'react';
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
import { FaSave, FaHome, FaCalendarAlt, FaList, FaBarcode, FaTag, FaBox, FaBuilding, FaStickyNote, FaChevronLeft, FaChevronRight, FaClipboardList } from 'react-icons/fa';
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
        "คอมพิวเตอร์ PC-Notebook": ["HP", "Dell", "Lenovo", "Acer", "Asus", "Samsung", "MSI", "Apple"],
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
            "สแกนเนอร์ Brother Scanner ",

        ]
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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
                        รับเข้าพัสดุ <small>(Incoming Stock)</small>
                    </h2>
                </div>
            </div>

            <div className="latest-panel">
                {/* Panel Header */}
                <div className="latest-panel-header">
                    <div className="latest-panel-title-wrap">
                        <div className="latest-panel-dot"></div>
                        <span className="latest-panel-title">กรอกข้อมูลพัสดุ</span>
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
                                        {formData.category && CATEGORY_OPTIONS[formData.category] ? (
                                            <Form.Select
                                                name="brand"
                                                value={formData.brand}
                                                onChange={handleChange}
                                                required
                                                className="inc-select"
                                            >
                                                <option value="">-- เลือกยี่ห้อ --</option>
                                                {CATEGORY_OPTIONS[formData.category].map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </Form.Select>
                                        ) : (
                                            <Form.Control
                                                type="text"
                                                name="brand"
                                                value={formData.brand}
                                                onChange={handleChange}
                                                placeholder="ระบุยี่ห้อ/ประเภท"
                                                required
                                                className="inc-input"
                                            />
                                        )}
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
                        </Row>

                        <Row className="mb-4">
                            <Col md={12}>
                                <Form.Group controlId="remarks">
                                    <Form.Label className="inc-label">
                                        <FaStickyNote className="me-2" /> หมายเหตุ
                                    </Form.Label>
                                    <div className="inc-input-group">
                                        <span className="inc-input-icon"><FaStickyNote /></span>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleChange}
                                            className="inc-input"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end gap-2 pt-2">
                            <Button
                                variant="warning"
                                size="lg"
                                onClick={() => navigate('/')}
                                style={{ fontWeight: 700 }}
                            >
                                <FaHome className="me-2" /> กลับเมนูหลัก
                            </Button>
                            <Button variant="success" type="submit" disabled={loading} size="lg" className="btn-incoming-submit">
                                <FaSave className="me-2" /> บันทึกรับเข้า (Incoming)
                            </Button>
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





