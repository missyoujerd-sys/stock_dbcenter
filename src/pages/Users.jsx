import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { Table, Card, Badge, Button, Modal, Form } from 'react-bootstrap';
import { FaUsers, FaLock, FaUnlock, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

export default function Users() {
    const { isAdmin, isAdmin_2 } = useAuth();
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin && !isAdmin_2) {
            setLoading(false);
            return;
        }

        const usersStatusRef = ref(db, 'users_status');
        const unsubscribe = onValue(usersStatusRef, (snapshot) => {
            const data = snapshot.val();
            const list = [];
            if (data) {
                for (const key in data) {
                    list.push({ id: key, ...data[key] });
                }
            }
            setUsersList(list);
            setLoading(false);
        });

        return unsubscribe;
    }, [isAdmin, isAdmin_2]);

    const handleUnlockUser = (userId) => {
        if (window.confirm('คุณต้องการปลดล็อกผู้ใช้นี้ใช่หรือไม่?')) {
            update(ref(db, `users_status/${userId}`), {
                locked: false,
                failedAttempts: 0,
                resetRequested: false
            });
            alert('ปลดล็อกสำเร็จ');
        }
    };

    if (!isAdmin && !isAdmin_2) {
        return (
            <div className="container-fluid py-4 text-center">
                <h3 className="text-danger mt-5">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin)</h3>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4" style={{ fontFamily: 'Prompt, sans-serif' }}>
            <div className="d-flex align-items-center mb-4">
                <h2 className="mb-0 fw-bold" style={{ color: '#1e293b' }}>
                    <FaUsers className="me-2" />
                    จัดการผู้ใช้งาน (User Management)
                </h2>
            </div>

            <Card className="shadow-sm border-0 rounded-4">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover responsive className="mb-0 align-middle">
                            <thead style={{ backgroundColor: '#f8fafc' }}>
                                <tr>
                                    <th className="py-3 px-4 text-secondary">บัญชีผู้ใช้ / อีเมล</th>
                                    <th className="py-3 px-4 text-secondary">เข้าสู่ระบบผิดพลาด</th>
                                    <th className="py-3 px-4 text-secondary">สถานะ</th>
                                    <th className="py-3 px-4 text-secondary">ดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center py-5">กำลังโหลดข้อมูล...</td></tr>
                                ) : usersList.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-5">ไม่พบข้อมูลผู้ใช้งาน</td></tr>
                                ) : (
                                    usersList.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-4 py-3 fw-bold">
                                                {user.email || user.id}
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.failedAttempts || 0} ครั้ง
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.locked ? (
                                                    <Badge bg="danger" className="rounded-pill"><FaLock className="me-1"/> บัญชีถูกล็อก</Badge>
                                                ) : (
                                                    <Badge bg="success" className="rounded-pill"><FaUnlock className="me-1"/> ปกติ</Badge>
                                                )}
                                                {user.resetRequested && (
                                                    <Badge bg="warning" text="dark" className="rounded-pill ms-2">ขอปลดล็อก</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.locked && (
                                                    <Button variant="outline-primary" size="sm" onClick={() => handleUnlockUser(user.id)}>
                                                        ปลดล็อกบัญชี
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}
