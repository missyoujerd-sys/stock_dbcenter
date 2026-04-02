import React, { useRef, useEffect } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { FaPrint, FaTimes } from 'react-icons/fa';

dev_
const ItemDetailModal = ({ show, onHide, item, items = [] }) => {
    const printRef = useRef();

    const printItems = items.length > 0 ? items : (item ? [item] : []);

    if (printItems.length === 0) return null;
=======
const ItemDetailModal = ({ show, onHide, item, autoPrint = false }) => {
    const printRef = useRef();

    useEffect(() => {
        if (show && autoPrint && item) {
            // Give a small delay for signatures and images to load
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [show, autoPrint, item]);

    if (!item) return null;
 main

    const handlePrint = () => {
        window.print();
    };

    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'short',
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
            <Modal.Body className="p-0" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div ref={printRef} className="print-wrapper d-flex flex-column align-items-center" style={{ gap: '10px', padding: '10px 0' }}>
                    {printItems.map((currentItem, index) => (
                        <div key={currentItem.id || index} className="document-container bg-white mx-auto shadow-sm position-relative"
                            style={{ width: '101.6mm', minHeight: '72.4mm', padding: '4mm 5mm', boxSizing: 'border-box' }}>
                            {/* Watermark for UI and printing */}
                            <div className="watermark">
                                จำหน่าย
                            </div>

                            {/* Header: title + date/time on same row */}
                            <div className="d-flex justify-content-between align-items-start mb-1">
                                <div style={{ flex: 1 }}></div>
                                <h1 className="document-title fw-bold text-decoration-underline mb-0 text-center" style={{ flex: 2, fontSize: '1rem' }}>
                                    จำหน่าย
                                </h1>
                                <div className="text-end" style={{ flex: 1, fontSize: '0.65rem', lineHeight: '1.4' }}>
                                    <div>วันที่: {formattedDate}</div>
                                    <div>เวลา: {formattedTime} น.</div>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="document-content" style={{ fontSize: '0.72rem', lineHeight: '1.7' }}>
                                <div className="d-flex mb-1">
                                    <span className="fw-bold" style={{ minWidth: '80px' }}>หน่วยงาน:</span>
                                    <span className="flex-grow-1 border-bottom-dotted px-1">{currentItem.department || '-'}{currentItem.building && ` (${currentItem.building})`}</span>
                                    <span className="border-bottom-dotted px-1" style={{ marginLeft: '8px', whiteSpace: 'nowrap' }}><strong>เบอร์โทร.</strong>&nbsp;{currentItem.phoneNumber || '2299'}</span>
                                </div>

                                <div className="d-flex mb-1">
                                    <span className="fw-bold" style={{ minWidth: '80px' }}>ประเภทครุภัณฑ์:</span>
                                    <span className="flex-grow-1 border-bottom-dotted px-1">{currentItem.category || '-'}</span>
                                </div>

                                <div className="d-flex mb-1">
                                    <span className="fw-bold" style={{ minWidth: '80px' }}>Serial Number:</span>
                                    <span className="flex-grow-1 border-bottom-dotted px-1">{currentItem.serialNumber || '-'}</span>
                                </div>

                                <div className="d-flex mb-1">
                                    <span className="fw-bold" style={{ minWidth: '80px' }}>เลขครุภัณฑ์:</span>
                                    <span className="flex-grow-1 border-bottom-dotted px-1">{currentItem.assetId || '-'}</span>
                                </div>

                                <div className="d-flex mb-1">
                                    <span className="fw-bold" style={{ minWidth: '80px' }}>ยี่ห้อ/รุ่น:</span>
                                    <span className="flex-grow-1 border-bottom-dotted px-1">{currentItem.brandModel || '-'}</span>
                                </div>

                                <div className="d-flex mb-0 align-items-start">
                                    <span className="fw-bold" style={{ minWidth: '80px' }}>หมายเหตุ:</span>
                                    <div className="flex-grow-1 border-bottom-dotted px-1" style={{ minHeight: '1.2em' }}>
                                        {currentItem.remarks || ''}
                                    </div>
                                    {/* Signature inline at remarks level */}
                                    <div className="text-center ms-2" style={{ width: '115px', flexShrink: 0 }}>
                                        <div style={{ width: '115px', height: '30px', borderBottom: '1px dotted #000', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                                            {currentItem.signatureData ? (
                                                <img src={currentItem.signatureData} alt="ลายเซ็น"
                                                    style={{ maxHeight: '28px', maxWidth: '110px', objectFit: 'contain', marginBottom: '2px', filter: 'invert(1) brightness(0)' }}
                                                />
                                            ) : null}
                                        </div>
                                        <div style={{ fontSize: '0.55rem' }}>({currentItem.officerName || '.....................'})</div>
                                        <div style={{ fontSize: '0.55rem' }}>{currentItem.officerDate || '..../....../..........'}</div>
                                        <div className="fw-bold" style={{ fontSize: '0.6rem' }}>เจ้าหน้าที่คอมพิวเตอร์</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
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
                    font-size: 1.2rem;
                    font-weight: 900;
                    color: rgba(220, 53, 69, 0.08);
                    white-space: nowrap;
                    pointer-events: none;
                    z-index: 0;
                    border: 4px solid rgba(220, 53, 69, 0.08);
                    padding: 4px 12px;
                    border-radius: 8px;
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
                    .print-wrapper {
                        display: block !important;
                        gap: 0 !important;
                        padding: 0 !important;
                    }
                    @page {
                        margin: 0;
                        size: 101.6mm 72.4mm landscape;
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
                        padding: 3mm 4mm !important;
                        width: 101.6mm !important;
                        min-height: 72.4mm !important;
                        max-height: 72.4mm !important;
                        page-break-after: always;
                        page-break-before: avoid;
                        margin: 0 !important;
                        overflow: hidden !important;
                    }
                    .document-container:last-child {
                        page-break-after: avoid;
                    }
                    .document-title {
                        margin-bottom: 0.5rem !important;
                        font-size: 1.2rem !important;
                    }
                    .document-content {
                        line-height: 1.5 !important;
                        font-size: 0.9rem !important;
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
                        font-size: 3.5rem !important;
                    }
                }
            `}</style>
        </Modal>
    );
};

export default ItemDetailModal;
