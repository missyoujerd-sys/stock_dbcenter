import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  FileText, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Download,
  Barcode,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { RepairService } from '../../services/repairService';
import { RepairRecord } from '../../types/repair';
import { Html5QrcodeScanner } from 'html5-qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function RepairEntry() {
  const [formData, setFormData] = useState<Omit<RepairRecord, 'id' | 'createdAt' | 'updatedAt'>>({
    equipmentModel: '',
    assetNumber: '',
    serialNumber: '',
    problemDescription: '',
    reporterName: '',
    reportedDate: new Date().toISOString().split('T')[0],
    receiverName: '',
    receivedDate: new Date().toISOString().split('T')[0],
    staffReceiptName: '',
    staffReceiptDate: '',
    returnerName: '',
    returnDate: '',
    status: 'pending'
  });

  const [scanning, setScanning] = useState<'asset' | 'serial' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render((decodedText) => {
        if (scanning === 'asset') {
          setFormData(prev => ({ ...prev, assetNumber: decodedText }));
        } else {
          setFormData(prev => ({ ...prev, serialNumber: decodedText }));
        }
        scanner.clear();
        setScanning(null);
      }, (error) => {
        // Handle error
      });

      return () => {
        scanner.clear();
      };
    }
  }, [scanning]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      RepairService.saveRepair(formData);
      setMessage({ type: 'success', text: 'บันทึกข้อมูลสำเร็จแล้ว' });
      // Reset form or redirect
    } catch (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
  };

  const exportPDF = async () => {
    const reportElement = document.getElementById('repair-report-template');
    if (!reportElement) {
      alert('ไม่พบ Template สำหรับสร้าง PDF');
      return;
    }

    // Temporarily make it visible but outside the viewport for capture
    reportElement.style.display = 'block';
    reportElement.style.position = 'fixed';
    reportElement.style.left = '-9999px';
    reportElement.style.top = '0';
    
    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Repair_${formData.assetNumber || 'record'}.pdf`);
      setMessage({ type: 'success', text: 'สร้างไฟล์ PDF สำเร็จแล้ว' });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการสร้าง PDF' });
    } finally {
      reportElement.style.display = 'none';
      reportElement.style.position = '';
      reportElement.style.left = '';
      reportElement.style.top = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            ข้อมูลการแจ้งซ่อม (Stock_Guaranteed)
          </h1>
          <p className="text-slate-500 mt-1">บันทึกประวัติการส่งซ่อมและรับเครื่องคืน</p>
        </div>
        <button 
          onClick={exportPDF}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-indigo-200"
        >
          <Download size={18} />
          Export PDF
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
          
          {/* Section 1: Equipment Details */}
          <div className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Barcode className="text-blue-500" /> ข้อมูลตัวเครื่อง
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">รุ่นของอุปกรณ์</label>
                <input 
                  type="text" 
                  required
                  placeholder="เช่น Dell Latitude 5420"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  value={formData.equipmentModel}
                  onChange={e => setFormData({...formData, equipmentModel: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">เลขครุภัณฑ์ (Asset Number)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.assetNumber}
                    onChange={e => setFormData({...formData, assetNumber: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setScanning('asset')}
                    className="absolute right-2 top-1.5 p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Camera size={20} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Serial Number (S/N)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.serialNumber}
                    onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setScanning('serial')}
                    className="absolute right-2 top-1.5 p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Camera size={20} />
                  </button>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-600">อาการเสีย / รายละเอียดปัญหา</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={formData.problemDescription}
                  onChange={e => setFormData({...formData, problemDescription: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Roles & Names */}
          <div className="p-6 md:p-8 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <User className="text-indigo-500" /> ชื่อผู้รับผิดชอบและวันเวลา
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Reporter */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">เจ้าหน้าที่แจ้งซ่อม</h3>
                <div className="space-y-2">
                  <input 
                    type="text" required placeholder="ชื่อ-นามสกุล"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    value={formData.reporterName}
                    onChange={e => setFormData({...formData, reporterName: e.target.value})}
                  />
                  <input 
                    type="date" required
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    value={formData.reportedDate}
                    onChange={e => setFormData({...formData, reportedDate: e.target.value})}
                  />
                </div>
              </div>

              {/* Receiver */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">ผู้รับซ่อมเครื่อง</h3>
                <div className="space-y-2">
                  <input 
                    type="text" required placeholder="ชื่อ-นามสกุล"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    value={formData.receiverName}
                    onChange={e => setFormData({...formData, receiverName: e.target.value})}
                  />
                  <input 
                    type="date" required
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    value={formData.receivedDate}
                    onChange={e => setFormData({...formData, receivedDate: e.target.value})}
                  />
                </div>
              </div>

              {/* Staff who received repaired device */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">เจ้าหน้าที่ผู้รับเครื่องคืน</h3>
                <div className="space-y-2">
                  <input 
                    type="text" placeholder="ชื่อ-นามสกุล"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    value={formData.staffReceiptName}
                    onChange={e => setFormData({...formData, staffReceiptName: e.target.value})}
                  />
                  <input 
                    type="date"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    value={formData.staffReceiptDate}
                    onChange={e => setFormData({...formData, staffReceiptDate: e.target.value})}
                  />
                </div>
              </div>

              {/* Returner */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">ผู้ส่งมอบเครื่องคืน</h3>
                <div className="space-y-2">
                  <input 
                    type="text" placeholder="ชื่อ-นามสกุล"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    value={formData.returnerName}
                    onChange={e => setFormData({...formData, returnerName: e.target.value})}
                  />
                  <input 
                    type="date"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    value={formData.returnDate}
                    onChange={e => setFormData({...formData, returnDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="p-8 flex justify-end">
            <button 
              type="submit"
              className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-100"
            >
              บันทึกข้อมูลการแจ้งซ่อม
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </div>
        </form>
      </div>

      {/* Barcode Scanner Modal overlay */}
      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              สแกน {scanning === 'asset' ? 'เลขครุภัณฑ์' : 'Serial Number'}
            </h3>
            <div id="reader" className="overflow-hidden rounded-2xl border-4 border-slate-100"></div>
            <button 
              onClick={() => setScanning(null)}
              className="mt-6 w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Hidden PDF Template (Rendered in Thai) */}
      <div id="repair-report-template" className="bg-white p-10" style={{ display: 'none', width: '800px', fontFamily: 'sans-serif' }}>
        <div className="text-center mb-8 pb-4" style={{ borderBottom: '4px solid #2563eb' }}>
          <h1 className="text-3xl font-black" style={{ color: '#1e293b' }}>เอกสารบันทึกการซ่อม</h1>
          <p className="font-bold tracking-widest uppercase" style={{ color: '#2563eb' }}>อยู่ในประกัน</p>
        </div>
        
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            <div className="p-4 rounded-xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
              <p className="text-xs font-bold uppercase mb-1" style={{ color: '#94a3b8' }}>เลขครุภัณฑ์ (Asset Number)</p>
              <p className="text-xl font-black" style={{ color: '#1e293b' }}>{formData.assetNumber || '-'}</p>
            </div>
            <div className="p-4 rounded-xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
              <p className="text-xs font-bold uppercase mb-1" style={{ color: '#94a3b8' }}>Serial Number (S/N)</p>
              <p className="text-lg font-bold" style={{ color: '#1e293b' }}>{formData.serialNumber || '-'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
              <p className="text-xs font-bold uppercase mb-1" style={{ color: '#94a3b8' }}>รุ่นอุปกรณ์ (Model)</p>
              <p className="text-xl font-black" style={{ color: '#1e293b' }}>{formData.equipmentModel || '-'}</p>
            </div>
            <div className="p-4 rounded-xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
              <p className="text-xs font-bold uppercase mb-1" style={{ color: '#94a3b8' }}>วันที่สร้างเอกสาร</p>
              <p className="text-lg font-bold" style={{ color: '#1e293b' }}>{new Date().toLocaleString('th-TH')}</p>
            </div>
          </div>
        </div>

        <div className="mb-10 p-6 rounded-2xl border" style={{ backgroundColor: '#fff1f2', borderColor: '#ffe4e6' }}>
          <p className="text-sm font-bold uppercase mb-2" style={{ color: '#fb7185' }}>อาการเสีย / ปัญหาที่พบ</p>
          <p className="text-lg leading-relaxed font-semibold" style={{ color: '#4c0519' }}>{formData.problemDescription || '-'}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div className="p-6 border-2 rounded-2xl" style={{ borderColor: '#f1f5f9' }}>
            <p className="text-xs font-bold uppercase mb-4 text-center border-b pb-2" style={{ color: '#94a3b8' }}>ผู้รายงาน / ผู้ส่งเครื่อง</p>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-bold" style={{ color: '#94a3b8' }}>ชื่อ:</span> <span className="font-bold" style={{ color: '#1e293b' }}>{formData.reporterName || '-'}</span></p>
              <p className="text-sm"><span className="font-bold" style={{ color: '#94a3b8' }}>วันที่:</span> <span className="font-bold" style={{ color: '#1e293b' }}>{formData.reportedDate || '-'}</span></p>
              <div className="mt-8 border-b border-dashed h-10" style={{ borderColor: '#cbd5e1' }}></div>
              <p className="text-[10px] text-center" style={{ color: '#cbd5e1' }}>ลายมือชื่อ</p>
            </div>
          </div>
          <div className="p-6 border-2 rounded-2xl" style={{ borderColor: '#eff6ff' }}>
            <p className="text-xs font-bold uppercase mb-4 text-center border-b pb-2" style={{ color: '#60a5fa' }}>ผู้รับเครื่องซ่อม</p>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-bold" style={{ color: '#60a5fa' }}>ชื่อ:</span> <span className="font-bold" style={{ color: '#1e293b' }}>{formData.receiverName || '-'}</span></p>
              <p className="text-sm"><span className="font-bold" style={{ color: '#60a5fa' }}>วันที่:</span> <span className="font-bold" style={{ color: '#1e293b' }}>{formData.receivedDate || '-'}</span></p>
              <div className="mt-8 border-b border-dashed h-10" style={{ borderColor: '#cbd5e1' }}></div>
              <p className="text-[10px] text-center" style={{ color: '#cbd5e1' }}>ลายมือชื่อ</p>
            </div>
          </div>
          <div className="p-6 border-2 rounded-2xl" style={{ borderColor: '#f1f5f9' }}>
            <p className="text-xs font-bold uppercase mb-4 text-center border-b pb-2" style={{ color: '#94a3b8' }}>เจ้าหน้าที่ผู้รับเครื่องคืน</p>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-bold" style={{ color: '#94a3b8' }}>ชื่อ:</span> <span className="font-bold" style={{ color: '#1e293b' }}>{formData.staffReceiptName || '-'}</span></p>
              <p className="text-sm"><span className="font-bold" style={{ color: '#94a3b8' }}>วันที่:</span> <span className="font-bold" style={{ color: '#1e293b' }}>{formData.staffReceiptDate || '-'}</span></p>
              <div className="mt-8 border-b border-dashed h-10" style={{ borderColor: '#cbd5e1' }}></div>
              <p className="text-[10px] text-center" style={{ color: '#cbd5e1' }}>ลายมือชื่อ</p>
            </div>
          </div>
          <div className="p-6 border-2 rounded-2xl" style={{ borderColor: '#ecfdf5' }}>
            <p className="text-xs font-bold uppercase mb-4 text-center border-b pb-2" style={{ color: '#34d399' }}>ผู้ส่งมอบเครื่องคืน</p>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-bold" style={{ color: '#34d399' }}>ชื่อ:</span> <span className="font-bold" style={{ color: '#1e293b' }}>{formData.returnerName || '-'}</span></p>
              <p className="text-sm"><span className="font-bold" style={{ color: '#34d399' }}>วันที่:</span> <span className="font-bold" style={{ color: '#1e293b' }}>{formData.returnDate || '-'}</span></p>
              <div className="mt-8 border-b border-dashed h-10" style={{ borderColor: '#cbd5e1' }}></div>
              <p className="text-[10px] text-center" style={{ color: '#cbd5e1' }}>ลายมือชื่อ</p>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] italic pt-8 border-t" style={{ color: '#cbd5e1' }}>
          เอกสารนี้สร้างขึ้นโดยระบบอัตโนมัติ Stock_Guaranteed - {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
