import React, { Component } from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { FaExclamationTriangle, FaHome, FaRedo } from 'react-icons/fa';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <Container className="mt-5 text-center">
                    <div className="p-5 shadow-sm rounded bg-white">
                        <FaExclamationTriangle size={64} className="text-danger mb-4" />
                        <h2 className="mb-3">ขออภัย เกิดข้อผิดพลาดบางอย่าง</h2>
                        <p className="text-muted mb-4">
                            {this.state.error?.message || "ระบบไม่สามารถดำเนินการต่อได้ในขณะนี้"}
                        </p>
                        <Alert variant="danger" className="text-start mb-4">
                            <small>
                                <strong>Error Details:</strong><br />
                                {this.state.error?.toString()}
                            </small>
                        </Alert>
                        <div className="d-flex justify-content-center gap-3">
                            <Button
                                variant="primary"
                                onClick={this.handleReset}
                                className="d-flex align-items-center"
                            >
                                <FaRedo className="me-2" /> ลองใหม่อีกครั้ง
                            </Button>
                            <Button
                                variant="outline-secondary"
                                href="/"
                                className="d-flex align-items-center"
                            >
                                <FaHome className="me-2" /> กลับหน้าหลัก
                            </Button>
                        </div>
                    </div>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
