import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { FaPrint, FaTimes } from 'react-icons/fa';

export default function ItemDetailModal({ show, onHide, item }) {
    const [selections, setSelections] = React.useState({
        add: false,
        replace: false,
        return: false
    });

    if (!item) return null;

    const handlePrint = () => {
        window.print();
    };

    const toggleSelection = (type) => {
        setSelections(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            centered
            className="item-detail-modal"
        >
            <Modal.Header closeButton className="d-print-none">
                <Modal.Title className="text-primary">รายละเอียดพัสดุ</Modal.Title>
            </Modal.Header>
            <Modal.Body id="printable-area">
                <style>
                    {`
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            #printable-area, #printable-area * {
                                visibility: visible;
                            }
                            #printable-area {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 148mm; /* A5 Portrait width */
                                height: 210mm; /* A5 Portrait height */
                                padding: 0;
                                margin: 0;
                                background: white !important;
                                -webkit-print-color-adjust: exact;
                            }
                            .d-print-none {
                                display: none !important;
                            }
                            @page {
                                size: A5 portrait;
                                margin: 0;
                            }
                            .a5-container {
                                border: none !important;
                                box-shadow: none !important;
                                padding: 5mm 8mm !important; 
                                width: 100% !important;
                                max-width: none !important;
                                margin: 0 !important;
                            }
                        }
                        .a5-container {
                            width: 100%;
                            max-width: 500px; /* Thinner for portrait feel in Modal */
                            margin: 0 auto;
                            font-family: 'Sarabun', sans-serif;
                            color: #333;
                            border: 1px solid #ddd;
                            padding: 20px;
                            background: #fff;
                            overflow: hidden; /* Prevent bleed */
                        }
                        .a5-header {
                            text-align: center;
                            text-decoration: underline;
                            font-weight: bold;
                            font-size: 18px;
                            margin-bottom: 20px;
                        }
                        .a5-row {
                            display: flex;
                            margin-bottom: 12px;
                            align-items: baseline;
                            font-size: 14px;
                        }
                        .a5-label {
                            min-width: 120px;
                            font-weight: bold;
                        }
                        .a5-value {
                            flex: 1;
                            border-bottom: 1px dotted #666;
                            padding-left: 10px;
                            font-weight: normal;
                            min-height: 20px;
                            word-break: break-all;
                        }
                        .checkbox-group {
                            display: flex;
                            gap: 15px;
                            margin-top: 15px;
                            margin-bottom: 15px;
                            font-size: 14px;
                        }
                        .checkbox-item {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            cursor: pointer;
                        }
                        .checkbox-box {
                            width: 16px;
                            height: 16px;
                            border: 1px solid #000;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 12px;
                            font-weight: bold;
                        }
                        .signature-section {
                            margin-top: 25px; /* Tighter for portrait */
                            display: flex;
                            justify-content: space-between;
                        }
                        .signature-box {
                            text-align: center;
                            width: 45%; /* Use percentage for safety */
                            font-size: 13px;
                        }
                        .signature-line {
                            border-bottom: 1px dotted #000;
                            margin-bottom: 6px;
                            padding-top: 15px;
                        }
                    `}
                </style>
                <div className="a5-container">
                    <div className="a5-header text-dark">
                        ใบเซ็นรับ/คืน คอมพิวเตอร์และอุปกรณ์ต่อพ่วง
                    </div>

                    <div className="a5-row">
                        <div className="a5-label">หน่วยงาน:</div>
                        <div className="a5-value">{item.department || '-'} {item.building && `(${item.building})`}</div>
                    </div>

                    <div className="a5-row">
                        <div className="a5-label">ประเภทครุภัณฑ์:</div>
                        <div className="a5-value">{item.category || '-'}</div>
                    </div>

                    <div className="a5-row">
                        <div className="a5-label">Computer Name:</div>
                        <div className="a5-value">{item.computerName || '-'}</div>
                    </div>

                    <div className="a5-row">
                        <div className="a5-label">Serial Number:</div>
                        <div className="a5-value">{item.serialNumber || '-'}</div>
                    </div>

                    <div className="a5-row">
                        <div className="a5-label">เลขครุภัณฑ์:</div>
                        <div className="a5-value fw-bold">{item.assetId || '-'}</div>
                    </div>

                    <div className="a5-row">
                        <div className="a5-label">ยี่ห้อ/รุ่น:</div>
                        <div className="a5-value">{item.brandModel || '-'}</div>
                    </div>

                    <div className="checkbox-group mt-3">
                        <div className="checkbox-item" onClick={() => toggleSelection('add')}>
                            <span className="checkbox-box">{selections.add ? '✓' : ''}</span> เพิ่ม
                        </div>
                        <div className="checkbox-item" onClick={() => toggleSelection('replace')}>
                            <span className="checkbox-box">{selections.replace ? '✓' : ''}</span> ทดแทน
                        </div>
                        <div className="checkbox-item" onClick={() => toggleSelection('return')}>
                            <span className="checkbox-box">{selections.return ? '✓' : ''}</span> คืน IT (ชำรุด,ไม่ได้ใช้งาน)
                        </div>
                    </div>

                    <div className="a5-row mt-3">
                        <div className="a5-label">หมายเหตุ:</div>
                        <div className="a5-value">
                            {item.remarks === '-' ? '' : item.remarks}
                        </div>
                    </div>

                    <div className="signature-section">
                        <div className="signature-box">
                            <div className="signature-line"></div>
                            <div>(......................................................)</div>
                            <div className="mt-2">เจ้าหน้าที่คอมพิวเตอร์</div>
                        </div>
                        <div className="signature-box">
                            <div className="signature-line"></div>
                            <div>(......................................................)</div>
                            <div className="mt-2 text-danger fw-bold">ผู้รับอุปกรณ์</div>
                            <small className="text-muted d-block" style={{ fontSize: '10px' }}>**กรอกชื่อ-นามสกุลตัวบรรจงเท่านั้น**</small>
                        </div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="d-print-none">
                <Button variant="secondary" onClick={onHide}>
                    <FaTimes className="me-2" /> ปิด
                </Button>
                <Button variant="primary" onClick={handlePrint}>
                    <FaPrint className="me-2" /> พิมพ์ (A5)
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
