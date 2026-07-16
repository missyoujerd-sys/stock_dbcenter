import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useExternalAuth } from '../../contexts/ExternalAuthContext';
import { ExternalRepairService } from '../../services/externalRepairService';

// ─────────────────────────────────────────────
// Accessory list
// ─────────────────────────────────────────────
const ACCESSORY_LIST = [
  'Adapter / ที่ชาร์จ',
  'Power Cable / สายไฟ',
  'HDMI Cable',
  'DisplayPort Cable',
  'USB Cable',
  'LAN Cable',
  'Keyboard / คีย์บอร์ด',
  'Mouse / เมาส์',
  'Toner / หมึก',
  'Ink / หมึกพิมพ์',
  'Bag / Case / กระเป๋า',
  'RAM',
  'SSD / HDD',
  'อื่นๆ (โปรดระบุ)',
];

const DEVICE_TYPES = [
  'Computer / คอมพิวเตอร์ตั้งโต๊ะ',
  'Notebook / โน้ตบุ๊ก',
  'All-In-One',
  'Monitor / จอภาพ',
  'Printer / เครื่องพิมพ์',
  'Scanner / เครื่องสแกน',
  'UPS',
  'Network Device',
  'Server',
  'Projector / โปรเจ็คเตอร์',
  'อื่นๆ',
];

const PRIORITY_LEVELS = [
  { value: 'Low', label: '🟢 Low — ปกติ', color: '#22c55e' },
  { value: 'Normal', label: '🔵 Normal — ทั่วไป', color: '#3b82f6' },
  { value: 'High', label: '🟠 High — เร่งด่วน', color: '#f97316' },
  { value: 'Critical', label: '🔴 Critical — วิกฤต', color: '#ef4444' },
];

const initialForm = {
  // ข้อมูลบริษัท
  receiveDate: new Date().toISOString().split('T')[0],
  company: '',
  branch: '',
  contactName: '',
  phone: '',
  email: '',
  userFullName: '',
  // ข้อมูลอุปกรณ์
  deviceType: '',
  otherDevice: '',
  brand: '',
  model: '',
  serialNumber: '',
  assetNumber: '',
  serviceTag: '',
  location: '',
  // สเปคภายใน
  ram: '',
  storage: '',
  cpu: '',
  // อุปกรณ์แนบ
  accessories: [],
  otherAccessory: '',
  // ปัญหา
  problem: '',
  appearance: '',
  // การซ่อม
  warranty: 'Unknown',
  priority: 'Normal',
  expectedDate: '',
  estimatedCost: '',
  laborCost: '',
  partsCost: '',
  // ผู้รับเรื่อง
  receiverName: '',
  remark: '',
};

// ─────────────────────────────────────────────
// Section component helper
// ─────────────────────────────────────────────
function Section({ icon, title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionHeader}>
        <span style={s.sectionIcon}>{icon}</span>
        <h3 style={s.sectionTitle}>{title}</h3>
      </div>
      <div style={s.sectionBody}>{children}</div>
    </div>
  );
}

function Field({ label, required, children, half }) {
  return (
    <div style={{ ...s.fieldGroup, ...(half ? s.fieldHalf : {}) }}>
      <label style={s.label}>
        {label}
        {required && <span style={{ color: '#f97316', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Form
// ─────────────────────────────────────────────
export default function ExternalRepairForm() {
  const { externalUser, logoutExternal } = useExternalAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ...initialForm,
    contactName: externalUser?.fullName || '',
    receiverName: externalUser?.fullName || '',
    company: externalUser?.company || '',
  });
  const [saving, setSaving] = useState(false);
  const [savedDoc, setSavedDoc] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleAccessory = (item) => {
    setForm((prev) => ({
      ...prev,
      accessories: prev.accessories.includes(item)
        ? prev.accessories.filter((i) => i !== item)
        : [...prev.accessories, item],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.receiveDate) errs.receiveDate = 'กรุณาระบุวันที่รับ';
    if (!form.company.trim()) errs.company = 'กรุณาระบุชื่อบริษัท';
    if (!form.contactName.trim()) errs.contactName = 'กรุณาระบุผู้ติดต่อ';
    if (!form.deviceType) errs.deviceType = 'กรุณาเลือกประเภทอุปกรณ์';
    if (!form.problem.trim()) errs.problem = 'กรุณาระบุอาการเสีย';
    if (!form.receiverName.trim()) errs.receiverName = 'กรุณาระบุผู้รับเรื่อง';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        submittedBy: externalUser?.fullName || '',
        submittedByCompany: externalUser?.company || '',
      };
      const record = await ExternalRepairService.saveExternalRepair(payload);
      setSavedDoc(record);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSavedDoc(null);
    setErrors({});
    setForm({
      ...initialForm,
      contactName: externalUser?.fullName || '',
      receiverName: externalUser?.fullName || '',
      company: externalUser?.company || '',
    });
  };

  const inputStyle = (fieldName) => ({
    ...s.input,
    borderColor: errors[fieldName] ? '#f87171' : '#e2e8f0',
  });

  // ── Success screen ──
  if (savedDoc) {
    return (
      <div style={s.page}>
        <div style={s.successCard}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
            บันทึกข้อมูลสำเร็จ!
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            เลขที่ใบรับซ่อม:
          </p>
          <div style={s.docNumberBadge}>{savedDoc.docNumber}</div>
          <div style={s.successMeta}>
            <div>📅 วันที่รับ: <strong>{savedDoc.receiveDate}</strong></div>
            <div>🏢 บริษัท: <strong>{savedDoc.company}</strong></div>
            <div>💻 อุปกรณ์: <strong>{savedDoc.deviceType === 'อื่นๆ' ? savedDoc.otherDevice : savedDoc.deviceType}</strong></div>
            <div>🔧 รุ่น: <strong>{savedDoc.brand} {savedDoc.model}</strong></div>
            <div>👤 ผู้รับเรื่อง: <strong>{savedDoc.receiverName}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', width: '100%' }}>
            <button onClick={handleReset} style={s.btnPrimary}>
              ➕ กรอกรายการใหม่
            </button>
            <Link to="/external/repair/list" style={s.btnSecondary}>
              📋 ดูรายการทั้งหมด
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ──
  return (
    <div style={s.page}>
      {/* Header Bar */}
      <div style={s.headerBar}>
        <div style={s.headerContent}>
          <div>
            <div style={s.headerTitle}>🔧 ระบบรับซ่อมอุปกรณ์ IT — บริษัทภายนอก</div>
            <div style={s.headerSubtitle}>External Repair Intake Form</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={s.userBadge}>👤 {externalUser?.fullName}</span>
            <Link to="/external/repair/list" style={s.navLink}>📋 รายการ</Link>
            <button onClick={() => { logoutExternal(); navigate('/external/login'); }} style={s.logoutBtn}>
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      {/* Validation error summary */}
      {Object.keys(errors).length > 0 && (
        <div style={s.errorSummary}>
          <strong>⚠️ กรุณาตรวจสอบข้อมูลที่จำเป็น:</strong>
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            {Object.values(errors).map((msg, i) => (
              <li key={i} style={{ fontSize: '0.85rem' }}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} style={s.formWrapper}>

        {/* ─── Section 1: Company ─── */}
        <Section icon="🏢" title="ข้อมูลบริษัท / ผู้ส่งซ่อม">
          <div style={s.row}>
            <Field label="วันที่รับเครื่อง" required half>
              <input type="date" name="receiveDate" value={form.receiveDate} onChange={handleChange} style={inputStyle('receiveDate')} />
              {errors.receiveDate && <p style={s.errMsg}>{errors.receiveDate}</p>}
            </Field>
            <Field label="กำหนดส่งคืน" half>
              <input type="date" name="expectedDate" value={form.expectedDate} onChange={handleChange} style={s.input} />
            </Field>
          </div>
          <div style={s.row}>
            <Field label="ชื่อบริษัท / หน่วยงาน" required>
              <input type="text" name="company" value={form.company} onChange={handleChange} placeholder="เช่น บริษัท ABC จำกัด" style={inputStyle('company')} />
              {errors.company && <p style={s.errMsg}>{errors.company}</p>}
            </Field>
            <Field label="สาขา / แผนก">
              <input type="text" name="branch" value={form.branch} onChange={handleChange} placeholder="เช่น สาขาหัวลำโพง" style={s.input} />
            </Field>
          </div>
          <div style={s.row}>
            <Field label="ชื่อผู้ติดต่อ" required>
              <input type="text" name="contactName" value={form.contactName} onChange={handleChange} placeholder="ชื่อ-นามสกุล" style={inputStyle('contactName')} />
              {errors.contactName && <p style={s.errMsg}>{errors.contactName}</p>}
            </Field>
            <Field label="ชื่อผู้ใช้งานเครื่อง">
              <input type="text" name="userFullName" value={form.userFullName} onChange={handleChange} placeholder="ชื่อคนใช้งานเครื่องจริง" style={s.input} />
            </Field>
          </div>
          <div style={s.row}>
            <Field label="เบอร์โทรศัพท์">
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="0xx-xxx-xxxx" style={s.input} />
            </Field>
            <Field label="Email">
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="example@company.com" style={s.input} />
            </Field>
          </div>
        </Section>

        {/* ─── Section 2: Device ─── */}
        <Section icon="💻" title="ข้อมูลอุปกรณ์">
          <div style={s.row}>
            <Field label="ประเภทอุปกรณ์" required>
              <select name="deviceType" value={form.deviceType} onChange={handleChange} style={inputStyle('deviceType')}>
                <option value="">— เลือกประเภท —</option>
                {DEVICE_TYPES.map((d) => <option key={d}>{d}</option>)}
              </select>
              {errors.deviceType && <p style={s.errMsg}>{errors.deviceType}</p>}
            </Field>
            {form.deviceType === 'อื่นๆ' && (
              <Field label="ระบุประเภทอุปกรณ์">
                <input type="text" name="otherDevice" value={form.otherDevice} onChange={handleChange} placeholder="ระบุอุปกรณ์" style={s.input} />
              </Field>
            )}
          </div>
          <div style={s.row}>
            <Field label="ยี่ห้อ (Brand)">
              <input type="text" name="brand" value={form.brand} onChange={handleChange} placeholder="เช่น Dell, HP, Lenovo" style={s.input} />
            </Field>
            <Field label="รุ่น (Model)">
              <input type="text" name="model" value={form.model} onChange={handleChange} placeholder="เช่น Latitude 5520" style={s.input} />
            </Field>
          </div>
          <div style={s.row}>
            <Field label="Serial Number (S/N)">
              <input type="text" name="serialNumber" value={form.serialNumber} onChange={handleChange} placeholder="เลขซีเรียล" style={s.input} />
            </Field>
            <Field label="Service Tag">
              <input type="text" name="serviceTag" value={form.serviceTag} onChange={handleChange} placeholder="เช่น Dell Service Tag" style={s.input} />
            </Field>
          </div>
          <div style={s.row}>
            <Field label="หมายเลขครุภัณฑ์ (Asset No.)">
              <input type="text" name="assetNumber" value={form.assetNumber} onChange={handleChange} placeholder="เลขครุภัณฑ์" style={s.input} />
            </Field>
            <Field label="Location / ที่ตั้งเครื่อง">
              <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="เช่น ชั้น 3 ห้อง 301" style={s.input} />
            </Field>
          </div>

          {/* Internal Specs */}
          <div style={s.specBox}>
            <div style={s.specTitle}>🔩 รายละเอียดอุปกรณ์ภายใน (ถ้าทราบ)</div>
            <div style={s.row}>
              <Field label="CPU / Processor" half>
                <input type="text" name="cpu" value={form.cpu} onChange={handleChange} placeholder="เช่น Intel i5-1135G7" style={s.input} />
              </Field>
              <Field label="RAM" half>
                <input type="text" name="ram" value={form.ram} onChange={handleChange} placeholder="เช่น 16GB DDR4" style={s.input} />
              </Field>
              <Field label="Storage (SSD/HDD)" half>
                <input type="text" name="storage" value={form.storage} onChange={handleChange} placeholder="เช่น 512GB SSD NVMe" style={s.input} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ─── Section 3: Accessories ─── */}
        <Section icon="📦" title="อุปกรณ์ที่ส่งมาด้วย">
          <div style={s.checkboxGrid}>
            {ACCESSORY_LIST.map((item) => (
              <label key={item} style={s.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.accessories.includes(item)}
                  onChange={() => toggleAccessory(item)}
                  style={{ marginRight: 8, accentColor: '#f97316' }}
                />
                {item}
              </label>
            ))}
          </div>
          {form.accessories.includes('อื่นๆ (โปรดระบุ)') && (
            <div style={{ marginTop: '0.75rem' }}>
              <input
                type="text"
                name="otherAccessory"
                value={form.otherAccessory}
                onChange={handleChange}
                placeholder="ระบุอุปกรณ์อื่นๆ"
                style={s.input}
              />
            </div>
          )}
        </Section>

        {/* ─── Section 4: Problem ─── */}
        <Section icon="⚠️" title="รายละเอียดปัญหา">
          <Field label="อาการเสีย / ปัญหาที่พบ" required>
            <textarea
              name="problem"
              value={form.problem}
              onChange={handleChange}
              rows={4}
              placeholder="อธิบายอาการเสียให้ละเอียดที่สุด เช่น เปิดไม่ติด, จอมืด, ช้ามาก..."
              style={{ ...inputStyle('problem'), resize: 'vertical' }}
            />
            {errors.problem && <p style={s.errMsg}>{errors.problem}</p>}
          </Field>
          <Field label="สภาพภายนอก (Appearance)">
            <textarea
              name="appearance"
              value={form.appearance}
              onChange={handleChange}
              rows={3}
              placeholder="เช่น มีรอยขีดข่วน, บุบที่มุมซ้ายล่าง..."
              style={{ ...s.input, resize: 'vertical' }}
            />
          </Field>
        </Section>

        {/* ─── Section 5: Repair Info ─── */}
        <Section icon="🛠️" title="ข้อมูลการซ่อม">
          <div style={s.row}>
            <Field label="สถานะประกัน" half>
              <select name="warranty" value={form.warranty} onChange={handleChange} style={s.input}>
                <option value="Unknown">❓ Unknown</option>
                <option value="In Warranty">✅ In Warranty — อยู่ในประกัน</option>
                <option value="Out of Warranty">❌ Out of Warranty — หมดประกัน</option>
              </select>
            </Field>
            <Field label="ระดับความเร่งด่วน" half>
              <select name="priority" value={form.priority} onChange={handleChange} style={s.input}>
                {PRIORITY_LEVELS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <div style={s.row}>
            <Field label="ราคาประเมิน (บาท)" half>
              <input type="number" name="estimatedCost" value={form.estimatedCost} onChange={handleChange} placeholder="0.00" min="0" style={s.input} />
            </Field>
            <Field label="ค่าแรง (บาท)" half>
              <input type="number" name="laborCost" value={form.laborCost} onChange={handleChange} placeholder="0.00" min="0" style={s.input} />
            </Field>
            <Field label="ค่าอะไหล่ (บาท)" half>
              <input type="number" name="partsCost" value={form.partsCost} onChange={handleChange} placeholder="0.00" min="0" style={s.input} />
            </Field>
          </div>
        </Section>

        {/* ─── Section 6: Receiver ─── */}
        <Section icon="👤" title="ผู้รับเรื่อง">
          <div style={s.row}>
            <Field label="ชื่อผู้รับเรื่อง" required>
              <input
                type="text"
                name="receiverName"
                value={form.receiverName}
                onChange={handleChange}
                placeholder="ชื่อ-นามสกุล"
                style={inputStyle('receiverName')}
              />
              {errors.receiverName && <p style={s.errMsg}>{errors.receiverName}</p>}
            </Field>
          </div>
          <Field label="หมายเหตุเพิ่มเติม">
            <textarea
              name="remark"
              value={form.remark}
              onChange={handleChange}
              rows={3}
              placeholder="หมายเหตุ, ข้อตกลงพิเศษ หรือข้อมูลเพิ่มเติม..."
              style={{ ...s.input, resize: 'vertical' }}
            />
          </Field>
        </Section>

        {/* Submit */}
        <div style={s.submitBar}>
          <button type="button" onClick={handleReset} style={s.btnReset}>
            🔄 ล้างข้อมูล
          </button>
          <button type="submit" disabled={saving} style={{ ...s.btnSubmit, opacity: saving ? 0.75 : 1 }}>
            {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกใบรับซ่อม'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    background: '#f1f5f9',
    fontFamily: '"Prompt", "Noto Sans Thai", Arial, sans-serif',
  },
  headerBar: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderBottom: '3px solid #f97316',
    padding: '0 24px',
    position: 'sticky', top: 0, zIndex: 100,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  headerContent: {
    maxWidth: '960px', margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 0',
  },
  headerTitle: { color: 'white', fontWeight: 800, fontSize: '1rem' },
  headerSubtitle: { color: '#f97316', fontSize: '0.75rem', fontWeight: 600 },
  userBadge: {
    background: 'rgba(249,115,22,0.2)', color: '#fed7aa',
    padding: '4px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600,
    border: '1px solid rgba(249,115,22,0.4)',
  },
  navLink: {
    color: '#94a3b8', textDecoration: 'none', fontSize: '0.82rem',
    padding: '6px 12px', borderRadius: '8px',
    border: '1px solid rgba(148,163,184,0.3)',
    transition: 'all 0.2s',
  },
  logoutBtn: {
    background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px',
    padding: '6px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
  },
  formWrapper: {
    maxWidth: '960px', margin: '0 auto', padding: '24px 16px 48px',
  },
  section: {
    background: 'white', borderRadius: '16px', marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 20px',
    background: 'linear-gradient(90deg, #fff7ed, #ffffff)',
    borderBottom: '2px solid #fed7aa',
  },
  sectionIcon: { fontSize: '1.2rem' },
  sectionTitle: { margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' },
  sectionBody: { padding: '20px' },
  row: {
    display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '4px',
  },
  fieldGroup: { flex: '1 1 200px', minWidth: '180px', marginBottom: '12px' },
  fieldHalf: { flex: '1 1 160px' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' },
  input: {
    width: '100%', padding: '0.7rem 0.9rem',
    borderRadius: '10px', border: '1.5px solid #e2e8f0',
    fontSize: '0.9rem', color: '#1e293b', background: '#f8fafc',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    fontFamily: '"Prompt", "Noto Sans Thai", Arial, sans-serif',
  },
  errMsg: { color: '#dc2626', fontSize: '0.75rem', margin: '4px 0 0', fontWeight: 600 },
  specBox: {
    marginTop: '12px', background: '#f8fafc', borderRadius: '12px',
    border: '1.5px dashed #cbd5e1', padding: '16px',
  },
  specTitle: { fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginBottom: '12px' },
  checkboxGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px',
  },
  checkLabel: {
    display: 'flex', alignItems: 'center', fontSize: '0.85rem',
    color: '#374151', cursor: 'pointer', padding: '8px 12px',
    borderRadius: '8px', border: '1.5px solid #e2e8f0',
    background: '#f8fafc', transition: 'all 0.15s',
    userSelect: 'none',
  },
  submitBar: {
    display: 'flex', gap: '16px', justifyContent: 'flex-end',
    padding: '16px 0', borderTop: '2px solid #e2e8f0', marginTop: '4px',
  },
  btnSubmit: {
    padding: '0.9rem 2.5rem',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    color: 'white', fontWeight: 800, fontSize: '1rem',
    border: 'none', borderRadius: '12px', cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(249,115,22,0.4)',
    fontFamily: '"Prompt", "Noto Sans Thai", Arial, sans-serif',
  },
  btnReset: {
    padding: '0.9rem 2rem',
    background: '#f1f5f9', color: '#475569', fontWeight: 700,
    border: '1.5px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer',
    fontFamily: '"Prompt", "Noto Sans Thai", Arial, sans-serif',
  },
  errorSummary: {
    maxWidth: '960px', margin: '16px auto 0', padding: '1rem 1.25rem',
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: '12px', color: '#dc2626', fontSize: '0.85rem',
  },
  // Success
  successCard: {
    margin: '48px auto', maxWidth: '520px', padding: '3rem 2rem',
    background: 'white', borderRadius: '24px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center',
  },
  docNumberBadge: {
    fontSize: '2rem', fontWeight: 900, color: '#ea580c',
    background: 'linear-gradient(135deg, #fff7ed, #fed7aa)',
    padding: '12px 32px', borderRadius: '16px',
    border: '2px solid #fdba74', letterSpacing: '0.1em',
    marginBottom: '1.5rem',
  },
  successMeta: {
    background: '#f8fafc', borderRadius: '12px',
    padding: '1rem 1.5rem', textAlign: 'left', width: '100%',
    display: 'flex', flexDirection: 'column', gap: '6px',
    fontSize: '0.85rem', color: '#475569',
  },
  btnPrimary: {
    flex: 1, padding: '0.85rem',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    color: 'white', fontWeight: 800, border: 'none',
    borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem',
    fontFamily: '"Prompt", "Noto Sans Thai", Arial, sans-serif',
  },
  btnSecondary: {
    flex: 1, padding: '0.85rem',
    background: '#f1f5f9', color: '#475569', fontWeight: 700,
    border: '1.5px solid #e2e8f0', borderRadius: '12px',
    textDecoration: 'none', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '0.9rem',
  },
};
