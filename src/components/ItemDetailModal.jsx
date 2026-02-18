import React, { useRef } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { FaPrint, FaTimes } from 'react-icons/fa';

const ItemDetailModal = ({ show, onHide, item }) => {
    const printRef = useRef();

    if (!item) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="item-detail-modal">
            <Modal.Header closeButton className="d-print-none border-0">
                <Modal.Title className="fw-bold">รายละเอียดพัสดุ</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                <div ref={printRef} className="document-container p-5 bg-white mx-auto shadow-sm" style={{ maxWidth: '800px', minHeight: '500px' }}>
                    {/* Header Section */}
                    <div className="text-center mb-5">
                        <h4 className="document-title fw-bold text-decoration-underline mb-4">
                            ใบเซ็นต์รับ/คืน คอมพิวเตอร์และอุปกรณ์ต่อพ่วง
                        </h4>
                    </div>

                    {/* Content Section */}
                    <div className="document-content ps-2" style={{ fontSize: '1.1rem', lineHeight: '2.2' }}>
                        <div className="d-flex mb-2">
                            <span className="fw-bold" style={{ minWidth: '150px' }}>หน่วยงาน:</span>
                            <span className="flex-grow-1 border-bottom-dotted px-2">{item.department || '-'} {item.building && `(${item.building})`}</span>
                            <span className="ms-3 fw-bold">เบอร์โทร.</span>
                            <span className="ms-2 border-bottom-dotted px-2" style={{ minWidth: '150px' }}>{item.phoneNumber || '....................'}</span>
                        </div>

                        <div className="d-flex mb-2">
                            <span className="fw-bold" style={{ minWidth: '150px' }}>ประเภทครุภัณฑ์:</span>
                            <span className="flex-grow-1 border-bottom-dotted px-2">{item.category || '-'}</span>
                        </div>

                        <div className="d-flex mb-2">
                            <span className="fw-bold" style={{ minWidth: '150px' }}>Computer Name:</span>
                            <span className="flex-grow-1 border-bottom-dotted px-2">{item.computerName || '-'}</span>
                        </div>

                        <div className="d-flex mb-2">
                            <span className="fw-bold" style={{ minWidth: '150px' }}>Serial Number:</span>
                            <span className="flex-grow-1 border-bottom-dotted px-2">{item.serialNumber || '-'}</span>
                        </div>

                        <div className="d-flex mb-2">
                            <span className="fw-bold" style={{ minWidth: '150px' }}>เลขครุภัณฑ์:</span>
                            <span className="flex-grow-1 border-bottom-dotted px-2">{item.assetId || '-'}</span>
                        </div>

                        <div className="d-flex mb-2">
                            <span className="fw-bold" style={{ minWidth: '150px' }}>ยี่ห้อ/รุ่น:</span>
                            <span className="flex-grow-1 border-bottom-dotted px-2">{item.brandModel || '-'}</span>
                        </div>

                        {/* Checkboxes Section */}
                        <div className="d-flex gap-4 mt-3 mb-4 ps-4">
                            <div className="d-flex align-items-center">
                                <div className="custom-checkbox me-2"></div>
                                <span>เพิ่ม</span>
                            </div>
                            <div className="d-flex align-items-center">
                                <div className="custom-checkbox me-2"></div>
                                <span>ทดแทน</span>
                            </div>
                            <div className="d-flex align-items-center">
                                <div className="custom-checkbox me-2"></div>
                                <span>คืน IT (ชำรุด,ไม่ใช้งาน)</span>
                            </div>
                        </div>

                        {/* Remarks Section */}
                        <div className="d-flex mb-5">
                            <span className="fw-bold" style={{ minWidth: '100px' }}>หมายเหตุ:</span>
                            <div className="flex-grow-1 border-bottom-dotted min-height-dotted px-2">
                                {item.remarks || ''}
                            </div>
                        </div>

                        {/* Signature Section */}
                        <Row className="mt-5 text-center">
                            <Col xs={6}>
                                <div className="mx-auto mb-2" style={{ width: '250px', borderBottom: '1px dotted #000' }}></div>
                                <div className="mb-2">......../................/............</div>
                                <div className="fw-bold">เจ้าหน้าที่คอมพิวเตอร์</div>
                            </Col>
                            <Col xs={6}>
                                <div className="mx-auto mb-2" style={{ width: '250px', borderBottom: '1px dotted #000' }}></div>
                                <div className="mb-2">......../................/............</div>
                                <div className="fw-bold">ผู้รับอุปกรณ์</div>
                            </Col>
                        </Row>

                        {/* Footer Text */}
                        <div className="text-end mt-5 small fw-bold">
                            **กรอกชื่อ-นามสกุลตัวบรรจงเท่านั้น**
                        </div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="d-print-none border-0">
                <Button variant="outline-secondary" onClick={onHide} className="px-4 border-0">
                    <FaTimes className="me-2" /> ยกเลิก
                </Button>
                <Button variant="primary" onClick={handlePrint} className="px-5 shadow-sm">
                    <FaPrint className="me-2" /> พิมพ์เอกสาร
                </Button>
            </Modal.Footer>

            <style>{`
                .item-detail-modal .modal-content {
                    border: none;
                    border-radius: 12px;
                    overflow: hidden;
                }
                .document-container {
                    font-family: 'Sarabun', sans-serif;
                    color: #000;
                }
                .border-bottom-dotted {
                    border-bottom: 1px dotted #000;
                    min-height: 1.5em;
                }
                .min-height-dotted {
                    min-height: 60px;
                }
                .custom-checkbox {
                    width: 18px;
                    height: 18px;
                    border: 1px solid #000;
                    border-radius: 3px;
                }
                
                @media print {
                    body {
                        background-color: white !important;
                    }
                    .modal-dialog {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .modal-content {
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .modal-header, .modal-footer {
                        display: none !important;
                    }
                    .modal-body {
                        padding: 0 !important;
                    }
                    .document-container {
                        box-shadow: none !important;
                        padding: 1cm !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                }
            `}</style>
        </Modal>
    );
};

export default ItemDetailModal;
