import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { RepairService } from '../../services/repairService';
import { RepairRecord } from '../../types/repair';
import { ShieldCheck, ShieldX, Search, Barcode, User, ClipboardList, AlertCircle, Loader } from 'lucide-react';

const HOSPITAL_LOGO = '/โลโก้ ร.พ.png';

const PUBLIC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800;900&display=swap');
* { box-sizing: border-box; }
body { margin: 0; }
.pub-wrap { font-family: 'Prompt', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%); }
.pub-hero { text-align: center; padding: 40px 20px 30px; }
.pub-hero h1 { font-size: 28px; font-weight: 900; color: #fff; margin: 0 0 8px; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.pub-hero p { font-size: 14px; color: rgba(255,255,255,0.7); margin: 0; }
.pub-search-box { max-width: 600px; margin: 0 auto 30px; padding: 0 20px; }
.pub-search-inner { background: rgba(255,255,255,0.12); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 24px; }
.pub-search-title { font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.pub-search-input { width: 100%; padding: 14px 20px; border-radius: 14px; border: 2px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.15); color: #fff; font-size: 16px; font-family: 'Prompt', sans-serif; outline: none; transition: 0.2s; }
.pub-search-input::placeholder { color: rgba(255,255,255,0.5); }
.pub-search-input:focus { border-color: #60a5fa; background: rgba(255,255,255,0.2); }
.pub-search-btn { width: 100%; margin-top: 12px; padding: 14px; border-radius: 14px; border: none; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; font-size: 16px; font-weight: 800; font-family: 'Prompt', sans-serif; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.pub-search-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(99,102,241,0.4); }
.pub-result { max-width: 900px; margin: 0 auto; padding: 0 20px 40px; }
.pub-card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,0.3); }
.pub-card-header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 24px 28px; display: flex; align-items: center; gap: 16px; position: relative; }
.pub-card-header .logo-box { background: #fff; padding: 4px; border-radius: 14px; width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
.pub-card-header .logo-box img { width: 100%; height: 100%; object-fit: contain; }
.pub-card-header h2 { font-size: 20px; font-weight: 900; color: #fff; margin: 0 0 4px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.pub-card-header p { font-size: 11px; color: rgba(255,255,255,0.8); margin: 0; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
.pub-status-badge { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); padding: 8px 18px; border-radius: 30px; font-size: 13px; font-weight: 800; font-family: 'Prompt', sans-serif; }
.pub-card-body { padding: 28px; }
.pub-section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
.pub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
.pub-field { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 12px 16px; }
.pub-field .label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.pub-field .value { font-size: 16px; font-weight: 800; color: #1e293b; }
.pub-problem { background: linear-gradient(135deg, #fff1f2, #fff5f5); border: 1.5px solid #fecdd3; border-radius: 14px; padding: 16px; margin-bottom: 24px; }
.pub-problem .label { font-size: 10px; font-weight: 800; color: #f43f5e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.pub-problem .value { font-size: 15px; font-weight: 600; color: #4c0519; line-height: 1.7; }
.pub-sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.pub-sig-card { border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; }
.pub-sig-card.blue { border-color: #bfdbfe; background: linear-gradient(to bottom, #eff6ff, #fff); }
.pub-sig-card.green { border-color: #bbf7d0; background: linear-gradient(to bottom, #f0fdf4, #fff); }
.pub-sig-card .sh { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 8px; margin-bottom: 10px; text-align: center; }
.pub-sig-card.blue .sh { color: #3b82f6; }
.pub-sig-card.green .sh { color: #22c55e; }
.pub-sig-row { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
.pub-sig-row .k { font-size: 12px; color: #64748b; font-weight: 700; width: 55px; flex-shrink: 0; }
.pub-sig-row .v { flex: 1; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; font-size: 13px; font-weight: 600; color: #1e293b; }
.pub-warranty-ok { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #bbf7d0; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-direction: column; min-height: 100px; gap: 6px; }
.pub-warranty-no { background: linear-gradient(135deg, #fff1f2, #ffe4e6); border: 2px solid #fecdd3; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-direction: column; min-height: 100px; gap: 6px; }
.pub-footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; font-size: 11px; color: #94a3b8; font-style: italic; font-weight: 600; }
.pub-not-found { max-width: 500px; margin: 0 auto; padding: 0 20px 40px; text-align: center; }
.pub-not-found-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 40px 30px; }
@media (max-width: 640px) {
  .pub-grid { grid-template-columns: 1fr; }
  .pub-sig-grid { grid-template-columns: 1fr; }
  .pub-card-header { flex-direction: column; text-align: center; }
  .pub-status-badge { position: static; transform: none; margin-top: 10px; }
  .pub-hero h1 { font-size: 22px; }
}
`;

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'รอดำเนินการ': { bg: '#fef3c7', color: '#92400e' },
  'การซ่อมแซม': { bg: '#dbeafe', color: '#1e40af' },
  'ดำเนินการซ่อมแล้ว': { bg: '#d1fae5', color: '#065f46' },
  'ส่งคืนหมดประกัน': { bg: '#ffe4e6', color: '#9f1239' },
  'ส่งคืนค่าซ่อมไม่คุ้ม': { bg: '#ffe4e6', color: '#9f1239' },
  'อื่นๆ': { bg: '#ede9fe', color: '#4c1d95' },
};

export default function RepairPublicSearch() {
  const { id: paramId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const qId = searchParams.get('id');
  const initialId = paramId || qId || '';

  const [searchId, setSearchId] = useState(initialId);
  const [data, setData] = useState<RepairRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  // Inject CSS
  useEffect(() => {
    const csId = 'repair-public-css';
    if (!document.getElementById(csId)) {
      const s = document.createElement('style');
      s.id = csId;
      s.textContent = PUBLIC_CSS;
      document.head.appendChild(s);
    }
  }, []);

  // Auto-search if ID from URL
  useEffect(() => {
    if (initialId) {
      doSearch(initialId);
    }
  }, []);

  const doSearch = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setSearched(true);
    setError('');
    setData(null);
    try {
      const result = await RepairService.getRepairById(id.trim());
      if (result) {
        setData(result);
      } else {
        setError('ไม่พบข้อมูลรายการแจ้งซ่อมในระบบ กรุณาตรวจสอบรหัสอีกครั้ง');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(searchId);
  };

  const statusColor = data ? (STATUS_COLORS[data.status] || { bg: '#f1f5f9', color: '#475569' }) : null;

  return (
    <div className="pub-wrap">
      {/* Hero */}
      <div className="pub-hero">
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', marginBottom: 16, backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.3)' }}>
          <img src={HOSPITAL_LOGO} alt="logo" style={{ width: 52, height: 52, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <h1>ตรวจสอบสถานะฟอร์มส่งซ่อม</h1>
        <p>โรงพยาบาลนครพิงค์ · ระบบบริหารจัดการงานซ่อมบำรุงคอมพิวเตอร์</p>
      </div>

      {/* Search Box */}
      <div className="pub-search-box">
        <div className="pub-search-inner">
          <div className="pub-search-title">
            <Search size={18} />
            ค้นหาฟอร์มส่งซ่อมด้วยรหัสเอกสาร
          </div>
          <form onSubmit={handleSearch}>
            <input
              className="pub-search-input"
              type="text"
              placeholder="กรอกรหัสเอกสาร เช่น abc123xyz..."
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              autoFocus={!initialId}
            />
            <button className="pub-search-btn" type="submit" disabled={loading}>
              {loading ? <><Loader size={18} className="animate-spin" /> กำลังค้นหา...</> : <><Search size={18} /> ค้นหาฟอร์มส่งซ่อม</>}
            </button>
          </form>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontFamily: 'Prompt, sans-serif', paddingBottom: 40 }}>
          <div style={{ width: 48, height: 48, border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontWeight: 700 }}>กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Error / Not Found */}
      {!loading && searched && error && (
        <div className="pub-not-found">
          <div className="pub-not-found-card">
            <div style={{ width: 64, height: 64, background: 'rgba(239,68,68,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertCircle size={32} color="#fca5a5" />
            </div>
            <h3 style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: '0 0 8px', fontFamily: 'Prompt, sans-serif' }}>ไม่พบข้อมูล</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'Prompt, sans-serif', margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      {/* Result Card */}
      {!loading && data && (
        <div className="pub-result">
          <div className="pub-card">
            {/* Card Header */}
            <div className="pub-card-header">
              <div className="logo-box">
                <img src={HOSPITAL_LOGO} alt="logo" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div>
                <h2>ใบสำคัญบันทึกข้อมูลการแจ้งซ่อม</h2>
                <p>โรงพยาบาลนครพิงค์ · ระบบบริหารจัดการข้อมูลครุภัณฑ์คอมพิวเตอร์</p>
              </div>
              {statusColor && (
                <div className="pub-status-badge" style={{ background: statusColor.bg, color: statusColor.color }}>
                  {data.status}
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="pub-card-body">
              {/* Date */}
              <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', fontWeight: 600, marginBottom: 24 }}>
                วันที่บันทึกเอกสาร: <strong style={{ color: '#1e293b' }}>{new Date(data.createdAt).toLocaleString('th-TH')}</strong>
                &nbsp;·&nbsp; รหัสอ้างอิง: <strong style={{ color: '#3b82f6' }}>{data.id}</strong>
              </p>

              {/* Equipment Info */}
              <div className="pub-section-title" style={{ color: '#3b82f6' }}>
                <Barcode size={16} /> ข้อมูลตัวเครื่อง
              </div>
              <div className="pub-grid" style={{ marginBottom: 24 }}>
                <div className="pub-field">
                  <div className="label">หมายเลขครุภัณฑ์ (Asset Number)</div>
                  <div className="value">{data.assetNumber || '-'}</div>
                </div>
                <div className="pub-field">
                  <div className="label">รุ่น / รูปแบบอุปกรณ์ (Model)</div>
                  <div className="value">{data.equipmentModel || '-'}</div>
                </div>
                <div className="pub-field">
                  <div className="label">หมายเลขซีเรียล (Serial Number)</div>
                  <div className="value">{data.serialNumber || '-'}</div>
                </div>
                <div className={data.isWarranty !== false ? 'pub-warranty-ok' : 'pub-warranty-no'}>
                  {data.isWarranty !== false
                    ? <><ShieldCheck size={32} color="#22c55e" /><span style={{ fontSize: 13, fontWeight: 800, color: '#166534', fontFamily: 'Prompt, sans-serif' }}>อยู่ในระยะรับประกัน</span></>
                    : <><ShieldX size={32} color="#e11d48" /><span style={{ fontSize: 13, fontWeight: 800, color: '#9f1239', fontFamily: 'Prompt, sans-serif' }}>พ้นระยะรับประกัน</span></>
                  }
                </div>
              </div>

              {/* Problem */}
              <div className="pub-problem">
                <div className="label">อาการเสีย / รายละเอียดปัญหา</div>
                <div className="value">{data.problemDescription || '-'}</div>
              </div>

              {/* Status */}
              <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #faf5ff)', border: '1.5px solid #ddd6fe', borderRadius: 14, padding: 16, marginBottom: 24 }}>
                <div className="pub-section-title" style={{ color: '#8b5cf6', marginBottom: 10 }}>
                  <ClipboardList size={16} /> ผลการดำเนินงาน / สถานะการซ่อม
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', border: '1.5px solid #c4b5fd', borderRadius: 10, padding: '10px 20px', fontSize: 18, fontWeight: 800, color: '#5b21b6', fontFamily: 'Prompt, sans-serif' }}>
                  {data.status}
                </div>
                {data.status === 'อื่นๆ' && data.statusDetail && (
                  <div style={{ fontSize: 14, color: '#4c1d95', lineHeight: 1.7, marginTop: 10, borderTop: '1px dashed #c4b5fd', paddingTop: 10 }}>
                    <span style={{ color: '#8b5cf6', fontWeight: 700 }}>รายละเอียด: </span>{data.statusDetail}
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="pub-section-title" style={{ color: '#3b82f6' }}>
                <User size={16} /> ผู้รับผิดชอบและลายมือชื่อ
              </div>
              <div className="pub-sig-grid">
                <div className="pub-sig-card blue">
                  <div className="sh">เจ้าหน้าที่ผู้แจ้งซ่อม / ผู้ส่งมอบอุปกรณ์</div>
                  <div className="pub-sig-row"><span className="k">ชื่อ:</span><span className="v">{data.reporterName || '-'}</span></div>
                  <div className="pub-sig-row"><span className="k">วันที่:</span><span className="v">{data.reportedDate || '-'}</span></div>
                </div>
                <div className="pub-sig-card blue">
                  <div className="sh">เจ้าหน้าที่ผู้รับมอบอุปกรณ์ซ่อม</div>
                  <div className="pub-sig-row"><span className="k">ชื่อ:</span><span className="v">{data.receiverName || '-'}</span></div>
                  <div className="pub-sig-row"><span className="k">วันที่:</span><span className="v">{data.receivedDate || '-'}</span></div>
                </div>
                <div className="pub-sig-card green">
                  <div className="sh">เจ้าหน้าที่ผู้รับมอบอุปกรณ์คืน</div>
                  <div className="pub-sig-row"><span className="k">ชื่อ:</span><span className="v">{data.staffReceiptName || '-'}</span></div>
                  <div className="pub-sig-row"><span className="k">วันที่:</span><span className="v">{data.staffReceiptDate || '-'}</span></div>
                </div>
                <div className="pub-sig-card green">
                  <div className="sh">เจ้าหน้าที่ผู้ส่งมอบอุปกรณ์คืน</div>
                  <div className="pub-sig-row"><span className="k">ชื่อ:</span><span className="v">{data.returnerName || '-'}</span></div>
                  <div className="pub-sig-row"><span className="k">วันที่:</span><span className="v">{data.returnDate || '-'}</span></div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pub-footer">
              เอกสารนี้จัดทำขึ้นโดยระบบบริหารจัดการงานซ่อมบำรุงอัตโนมัติ &nbsp;·&nbsp; Stock Guaranteed System &nbsp;·&nbsp; โรงพยาบาลนครพิงค์ &nbsp;·&nbsp; {new Date().getFullYear()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
