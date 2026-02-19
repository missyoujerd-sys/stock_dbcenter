import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
            <Navbar expand="lg" className="premium-navbar mb-4">
                <Container fluid className="px-lg-5">
                    <Navbar.Brand as={Link} to="/" className="navbar-brand-custom">
                        <FaBoxOpen className="navbar-brand-icon" />
                        ระบบจัดการ Stock
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 shadow-none text-white" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto mt-3 mt-lg-0">
                            <Nav.Link as={Link} to="/" className={`nav-link-custom ${location.pathname === '/' ? 'active' : ''}`}>
                                หน้าหลัก
                            </Nav.Link>
                            <Nav.Link as={Link} to="/incoming" className={`nav-link-custom ${location.pathname === '/incoming' ? 'active' : ''}`}>
                                <FaClipboardList className="me-2" /> รับเข้า Stock
                            </Nav.Link>
                            <Nav.Link as={Link} to="/distribution" className={`nav-link-custom ${location.pathname === '/distribution' ? 'active' : ''}`}>
                                <FaTruckLoading className="me-2" /> จำหน่ายสินค้า
                            </Nav.Link>
                            <Nav.Link as={Link} to="/inventory" className={`nav-link-custom ${location.pathname === '/inventory' ? 'active' : ''}`}>
                                <FaBoxOpen className="me-2" /> คลังพัสดุ
                            </Nav.Link>
                        </Nav>
                        <div className="d-flex align-items-center text-white mt-3 mt-lg-0">
                            {currentUser && (
                                <>
                                    <div className="user-email-badge d-none d-lg-block">
                                        <small className="opacity-75 me-1">ผู้ใช้งาน:</small>
                                        <span className="fw-bold">{currentUser.email}</span>
                                    </div>
                                    <Button variant="outline-light" className="logout-btn-custom" onClick={handleLogout}>
                                        <FaSignOutAlt className="me-2" /> ออกจากระบบ
                                    </Button>
                                </>
                            )}
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container fluid className="flex-grow-1 px-lg-5">
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
