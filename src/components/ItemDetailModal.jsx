import React, { useRef } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { FaPrint, FaTimes } from 'react-icons/fa';

const ItemDetailModal = ({ show, onHide, item }) => {
    const printRef = useRef();

    if (!item) return null;

    const handlePrint = () => {
        window.print();
    };

    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(now);
    const formattedTime = new Intl.DateTimeFormat('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(now);

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="item-detail-modal">
            <Modal.Header closeButton className="d-print-none border-0">
                <Modal.Title className="fw-bold">รายละเอียดพัสดุ</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                <div ref={printRef} className="document-container p-4 bg-white mx-auto shadow-sm position-relative" style={{ maxWidth: '800px', minHeight: '500px' }}>
                    {/* Watermark for UI and printing */}
                    <div className="watermark">
                        จำหน่าย
                    </div>
                    {/* Date/Time Section */}
                    <div className="text-end mb-2 small">
                        <div>วันที่: {formattedDate}</div>
                        <div>เวลา: {formattedTime} น.</div>
                    </div>

                    {/* Header Section */}
                    <div className="text-center mb-5">
                        <h1 className="document-title fw-bold text-decoration-underline mb-4">
                            จำหน่าย
                        </h1>
                    </div>

                    {/* Content Section */}
                    <div className="document-content ps-2" style={{ fontSize: '1.1rem', lineHeight: '2.2' }}>
                        <div className="d-flex mb-2">
                            <span className="fw-bold" style={{ minWidth: '150px' }}>หน่วยงาน:</span>
                            <span className="flex-grow-1 border-bottom-dotted px-2">{item.department || '-'} {item.building && `(${item.building})`}</span>
                            <span className="ms-3 fw-bold">เบอร์โทร.</span>
                            <span className="ms-2 border-bottom-dotted px-2" style={{ minWidth: '150px' }}>{item.phoneNumber || '2299'}</span>
                        </div>

                        <div className="d-flex mb-2">
                            <span className="fw-bold" style={{ minWidth: '150px' }}>ประเภทครุภัณฑ์:</span>
                            <span className="flex-grow-1 border-bottom-dotted px-2">{item.category || '-'}</span>
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
                                {/* Signature image if available, else blank dotted line */}
                                <div className="mx-auto mb-1" style={{ width: '250px', height: '70px', borderBottom: '1px dotted #000', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                                    {item.signatureData ? (
                                        <img
                                            src={item.signatureData}
                                            alt="ลายเซ็น"
                                            style={{ maxHeight: '68px', maxWidth: '240px', objectFit: 'contain', marginBottom: '2px', filter: 'invert(1) brightness(0)' }}
                                        />
                                    ) : null}
                                </div>
                                <div className="mb-1 small">({item.officerName || '............................................'})</div>
                                <div className="mb-1 small">{item.officerDate || '........./............./............'}</div>
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
                    page-break-inside: avoid;
                }
                .border-bottom-dotted {
                    border-bottom: 1px dotted #000;
                    min-height: 1.5em;
                }
                .min-height-dotted {
                    min-height: 40px;
                }
                .custom-checkbox {
                    width: 18px;
                    height: 18px;
                    border: 1px solid #000;
                    border-radius: 3px;
                }

                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-30deg);
                    font-size: 5rem;
                    font-weight: 900;
                    color: rgba(220, 53, 69, 0.1); /* Reddish for UI visibility */
                    white-space: nowrap;
                    pointer-events: none;
                    z-index: 0;
                    border: 8px solid rgba(220, 53, 69, 0.1);
                    padding: 15px 30px;
                    border-radius: 20px;
                    text-transform: uppercase;
                }

                .document-container {
                    position: relative;
                    z-index: 1;
                }

                .document-content {
                    position: relative;
                    z-index: 2;
                }
                
                @media print {
                    @page {
                        margin: 0.3cm;
                        size: A5 portrait;
                    }
                    html, body {
                        height: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden;
                    }
                    .modal {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .modal-dialog {
                        max-width: 100% !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .modal-content {
                        border: none !important;
                        box-shadow: none !important;
                        background-color: white !important;
                    }
                    .modal-header, .modal-footer {
                        display: none !important;
                    }
                    .modal-body {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .document-container {
                        box-shadow: none !important;
                        padding: 1cm !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        height: auto !important;
                        page-break-after: avoid;
                        page-break-before: avoid;
                        margin: 0 auto !important;
                    }
                    .document-title {
                        margin-bottom: 1rem !important;
                        font-size: 1.3rem !important;
                    }
                    .document-content {
                        line-height: 1.8 !important;
                    }
                    .mt-5 {
                        margin-top: 1.5rem !important;
                    }
                    .mb-5 {
                        margin-bottom: 1rem !important;
                    }
                    .mb-4 {
                        margin-bottom: 0.5rem !important;
                    }
                    .watermark {
                        color: rgba(0, 0, 0, 0.05) !important; /* Lighter/Gray for actual printing */
                        border-color: rgba(0, 0, 0, 0.05) !important;
                        font-size: 5rem !important;
                    }
                }
            `}</style>
        </Modal>
    );
};

export default ItemDetailModal;
