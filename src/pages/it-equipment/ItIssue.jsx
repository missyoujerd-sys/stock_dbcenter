import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, push, onValue, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

export default function ItIssue() {
    const navigate = useNavigate();
    
    // Form State
    const [docNo, setDocNo] = useState('');
    const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
    const [requester, setRequester] = useState('');
    const [remarks, setRemarks] = useState('');
    
    // Grid State
    const [lines, setLines] = useState([
        { id: Date.now(), itemCode: '', itemName: '', unit: '', qty: 1, price: 0, total: 0 }
    ]);
    
    // Master Data
    const [employees, setEmployees] = useState([]);
    const [items, setItems] = useState([]);
    
    useEffect(() => {
        // Auto-generate Doc No
        const generateDocNo = () => {
            const date = new Date();
            const year = date.getFullYear() + 543; // Thai year
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
            setDocNo(`TI-${year}${month}-${random}`);
        };
        generateDocNo();

        // Fetch Employees
        const empRef = ref(db, 'it_employees');
        onValue(empRef, (snapshot) => {
            const data = snapshot.val();
            const empList = [];
            if (data) {
                for (let key in data) {
                    empList.push({ id: key, ...data[key] });
                }
            }
            setEmployees(empList);
        });

        // Fetch Items (from office_items or it_equipment_tx to build stock)
        const itemsRef = ref(db, 'office_items');
        onValue(itemsRef, (snapshot) => {
            const data = snapshot.val();
            const itemList = [];
            if (data) {
                for (let key in data) {
                    itemList.push({ id: key, ...data[key] });
                }
            } else {
                // Mock data if empty
                itemList.push(
                    { id: 'IT001', code: 'IT001', name: 'เมาส์', unit: 'อัน', price: 200 },
                    { id: 'IT002', code: 'IT002', name: 'คีย์บอร์ด', unit: 'อัน', price: 350 },
                    { id: 'IT003', code: 'IT003', name: 'กระดาษ A4', unit: 'รีม', price: 120 }
                );
            }
            setItems(itemList);
        });
    }, []);

    const handleLineChange = (index, field, value) => {
        const newLines = [...lines];
        newLines[index][field] = value;
        
        // Auto-fill from item selection
        if (field === 'itemCode' || field === 'itemName') {
            const selectedItem = items.find(it => it.code === value || it.name === value);
            if (selectedItem) {
                newLines[index].itemCode = selectedItem.code;
                newLines[index].itemName = selectedItem.name;
                newLines[index].unit = selectedItem.unit;
                newLines[index].price = selectedItem.price;
            }
        }
        
        // Calculate Total
        if (field === 'qty' || field === 'price' || field === 'itemCode' || field === 'itemName') {
            newLines[index].total = Number(newLines[index].qty || 0) * Number(newLines[index].price || 0);
        }
        
        setLines(newLines);
    };

    const addLine = () => {
        setLines([...lines, { id: Date.now(), itemCode: '', itemName: '', unit: '', qty: 1, price: 0, total: 0 }]);
    };
    
    const removeLine = (index) => {
        if (lines.length > 1) {
            const newLines = lines.filter((_, i) => i !== index);
            setLines(newLines);
        }
    };

    const handleSave = async () => {
        try {
            // Check required
            if (!requester) {
                alert('กรุณาเลือกผู้เบิก');
                return;
            }
            
            const validLines = lines.filter(l => l.itemName && l.qty > 0);
            if (validLines.length === 0) {
                alert('กรุณาระบุรายการวัสดุอย่างน้อย 1 รายการ');
                return;
            }

            // Save Document Master
            const docRef = push(ref(db, 'documents'));
            const docId = docRef.key;
            
            await set(docRef, {
                docNo,
                docDate,
                requester,
                remarks,
                type: 'ISSUE',
                timestamp: Date.now()
            });

            // Save Document Lines & Update Stock Transactions
            for (let line of validLines) {
                // Line
                await push(ref(db, 'document_lines'), {
                    docId,
                    itemCode: line.itemCode,
                    itemName: line.itemName,
                    qty: Number(line.qty),
                    price: Number(line.price),
                    total: Number(line.total)
                });
                
                // Update transaction for backwards compatibility
                await push(ref(db, 'it_equipment_tx'), {
                    type: 'OUT',
                    timestamp: Date.now(),
                    equipmentName: line.itemName,
                    quantity: Number(line.qty),
                    department: '', // Can pull from emp if needed
                    receiver: requester,
                    remarks: remarks || `เบิกตามเอกสาร ${docNo}`,
                    docNo: docNo
                });
            }
            
            alert('บันทึกข้อมูลเรียบร้อยแล้ว');
            
            // Reset
            setLines([{ id: Date.now(), itemCode: '', itemName: '', unit: '', qty: 1, price: 0, total: 0 }]);
            setDocNo(`IT-${new Date().getFullYear()+543}${String(new Date().getMonth()+1).padStart(2,'0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`);
            setRemarks('');
            
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    // Calculate Grand Total
    const grandTotalQty = lines.reduce((sum, line) => sum + Number(line.qty || 0), 0);
    const grandTotalAmount = lines.reduce((sum, line) => sum + Number(line.total || 0), 0);

    return (
        <div style={{ padding: '20px', fontFamily: '"MS Sans Serif", Tahoma, sans-serif', backgroundColor: '#c0c0c0', minHeight: '100vh' }}>
            <div style={{ border: '2px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080', backgroundColor: '#e0dfdf', maxWidth: '1000px', margin: '0 auto', boxShadow: '2px 2px 5px rgba(0,0,0,0.3)' }}>
                
                {/* Header Title Bar (Dark Red) */}
                <div style={{ backgroundColor: '#800000', color: 'white', padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>📝 ระบบเบิกจ่ายวัสดุ</span>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => window.print()} style={{ padding: '2px 10px', backgroundColor: '#d4d0c8', border: '1px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080', cursor: 'pointer', color: 'black' }}>พิมพ์</button>
                        <button onClick={handleSave} style={{ padding: '2px 10px', backgroundColor: '#d4d0c8', border: '1px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080', cursor: 'pointer', color: 'black' }}>บันทึก</button>
                        <button onClick={() => navigate('/it-equipment')} style={{ padding: '2px 10px', backgroundColor: '#d4d0c8', border: '1px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080', cursor: 'pointer', color: 'black' }}>ออก</button>
                    </div>
                </div>

                {/* Master Section (Teal) */}
                <div style={{ backgroundColor: '#008080', padding: '15px', color: 'black' }}>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', width: '300px' }}>
                            <span style={{ width: '80px', color: 'white', fontSize: '14px' }}>เลขที่เอกสาร</span>
                            <input type="text" value={docNo} readOnly style={{ flex: 1, padding: '2px 5px', border: '1px solid #000' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', width: '300px' }}>
                            <span style={{ width: '80px', color: 'white', fontSize: '14px' }}>วันที่ขอ</span>
                            <input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} style={{ flex: 1, padding: '2px 5px', border: '1px solid #000' }} />
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', width: '400px' }}>
                        <span style={{ width: '80px', color: 'white', fontSize: '14px' }}>ผู้เบิก</span>
                        <select 
                            value={requester} 
                            onChange={(e) => setRequester(e.target.value)}
                            style={{ flex: 1, padding: '2px 5px', border: '1px solid #000', backgroundColor: 'white' }}
                        >
                            <option value="">-- เลือกผู้เบิก --</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.name}>{emp.name} ({emp.department})</option>
                            ))}
                            {employees.length === 0 && <option value="พนักงาน A (แผนก IT)">พนักงาน A (แผนก IT)</option>}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', width: '500px' }}>
                        <span style={{ width: '80px', color: 'white', fontSize: '14px' }}>หมายเหตุ</span>
                        <textarea 
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={3} 
                            style={{ flex: 1, padding: '2px 5px', border: '1px solid #000' }} 
                        />
                    </div>
                </div>

                {/* Grid Section */}
                <div style={{ backgroundColor: '#c0c0c0', padding: '5px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', backgroundColor: 'white' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#000080', color: 'white', fontSize: '13px' }}>
                                <th style={{ border: '1px solid #fff', padding: '3px', width: '30px' }}>#</th>
                                <th style={{ border: '1px solid #fff', padding: '3px', width: '120px' }}>รหัสวัสดุ</th>
                                <th style={{ border: '1px solid #fff', padding: '3px' }}>ชื่อวัสดุ</th>
                                <th style={{ border: '1px solid #fff', padding: '3px', width: '80px' }}>หน่วยนับ</th>
                                <th style={{ border: '1px solid #fff', padding: '3px', width: '80px' }}>จำนวน</th>
                                <th style={{ border: '1px solid #fff', padding: '3px', width: '100px' }}>ราคาต่อหน่วย</th>
                                <th style={{ border: '1px solid #fff', padding: '3px', width: '120px' }}>จำนวนเงิน</th>
                                <th style={{ border: '1px solid #fff', padding: '3px', width: '40px' }}>ลบ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, index) => (
                                <tr key={line.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f0f0f0', fontSize: '13px' }}>
                                    <td style={{ border: '1px solid #c0c0c0', padding: '2px', textAlign: 'center' }}>
                                        <div style={{ width: '10px', height: '10px', backgroundColor: 'black', borderRadius: '50%', margin: '0 auto', opacity: index === lines.length - 1 ? 1 : 0 }}></div>
                                    </td>
                                    <td style={{ border: '1px solid #c0c0c0', padding: '2px' }}>
                                        <input 
                                            type="text" 
                                            value={line.itemCode} 
                                            onChange={(e) => handleLineChange(index, 'itemCode', e.target.value)}
                                            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
                                        />
                                    </td>
                                    <td style={{ border: '1px solid #c0c0c0', padding: '2px' }}>
                                        <select 
                                            value={line.itemName} 
                                            onChange={(e) => handleLineChange(index, 'itemName', e.target.value)}
                                            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
                                        >
                                            <option value=""></option>
                                            {items.map(it => (
                                                <option key={it.id} value={it.name}>{it.name}</option>
                                            ))}
                                            {/* Support custom typing by allowing input if not selected */}
                                        </select>
                                    </td>
                                    <td style={{ border: '1px solid #c0c0c0', padding: '2px' }}>
                                        <input 
                                            type="text" 
                                            value={line.unit} 
                                            onChange={(e) => handleLineChange(index, 'unit', e.target.value)}
                                            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', textAlign: 'center' }}
                                        />
                                    </td>
                                    <td style={{ border: '1px solid #c0c0c0', padding: '2px' }}>
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={line.qty} 
                                            onChange={(e) => handleLineChange(index, 'qty', e.target.value)}
                                            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', textAlign: 'right' }}
                                        />
                                    </td>
                                    <td style={{ border: '1px solid #c0c0c0', padding: '2px' }}>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={line.price} 
                                            onChange={(e) => handleLineChange(index, 'price', e.target.value)}
                                            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', textAlign: 'right' }}
                                        />
                                    </td>
                                    <td style={{ border: '1px solid #c0c0c0', padding: '2px', textAlign: 'right', paddingRight: '5px' }}>
                                        {line.total.toFixed(2)}
                                    </td>
                                    <td style={{ border: '1px solid #c0c0c0', padding: '2px', textAlign: 'center' }}>
                                        <button onClick={() => removeLine(index)} style={{ padding: '0 5px', fontSize: '10px' }}>X</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div style={{ marginTop: '5px' }}>
                        <button onClick={addLine} style={{ padding: '2px 10px', backgroundColor: '#d4d0c8', border: '1px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080', cursor: 'pointer', fontSize: '12px' }}>
                            + เพิ่มรายการ
                        </button>
                    </div>

                    {/* Footer Totals */}
                    <div style={{ display: 'flex', backgroundColor: '#000080', color: 'white', marginTop: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                        <div style={{ flex: 1, padding: '3px 10px' }}>Record: {lines.length}</div>
                        <div style={{ width: '80px', padding: '3px', textAlign: 'right' }}>{grandTotalQty}</div>
                        <div style={{ width: '100px', padding: '3px' }}></div>
                        <div style={{ width: '120px', padding: '3px', textAlign: 'right', paddingRight: '10px' }}>{grandTotalAmount.toFixed(2)}</div>
                        <div style={{ width: '40px' }}></div>
                    </div>
                </div>

            </div>
            
            {/* Print Styles */}
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .container-fluid, .container-fluid * {
                        visibility: visible;
                    }
                    button { display: none !important; }
                    input, select, textarea { border: none !important; border-bottom: 1px solid #000 !important; }
                }
                `}
            </style>
        </div>
    );
}
