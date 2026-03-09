import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Barcode,
  ShieldCheck,
  User,
  ArrowLeft,
  Download
} from 'lucide-react';
import { RepairService } from '../../services/repairService';
import { RepairRecord } from '../../types/repair';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const HOSPITAL_LOGO = '/nakornping-logo.png';

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
  top: 30%;
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
  opacity: 0.12;
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

.a4-static-box {
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  min-height: 48px;
  display: flex;
  align-items: center;
}

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
  font-size: 16px;
  font-weight: 600;
  color: #4c0519;
  line-height: 1.6;
  min-height: 100px;
}

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
.a4-sig-static { flex: 1; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-weight: 600; color: #1e293b; background: white; min-height: 40px; }

.a4-sig-line { border-bottom: 1.5px dashed #cbd5e1; margin-top: 30px; }
.a4-sig-line-label { font-size: 10px; text-align: center; color: #94a3b8; margin-top: 6px; font-weight: 600; }

/* Footer */
.a4-footer { padding-top: 6mm; text-align: center; font-size: 10px; color: #cbd5e1; font-style: italic; font-weight: 600; border-top: 1px solid #e2e8f0; }

/* Responsive adjustments for A4 Preview */
@media (max-width: 768px) {
  .a4-preview { min-height: auto; }
  .a4-content { padding: 5mm; }
  .a4-header-stripe { margin: -5mm -5mm 0; padding: 5mm; flex-direction: column; text-align: center; gap: 8px; margin-bottom: 4mm; }
  .a4-header-title h1 { font-size: 20px; }
  .a4-header-title p { font-size: 9px; line-height: 1.4; }
  .a4-info-grid { grid-template-columns: 1fr; gap: 12px; margin-bottom: 4mm; }
  .a4-sig-grid { grid-template-columns: 1fr; gap: 12px; margin-bottom: 4mm; }
  .a4-static-box { padding: 8px 12px; font-size: 14px; min-height: 40px; }
  .a4-stock-guaranteed, .a4-stock-expired { min-height: 80px; padding: 12px; }
  .a4-sig-card { padding: 12px; }
}

#repair-pdf-root {
  display: none;
  position: fixed;
  left: -9999px;
  top: 0;
  width: 794px;
  background: transparent;
}
`;

export default function RepairView() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<RepairRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const idName = 'repair-premium-css-view';
    if (!document.getElementById(idName)) {
      const style = document.createElement('style');
      style.id = idName;
      style.textContent = PREMIUM_CSS;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const result = await RepairService.getRepairById(id);
        setData(result);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const exportPDF = async () => {
    const el = document.getElementById('repair-pdf-root');
    if (!el || !data) return;
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
      pdf.save(`Repair_${data.assetNumber || 'record'}_${new Date().toLocaleDateString('th-TH').replace(/\//g,'-')}.pdf`);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF');
    } finally {
      el.style.display = 'none';
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 text-slate-500 font-['Prompt']">
        <h2 className="text-2xl font-bold">ไม่พบข้อมูลการแจ้งซ่อม</h2>
        <Link to="/repair" className="text-blue-600 hover:underline">กลับไปหน้ารายการแจ้งซ่อม</Link>
      </div>
    );
  }

  return (
    <div className="repair-page-wrap max-w-5xl mx-auto px-4 py-8">
      {/* ── Page Header ── */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/repair" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
              รายละเอียดแจ้งซ่อม
            </h1>
            <p className="text-slate-500 mt-1 text-sm">เลขที่เอกสาร: {data.id}</p>
          </div>
        </div>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="flex items-center gap-2 bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 disabled:opacity-60 text-white px-5 py-3 rounded-xl transition-all shadow-xl shadow-indigo-200 font-bold text-sm"
        >
          <Download size={18} />
          {exporting ? 'กำลังสร้าง...' : 'Export PDF'}
        </button>
      </div>

      {/* ── A4 VIEW PORT ── */}
      <div className="a4-preview">
        {/* Watermark */}
        <div className="a4-watermark">
          <img src={HOSPITAL_LOGO} alt="watermark" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
        </div>

        <div className="a4-content">
          <div className="a4-header-stripe">
            <div className="logo-box">
              <img src={HOSPITAL_LOGO} alt="โรงพยาบาลนครพิงค์" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            </div>
            <div className="a4-header-title">
              <h1>เอกสารบันทึกการแจ้งซ่อม</h1>
              <p>โรงพยาบาลนครพิงค์ · Stock Guaranteed System Google Forms</p>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8mm', fontStyle: 'italic', fontWeight: 600 }}>
            วันที่สร้างเอกสาร: <strong style={{ color: '#1e293b' }}>{new Date(data.createdAt).toLocaleString('th-TH')}</strong>
          </p>

          {/* Section 1 */}
          <div className="section-title blue">
            <Barcode size={18} /> ข้อมูลตัวเครื่อง
          </div>

          <div className="a4-info-grid">
            <div className="a4-card">
              <div className="a4-card-inner">
                <div className="label">เลขครุภัณฑ์ (Asset Number)</div>
                <div className="a4-static-box">{data.assetNumber || '-'}</div>
              </div>
            </div>

            <div className="a4-card">
              <div className="a4-card-inner">
                <div className="label">รุ่นของอุปกรณ์ (Model)</div>
                <div className="a4-static-box">{data.equipmentModel || '-'}</div>
              </div>
            </div>

            <div className="a4-card">
              <div className="a4-card-inner">
                <div className="label">Serial Number (S/N)</div>
                <div className="a4-static-box">{data.serialNumber || '-'}</div>
              </div>
            </div>

            <div className="a4-card" style={{ padding: '4px' }}>
              <div className={data.isWarranty !== false ? "a4-stock-guaranteed" : "a4-stock-expired"}>
                {data.isWarranty !== false ? (
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

          {/* Section 2 */}
          <div className="section-title red">
            อาการเสีย / รายละเอียดปัญหา
          </div>
          <div className="a4-problem">
            {data.problemDescription || '-'}
          </div>

          {/* Section 3 */}
          <div className="section-title blue" style={{ marginTop: '10mm' }}>
            <User size={18} /> ผู้รับผิดชอบและลายมือชื่อ
          </div>

          <div className="a4-sig-grid">
            {/* Reporter */}
            <div className="a4-sig-card blue">
              <div className="sig-header">เจ้าหน้าที่แจ้งซ่อม / ผู้ส่งเครื่อง</div>
              <div className="a4-sig-row">
                <div className="k">ชื่อ:</div>
                <div className="a4-sig-static">{data.reporterName || '-'}</div>
              </div>
              <div className="a4-sig-row">
                <div className="k">วันที่:</div>
                <div className="a4-sig-static">{data.reportedDate || '-'}</div>
              </div>
              <div className="a4-sig-line" />
              <div className="a4-sig-line-label">ลายมือชื่อ</div>
            </div>

            {/* Receiver */}
            <div className="a4-sig-card blue">
              <div className="sig-header">ผู้รับเครื่องซ่อม</div>
              <div className="a4-sig-row">
                <div className="k">ชื่อ:</div>
                <div className="a4-sig-static">{data.receiverName || '-'}</div>
              </div>
              <div className="a4-sig-row">
                <div className="k">วันที่:</div>
                <div className="a4-sig-static">{data.receivedDate || '-'}</div>
              </div>
              <div className="a4-sig-line" />
              <div className="a4-sig-line-label">ลายมือชื่อ</div>
            </div>

            {/* Staff Receipt */}
            <div className="a4-sig-card green">
              <div className="sig-header" style={{ color: '#22c55e' }}>เจ้าหน้าที่ผู้รับเครื่องคืน</div>
              <div className="a4-sig-row">
                <div className="k">ชื่อ:</div>
                <div className="a4-sig-static">{data.staffReceiptName || '-'}</div>
              </div>
              <div className="a4-sig-row">
                <div className="k">วันที่:</div>
                <div className="a4-sig-static">{data.staffReceiptDate || '-'}</div>
              </div>
              <div className="a4-sig-line" />
              <div className="a4-sig-line-label">ลายมือชื่อ</div>
            </div>

            {/* Returner */}
            <div className="a4-sig-card green">
              <div className="sig-header" style={{ color: '#22c55e' }}>ผู้ส่งมอบเครื่องคืน</div>
              <div className="a4-sig-row">
                <div className="k">ชื่อ:</div>
                <div className="a4-sig-static">{data.returnerName || '-'}</div>
              </div>
              <div className="a4-sig-row">
                <div className="k">วันที่:</div>
                <div className="a4-sig-static">{data.returnDate || '-'}</div>
              </div>
              <div className="a4-sig-line" />
              <div className="a4-sig-line-label">ลายมือชื่อ</div>
            </div>
          </div>

          {/* Footer */}
          <div className="a4-footer" style={{ marginTop: '6mm' }}>
            เอกสารนี้สร้างขึ้นโดยระบบอัตโนมัติ Google Forms &nbsp;·&nbsp; Stock Guaranteed System &nbsp;·&nbsp; โรงพยาบาลนครพิงค์ &nbsp;·&nbsp; {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* ── PDF EXPORT DIV ── */}
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
                <div style={{ fontWeight: 400 }}>{new Date(data.createdAt).toLocaleString('th-TH')}</div>
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
                  <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', background: '#f8fafc', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{data.assetNumber || '-'}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '8px 14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>รุ่นของอุปกรณ์ (Model)</div>
                  <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', background: '#f8fafc', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{data.equipmentModel || '-'}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '8px 14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Serial Number (S/N)</div>
                  <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', background: '#f8fafc', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{data.serialNumber || '-'}</div>
                </div>
                <div style={
                  data.isWarranty !== false 
                  ? { background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)', border: '2px dashed #bfdbfe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minHeight: '100px' }
                  : { background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '3px dashed #f87171', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minHeight: '100px' }
                }>
                  {data.isWarranty !== false ? (
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
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#4c0519', lineHeight: '1.6' }}>{data.problemDescription || '-'}</div>
              </div>

              {/* Signatures */}
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} /> ผู้รับผิดชอบและลายมือชื่อ
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {[
                  { label: 'เจ้าหน้าที่แจ้งซ่อม / ผู้ส่งเครื่อง', name: data.reporterName, date: data.reportedDate, color: '#3b82f6', border: '#bfdbfe', bg: 'linear-gradient(to bottom, #eff6ff 0%, #fff 40%)' },
                  { label: 'ผู้รับเครื่องซ่อม', name: data.receiverName, date: data.receivedDate, color: '#3b82f6', border: '#bfdbfe', bg: 'linear-gradient(to bottom, #eff6ff 0%, #fff 40%)' },
                  { label: 'เจ้าหน้าที่ผู้รับเครื่องคืน', name: data.staffReceiptName, date: data.staffReceiptDate, color: '#22c55e', border: '#bbf7d0', bg: 'linear-gradient(to bottom, #f0fdf4 0%, #fff 40%)' },
                  { label: 'ผู้ส่งมอบเครื่องคืน', name: data.returnerName, date: data.returnDate, color: '#22c55e', border: '#bbf7d0', bg: 'linear-gradient(to bottom, #f0fdf4 0%, #fff 40%)' },
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
    </div>
  );
}
