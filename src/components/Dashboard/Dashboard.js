import { Row, Col, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import NavigationBar from '../Layout/Navbar';
import pngegg from '../../picture/pngegg.png';
import original from '../../picture/original.png';
import medical from '../../picture/medical.jpg';

export default function Dashboard() {

    return (
        <>
            <NavigationBar />
            <Container>

                <h3 className="mb-3">เมนูด่วน</h3>
                <Row>
                    <Col md={4}>
                        <Link to="/stock-receiving" className="text-decoration-none">
                            <div className="d-grid gap-2">
                                <Button variant="outline-primary" size="lg" className="py-4">
                                    <img src={original} alt="Icon" style={{ width: '50px', marginBottom: '10px' }} /><br />
                                    รับอุปกรณ์รอจำหน่ายเข้า
                                </Button>
                            </div>
                        </Link>
                    </Col>
                    <Col md={4}>
                        <Link to="/stock-dispatch" className="text-decoration-none">
                            <div className="d-grid gap-2">
                                <Button variant="outline-warning" size="lg" className="py-4">
                                    <img src={pngegg} alt="Icon" style={{ width: '50px', marginBottom: '10px' }} /><br />
                                    รอจำหน่ายออก
                                </Button>
                            </div>
                        </Link>
                    </Col>
                    <Col md={4}>
                        <Link to="/stock-list" className="text-decoration-none">
                            <div className="d-grid gap-2">
                                <Button variant="outline-info" size="lg" className="py-4">
                                    <img src={medical} alt="Icon" style={{ width: '50px', marginBottom: '10px' }} /><br />
                                    ดูรายการทั้งหมด
                                </Button>
                            </div>
                        </Link>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

