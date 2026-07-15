import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useExternalAuth } from '../../contexts/ExternalAuthContext';
import { ExternalRepairService } from '../../services/externalRepairService';

const PRIORITY_COLOR = {
  Low: '#22c55e',
  Normal: '#3b82f6',
  High: '#f97316',
  Critical: '#ef4444',
};

const WARRANTY_LABEL = {
  'Unknown': '❓ ไม่ทราบ',
  'In Warranty': '✅ ยังในประกัน',
  'Out of Warranty': '❌ หมดประกันแล้ว',
};

export default function ExternalRepairList() {
  const { externalUser, logoutExternal } = useExternalAuth();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    ExternalRepairService.getExternalRepairs()
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.docNumber || '').toLowerCase().includes(q) ||
      (r.company || '').toLowerCase().includes(q) ||
      (r.brand || '').toLowerCase().includes(q) ||
      (r.model || '').toLowerCase().includes(q) ||
      (r.serialNumber || '').toLowerCase().includes(q) ||
      (r.contactName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.headerBar}>
        <div style={s.headerContent}>
          <div>
            <div style={s.headerTitle}>📋 รายการรับซ่อมอุปกรณ์ IT — บริษัทภายนอก</div>
            <div style={s.headerSubtitle}>External Repair Records</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={s.userBadge}>👤 {externalUser?.fullName}</span>
            <Link to="/external/repair" style={s.navLink}>➕ กรอกฟอร์มใหม่</Link>
            <button
              onClick={() => { logoutExternal(); navigate('/external/login'); }}
              style={s.logoutBtn}
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      <div style={s.content}>
        {/* Search + Summary */}
        <div style={s.toolbar}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <span style={s.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="ค้นหาตามเลขที่ใบ, บริษัท, รุ่น, S/N, ผู้ติดต่อ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={s.searchInput}
            />
          </div>
          <div style={s.statBadge}>
            รายการทั้งหมด: <strong>{records.length}</strong>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={s.centerBox}>
            <div style={s.spinner} />
            <p style={{ color: '#94a3b8', marginTop: '12px', fontWeight: 600 }}>กำลังโหลด...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.centerBox}>
            <div style={{ fontSize: '4rem', marginBottom: '8px' }}>📭</div>
            <p style={{ color: '#94a3b8', fontWeight: 600 }}>ไม่พบรายการ</p>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['เลขที่ใบรับ', 'วันที่รับ', 'บริษัท / ผู้ติดต่อ', 'อุปกรณ์', 'อาการ / ปัญหา', 'ประกัน', 'ความเร่งด่วน', 'ผู้รับเรื่อง'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={s.tr}>
                    <td style={s.td}>
                      <span style={s.docBadge}>{r.docNumber}</span>
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {r.receiveDate}
                      {r.expectedDate && (
                        <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                          คืน: {r.expectedDate}
                        </div>
                      )}
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>{r.company}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{r.contactName}</div>
                      {r.phone && <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>📞 {r.phone}</div>}
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        {r.deviceType === 'อื่นๆ' ? r.otherDevice : r.deviceType}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{r.brand} {r.model}</div>
                      {r.serialNumber && (
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>S/N: {r.serialNumber}</div>
                      )}
                    </td>
                    <td style={{ ...s.td, maxWidth: '200px' }}>
                      <div style={{ fontSize: '0.82rem', color: '#374151', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {r.problem}
                      </div>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {WARRANTY_LABEL[r.warranty] || r.warranty}
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '0.72rem', fontWeight: 700,
                        background: `${PRIORITY_COLOR[r.priority]}22`,
                        color: PRIORITY_COLOR[r.priority] || '#64748b',
                        border: `1px solid ${PRIORITY_COLOR[r.priority] || '#e2e8f0'}44`,
                      }}>
                        {r.priority}
                      </span>
                    </td>
                    <td style={{ ...s.td, fontSize: '0.82rem', color: '#374151' }}>
                      {r.receiverName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', background: '#f1f5f9',
    fontFamily: '"Prompt", "Noto Sans Thai", Arial, sans-serif',
  },
  headerBar: {
    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
    borderBottom: '3px solid #f97316',
    padding: '0 24px', position: 'sticky', top: 0, zIndex: 100,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  headerContent: {
    maxWidth: '1200px', margin: '0 auto',
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
  },
  logoutBtn: {
    background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px',
    padding: '6px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
  },
  content: { maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: '16px',
    marginBottom: '16px', flexWrap: 'wrap',
  },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' },
  searchInput: {
    width: '100%', padding: '0.7rem 0.9rem 0.7rem 2.2rem',
    borderRadius: '10px', border: '1.5px solid #e2e8f0',
    fontSize: '0.88rem', background: 'white', outline: 'none',
    fontFamily: '"Prompt", "Noto Sans Thai", Arial, sans-serif',
  },
  statBadge: {
    padding: '8px 16px', background: 'white', borderRadius: '10px',
    border: '1.5px solid #e2e8f0', fontSize: '0.85rem', color: '#475569',
    whiteSpace: 'nowrap',
  },
  tableWrap: {
    background: 'white', borderRadius: '16px', overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
    overflowX: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '12px 14px', textAlign: 'left', fontSize: '0.75rem',
    fontWeight: 800, color: 'white', whiteSpace: 'nowrap',
    background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
    borderRight: '1px solid rgba(255,255,255,0.1)',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.15s',
  },
  td: {
    padding: '12px 14px', verticalAlign: 'top',
    borderRight: '1px solid #f1f5f9',
  },
  docBadge: {
    display: 'inline-block', padding: '3px 10px',
    background: 'linear-gradient(135deg, #fff7ed, #fed7aa)',
    border: '1.5px solid #fdba74', borderRadius: '8px',
    fontWeight: 800, fontSize: '0.78rem', color: '#c2410c',
    letterSpacing: '0.03em',
  },
  centerBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '80px 24px',
    background: 'white', borderRadius: '16px',
  },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid #fed7aa', borderTop: '3px solid #f97316',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
};
