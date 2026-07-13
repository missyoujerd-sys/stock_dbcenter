import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { Button, Table, Form, Modal, Card } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUsers } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function ItEmployees() {
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        empCode: '',
        name: '',
        department: '',
        position: ''
    });

    useEffect(() => {
        const empRef = ref(db, 'it_employees');
        const unsubscribe = onValue(empRef, (snapshot) => {
            const data = snapshot.val();
            const list = [];
            if (data) {
                for (let key in data) {
                    list.push({ id: key, ...data[key] });
                }
            }
            setEmployees(list);
        });
        return unsubscribe;
    }, []);

    const handleClose = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ empCode: '', name: '', department: '', position: '' });
    };

    const handleShow = (emp = null) => {
        if (emp) {
            setEditingId(emp.id);
            setFormData({
                empCode: emp.empCode || '',
                name: emp.name || '',
                department: emp.department || '',
                position: emp.position || ''
            });
        }
        setShowModal(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await update(ref(db, `it_employees/${editingId}`), formData);
            } else {
                await push(ref(db, 'it_employees'), formData);
            }
            handleClose();
        } catch (error) {
            console.error("Error saving employee:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("คุณต้องการลบข้อมูลพนักงานรายนี้ใช่หรือไม่?")) {
            try {
                await remove(ref(db, `it_employees/${id}`));
            } catch (error) {
                console.error("Error deleting employee:", error);
                alert("เกิดข้อผิดพลาดในการลบข้อมูล");
            }
        }
    };

    return (
        <div className="container-fluid py-4" style={{ fontFamily: 'Inter, Prompt, sans-serif' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1 text-primary">
                        <FaUsers className="me-2" />
                        ข้อมูลพนักงาน (Employees)
                    </h2>
                    <p className="text-muted mb-0">ระบบจัดการข้อมูลพนักงานสำหรับอ้างอิงการเบิกจ่าย</p>
                </div>
                <div className="d-flex gap-2">
                    <Link to="/it-equipment">
                        <Button variant="outline-secondary" className="rounded-pill px-4">กลับหน้าหลัก</Button>
                    </Link>
                    <Button variant="primary" className="rounded-pill px-4 d-flex align-items-center gap-2" onClick={() => handleShow()}>
                        <FaPlus /> เพิ่มพนักงาน
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Card.Body className="p-0">
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3 border-0">รหัสพนักงาน</th>
                                <th className="px-4 py-3 border-0">ชื่อ-นามสกุล</th>
                                <th className="px-4 py-3 border-0">แผนก</th>
                                <th className="px-4 py-3 border-0">ตำแหน่ง</th>
                                <th className="px-4 py-3 border-0 text-end">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-muted">ยังไม่มีข้อมูลพนักงาน</td>
                                </tr>
                            ) : (
                                employees.map((emp) => (
                                    <tr key={emp.id}>
                                        <td className="px-4 py-3">{emp.empCode || '-'}</td>
                                        <td className="px-4 py-3 fw-bold">{emp.name}</td>
                                        <td className="px-4 py-3">{emp.department || '-'}</td>
                                        <td className="px-4 py-3">{emp.position || '-'}</td>
                                        <td className="px-4 py-3 text-end">
                                            <Button variant="light" size="sm" className="me-2 text-primary" onClick={() => handleShow(emp)}>
                                                <FaEdit />
                                            </Button>
                                            <Button variant="light" size="sm" className="text-danger" onClick={() => handleDelete(emp.id)}>
                                                <FaTrash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Modal */}
            <Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{editingId ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>รหัสพนักงาน</Form.Label>
                            <Form.Control type="text" name="empCode" value={formData.empCode} onChange={handleChange} placeholder="เช่น EMP-001" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>ชื่อ-นามสกุล *</Form.Label>
                            <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="เช่น สมชาย ใจดี" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>แผนก</Form.Label>
                            <Form.Control type="text" name="department" value={formData.department} onChange={handleChange} placeholder="เช่น IT, HR, ฝ่ายขาย" />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label>ตำแหน่ง</Form.Label>
                            <Form.Control type="text" name="position" value={formData.position} onChange={handleChange} placeholder="เช่น เจ้าหน้าที่, ผู้จัดการ" />
                        </Form.Group>
                        <Button variant="primary" type="submit" className="w-100 rounded-pill py-2 fw-bold">
                            บันทึกข้อมูล
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}
