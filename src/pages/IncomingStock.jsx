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
    const [stocksLoading, setStocksLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const serialInputRef = useRef(null);
    const [stocks, setStocks] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

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
        "คอมพิวเตอร์ PC-Notebook": ["HP", "Dell", "Lenovo", "Acer", "Asus", "LG", "Samsung", "MSI", "AOC", "Philips", "Apple"],
        "TV": ["HP", "Dell", "Lenovo", "Acer", "Asus", "LG", "Samsung", "MSI", "AOC", "Philips", "Apple"],
        "Tablet": ["HP", "Dell", "Lenovo", "Acer", "Asus", "LG", "Samsung", "MSI", "Apple"],
        "Printer": [
            "เครื่องพิมพ์ประเภทหัวเข็ม (Dot Matrix Printer)",
            "เครื่องพิมพ์อิงค์เจ็ท (Inkjet Printer)",
            "เครื่องพิมพ์เลเซอร์ (Laser Printer)",
            "เครื่องพิมพ์ความร้อน (Thermal Printer)",
            "เครื่องพิมพ์พล็อตเตอร์ (Plotter Printer)"
        ],
        "UPS (เครื่องสำรองไฟ)": ["APC", "Eaton", "Delta", "Cyberpower", "Vertiv", "Chuphotic", "Cleanline", "Leonics", "Syndome", "Zircon"],
        "จอคอมพิวเตอร์": [
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
                category: encryptData(formData.category), // New field
                brandModel: encryptData(`${formData.category} ${formData.brand} ${formData.model}`.trim()),
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
                        brandModel: decryptData(item.brandModel),
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
            <Card className="shadow-sm border-0">
                <Card.Header as="h5" className="bg-white py-4 text-dark border-0 fw-bold px-4">
                    รับเข้า Stock (Incoming)
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Row className="mb-4">
                            <Col md={6}>
                                <Form.Group controlId="surveyDate">
                                    <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.85rem' }}>
                                        <FaCalendarAlt className="me-2" /> ว/ด/ป สำรวจ
                                    </Form.Label>
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-white text-muted border-end-0">
                                            <FaCalendarAlt />
                                        </span>
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
                                                className="form-control border-start-0 ps-0 py-2 w-100"
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
                                    <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.85rem' }}>
                                        <FaList className="me-2" /> หมวดหมู่ (Category)
                                    </Form.Label>
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-white text-muted border-end-0">
                                            <FaList />
                                        </span>
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
                                            className="border-start-0 ps-0 py-2"
                                            style={{ backgroundColor: '#fff', cursor: 'pointer', height: '100%' }}
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
                                    <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.85rem' }}>
                                        <FaBarcode className="me-2" /> เลบครุภัณฑ์
                                    </Form.Label>
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-white text-muted border-end-0">
                                            <FaBarcode />
                                        </span>
                                        <Form.Control
                                            type="text"
                                            name="assetId"
                                            value={formData.assetId}
                                            onChange={handleChange}
                                            placeholder="ระบุหมายเลขครุภัณฑ์"
                                            required
                                            className="border-start-0 ps-0 py-2"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group controlId="brand">
                                    <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.85rem' }}>
                                        <FaTag className="me-2" /> ยี่ห้อ / ประเภท
                                    </Form.Label>
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-white text-muted border-end-0">
                                            <FaTag />
                                        </span>
                                        {formData.category && CATEGORY_OPTIONS[formData.category] ? (
                                            <Form.Select
                                                name="brand"
                                                value={formData.brand}
                                                onChange={handleChange}
                                                required
                                                className="border-start-0 ps-0 py-2"
                                                style={{ cursor: 'pointer' }}
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
                                                className="border-start-0 ps-0 py-2"
                                            />
                                        )}
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group controlId="model">
                                    <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.85rem' }}>
                                        <FaBox className="me-2" /> รุ่น (Model)
                                    </Form.Label>
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-white text-muted border-end-0">
                                            <FaBox />
                                        </span>
                                        <Form.Control
                                            type="text"
                                            name="model"
                                            value={formData.model}
                                            onChange={handleChange}
                                            placeholder="ระบุรุ่น (ถ้ามี)"
                                            className="border-start-0 ps-0 py-2"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-4">
                            <Col md={4}>
                                <Form.Group controlId="serialNumber">
                                    <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.85rem' }}>
                                        <FaBarcode className="me-2" /> S/N (Serial Number)
                                    </Form.Label>
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-white text-muted border-end-0">
                                            #
                                        </span>
                                        <Form.Control
                                            type="text"
                                            name="serialNumber"
                                            value={formData.serialNumber}
                                            onChange={handleChange}
                                            placeholder="ระบุ Serial Number"
                                            className="border-start-0 ps-0 py-2"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group controlId="department">
                                    <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.85rem' }}>
                                        <FaBuilding className="me-2" /> หน่วยงาน
                                    </Form.Label>
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-white text-muted border-end-0">
                                            <FaBuilding />
                                        </span>
                                        <Form.Control
                                            type="text"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            placeholder="ระบุหน่วยงาน"
                                            required
                                            className="border-start-0 ps-0 py-2"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group controlId="building">
                                    <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.85rem' }}>
                                        <FaBuilding className="me-2" /> อาคาร
                                    </Form.Label>
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-white text-muted border-end-0">
                                            <FaBuilding />
                                        </span>
                                        <Form.Control
                                            type="text"
                                            name="building"
                                            value={formData.building}
                                            onChange={handleChange}
                                            placeholder="ระบุอาคาร"
                                            required
                                            className="border-start-0 ps-0 py-2"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-4">
                            <Col md={12}>
                                <Form.Group controlId="remarks">
                                    <Form.Label className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.85rem' }}>
                                        <FaStickyNote className="me-2" /> หมายเหตุ
                                    </Form.Label>
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-white text-muted border-end-0">
                                            <FaStickyNote />
                                        </span>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleChange}
                                            className="border-start-0 ps-0 py-2"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                            <Button
                                variant="warning"
                                className="me-md-2"
                                size="lg"
                                onClick={() => navigate('/')}
                            >
                                <FaHome className="me-2" /> กลับเมนูหลัก
                            </Button>
                            <Button variant="primary" type="submit" disabled={loading} size="lg">
                                <FaSave className="me-2" /> บันทึกรับเข้า (Incoming)
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            <Card className="shadow-sm border-0 mt-4">
                <Card.Header className="bg-white py-3">
                    <h5 className="mb-0 text-primary fw-bold">
                        <FaClipboardList className="me-2" /> รายการพัสดุล่าสุด (Latest Items)
                    </h5>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover striped className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>วันที่</th>
                                    <th>หมายเลขพัสดุ</th>
                                    <th>ยี่ห้อ/รุ่น</th>
                                    <th>หน่วยงาน</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stocksLoading ? (
                                    <tr><td colSpan="5" className="text-center py-4">กำลังโหลดข้อมูล...</td></tr>
                                ) : stocks.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-4 text-muted">ไม่พบข้อมูล</td></tr>
                                ) : stocks.slice(0, 5).map((stock) => (
                                    <tr
                                        key={stock.id}
                                        onClick={() => handleRowClick(stock)}
                                        style={{ cursor: 'pointer' }}
                                        title="คลิกเพื่อดูรายละเอียด"
                                    >
                                        <td>{stock.importDate}</td>
                                        <td className="fw-bold">{stock.assetId}</td>
                                        <td>{stock.brandModel}</td>
                                        <td>{stock.department}</td>
                                        <td>
                                            <Badge bg={stock.status === 'รับเข้า' ? 'success' : (stock.status === 'จำหน่าย' ? 'danger' : 'warning')}>
                                                {stock.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            <ItemDetailModal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                item={selectedItem}
            />
        </>
    );
}


