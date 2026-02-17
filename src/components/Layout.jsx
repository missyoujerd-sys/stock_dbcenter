import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { FaBoxOpen, FaClipboardList, FaSignOutAlt, FaTruckLoading } from 'react-icons/fa';

export default function Layout({ children }) {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error("Failed to log out");
        }
    }

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            <Navbar bg="light" expand="lg" className="mb-4 shadow-sm">
                <Container fluid>
                    <Navbar.Brand as={Link} to="/" className="fw-bold">
                        ระบบจัดการ Stock
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link as={Link} to="/" active={location.pathname === '/'}>
                                หน้าหลัก
                            </Nav.Link>
                            <Nav.Link as={Link} to="/incoming" active={location.pathname === '/incoming'}>
                                รับเข้า Stock
                            </Nav.Link>
                            <Nav.Link as={Link} to="/distribution" active={location.pathname === '/distribution'}>
                                จำหน่ายสินค้า
                            </Nav.Link>
                        </Nav>
                        <div className="d-flex align-items-center">
                            {currentUser && (
                                <>
                                    <span className="me-3 d-none d-lg-inline text-dark">
                                        ผู้ใช้งาน: {currentUser.email}
                                    </span>
                                    <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                                        <FaSignOutAlt className="me-1" /> ออกจากระบบ
                                    </Button>
                                </>
                            )}
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container fluid className="flex-grow-1 px-4">
                {children}
            </Container>

            <footer className="bg-white text-center py-3 mt-4 border-top text-muted">
                <Container fluid>
                    <small>&copy; {new Date().getFullYear()} ระบบจัดการ Stock พัสดุครุภัณฑ์</small>
                </Container>
            </footer>
        </div>
    );
}
