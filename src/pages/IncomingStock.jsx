import React, { useState, useRef } from 'react';
import { Form, Button, Card, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { db } from '../firebase';
import { ref, push, set } from 'firebase/database';
import { encryptData } from '../utils/encryption';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaHome, FaChevronLeft, FaChevronRight, FaBarcode } from 'react-icons/fa';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { th, enUS } from 'date-fns/locale';
import { format } from 'date-fns';

registerLocale('th', th);

export default function IncomingStock() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
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
        remarks: ''
    });

    const CATEGORY_OPTIONS = {
        "คอมพิวเตอร์ PC - Notebook": ["HP", "Dell", "Lenovo", "Acer", "Asus", "LG", "Samsung", "MSI", "AOC", "Philips", "Apple"],
        "จอคอมพิวเตอร์": ["HP", "Dell", "Lenovo", "Acer", "Asus", "LG", "Samsung", "MSI", "AOC", "Philips", "Apple"],
        "TV": ["HP", "Dell", "Lenovo", "Acer", "Asus", "LG", "Samsung", "MSI", "AOC", "Philips", "Apple"],
        "Tablet": ["HP", "Dell", "Lenovo", "Acer", "Asus", "LG", "Samsung", "MSI", "Apple"],
        "Printer": [
            "เครื่องพิมพ์ประเภทหัวเข็ม (Dot Matrix Printer)",
            "เครื่องพิมพ์อิงค์เจ็ท (Inkjet Printer)",
            "เครื่องพิมพ์เลเซอร์ (Laser Printer)",
            "เครื่องพิมพ์ความร้อน (Thermal Printer)",
            "เครื่องพิมพ์พล็อตเตอร์ (Plotter Printer)"
        ],
        "Scanner": [
            "สแกนเนอร์ Canon PIXMA ",
            "สแกนเนอร์ Epson Scaner ",
            "สแกนเนอร์ FUJITSU Scanner ",
            "สแกนเนอร์ Brother ",
            "สแกนเนอร์ Aibecy ",
            "สแกนเนอร์ HP Deskjet ",
            "สแกนเนอร์ Brother Scanner ",

        ],

        "UPS (เครื่องสำรองไฟ)": ["APC", "Eaton", "Delta", "Cyberpower", "Vertiv", "Chuphotic", "Cleanline", "Leonics", "Syndome", "Zircon"]
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
                remarks: ''
            });
        } catch (err) {
            console.error("Error saving stock:", err);
            setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }

        setLoading(false);
    };

    return (
        <Card className="shadow-sm border-0">
            <Card.Header as="h5" className="bg-white py-4 text-dark border-0 fw-bold px-4">
                รับเข้า Stock (Incoming)
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="surveyDate">
                                <Form.Label>ว/ด/ป สำรวจ</Form.Label>
                                <DatePicker
                                    selected={formData.surveyDate ? new Date(formData.surveyDate) : null}
                                    onChange={(date) => {
                                        if (date) {
                                            const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                                            setFormData({ ...formData, surveyDate: offsetDate.toISOString().split('T')[0] });
                                        } else {
                                            setFormData({ ...formData, surveyDate: '' });
                                        }
                                    }}
                                    dateFormat="dd/MM/yyyy"
                                    locale="th"
                                    className="form-control"
                                    renderCustomHeader={({
                                        date,
                                        changeYear,
                                        changeMonth,
                                        decreaseMonth,
                                        increaseMonth,
                                        prevMonthButtonDisabled,
                                        nextMonthButtonDisabled,
                                    }) => (
                                        <div
                                            style={{
                                                margin: 10,
                                                display: "flex",
                                                justifyContent: "center",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                backgroundColor: "#f8f9fa",
                                                padding: "10px",
                                                borderRadius: "8px 8px 0 0"
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                                                <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} type="button" className="btn btn-sm btn-light border-0">
                                                    <FaChevronLeft />
                                                </button>
                                                <div style={{ textAlign: "center" }}>
                                                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333", lineHeight: "1.2" }}>
                                                        {format(date, 'MMMM', { locale: th })}
                                                    </div>
                                                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#0d6efd", textTransform: "uppercase", letterSpacing: "1px" }}>
                                                        {format(date, 'MMMM', { locale: enUS })}
                                                    </div>
                                                    <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                                                        {date.getFullYear() + 543}
                                                    </div>
                                                </div>
                                                <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} type="button" className="btn btn-sm btn-light border-0">
                                                    <FaChevronRight />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="category">
                                <Form.Label>หมวดหมู่ (Category)</Form.Label>
                                <Form.Select
                                    name="category"
                                    value={formData.category}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            category: e.target.value,
                                            brand: '', // Reset brand on category change
                                            model: ''
                                        });
                                    }}
                                    required
                                >
                                    <option value="">เลือกหมวดหมู่</option>
                                    {Object.keys(CATEGORY_OPTIONS).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    <option value="อื่นๆ">อื่นๆ</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group controlId="assetId">
                                <Form.Label>หมายเลขครุภัณฑ์ (เลขครุภัณฑ์)</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="assetId"
                                    value={formData.assetId}
                                    onChange={handleChange}
                                    placeholder="ระบุหมายเลขครุภัณฑ์"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group controlId="brand">
                                <Form.Label>ยี่ห้อ / ประเภท</Form.Label>
                                {formData.category && CATEGORY_OPTIONS[formData.category] ? (
                                    <Form.Select
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">เลือกยี่ห้อ/ประเภท</option>
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
                                    />
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group controlId="model">
                                <Form.Label>รุ่น (Model)</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleChange}
                                    placeholder="ระบุรุ่น (ถ้ามี)"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group controlId="serialNumber">
                                <Form.Label>S/N (Serial Number)</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text
                                        onClick={() => serialInputRef.current.focus()}
                                        style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                                        title="คลิกเพื่อสแกนบาร์โค้ด"
                                    >
                                        <FaBarcode />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        name="serialNumber"
                                        ref={serialInputRef}
                                        value={formData.serialNumber}
                                        onChange={handleChange}
                                        placeholder="ระบุ หรือ ยิงบาร์โค้ด"
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group controlId="department">
                                <Form.Label>หน่วยงาน</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    placeholder="ระบุหน่วยงาน"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group controlId="building">
                                <Form.Label>อาคาร</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="building"
                                    value={formData.building}
                                    onChange={handleChange}
                                    placeholder="ระบุอาคาร"
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-4">
                        <Col md={12}>
                            <Form.Group controlId="remarks">
                                <Form.Label>หมายเหตุ</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                />
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
    );
}


