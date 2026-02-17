import React, { useState } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function NavigationBar() {
    const [error, setError] = useState('');
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        setError('');

        try {
            await logout();
            navigate('/login');
        } catch {
            setError('Failed to log out');
        }
    }

    return (
        <Navbar bg="light" expand="lg" className="mb-4 shadow-sm">
            <Container>
                <Navbar.Brand as={Link} to="/">ระบบจัดการสต็อก</Navbar.Brand>
                {error && <div className="alert alert-danger position-absolute top-100 start-50 translate-middle-x mt-2">{error}</div>}
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">หน้าหลัก</Nav.Link>
                        <Nav.Link as={Link} to="/stock-receiving">รับเข้า Stock</Nav.Link>
                        <Nav.Link as={Link} to="/stock-list">รายการครุภัณฑ์</Nav.Link>
                        <Nav.Link as={Link} to="/stock-dispatch">จำหน่ายออก</Nav.Link>
                    </Nav>
                    <Nav>
                        <Navbar.Text className="me-3">
                            ผู้ใช้งาน: {currentUser && currentUser.email}
                        </Navbar.Text>
                        <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                            ออกจากระบบ
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
