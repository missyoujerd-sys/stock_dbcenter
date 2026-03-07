import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  User, 
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

// ---- Shared constants ----
<<<<<<< HEAD
const HOSPITAL_LOGO = '/nakornping-logo.png';
=======
const HOSPITAL_LOGO = '/cnkp-logo-best.png';
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e

// ---- Premium styles injected once ----
const PREMIUM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800;900&display=swap');

.repair-page-wrap { font-family: 'Prompt', sans-serif; }

/* A4 preview */
.a4-preview {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: #fff;
  position: relative;
  box-shadow: 0 30px 80px rgba(0,0,0,0.18);
  border-radius: 4px;
  overflow: hidden;
}

<<<<<<< HEAD
/* Watermark */
.a4-watermark {
  position: absolute;
  top: 30%; /* Align toward the middle of the form details specifically */
  left: 0;
  right: 0;
=======
/* Watermark styling - Premium */
.a4-watermark {
  position: absolute;
  inset: 0;
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 0;
}
.a4-watermark img {
<<<<<<< HEAD
  width: 60%;
  opacity: 0.12; /* Slightly more visible */
=======
  width: 55%; /* Changed back to fit square logo */
  opacity: 0.15; /* Increased opacity for prominence */
  transform: rotate(-15deg) scale(1.1); /* Classic premium watermark rotation */
  filter: drop-shadow(0 20px 40px rgba(0,0,0,0.2)) saturate(1.3); /* Stronger shadow and colors */
  user-select: none;
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
}

.a4-content { position: relative; z-index: 1; padding: 14mm 16mm 12mm; }

/* Header stripe */
.a4-header-stripe {
<<<<<<< HEAD
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  margin: -14mm -16mm 0;
  padding: 12mm 16mm 10mm;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8mm;
  border-bottom: 4px solid #60a5fa;
}
.a4-header-stripe .logo-box { background: white; padding: 8px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
.a4-header-stripe .logo-box img { width: 65px; height: 65px; object-fit: contain; }
.a4-header-title h1 { font-size: 26px; font-weight: 900; color: #fff; margin: 0 0 4px 0; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.a4-header-title p  { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.9); margin: 0; letter-spacing: 2px; text-transform: uppercase; }

/* Section titles */
.section-title { font-size: 13px; font-weight: 800; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
.section-title.blue { color: #3b82f6; }
.section-title.red { color: #ef4444; }
=======
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #60a5fa 100%);
  margin: -14mm -16mm 0;
  padding: 10mm 16mm 8mm;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 10mm;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.15);
}
.a4-header-stripe .logo-box {
  background: #fff;
  padding: 0; /* Remove padding to make it full bleed */
  border-radius: 12px;
  overflow: hidden; /* Ensure image respects border radius */
  box-shadow: 0 10px 30px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.8), 0 0 0 3px rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0; /* Extra crisp edge */
  width: 76px;
  height: 76px;
  flex-shrink: 0;
}
.a4-header-stripe .logo-box img { width: 100%; height: 100%; object-fit: contain; transform: scale(1.1); padding: 2px; } /* Slightly scaled to fill margins */
.a4-header-title h1 { font-size: 24px; font-weight: 900; color: #fff; margin: 0; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.a4-header-title p  { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.7); margin: 0; letter-spacing: 2px; text-transform: uppercase; }
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e

/* Grid info cards */
.a4-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
<<<<<<< HEAD
  gap: 16px;
  margin-bottom: 8mm;
}
.a4-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 0;
}
.a4-card-inner { padding: 8px 14px; }
.a4-card .label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }

.a4-input-box {
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}
.a4-input-box:focus-within { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.a4-input-box input { width: 100%; border: none; background: transparent; outline: none; font-size: 18px; font-weight: 800; color: #1e293b; font-family: 'Prompt', sans-serif; }
.a4-input-box input::placeholder { color: #cbd5e1; }

.a4-scan-btn { font-size: 11px; color: #3b82f6; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 700; margin-top: 8px; }

.a4-stock-guaranteed {
  background: linear-gradient(135deg, #eff6ff, #f0f9ff);
  border: 2px dashed #bfdbfe;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  min-height: 100px;
}
.a4-stock-guaranteed svg { color: #60a5fa; margin-bottom: 8px; }
.a4-stock-guaranteed .text { font-size: 11px; color: #60a5fa; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
=======
  gap: 5mm;
  margin-bottom: 6mm;
}
.a4-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
}
.a4-card .label { font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }
.a4-card .value { font-size: 16px; font-weight: 900; color: #1e293b; }
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e

/* Problem box */
.a4-problem {
  background: linear-gradient(135deg, #fff1f2, #fff5f5);
  border: 1.5px solid #fecdd3;
<<<<<<< HEAD
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 8mm;
}
.a4-problem textarea { width: 100%; font-size: 16px; font-weight: 600; color: #4c0519; background: transparent; border: none; outline: none; resize: none; font-family: 'Prompt', sans-serif; line-height: 1.6; }
.a4-problem textarea::placeholder { color: #fda4af; }
=======
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 6mm;
}
.a4-problem .label { font-size: 8px; font-weight: 800; color: #fb7185; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 5px; }
.a4-problem .value { font-size: 13px; font-weight: 600; color: #4c0519; line-height: 1.5; }
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e

/* Signature grid */
.a4-sig-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
<<<<<<< HEAD
  gap: 16px;
  margin-bottom: 8mm;
}
.a4-sig-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}
.a4-sig-card.blue  { border-color: #bfdbfe; background: linear-gradient(to bottom, #eff6ff 0%, #fff 40%); }
.a4-sig-card.green { border-color: #bbf7d0; background: linear-gradient(to bottom, #f0fdf4 0%, #fff 40%); }

.a4-sig-card .sig-header { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1.5px solid rgba(0,0,0,0.05); padding-bottom: 8px; margin-bottom: 12px; text-align: center; }
.a4-sig-card.blue  .sig-header { color: #3b82f6; }
.a4-sig-card.green .sig-header { color: #22c55e; }

.a4-sig-row { display: flex; align-items: center; margin-bottom: 10px; }
.a4-sig-row .k { font-size: 13px; color: #64748b; font-weight: 700; width: 45px; }
.a4-sig-input { flex: 1; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-family: 'Prompt', sans-serif; outline: none; font-weight: 600; color: #1e293b; background: white; transition: 0.2s; }
.a4-sig-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.a4-sig-input::placeholder { color: #cbd5e1; font-weight: 500;}

.a4-sig-line { border-bottom: 1.5px dashed #cbd5e1; margin-top: 30px; }
.a4-sig-line-label { font-size: 10px; text-align: center; color: #94a3b8; margin-top: 6px; font-weight: 600; }

/* Footer */
.a4-footer { padding-top: 6mm; text-align: center; font-size: 10px; color: #cbd5e1; font-style: italic; font-weight: 600; }
=======
  gap: 5mm;
  margin-bottom: 6mm;
}
.a4-sig-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
}
.a4-sig-card.blue  { border-color: #bfdbfe; }
.a4-sig-card.green { border-color: #bbf7d0; }
.a4-sig-card.slate { border-color: #e2e8f0; }
.a4-sig-card.teal  { border-color: #99f6e4; }

.a4-sig-card .sig-header { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; margin-bottom: 6px; text-align: center; }
.a4-sig-card.blue  .sig-header { color: #3b82f6; }
.a4-sig-card.green .sig-header { color: #22c55e; }
.a4-sig-card.slate .sig-header { color: #94a3b8; }
.a4-sig-card.teal  .sig-header { color: #14b8a6; }

.a4-sig-card .sig-row { font-size: 11px; margin-bottom: 3px; }
.a4-sig-card .sig-row span.k { color: #94a3b8; font-weight: 700; margin-right: 4px; }
.a4-sig-card .sig-row span.v { color: #1e293b; font-weight: 700; }
.a4-sig-line { margin-top: auto; border-bottom: 1.5px dashed #cbd5e1; margin-top: 14px; }
.a4-sig-line-label { font-size: 8px; text-align: center; color: #cbd5e1; margin-top: 3px; }

/* Footer */
.a4-footer { border-top: 1px solid #e2e8f0; padding-top: 5mm; text-align: center; font-size: 8px; color: #cbd5e1; font-style: italic;  }
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e

/* -- Export hidden wrapper -- */
#repair-pdf-root {
  display: none;
  position: fixed;
  left: -9999px;
  top: 0;
  width: 794px; /* 210mm at 96dpi */
  background: transparent;
}
`;

export default function RepairEntry() {
  const [formData, setFormData] = useState<Omit<RepairRecord, 'id' | 'createdAt' | 'updatedAt'>>({
    assetNumber: '',
    equipmentModel: '',
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  // Inject premium CSS once
  useEffect(() => {
    const id = 'repair-premium-css';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = PREMIUM_CSS;
      document.head.appendChild(style);
    }
    return () => {};
  }, []);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render(
        (decodedText) => {
          if (scanning === 'asset') setFormData(prev => ({ ...prev, assetNumber: decodedText }));
          else setFormData(prev => ({ ...prev, serialNumber: decodedText }));
          scanner.clear();
          setScanning(null);
        },
        () => {}
      );
      return () => { scanner.clear(); };
    }
  }, [scanning]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      RepairService.saveRepair(formData);
      setMessage({ type: 'success', text: 'บันทึกข้อมูลสำเร็จแล้ว' });
    } catch {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
  };

  const exportPDF = async () => {
    const el = document.getElementById('repair-pdf-root');
    if (!el) return;
    setExporting(true);
    el.style.display = 'block';
    await new Promise(r => setTimeout(r, 300));
    try {
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ratio = canvas.height / canvas.width;
      const imgH = pw * ratio;
      if (imgH <= ph) {
        pdf.addImage(imgData, 'PNG', 0, 0, pw, imgH);
      } else {
        // Multi-page
        let yPos = 0;
        let remaining = canvas.height;
        const pageH = canvas.width * (ph / pw);
        let page = 0;
        while (remaining > 0) {
          if (page > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -(page * ph), pw, pw * ratio);
          remaining -= pageH;
          page++;
        }
      }
      pdf.save(`Repair_${formData.assetNumber || 'record'}_${new Date().toLocaleDateString('th-TH').replace(/\//g,'-')}.pdf`);
      setMessage({ type: 'success', text: 'สร้างไฟล์ PDF สำเร็จแล้ว' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการสร้าง PDF' });
    } finally {
      el.style.display = 'none';
      setExporting(false);
    }
  };

  // ─── Input helpers ───
  const inp = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-[Prompt] text-slate-700 placeholder:text-slate-300';
  const inpWhite = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none font-[Prompt] text-slate-700';

  return (
    <div className="repair-page-wrap max-w-5xl mx-auto px-4 py-8">

      {/* ── Page Header ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2" style={{ fontFamily: 'Prompt, sans-serif' }}>
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            ข้อมูลการแจ้งซ่อม
          </h1>
          <p className="text-slate-500 mt-1 text-sm" style={{ fontFamily: 'Prompt, sans-serif' }}>บันทึกประวัติการส่งซ่อมและรับเครื่องคืน</p>
        </div>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="flex items-center gap-2 bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 disabled:opacity-60 text-white px-5 py-3 rounded-xl transition-all shadow-xl shadow-indigo-200 font-bold text-sm"
          style={{ fontFamily: 'Prompt, sans-serif' }}
        >
          <Download size={18} />
          {exporting ? 'กำลังสร้าง...' : 'Export PDF'}
        </button>
      </div>

      {/* ── Alert ── */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          A4 FORM PREVIEW (also used for PDF export)
      ══════════════════════════════════════════════ */}
      <div className="a4-preview">
        {/* Watermark */}
        <div className="a4-watermark">
          <img src={HOSPITAL_LOGO} alt="watermark" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
        </div>

        <div className="a4-content">
          {/* ── Header stripe ── */}
          <div className="a4-header-stripe">
            <div className="logo-box">
              <img src={HOSPITAL_LOGO} alt="โรงพยาบาลนครพิงค์" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            </div>
            <div className="a4-header-title">
              <h1>เอกสารบันทึกการแจ้งซ่อม</h1>
              <p>โรงพยาบาลนครพิงค์ · Stock Guaranteed System</p>
            </div>
          </div>

          {/* ── Intro line ── */}
<<<<<<< HEAD
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8mm', fontStyle: 'italic', fontWeight: 600 }}>
=======
          <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '6mm', fontStyle: 'italic' }}>
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
            วันที่สร้างเอกสาร: <strong style={{ color: '#1e293b' }}>{new Date().toLocaleString('th-TH')}</strong>
          </p>

          {/* ── Section 1: Equipment ── */}
<<<<<<< HEAD
          <div className="section-title blue">
            <Barcode size={18} /> ข้อมูลตัวเครื่อง
          </div>

          <div className="a4-info-grid">
            <div className="a4-card">
              <div className="a4-card-inner">
                <div className="label">เลขครุภัณฑ์ (Asset Number)</div>
                <div className="a4-input-box">
                  <input
                    type="text"
                    required
                    value={formData.assetNumber}
                    onChange={e => setFormData({ ...formData, assetNumber: e.target.value })}
                    placeholder="เช่น 7440-006-1009/..-69"
                  />
                </div>
                <button type="button" className="a4-scan-btn" onClick={() => setScanning('asset')}>
                  <Camera size={14} /> สแกน QR/Barcode
                </button>
              </div>
            </div>

            <div className="a4-card">
              <div className="a4-card-inner">
                <div className="label">รุ่นของอุปกรณ์ (Model)</div>
                <div className="a4-input-box">
                  <input
                    type="text"
                    required
                    value={formData.equipmentModel}
                    onChange={e => setFormData({ ...formData, equipmentModel: e.target.value })}
                    placeholder="เช่น Acer X4690G"
                  />
                </div>
              </div>
            </div>

            <div className="a4-card">
              <div className="a4-card-inner">
                <div className="label">Serial Number (S/N)</div>
                <div className="a4-input-box">
                  <input
                    type="text"
                    required
                    value={formData.serialNumber}
                    onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Serial Number"
                  />
                </div>
                <button type="button" className="a4-scan-btn" onClick={() => setScanning('serial')}>
                  <Camera size={14} /> สแกน QR/Barcode
                </button>
              </div>
            </div>

            <div className="a4-card" style={{ padding: '4px' }}>
              <div className="a4-stock-guaranteed">
                <ShieldCheck size={36} />
                <div className="text">Stock Guaranteed</div>
=======
          <p style={{ fontSize: '9px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4mm', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Barcode size={13} /> ข้อมูลตัวเครื่อง
          </p>

          <div className="a4-info-grid" style={{ marginBottom: '6mm' }}>
            {/* ── SWAPPED: Asset Number first, then Model ── */}
            <div className="a4-card">
              <div className="label">เลขครุภัณฑ์ (Asset Number)</div>
              <input
                type="text"
                required
                className={inp}
                style={{ fontSize: '18px', fontWeight: 900, background: 'transparent', border: 'none', padding: '2px 0', outline: 'none', color: '#1e293b', width: '100%' }}
                value={formData.assetNumber}
                onChange={e => setFormData({ ...formData, assetNumber: e.target.value })}
                placeholder="เช่น 52-01-1234"
              />
              <button type="button" onClick={() => setScanning('asset')} style={{ fontSize: '10px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Camera size={13} /> สแกน QR/Barcode
              </button>
            </div>

            <div className="a4-card">
              <div className="label">รุ่นของอุปกรณ์ (Model)</div>
              <input
                type="text"
                required
                className={inp}
                style={{ fontSize: '18px', fontWeight: 900, background: 'transparent', border: 'none', padding: '2px 0', outline: 'none', color: '#1e293b', width: '100%' }}
                value={formData.equipmentModel}
                onChange={e => setFormData({ ...formData, equipmentModel: e.target.value })}
                placeholder="เช่น Dell Latitude 5420"
              />
            </div>

            <div className="a4-card">
              <div className="label">Serial Number (S/N)</div>
              <input
                type="text"
                required
                className={inp}
                style={{ fontSize: '16px', fontWeight: 700, background: 'transparent', border: 'none', padding: '2px 0', outline: 'none', color: '#1e293b', width: '100%' }}
                value={formData.serialNumber}
                onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="Serial Number"
              />
              <button type="button" onClick={() => setScanning('serial')} style={{ fontSize: '10px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Camera size={13} /> สแกน QR/Barcode
              </button>
            </div>

            {/* Placeholder 4th cell */}
            <div className="a4-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)', border: '1.5px dashed #bfdbfe' }}>
              <div style={{ textAlign: 'center' }}>
                <ShieldCheck size={28} style={{ color: '#93c5fd', margin: '0 auto 6px' }} />
                <div style={{ fontSize: '9px', color: '#93c5fd', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Stock Guaranteed</div>
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
              </div>
            </div>
          </div>

          {/* ── Section 2: Problem ── */}
<<<<<<< HEAD
          <div className="section-title red">
            อาการเสีย / รายละเอียดปัญหา
          </div>
          <div className="a4-problem">
            <textarea
              required
              rows={4}
=======
          <p style={{ fontSize: '9px', fontWeight: 800, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '3mm' }}>
            อาการเสีย / รายละเอียดปัญหา
          </p>
          <div className="a4-problem">
            <textarea
              required
              rows={3}
              style={{ fontSize: '13px', fontWeight: 600, color: '#4c0519', background: 'transparent', border: 'none', outline: 'none', resize: 'none', width: '100%', fontFamily: 'Prompt, sans-serif' }}
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
              value={formData.problemDescription}
              onChange={e => setFormData({ ...formData, problemDescription: e.target.value })}
              placeholder="ระบุอาการเสียหรือปัญหาที่พบ..."
            />
          </div>

          {/* ── Section 3: Signatures ── */}
<<<<<<< HEAD
          <div className="section-title blue" style={{ marginTop: '10mm' }}>
            <User size={18} /> ผู้รับผิดชอบและลายมือชื่อ
          </div>

          <div className="a4-sig-grid">
            {/* Reporter */}
            <div className="a4-sig-card blue">
              <div className="sig-header">เจ้าหน้าที่แจ้งซ่อม / ผู้ส่งเครื่อง</div>
              <div className="a4-sig-row">
                <div className="k">ชื่อ:</div>
                <input type="text" required placeholder="ชื่อ-นามสกุล" className="a4-sig-input" value={formData.reporterName} onChange={e => setFormData({ ...formData, reporterName: e.target.value })} />
              </div>
              <div className="a4-sig-row">
                <div className="k">วันที่:</div>
                <input type="date" required className="a4-sig-input" value={formData.reportedDate} onChange={e => setFormData({ ...formData, reportedDate: e.target.value })} />
              </div>
=======
          <p style={{ fontSize: '9px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '3mm', marginTop: '6mm', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={13} /> ผู้รับผิดชอบและลายมือชื่อ
          </p>

          <div className="a4-sig-grid">
            {/* Reporter */}
            <div className="a4-sig-card slate">
              <div className="sig-header">เจ้าหน้าที่แจ้งซ่อม / ผู้ส่งเครื่อง</div>
              <div className="sig-row"><span className="k">ชื่อ:</span></div>
              <input type="text" required placeholder="ชื่อ-นามสกุล" className={inpWhite} style={{ fontSize: '12px', marginBottom: '4px' }} value={formData.reporterName} onChange={e => setFormData({ ...formData, reporterName: e.target.value })} />
              <div className="sig-row" style={{ marginTop: '4px' }}><span className="k">วันที่:</span></div>
              <input type="date" required className={inpWhite} style={{ fontSize: '12px' }} value={formData.reportedDate} onChange={e => setFormData({ ...formData, reportedDate: e.target.value })} />
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
              <div className="a4-sig-line" />
              <div className="a4-sig-line-label">ลายมือชื่อ</div>
            </div>

            {/* Receiver */}
            <div className="a4-sig-card blue">
              <div className="sig-header">ผู้รับเครื่องซ่อม</div>
<<<<<<< HEAD
              <div className="a4-sig-row">
                <div className="k">ชื่อ:</div>
                <input type="text" required placeholder="ชื่อ-นามสกุล" className="a4-sig-input" value={formData.receiverName} onChange={e => setFormData({ ...formData, receiverName: e.target.value })} />
              </div>
              <div className="a4-sig-row">
                <div className="k">วันที่:</div>
                <input type="date" required className="a4-sig-input" value={formData.receivedDate} onChange={e => setFormData({ ...formData, receivedDate: e.target.value })} />
              </div>
=======
              <div className="sig-row"><span className="k">ชื่อ:</span></div>
              <input type="text" required placeholder="ชื่อ-นามสกุล" className={inpWhite} style={{ fontSize: '12px', marginBottom: '4px' }} value={formData.receiverName} onChange={e => setFormData({ ...formData, receiverName: e.target.value })} />
              <div className="sig-row" style={{ marginTop: '4px' }}><span className="k">วันที่:</span></div>
              <input type="date" required className={inpWhite} style={{ fontSize: '12px' }} value={formData.receivedDate} onChange={e => setFormData({ ...formData, receivedDate: e.target.value })} />
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
              <div className="a4-sig-line" />
              <div className="a4-sig-line-label">ลายมือชื่อ</div>
            </div>

            {/* Staff receipt */}
<<<<<<< HEAD
            <div className="a4-sig-card green">
              <div className="sig-header" style={{ color: '#22c55e' }}>เจ้าหน้าที่ผู้รับเครื่องคืน</div>
              <div className="a4-sig-row">
                <div className="k">ชื่อ:</div>
                <input type="text" placeholder="ชื่อ-นามสกุล" className="a4-sig-input" value={formData.staffReceiptName} onChange={e => setFormData({ ...formData, staffReceiptName: e.target.value })} />
              </div>
              <div className="a4-sig-row">
                <div className="k">วันที่:</div>
                <input type="date" className="a4-sig-input" value={formData.staffReceiptDate} onChange={e => setFormData({ ...formData, staffReceiptDate: e.target.value })} />
              </div>
=======
            <div className="a4-sig-card teal">
              <div className="sig-header">เจ้าหน้าที่ผู้รับเครื่องคืน</div>
              <div className="sig-row"><span className="k">ชื่อ:</span></div>
              <input type="text" placeholder="ชื่อ-นามสกุล" className={inpWhite} style={{ fontSize: '12px', marginBottom: '4px' }} value={formData.staffReceiptName} onChange={e => setFormData({ ...formData, staffReceiptName: e.target.value })} />
              <div className="sig-row" style={{ marginTop: '4px' }}><span className="k">วันที่:</span></div>
              <input type="date" className={inpWhite} style={{ fontSize: '12px' }} value={formData.staffReceiptDate} onChange={e => setFormData({ ...formData, staffReceiptDate: e.target.value })} />
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
              <div className="a4-sig-line" />
              <div className="a4-sig-line-label">ลายมือชื่อ</div>
            </div>

            {/* Returner */}
            <div className="a4-sig-card green">
<<<<<<< HEAD
              <div className="sig-header" style={{ color: '#22c55e' }}>ผู้ส่งมอบเครื่องคืน</div>
              <div className="a4-sig-row">
                <div className="k">ชื่อ:</div>
                <input type="text" placeholder="ชื่อ-นามสกุล" className="a4-sig-input" value={formData.returnerName} onChange={e => setFormData({ ...formData, returnerName: e.target.value })} />
              </div>
              <div className="a4-sig-row">
                <div className="k">วันที่:</div>
                <input type="date" className="a4-sig-input" value={formData.returnDate} onChange={e => setFormData({ ...formData, returnDate: e.target.value })} />
              </div>
=======
              <div className="sig-header">ผู้ส่งมอบเครื่องคืน</div>
              <div className="sig-row"><span className="k">ชื่อ:</span></div>
              <input type="text" placeholder="ชื่อ-นามสกุล" className={inpWhite} style={{ fontSize: '12px', marginBottom: '4px' }} value={formData.returnerName} onChange={e => setFormData({ ...formData, returnerName: e.target.value })} />
              <div className="sig-row" style={{ marginTop: '4px' }}><span className="k">วันที่:</span></div>
              <input type="date" className={inpWhite} style={{ fontSize: '12px' }} value={formData.returnDate} onChange={e => setFormData({ ...formData, returnDate: e.target.value })} />
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
              <div className="a4-sig-line" />
              <div className="a4-sig-line-label">ลายมือชื่อ</div>
            </div>
          </div>

          {/* ── Submit ── */}
          <div style={{ display: 'flex', justifyItems: 'end', marginTop: '8mm', paddingTop: '5mm', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={handleSubmit as any}
              className="group flex w-full justify-center md:w-auto md:ml-auto items-center gap-2 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-xl shadow-blue-200"
              style={{ fontFamily: 'Prompt, sans-serif' }}
            >
              บันทึกข้อมูลการแจ้งซ่อม
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
            </button>
          </div>

          {/* ── Footer ── */}
          <div className="a4-footer" style={{ marginTop: '6mm' }}>
            เอกสารนี้สร้างขึ้นโดยระบบอัตโนมัติ &nbsp;·&nbsp; Stock Guaranteed System &nbsp;·&nbsp; โรงพยาบาลนครพิงค์ &nbsp;·&nbsp; {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          HIDDEN DIV for PDF Export (cloned from above)
      ═══════════════════════════════════════════════ */}
      <div id="repair-pdf-root" style={{ fontFamily: 'Prompt, sans-serif' }}>
        <div style={{
          width: '794px',
          minHeight: '1122px',
          background: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* PDF Watermark */}
          <div style={{
<<<<<<< HEAD
            position: 'absolute', top: '30%', left: 0, right: 0,
=======
            position: 'absolute', inset: 0,
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 0
          }}>
            <img
              src={HOSPITAL_LOGO}
              alt="watermark"
<<<<<<< HEAD
              style={{ width: '60%', opacity: 0.12 }} /* Consistent with preview */
=======
              style={{ width: '55%', opacity: 0.15, transform: 'rotate(-15deg) scale(1.1)', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2)) saturate(1.3)' }}
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
              onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
            />
          </div>

          <div style={{ position: 'relative', zIndex: 1, padding: '0' }}>
            {/* PDF Header stripe */}
            <div style={{
<<<<<<< HEAD
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              padding: '24px 40px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '20px',
              borderBottom: '4px solid #60a5fa'
            }}>
              <div style={{ background: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <img
                  src={HOSPITAL_LOGO}
                  alt="logo"
                  style={{ width: '65px', height: '65px', objectFit: 'contain' }}
=======
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #60a5fa 100%)',
              padding: '24px 40px',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: '#fff',
                padding: '0',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25), 0 0 0 3px rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '76px',
                height: '76px',
                border: '1px solid #e2e8f0',
                flexShrink: 0
              }}>
                <img
                  src={HOSPITAL_LOGO}
                  alt="logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.1)', padding: '2px' }}
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
                />
              </div>
              <div>
<<<<<<< HEAD
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>เอกสารบันทึกการแจ้งซ่อม</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '2px', textTransform: 'uppercase' }}>โรงพยาบาลนครพิงค์ · Stock Guaranteed System</div>
=======
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>เอกสารบันทึกการแจ้งซ่อม</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '2px', textTransform: 'uppercase' }}>โรงพยาบาลนครพิงค์ · Stock Guaranteed System</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>วันที่สร้างเอกสาร</div>
                <div style={{ fontWeight: 400 }}>{new Date().toLocaleString('th-TH')}</div>
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
              </div>
            </div>

            <div style={{ padding: '0 40px 30px' }}>
<<<<<<< HEAD
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8mm', fontStyle: 'italic', fontWeight: 600 }}>
                วันที่สร้างเอกสาร: <strong style={{ color: '#1e293b' }}>{new Date().toLocaleString('th-TH')}</strong>
              </div>

              {/* Info grid */}
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Barcode size={18} /> ข้อมูลตัวเครื่อง
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '30px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '8px 14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>เลขครุภัณฑ์ (Asset Number)</div>
                  <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', background: '#f8fafc', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{formData.assetNumber || '-'}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '8px 14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>รุ่นของอุปกรณ์ (Model)</div>
                  <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', background: '#f8fafc', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{formData.equipmentModel || '-'}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '8px 14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Serial Number (S/N)</div>
                  <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', background: '#f8fafc', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{formData.serialNumber || '-'}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f0f9ff)', border: '2px dashed #bfdbfe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minHeight: '100px' }}>
                  <ShieldCheck size={36} color="#60a5fa" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Stock Guaranteed</div>
=======
              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px' }}>
                  <div style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>เลขครุภัณฑ์ (Asset Number)</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b' }}>{formData.assetNumber || '-'}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px' }}>
                  <div style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>รุ่นของอุปกรณ์ (Model)</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b' }}>{formData.equipmentModel || '-'}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px' }}>
                  <div style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>Serial Number (S/N)</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>{formData.serialNumber || '-'}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f0f9ff)', border: '1.5px dashed #bfdbfe', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <div style={{ fontSize: '9px', color: '#93c5fd', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>⚙ Stock Guaranteed</div>
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
                </div>
              </div>

              {/* Problem */}
<<<<<<< HEAD
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                อาการเสีย / รายละเอียดปัญหา
              </div>
              <div style={{ background: 'linear-gradient(135deg,#fff1f2,#fff5f5)', border: '1.5px solid #fecdd3', borderRadius: '12px', padding: '16px 20px', marginBottom: '30px' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#4c0519', lineHeight: '1.6' }}>{formData.problemDescription || '-'}</div>
              </div>

              {/* Signatures */}
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} /> ผู้รับผิดชอบและลายมือชื่อ
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {[
                  { label: 'เจ้าหน้าที่แจ้งซ่อม / ผู้ส่งเครื่อง', name: formData.reporterName, date: formData.reportedDate, color: '#3b82f6', border: '#bfdbfe', bg: 'linear-gradient(to bottom, #eff6ff 0%, #fff 40%)' },
                  { label: 'ผู้รับเครื่องซ่อม', name: formData.receiverName, date: formData.receivedDate, color: '#3b82f6', border: '#bfdbfe', bg: 'linear-gradient(to bottom, #eff6ff 0%, #fff 40%)' },
                  { label: 'เจ้าหน้าที่ผู้รับเครื่องคืน', name: formData.staffReceiptName, date: formData.staffReceiptDate, color: '#22c55e', border: '#bbf7d0', bg: 'linear-gradient(to bottom, #f0fdf4 0%, #fff 40%)' },
                  { label: 'ผู้ส่งมอบเครื่องคืน', name: formData.returnerName, date: formData.returnDate, color: '#22c55e', border: '#bbf7d0', bg: 'linear-gradient(to bottom, #f0fdf4 0%, #fff 40%)' },
                ].map((sig, i) => (
                  <div key={i} style={{ background: sig.bg, border: `1.5px solid ${sig.border}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: sig.color, textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1.5px solid rgba(0,0,0,0.05)', paddingBottom: '8px', marginBottom: '12px', textAlign: 'center' }}>{sig.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, width: '45px' }}>ชื่อ: </span>
                      <span style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', fontWeight: 600, color: '#1e293b', background: 'white' }}>{sig.name || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, width: '45px' }}>วันที่: </span>
                      <span style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', fontWeight: 600, color: '#1e293b', background: 'white' }}>{sig.date || '-'}</span>
                    </div>
                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ borderBottom: '1.5px dashed #cbd5e1', marginTop: '30px' }} />
                      <div style={{ fontSize: '10px', textAlign: 'center', color: '#94a3b8', marginTop: '6px', fontWeight: 600 }}>ลายมือชื่อ</div>
                    </div>
=======
              <div style={{ background: 'linear-gradient(135deg,#fff1f2,#fff5f5)', border: '1.5px solid #fecdd3', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>อาการเสีย / ปัญหาที่พบ</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#4c0519', lineHeight: '1.6' }}>{formData.problemDescription || '-'}</div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                {[
                  { label: 'เจ้าหน้าที่แจ้งซ่อม / ผู้ส่งเครื่อง', name: formData.reporterName, date: formData.reportedDate, color: '#94a3b8', border: '#e2e8f0' },
                  { label: 'ผู้รับเครื่องซ่อม', name: formData.receiverName, date: formData.receivedDate, color: '#3b82f6', border: '#bfdbfe' },
                  { label: 'เจ้าหน้าที่ผู้รับเครื่องคืน', name: formData.staffReceiptName, date: formData.staffReceiptDate, color: '#14b8a6', border: '#99f6e4' },
                  { label: 'ผู้ส่งมอบเครื่องคืน', name: formData.returnerName, date: formData.returnDate, color: '#22c55e', border: '#bbf7d0' },
                ].map((sig, i) => (
                  <div key={i} style={{ border: `1.5px solid ${sig.border}`, borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 800, color: sig.color, textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', marginBottom: '10px', textAlign: 'center' }}>{sig.label}</div>
                    <div style={{ fontSize: '12px', marginBottom: '3px' }}><span style={{ color: sig.color, fontWeight: 700 }}>ชื่อ: </span><span style={{ color: '#1e293b', fontWeight: 700 }}>{sig.name || '-'}</span></div>
                    <div style={{ fontSize: '12px', marginBottom: '3px' }}><span style={{ color: sig.color, fontWeight: 700 }}>วันที่: </span><span style={{ color: '#1e293b', fontWeight: 700 }}>{sig.date || '-'}</span></div>
                    <div style={{ marginTop: '24px', borderBottom: '1.5px dashed #cbd5e1' }} />
                    <div style={{ fontSize: '8px', textAlign: 'center', color: '#cbd5e1', marginTop: '3px' }}>ลายมือชื่อ</div>
>>>>>>> 938c24ebed8162d6cda838f430289cac93a1dd7e
                  </div>
                ))}
              </div>

              {/* PDF Footer */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', textAlign: 'center', fontSize: '9px', color: '#cbd5e1', fontStyle: 'italic' }}>
                เอกสารนี้สร้างขึ้นโดยระบบอัตโนมัติ &nbsp;·&nbsp; Stock Guaranteed System &nbsp;·&nbsp; โรงพยาบาลนครพิงค์ &nbsp;·&nbsp; {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barcode Scanner Modal ── */}
      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4" style={{ fontFamily: 'Prompt, sans-serif' }}>
              สแกน {scanning === 'asset' ? 'เลขครุภัณฑ์' : 'Serial Number'}
            </h3>
            <div id="reader" className="overflow-hidden rounded-2xl border-4 border-slate-100" />
            <button
              onClick={() => setScanning(null)}
              className="mt-6 w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
              style={{ fontFamily: 'Prompt, sans-serif' }}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
