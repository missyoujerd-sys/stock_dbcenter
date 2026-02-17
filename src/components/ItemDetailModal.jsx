import React from 'react';
import { Modal, Button, Row, Col, Badge } from 'react-bootstrap';
import { FaInfoCircle, FaCalendarAlt, FaBuilding, FaMicrochip, FaTag, FaBarcode, FaStickyNote, FaUser } from 'react-icons/fa';

const ItemDetailModal = ({ show, onHide, item }) => {
    if (!item) return null;

    const DetailRow = ({ icon: Icon, label, value, color = "primary" }) => (
        <Col md={6} className="mb-3">
            <div className="d-flex align-items-start">
                <div className={`bg-${color}-light p-2 rounded me-3`} style={{ minWidth: '40px', textAlign: 'center' }}>
                    <Icon className={`text-${color}`} />
                </div>
                <div>
                    <div className="text-muted small text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>{label}</div>
                    <div className="fw-bold text-dark">{value || '-'}</div>
                </div>
            </div>
        </Col>
    );

    return (
        <Modal show={show} onHide={onHide} size="lg" centered border="0" className="item-detail-modal">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold d-flex align-items-center">
                    <FaInfoCircle className="text-primary me-2" /> รายละเอียดพัสดุ
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-4 px-4 pb-5">
                <div className="mb-4">
                    <Badge bg={item.status === 'รับเข้า' ? 'success' : (item.status === 'จำหน่าย' ? 'danger' : 'warning')} className="px-3 py-2">
                        สถานะ: {item.status}
                    </Badge>
                </div>

                <Row>
                    <DetailRow icon={FaCalendarAlt} label="วันที่รับเข้า" value={item.importDate} color="primary" />
                    <DetailRow icon={FaBarcode} label="เลขครุภัณฑ์" value={item.assetId} color="danger" />

                    <Col md={12}><hr className="my-2 opacity-50" /></Col>

                    <DetailRow icon={FaTag} label="หมวดหมู่" value={item.category} color="success" />
                    <DetailRow icon={FaMicrochip} label="ยี่ห้อ/รุ่น" value={item.brandModel} color="info" />

                    <DetailRow icon={FaTag} label="ชื่อเครื่อง" value={item.computerName} color="warning" />
                    <DetailRow icon={FaBarcode} label="Serial Number (S/N)" value={item.serialNumber} color="dark" />

                    <Col md={12}><hr className="my-2 opacity-50" /></Col>

                    <DetailRow icon={FaBuilding} label="หน่วยงาน/ฝ่าย" value={item.department} color="secondary" />
                    <DetailRow icon={FaBuilding} label="อาคาร/สถานที่" value={item.building} color="secondary" />

                    {item.status === 'จำหน่าย' && (
                        <>
                            <Col md={12}><hr className="my-2 opacity-50" /></Col>
                            <DetailRow icon={FaCalendarAlt} label="วันที่จำหน่าย" value={item.distributionDate} color="danger" />
                            <DetailRow icon={FaUser} label="ผู้รับอุปกรณ์" value={item.distributor} color="danger" />
                        </>
                    )}

                    <Col md={12} className="mt-3">
                        <div className="bg-light p-3 rounded">
                            <div className="text-muted small text-uppercase fw-bold mb-2">
                                <FaStickyNote className="me-1" /> หมายเหตุ (Remarks)
                            </div>
                            <div className="text-dark">{item.remarks || '-'}</div>
                        </div>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer className="border-0">
                <Button variant="secondary" onClick={onHide} className="px-4">ปิด</Button>
            </Modal.Footer>

            <style>{`
                .bg-primary-light { background-color: rgba(13, 110, 253, 0.1); }
                .bg-success-light { background-color: rgba(25, 135, 84, 0.1); }
                .bg-danger-light { background-color: rgba(220, 53, 69, 0.1); }
                .bg-info-light { background-color: rgba(13, 202, 240, 0.1); }
                .bg-warning-light { background-color: rgba(255, 193, 7, 0.1); }
                .bg-dark-light { background-color: rgba(33, 37, 41, 0.1); }
                .bg-secondary-light { background-color: rgba(108, 117, 125, 0.1); }
            `}</style>
        </Modal>
    );
};

export default ItemDetailModal;
