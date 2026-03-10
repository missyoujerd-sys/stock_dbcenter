import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Download,
  Barcode,
  ArrowRight,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { RepairService } from '../../services/repairService';
import { RepairRecord } from '../../types/repair';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ---- Shared constants ----
const HOSPITAL_LOGO = '/cnkp-logo-best.png';

// ---- Premium styles injected once ----
const PREMIUM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800;900&display=swap');

.repair-page-wrap { font-family: 'Prompt', sans-serif; }

/* A4 preview */
.a4-preview {
  width: 100%;
  max-width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: #fff;
  position: relative;
  box-shadow: 0 30px 80px rgba(0,0,0,0.18);
  border-radius: 8px;
  overflow: hidden;
}

/* Watermark styling - Premium */
.a4-watermark {
  position: absolute;
  top: 30%; /* Align toward the middle of the form details specifically */
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 0;
}
.a4-watermark img {
  width: 60%;
  opacity: 0.12; /* Slightly more visible */
}

.a4-content { position: relative; z-index: 1; padding: 14mm 16mm 12mm; }

/* Header stripe */
.a4-header-stripe {
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

/* Grid info cards */
.a4-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}
.a4-stock-guaranteed:hover {
  background: linear-gradient(135deg, #e0f2fe, #f0f9ff);
}
.a4-stock-guaranteed svg { color: #60a5fa; margin-bottom: 8px; }
.a4-stock-guaranteed .text { 
  font-size: 11px; 
  color: #60a5fa; 
  font-weight: 800; 
  letter-spacing: 2px; 
  text-transform: uppercase; 
}

.a4-stock-expired {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 3px dashed #f87171;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  min-height: 100px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}
.a4-stock-expired:hover {
  background: linear-gradient(135deg, #fee2e2, #fca5a5);
  border-style: solid;
}
.a4-stock-expired svg { color: #ef4444; margin-bottom: 8px; }
.a4-stock-expired .text { 
  font-size: 14px; 
  color: #ef4444; 
  font-weight: 800; 
  letter-spacing: 1px; 
  text-transform: uppercase; 
}

/* Problem box */
.a4-problem {
  background: linear-gradient(135deg, #fff1f2, #fff5f5);
  border: 1.5px solid #fecdd3;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 8mm;
}
.a4-problem textarea { width: 100%; font-size: 16px; font-weight: 600; color: #4c0519; background: transparent; border: none; outline: none; resize: none; font-family: 'Prompt', sans-serif; line-height: 1.6; }
.a4-problem textarea::placeholder { color: #fda4af; }

/* Signature grid */
.a4-sig-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

/* Responsive adjustments for A4 Preview */
@media (max-width: 768px) {
  .a4-preview { min-height: auto; }
  .a4-content { padding: 5mm; }
  .a4-header-stripe { margin: -5mm -5mm 0; padding: 5mm; flex-direction: column; text-align: center; gap: 8px; margin-bottom: 4mm; }
  .a4-header-title h1 { font-size: 20px; }
  .a4-header-title p { font-size: 9px; line-height: 1.4; }
  .a4-info-grid { grid-template-columns: 1fr; gap: 12px; margin-bottom: 4mm; }
  .a4-sig-grid { grid-template-columns: 1fr; gap: 12px; margin-bottom: 4mm; }
  .a4-input-box { padding: 8px 12px; }
  .a4-input-box input { font-size: 14px; }
  .a4-stock-guaranteed, .a4-stock-expired { min-height: 80px; padding: 12px; }
  .a4-sig-card { padding: 12px; }
}

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
    isWarranty: true,
    status: 'pending'
  });

  const [scanning, setScanning] = useState<'asset' | 'serial' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // OCR specific state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const photoInputRef = React.useRef<HTMLInputElement>(null);

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

  /* ── Photo capture + OCR for Asset matching ── */
  const rotateToLandscape = (dataUrl: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        if (h > w) {
          const canvas = document.createElement('canvas');
          canvas.width = h;
          canvas.height = w;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.translate(h / 2, w / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(img, -w / 2, -h / 2);
            resolve(canvas.toDataURL('image/jpeg', 0.92));
            return;
          }
        }
        resolve(dataUrl);
      };
      img.src = dataUrl;
    });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setScanning(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const rawUrl = evt.target?.result as string;
      const dataUrl = await rotateToLandscape(rawUrl);
      
      setOcrLoading(true);
      setOcrResult('');
      
      try {
        const Tesseract = (await import('tesseract.js')).default;
        const result = await Tesseract.recognize(dataUrl, 'eng', {
          logger: () => { },
        });
        const text = result.data.text;
        
        // ดึงเฉพาะตัวเลข ขีด (-) และสแลช (/) และลบตัวอักษรหรือช่องว่างอื่นๆทิ้งทั้งหมด
        let extracted = text.replace(/[^\d\-\/]/g, '');

        if (extracted.length > 0) {
            if (scanning === 'asset') {
                setFormData((prev) => ({ ...prev, assetNumber: extracted }));
            } else if (scanning === 'serial') {
                setFormData((prev) => ({ ...prev, serialNumber: extracted }));
            }
            setOcrResult('สำเร็จ');
            setMessage({ type: 'success', text: `อ่านค่าสำเร็จ: ${extracted}` });
        } else {
            setMessage({ type: 'error', text: 'ไม่พบตัวเลขในรูปภาพ' });
        }
      } catch (err) {
        console.error('OCR error:', err);
        setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการอ่านรูป (OCR)' });
      } finally {
        setOcrLoading(false);
        setScanning(null);
        if (photoInputRef.current) photoInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await RepairService.saveRepair(formData);
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
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
              <p>โรงพยาบาลนครพิงค์ · Stock Guaranteed System Google Forms</p>
            </div>
          </div>

          {/* ── Intro line ── */}
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8mm', fontStyle: 'italic', fontWeight: 600 }}>
            วันที่สร้างเอกสาร: <strong style={{ color: '#1e293b' }}>{new Date().toLocaleString('th-TH')}</strong>
          </p>

          {/* ── Section 1: Equipment ── */}
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
                <button type="button" className="a4-scan-btn" onClick={() => { setScanning('asset'); photoInputRef.current?.click(); }} disabled={ocrLoading}>
                  <Camera size={14} /> {ocrLoading && scanning === 'asset' ? 'กำลังอ่าน...' : 'สแกน QR/Barcode'}
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
                <button type="button" className="a4-scan-btn" onClick={() => { setScanning('serial'); photoInputRef.current?.click(); }} disabled={ocrLoading}>
                  <Camera size={14} /> {ocrLoading && scanning === 'serial' ? 'กำลังอ่าน...' : 'สแกน QR/Barcode'}
                </button>
              </div>
            </div>

            <div className="a4-card" style={{ padding: '4px' }}>
              <div 
                className={formData.isWarranty ? "a4-stock-guaranteed" : "a4-stock-expired"}
                onClick={() => setFormData({ ...formData, isWarranty: !formData.isWarranty })}
                title="คลิกเพื่อสลับสถานะการรับประกัน"
              >
                {formData.isWarranty ? (
                  <>
                    <ShieldCheck size={36} />
                    <div className="text" style={{ fontFamily: 'Prompt, sans-serif' }}>STOCK อยู่ในประกัน</div>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={36} />
                    <div className="text" style={{ fontFamily: 'Prompt, sans-serif' }}>หมดประกัน</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 2: Problem ── */}
          <div className="section-title red">
            อาการเสีย / รายละเอียดปัญหา
          </div>
          <div className="a4-problem">
            <textarea
              required
              rows={4}
              value={formData.problemDescription}
              onChange={e => setFormData({ ...formData, problemDescription: e.target.value })}
              placeholder="ระบุอาการเสียหรือปัญหาที่พบ..."
            />
          </div>

          {/* ── Section 3: Signatures ── */}
          <div className="section-title blue" style={{ marginTop: '10mm' }}>
            <User size={18} /> ผู้รับผิดชอบและลายมือชื่อ
          </div>

          <div className="a4-sig-grid">
            {/* Reporter */}
            <div className="a4-sig-card blue">
              <div className="sig-header">เจ้าหน้าที่แจ้งซ่อม / ผู้ส่งเครื่อง</div>
              <div className="a4-sig-row">
                <div className="k">ชื่อ:</div>
                <input type="text" required placeholder="ชื่อ-นามสกุล" className="a4-sig-input" value={formData.reporterName} onChange={e => setFormData({ ...formData, reporterName: e.target.value })} list="officer-names-list" />
              </div>
              <div className="a4-sig-row">
                <div className="k">วันที่:</div>
                <input type="date" required className="a4-sig-input" value={formData.reportedDate} onChange={e => setFormData({ ...formData, reportedDate: e.target.value })} />
              </div>
              <div className="a4-sig-line" />
              <div className="a4-sig-line-label">ลายมือชื่อ</div>
            </div>

            {/* Receiver */}
            <div className="a4-sig-card blue">
              <div className="sig-header">ผู้รับเครื่องซ่อม</div>
              <div className="a4-sig-row">
                <div className="k">ชื่อ:</div>
                <input type="text" required placeholder="ชื่อ-นามสกุล" className="a4-sig-input" value={formData.receiverName} onChange={e => setFormData({ ...formData, receiverName: e.target.value })} />
              </div>
              <div className="a4-sig-row">
                <div className="k">วันที่:</div>
                <input type="date" required className="a4-sig-input" value={formData.receivedDate} onChange={e => setFormData({ ...formData, receivedDate: e.target.value })} />
              </div>
              <div className="a4-sig-line" />
              <div className="a4-sig-line-label">ลายมือชื่อ</div>
            </div>

            {/* Staff receipt */}
            <div className="a4-sig-card green">
              <div className="sig-header" style={{ color: '#22c55e' }}>เจ้าหน้าที่ผู้รับเครื่องคืน</div>
              <div className="a4-sig-row">
                <div className="k">ชื่อ:</div>
                <input type="text" placeholder="ชื่อ-นามสกุล" className="a4-sig-input" value={formData.staffReceiptName} onChange={e => setFormData({ ...formData, staffReceiptName: e.target.value })} list="officer-names-list" />
              </div>
              <div className="a4-sig-row">
                <div className="k">วันที่:</div>
                <input type="date" className="a4-sig-input" value={formData.staffReceiptDate} onChange={e => setFormData({ ...formData, staffReceiptDate: e.target.value })} />
              </div>
              <div className="a4-sig-line" />
              <div className="a4-sig-line-label">ลายมือชื่อ</div>
            </div>

            {/* Returner */}
            <div className="a4-sig-card green">
              <div className="sig-header" style={{ color: '#22c55e' }}>ผู้ส่งมอบเครื่องคืน</div>
              <div className="a4-sig-row">
                <div className="k">ชื่อ:</div>
                <input type="text" placeholder="ชื่อ-นามสกุล" className="a4-sig-input" value={formData.returnerName} onChange={e => setFormData({ ...formData, returnerName: e.target.value })} />
              </div>
              <div className="a4-sig-row">
                <div className="k">วันที่:</div>
                <input type="date" className="a4-sig-input" value={formData.returnDate} onChange={e => setFormData({ ...formData, returnDate: e.target.value })} />
              </div>
              <div className="a4-sig-line" />
              <div className="a4-sig-line-label">ลายมือชื่อ</div>
            </div>
          </div>

          <datalist id="officer-names-list">
            <option value="จันทกานต์ จันทร์ตาใหม่" />
            <option value="ฉันทวัฒน์ สุทธิพงษ์" />
            <option value="ณรงค์ รวมสุข" />
            <option value="ณัฐวุฒิ อินต๊ะผัด" />
            <option value="ทรงกลด สิงห์สันต์" />
            <option value="ธนากร ลุงหม่อง" />
            <option value="บรรเจิด สลักพิศพักตร์" />
            <option value="พัชชามาศ กาแก้ว" />
            <option value="ภาณุพงศ์ เชื่อมชิต" />
            <option value="มนตรี เครือซุย" />
            <option value="รสริน อุทิศเวทศักดิ์" />
            <option value="ศิวาพร ยอดเมือง" />
            <option value="อณุศักดิ์ เวียงนาค" />
            <option value="อาจารีย์ โสภากร" />
          </datalist>

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
            เอกสารนี้สร้างขึ้นโดยระบบอัตโนมัติ Google Forms &nbsp;·&nbsp; Stock Guaranteed System &nbsp;·&nbsp; โรงพยาบาลนครพิงค์ &nbsp;·&nbsp; {new Date().getFullYear()}
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
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 0
          }}>
            <img
              src={HOSPITAL_LOGO}
              alt="watermark"
              style={{ width: '55%', opacity: 0.15, transform: 'rotate(-15deg) scale(1.1)', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2)) saturate(1.3)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
            />
          </div>

          <div style={{ position: 'relative', zIndex: 1, padding: '0' }}>
            {/* PDF Header stripe */}
            <div style={{
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #60a5fa 100%)',
              padding: '24px 40px',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              marginBottom: '20px',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.15)'
            }}>
              <div style={{
                background: '#fff',
                padding: '0',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.8), 0 0 0 3px rgba(255,255,255,0.3)',
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
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
                />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>เอกสารบันทึกการแจ้งซ่อม</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '2px', textTransform: 'uppercase' }}>โรงพยาบาลนครพิงค์ · Stock Guaranteed System Google Forms</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>วันที่สร้างเอกสาร</div>
                <div style={{ fontWeight: 400 }}>{new Date().toLocaleString('th-TH')}</div>
              </div>
            </div>

            <div style={{ padding: '0 40px 30px' }}>

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
                <div style={
                  formData.isWarranty 
                  ? { background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)', border: '2px dashed #bfdbfe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minHeight: '100px' }
                  : { background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '3px dashed #f87171', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minHeight: '100px' }
                }>
                  {formData.isWarranty ? (
                    <>
                      <ShieldCheck size={36} color="#60a5fa" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: '"Prompt", sans-serif' }}>STOCK อยู่ในประกัน</div>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={36} color="#ef4444" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: '"Prompt", sans-serif' }}>หมดประกัน</div>
                    </>
                  )}
                </div>
              </div>

              {/* Problem */}
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
                  </div>
                ))}
              </div>

              {/* PDF Footer */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', textAlign: 'center', fontSize: '9px', color: '#cbd5e1', fontStyle: 'italic' }}>
                เอกสารนี้สร้างขึ้นโดยระบบอัตโนมัติ (Google Forms) &nbsp;·&nbsp; Stock Guaranteed System Google Forms &nbsp;·&nbsp; โรงพยาบาลนครพิงค์ &nbsp;·&nbsp; {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Native Camera Input ── */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoChange}
      />

      {/* ── Bottom Actions ── */}
      <div className="mt-8 flex justify-end">
        <Link to="/repair/dashboard" className="group flex items-center gap-3 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-200/50 font-bold text-base hover:-translate-y-1" style={{ fontFamily: 'Prompt, sans-serif' }}>
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
          <span>ย้อนกลับ</span>
        </Link>
      </div>
    </div>
  );
}
