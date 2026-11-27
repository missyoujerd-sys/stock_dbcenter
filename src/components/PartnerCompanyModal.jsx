import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Globe,
  Grid2x2,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  Wrench,
  Zap,
  Radio,
  ArrowUp,
} from 'lucide-react';
import { PARTNER_COMPANIES } from '../data/partnerCompanies';

function CompanyEmblem({ company }) {
  switch (company.emblemType) {
    case 'chichang':
      return (
        <div className="w-full h-full bg-[#09090b] text-white flex flex-col items-center justify-center rounded-2xl px-1">
          <span className="text-[10px] font-black tracking-[0.14em] leading-tight text-center">CHI CHANG</span>
        </div>
      );
    case 'canon':
      return (
        <div className="flex flex-col items-center justify-center">
          <span className="text-[15px] font-black tracking-tight text-red-600 leading-none">Canon</span>
          <span className="text-[7px] font-bold text-slate-400 tracking-widest mt-1">AUTHORIZED</span>
        </div>
      );
    case 'medica':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-9 h-9 rounded-full border-2 border-amber-500 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shadow-inner">
            <span className="text-base font-black text-amber-800">M</span>
          </div>
          <span className="text-[6px] font-bold text-slate-500 mt-0.5 tracking-tight">MEDICA PACKING</span>
        </div>
      );
    case 'others':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center mb-1">
            <Grid2x2 size={15} />
          </div>
          <span className="text-[8px] font-black text-slate-700 leading-none">OTHERS</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">คู่ค้ารายย่อย</span>
        </div>
      );
    case 'goodspeed':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-amber-300 flex items-center justify-center mb-1 shadow-sm">
            <Zap size={14} fill="currentColor" />
          </div>
          <span className="text-[7.5px] font-black text-indigo-700 leading-none">GOODSPEED</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">COMPUTER</span>
        </div>
      );
    case 'northern':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rotate-45 rounded-md bg-gradient-to-tr from-purple-700 to-fuchsia-500 flex items-center justify-center mb-1.5 shadow-sm">
            <div className="w-2.5 h-2.5 bg-white/90 rounded-xs" />
          </div>
          <span className="text-[8px] font-black text-purple-800 leading-none">NORTHERN</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">SYSTEMS</span>
        </div>
      );
    case 'simmaster':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center mb-1 shadow-sm font-black text-[11px]">
            II
          </div>
          <span className="text-[8px] font-black text-cyan-800 leading-none">SIM</span>
          <span className="text-[7px] font-bold text-slate-500 mt-0.5">MASTER</span>
        </div>
      );
    case 'isan':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1 shadow-sm">
            <ArrowUp size={15} strokeWidth={3} />
          </div>
          <span className="text-[9px] font-black text-amber-700 leading-none">ISAN</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">COMPUTER</span>
        </div>
      );
    case 'atp':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-teal-500 text-white flex items-center justify-center mb-1 shadow-sm">
            <ShieldCheck size={15} />
          </div>
          <span className="text-[9px] font-black text-teal-700 leading-none">ATP</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">TECHNOLOGY</span>
        </div>
      );
    case 'supatchar':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center mb-1 shadow-sm">
            <Wrench size={14} />
          </div>
          <span className="text-[7.5px] font-black text-orange-700 leading-none">SUPATCHAR</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">SERVICE</span>
        </div>
      );
    case 'tns':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-sky-700 text-white flex items-center justify-center mb-1 shadow-sm">
            <Radio size={14} />
          </div>
          <span className="text-[9px] font-black text-slate-800 leading-none">TNS</span>
          <span className="text-[6px] font-semibold text-slate-400 mt-0.5">TELECOM NETWORK</span>
        </div>
      );
    case 'gnet':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1 shadow-sm">
            <Globe size={15} />
          </div>
          <span className="text-[8.5px] font-black text-emerald-700 leading-none">G-NET</span>
          <span className="text-[6px] font-semibold text-slate-400 mt-0.5">SYSTEMS &amp; NETWORK</span>
        </div>
      );
    case 'denchai':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center mb-1 shadow-sm">
            <Star size={14} fill="currentColor" />
          </div>
          <span className="text-[8px] font-black text-rose-700 leading-none">DENCHAI</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">TRADING</span>
        </div>
      );
    case 'gotit':
    default:
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center mb-1 shadow-sm">
            <Check size={15} strokeWidth={3} />
          </div>
          <span className="text-[8.5px] font-black text-purple-800 leading-none">GOT IT</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">SOLUTIONS</span>
        </div>
      );
  }
}

export default function PartnerCompanyModal({
  isOpen,
  onSelectCompany,
  onCancel,
  loadingCompanyId = null,
  errorText = '',
}) {
  const [filterText, setFilterText] = useState('');

  const visibleCompanies = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return PARTNER_COMPANIES;
    return PARTNER_COMPANIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.shortTag.toLowerCase().includes(q) ||
        c.subTag.toLowerCase().includes(q)
    );
  }, [filterText]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-start sm:items-center justify-center p-2.5 sm:p-5 bg-slate-950/85 backdrop-blur-md font-['Prompt']"
      style={{ overflowY: 'auto' }}
    >
      <div className="relative w-full max-w-6xl rounded-[30px] p-[2px] bg-gradient-to-br from-amber-300 via-blue-500/60 to-emerald-400 shadow-[0_35px_90px_-15px_rgba(0,0,0,0.85)] my-auto">
        <div className="rounded-[28px] overflow-hidden bg-gradient-to-b from-[#f8fbff] via-white to-[#eef4f8] dark:from-[#0b1324] dark:via-[#0f1a30] dark:to-[#0a1420] flex flex-col max-h-[92vh]">

          {/* Top Official Hospital Notification Header */}
          <div className="relative bg-gradient-to-r from-[#091e3a] via-[#123868] to-[#0b3b2c] px-5 sm:px-8 py-5 border-b-[3px] border-amber-400 shrink-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.2),transparent_55%)] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-5">
                {/* Official Hospital Crest Notification Icon */}
                <div className="relative shrink-0">
                  <div className="absolute -inset-2 rounded-full bg-amber-400/30 blur-md animate-pulse" />
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.45)] border-2 border-amber-300 flex items-center justify-center">
                    <img
                      src="/โลโก้ ร.พ.png"
                      alt="ตราโรงพยาบาลนครพิงค์"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-200 text-[11px] font-extrabold tracking-wide mb-1.5">
                    <ShieldAlert size={13} className="text-amber-300" />
                    ประกาศแจ้งเตือนจากโรงพยาบาลนครพิงค์ • บังคับเลือกก่อนเข้าใช้งาน
                  </div>
                  <h2 className="text-xl sm:text-2xl font-[900] text-white m-0 tracking-tight drop-shadow-sm">
                    กรุณาเลือกบริษัทคู่ค้าของท่านก่อนเข้าระบบ
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-100/90 mt-1 mb-0 font-medium">
                    คลิกเลือกชื่อบริษัทของท่านด้านล่างเพื่อเข้าสู่ระบบค้นหา Jop โดยอัตโนมัติ
                  </p>
                </div>
              </div>

              {/* Filter box */}
              <div className="relative w-full md:w-64 shrink-0">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-300 pointer-events-none" />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="ค้นหาชื่อบริษัท..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/15 border border-white/25 text-white placeholder:text-blue-200/70 text-sm font-semibold outline-none focus:border-amber-300 focus:bg-white/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Error Banner if any */}
          {errorText && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
              {errorText}
            </div>
          )}

          {/* 14 Partner Companies Luxury Grid */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 relative">
            {/* Subtle Hospital Watermark */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04] select-none">
              <img src="/โลโก้ ร.พ ข้างขวา.png" alt="" className="w-[320px] object-contain" />
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
              {visibleCompanies.map((company) => {
                const isBusy = loadingCompanyId === company.id;
                const isDisabled = Boolean(loadingCompanyId);

                return (
                  <button
                    key={company.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSelectCompany(company)}
                    style={{
                      background: company.gradient,
                      boxShadow: `0 12px 24px -8px ${company.shadow}`,
                    }}
                    className="group relative flex flex-col items-center justify-between rounded-2xl p-3.5 text-white border border-white/25 hover:-translate-y-1.5 hover:ring-2 hover:ring-amber-300 active:scale-[0.97] transition-all duration-200 cursor-pointer min-h-[188px] overflow-hidden text-center"
                  >
                    {/* Top Gloss Shine */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20 pointer-events-none" />

                    {/* White Rounded Logo Tile */}
                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
                      <CompanyEmblem company={company} />
                    </div>

                    {/* Company Name */}
                    <div className="relative z-10 my-2.5 px-0.5 flex-1 flex items-center justify-center">
                      <span className="text-[13px] sm:text-[13.5px] font-[800] leading-snug drop-shadow-xs line-clamp-2">
                        {company.name}
                      </span>
                    </div>

                    {/* Action Pill */}
                    <div className="relative z-10 w-full flex items-center justify-center gap-1.5">
                      <div className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 text-slate-950 font-black text-[11px] shadow-sm flex items-center justify-center gap-1 group-hover:from-amber-200 group-hover:to-amber-300 transition-colors">
                        {isBusy ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>กำลังเข้า...</span>
                          </>
                        ) : (
                          <>
                            <span>เลือกบริษัท</span>
                          </>
                        )}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/25 border border-white/40 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-100/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <img src="/cnkp-logo-horizontal.png" alt="โรงพยาบาลนครพิงค์" className="h-6 object-contain" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                • บังคับเลือกบริษัทคู่ค้าก่อนเข้าใช้งานระบบค้นหา Jop
              </span>
            </div>

            {onCancel && (
              <button
                type="button"
                disabled={Boolean(loadingCompanyId)}
                onClick={onCancel}
                className="px-4 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer border-0"
              >
                กลับหน้า Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
