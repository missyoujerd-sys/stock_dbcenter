import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ScanBarcode,
  X,
  CheckCircle2,
  Wrench,
  Layers,
  RefreshCw,
  Settings,
  Eye,
  ExternalLink,
  Calendar,
  Building2,
  Barcode,
  ShieldCheck,
  ShieldX,
  AlertCircle,
  ArrowRight,
  Clock,
  FileText,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  JobSearchService,
  JobRecord,
  JobFilterMode,
  JobApiConfig,
  DEFAULT_JOB_API_CONFIG,
  matchesJobFilter,
} from '../../services/jobSearchService';

function playBeep(type: 'success' | 'error') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
      osc.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Ignore audio context restriction
  }
}

export default function JobSearch() {
  const { currentUser, isAdmin_2, partnerCompany } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [filterMode, setFilterMode] = useState<JobFilterMode>('all');
  const [inputKeyword, setInputKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [allJobs, setAllJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState<JobApiConfig>(DEFAULT_JOB_API_CONFIG);

  const [lastScannedCode, setLastScannedCode] = useState('');

  // Detail & API config modals
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [draftApiConfig, setDraftApiConfig] = useState<JobApiConfig>(DEFAULT_JOB_API_CONFIG);
  const [savingApi, setSavingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [updatingStage, setUpdatingStage] = useState(false);

  const loadJobs = useCallback(async (cfg?: JobApiConfig, queryText = '', mode: JobFilterMode = 'all') => {
    setLoading(true);
    try {
      const activeCfg = cfg || (await JobSearchService.getApiConfig());
      setApiConfig(activeCfg);
      setDraftApiConfig(activeCfg);
      const result = await JobSearchService.fetchAllJobs(activeCfg, queryText, mode);
      setAllJobs(result.jobs);
      setApiError(result.apiError);
      return result.jobs;
    } catch (err: any) {
      setApiError(err?.message || 'ไม่สามารถโหลดข้อมูลได้');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (!showApiModal && !selectedJob) {
      searchInputRef.current?.focus();
    }
  }, [showApiModal, selectedJob]);

  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) =>
      matchesJobFilter(job, appliedKeyword, filterMode)
    );
  }, [allJobs, appliedKeyword, filterMode]);

  const exactMatchJob = useMemo(() => {
    const term = appliedKeyword.trim().toLowerCase();
    if (!term) return null;
    return (
      filteredJobs.find(
        (j) =>
          j.jobNumber.toLowerCase() === term ||
          j.id.toLowerCase() === term ||
          j.serialNumber.toLowerCase() === term ||
          j.assetNumber.toLowerCase() === term
      ) || (filteredJobs.length === 1 ? filteredJobs[0] : null)
    );
  }, [filteredJobs, appliedKeyword]);

  const executeSearch = async (rawTerm?: string, overrideMode?: JobFilterMode) => {
    const keyword = (rawTerm !== undefined ? rawTerm : inputKeyword).trim();
    const targetMode = overrideMode || filterMode;
    setAppliedKeyword(keyword);
    setHasSearched(true);
    if (keyword) {
      setLastScannedCode(keyword);
    }

    let dataset = allJobs;
    if ((apiConfig.mode === 'api' || apiConfig.mode === 'hybrid') && apiConfig.apiUrl.trim()) {
      dataset = await loadJobs(apiConfig, keyword, targetMode);
    }

    const matched = dataset.filter((job) =>
      matchesJobFilter(job, keyword, targetMode)
    );

    if (keyword) {
      playBeep(matched.length > 0 ? 'success' : 'error');
    }

    setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 40);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleClearSearch = () => {
    setInputKeyword('');
    setAppliedKeyword('');
    setHasSearched(false);
    setLastScannedCode('');
    searchInputRef.current?.focus();
  };

  const handleTestApi = async () => {
    if (!draftApiConfig.apiUrl.trim()) {
      setApiTestResult({ ok: false, msg: 'กรุณาระบุ API Endpoint URL ก่อนทดสอบ' });
      return;
    }
    setApiTestResult(null);
    try {
      const items = await JobSearchService.fetchExternalJobs(draftApiConfig, inputKeyword, filterMode);
      setApiTestResult({ ok: true, msg: `เชื่อมต่อสำเร็จ! พบข้อมูลจาก API จำนวน ${items.length} รายการ` });
    } catch (err: any) {
      setApiTestResult({ ok: false, msg: `เชื่อมต่อไม่สำเร็จ: ${err?.message || 'Unknown error'}` });
    }
  };

  const handleSaveApiConfig = async () => {
    setSavingApi(true);
    try {
      await JobSearchService.saveApiConfig(draftApiConfig);
      setApiConfig(draftApiConfig);
      setShowApiModal(false);
      await loadJobs(draftApiConfig, appliedKeyword, filterMode);
    } catch (err: any) {
      setApiTestResult({ ok: false, msg: `บันทึกไม่สำเร็จ: ${err?.message || 'Error'}` });
    } finally {
      setSavingApi(false);
    }
  };

  const handleToggleStage = async (job: JobRecord, nextStage: 'receive' | 'complete') => {
    if (!isAdmin_2 || job.source !== 'firebase') return;
    setUpdatingStage(true);
    try {
      const operator = currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
      await JobSearchService.updateFirebaseJobStage(job.id, nextStage, operator);
      const updated = await loadJobs(apiConfig, appliedKeyword, filterMode);
      const fresh = updated.find((u) => u.id === job.id);
      if (fresh) setSelectedJob(fresh);
    } finally {
      setUpdatingStage(false);
    }
  };

  const radioOptions: {
    value: JobFilterMode;
    label: string;
    icon: React.ComponentType<any>;
    activeBorder: string;
    activeBg: string;
    activeText: string;
  }[] = [
    {
      value: 'all',
      label: 'All',
      icon: Layers,
      activeBorder: 'border-indigo-500 ring-2 ring-indigo-500/20',
      activeBg: 'bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-purple-500/15 dark:from-indigo-500/25 dark:to-blue-500/20',
      activeText: 'text-indigo-700 dark:text-indigo-300',
    },
    {
      value: 'receive',
      label: 'รับเครื่องซ่อม',
      icon: Wrench,
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
      activeBg: 'bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-yellow-500/15 dark:from-amber-500/25 dark:to-orange-500/20',
      activeText: 'text-amber-700 dark:text-amber-300',
    },
    {
      value: 'complete',
      label: 'ส่งเครื่องจบงาน',
      icon: CheckCircle2,
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
      activeBg: 'bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-green-500/15 dark:from-emerald-500/25 dark:to-teal-500/20',
      activeText: 'text-emerald-700 dark:text-emerald-300',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8 font-['Prompt'] relative">
      {/* Dimensional Government Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-[10%] left-[20%] w-[420px] h-[420px] rounded-full bg-blue-400/12 dark:bg-blue-500/10 blur-[110px]" />
        <div className="absolute bottom-[5%] right-[12%] w-[380px] h-[380px] rounded-full bg-emerald-400/12 dark:bg-emerald-500/10 blur-[110px]" />
      </div>

      {/* Section 2: Official Thai Government 3D Dimensional Search Card */}
      <div className="relative z-10 rounded-[30px] p-[1.5px] bg-gradient-to-br from-amber-300/60 via-blue-300/50 to-emerald-400/60 dark:from-amber-400/35 dark:via-blue-500/35 dark:to-emerald-500/35 shadow-[0_28px_70px_-15px_rgba(11,37,69,0.24)] dark:shadow-[0_28px_70px_-15px_rgba(0,0,0,0.75)]">
        <div className="rounded-[29px] overflow-hidden bg-gradient-to-b from-white via-[#f9fbff] to-[#f2f7f5] dark:from-[#0e1729] dark:via-[#111c33] dark:to-[#0c1a1e] relative">

          {/* Official Government Header Bar (Royal Navy + Ministry Emerald + Gold Rim) */}
          <div className="relative bg-gradient-to-r from-[#0a2240] via-[#123868] to-[#0b3d2e] px-6 sm:px-8 py-5 sm:py-6 border-b-[3px] border-amber-400 flex flex-wrap items-center justify-between gap-4 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_55%)] pointer-events-none" />

            <div className="relative z-10 flex items-center gap-4 sm:gap-5">
              {/* Official Ministry + Hospital Seal */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.32)] border-2 border-amber-300/85 shrink-0 flex items-center justify-center">
                <img
                  src="/โลโก้ ร.พ.png"
                  alt="ตราโรงพยาบาลนครพิงค์ กระทรวงสาธารณสุข"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-2 text-2xl sm:text-[30px] font-black tracking-wide leading-tight">
                    <Search
                      size={25}
                      className="text-yellow-300 shrink-0"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.65)) drop-shadow(0 0 10px rgba(250,204,21,0.45))' }}
                    />
                    <span
                      className="bg-gradient-to-b from-[#fef9c3] via-[#facc15] to-[#d97706] bg-clip-text text-transparent"
                      style={{ filter: 'drop-shadow(0 2px 0 rgba(120,53,15,0.9)) drop-shadow(0 5px 12px rgba(0,0,0,0.5))' }}
                    >
                      ค้นหา Jop
                    </span>
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400/20 text-amber-200 border border-amber-300/45 shadow-xs">
                    งานราชการ • คู่ค้า
                  </span>
                  {partnerCompany && (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-400/20 text-emerald-200 border border-emerald-300/45 shadow-xs">
                      {partnerCompany.name}
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base font-bold text-amber-200/95 mt-1.5 mb-0 tracking-wide drop-shadow-xs">
                  ระบบสืบค้นและตรวจสอบงานซ่อมบริษัทคู่ค้า • โรงพยาบาลนครพิงค์
                </p>
              </div>
            </div>

            {/* Utility Controls (Refresh + Admin API Config) */}
            <div className="relative z-10 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => loadJobs(apiConfig, appliedKeyword, filterMode)}
                className="flex items-center justify-center p-2.5 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer border border-white/20"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin text-amber-300' : ''} />
              </button>

              {isAdmin_2 && (
                <button
                  type="button"
                  onClick={() => {
                    setApiTestResult(null);
                    setDraftApiConfig(apiConfig);
                    setShowApiModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 shadow-md hover:brightness-105 transition-all cursor-pointer border-0"
                >
                  <Settings size={14} />
                  <span>ตั้งค่า API</span>
                </button>
              )}
            </div>
          </div>

          {/* Card Form Body with Official Watermark & 3D Depth */}
          <form onSubmit={handleFormSubmit} className="relative p-6 sm:p-10 overflow-hidden">
            {/* Subtle Official Ministry Crest Watermark */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.045] dark:opacity-[0.06] select-none">
              <img src="/โลโก้ ร.พ ข้างขวา.png" alt="" className="w-[290px] sm:w-[340px] object-contain" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
              {/* Row 1: Symmetrical Single-Line Radio Pills (All | รับเครื่องซ่อม | ส่งเครื่องจบงาน) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                {radioOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = filterMode === opt.value;
                  return (
                    <label
                      key={opt.value}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      className={`relative gap-2.5 px-4 py-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none ${
                        isSelected
                          ? `${opt.activeBorder} ${opt.activeBg} shadow-[0_10px_24px_-6px_rgba(19,59,107,0.22)] -translate-y-0.5`
                          : 'border-slate-200/90 dark:border-slate-700 bg-white/90 dark:bg-slate-800/80 shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:border-blue-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="jobStageFilter"
                        value={opt.value}
                        checked={isSelected}
                        onChange={() => {
                          setFilterMode(opt.value);
                          setTimeout(() => searchInputRef.current?.focus(), 20);
                        }}
                        className="w-4 h-4 accent-[#123868] cursor-pointer shrink-0 m-0"
                      />
                      <Icon
                        size={18}
                        className={`shrink-0 ${isSelected ? opt.activeText : 'text-slate-400'}`}
                      />
                      <span className={`text-[15px] font-extrabold whitespace-nowrap ${isSelected ? opt.activeText : 'text-slate-700 dark:text-slate-200'}`}>
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Row 2: "คำค้นหา:" + Recessed 3D Barcode Input */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-base font-extrabold text-slate-700 dark:text-slate-200 sm:w-24 sm:text-right shrink-0">
                  คำค้นหา:
                </span>

                <div className="relative flex-1 flex items-center">
                  <ScanBarcode
                    size={20}
                    className="absolute left-4 text-[#123868] dark:text-blue-400 pointer-events-none"
                  />
                  <input
                    id="jop-search-input"
                    ref={searchInputRef}
                    type="text"
                    value={inputKeyword}
                    onChange={(e) => setInputKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') handleClearSearch();
                    }}
                    placeholder="ยิงบาร์โค้ด / เลขที่ Jop / เลขครุภัณฑ์ / Serial Number..."
                    autoFocus
                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-semibold text-base shadow-[inset_0_2px_6px_rgba(15,23,42,0.06)] outline-none focus:border-[#123868] dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />

                  {inputKeyword && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2.5 p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer border-0 bg-transparent"
                      title="ล้างคำค้นหา"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 3: Action Button ("ค้นหา") */}
              <div className="flex items-center justify-center mt-7">
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2.5 min-w-[200px] px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#0b2545] via-[#134074] to-[#0b3d2e] hover:brightness-110 text-white font-extrabold text-base shadow-[0_10px_25px_-5px_rgba(11,37,69,0.45)] border border-amber-300/40 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Search size={19} className="text-amber-300" />
                  ค้นหา
                </button>
              </div>
            </div>
          </form>

          {/* Official Government Footer Strip inside Card */}
          <div className="px-6 sm:px-8 py-3.5 bg-gradient-to-r from-slate-50 via-blue-50/40 to-emerald-50/40 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/cnkp-logo-horizontal.png"
                alt="โรงพยาบาลนครพิงค์"
                className="h-7 object-contain opacity-90"
              />
            </div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wide text-center sm:text-right">
              กระทรวงสาธารณสุข • โรงพยาบาลนครพิงค์ จังหวัดเชียงใหม่
            </div>
          </div>
        </div>
      </div>

      {/* API Error Notice */}
      {apiError && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 p-4 flex items-center gap-3 text-amber-800 dark:text-amber-200">
          <AlertCircle size={20} className="shrink-0" />
          <div className="text-sm font-semibold">
            แจ้งเตือนการเชื่อมต่อ API: {apiError}
          </div>
        </div>
      )}

      {/* Results appear ONLY after searching AND when External API is connected (default table removed as requested) */}
      {hasSearched && !apiConfig.apiUrl.trim() && (
        <div className="rounded-2xl bg-white/95 dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-700/40 px-5 py-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <ScanBarcode size={18} />
            </div>
            <div>
              <div className="font-extrabold">
                รับคำค้นหา: <span className="text-blue-600 dark:text-blue-400">{appliedKeyword || '(ทั้งหมดในหมวด)'}</span> • หมวด:{' '}
                <span className="text-indigo-600 dark:text-indigo-300">
                  {filterMode === 'all' ? 'All' : filterMode === 'receive' ? 'รับเครื่องซ่อม' : 'ส่งเครื่องจบงาน'}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                ระบบพร้อมสำหรับเชื่อมต่อ API บริษัทคู่ค้า (ยังไม่ได้ตั้งค่า API Endpoint)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin_2 && (
              <button
                type="button"
                onClick={() => {
                  setApiTestResult(null);
                  setDraftApiConfig(apiConfig);
                  setShowApiModal(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-400 text-slate-950 hover:brightness-105 cursor-pointer border-0"
              >
                ตั้งค่าเชื่อม API
              </button>
            )}
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer border-0"
            >
              ล้างผล
            </button>
          </div>
        </div>
      )}

      {hasSearched && apiConfig.apiUrl.trim() && (
        <>
          {/* Exact Barcode Hit Spotlight Card */}
          {exactMatchJob && (
            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-blue-950/30 border-2 border-emerald-400/70 dark:border-emerald-500/40 p-6 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-sm">
                      <ScanBarcode size={14} />
                      พบข้อมูลตรงกับบาร์โค้ด {lastScannedCode ? `"${lastScannedCode}"` : ''}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                        exactMatchJob.stage === 'complete'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                      }`}
                    >
                      {exactMatchJob.stage === 'complete' ? <CheckCircle2 size={14} /> : <Wrench size={14} />}
                      {exactMatchJob.stageLabel} ({exactMatchJob.status})
                    </span>
                  </div>

                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {exactMatchJob.jobNumber} — {exactMatchJob.equipmentModel}
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <span><strong>ครุภัณฑ์:</strong> {exactMatchJob.assetNumber}</span>
                    <span><strong>S/N:</strong> <code className="font-mono text-blue-600 dark:text-blue-400">{exactMatchJob.serialNumber}</code></span>
                    <span><strong>บริษัท/ผู้รับซ่อม:</strong> {exactMatchJob.companyName}</span>
                    <span><strong>อาการ:</strong> {exactMatchJob.problemDescription}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedJob(exactMatchJob)}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-all cursor-pointer shrink-0 border-0"
                >
                  <Eye size={16} />
                  ดูรายละเอียด Jop
                </button>
              </div>
            </div>
          )}

          {/* Results Table from Connected API */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                <span className="font-extrabold text-slate-800 dark:text-white text-base">
                  ผลการค้นหา Jop ({filteredJobs.length} รายการ)
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-xs font-bold text-slate-500 hover:text-rose-500 cursor-pointer border-0 bg-transparent"
              >
                ปิดผลลัพธ์
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-9 h-9 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm font-bold mb-0">กำลังค้นหาข้อมูลจาก API...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 px-4 text-center">
                <ScanBarcode size={44} className="text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-0">
                  ไม่พบรายการ Jop ที่ตรงกับเงื่อนไข
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-900 text-white text-xs uppercase tracking-wider">
                      <th className="px-5 py-3.5 font-bold whitespace-nowrap">ประเภทงาน</th>
                      <th className="px-5 py-3.5 font-bold whitespace-nowrap">เลขที่ Jop / อุปกรณ์</th>
                      <th className="px-5 py-3.5 font-bold whitespace-nowrap">เลขครุภัณฑ์ / S/N</th>
                      <th className="px-5 py-3.5 font-bold whitespace-nowrap">อาการเสีย</th>
                      <th className="px-5 py-3.5 font-bold whitespace-nowrap">บริษัท / สถานะ</th>
                      <th className="px-5 py-3.5 font-bold whitespace-nowrap text-center">ดูข้อมูล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredJobs.map((job) => (
                      <tr
                        key={`${job.source}-${job.id}`}
                        onClick={() => setSelectedJob(job)}
                        className="hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                              job.stage === 'complete'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                            }`}
                          >
                            {job.stage === 'complete' ? <CheckCircle2 size={13} /> : <Wrench size={13} />}
                            {job.stageLabel}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-black text-indigo-600 dark:text-indigo-300">{job.jobNumber}</div>
                          <div className="font-bold text-slate-800 dark:text-white text-sm">{job.equipmentModel}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{job.assetNumber}</div>
                          <div className="text-xs font-mono text-blue-600 dark:text-blue-400">{job.serialNumber}</div>
                        </td>
                        <td className="px-5 py-3.5 max-w-[220px]">
                          <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{job.problemDescription}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{job.companyName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{job.status}</div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJob(job);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 text-xs font-bold border border-blue-200/70 dark:border-blue-500/30 cursor-pointer"
                          >
                            <Eye size={14} />
                            รายละเอียด
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 text-white flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/15 border border-white/20">
                    {selectedJob.jobNumber}
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-[11px] font-black ${
                      selectedJob.stage === 'complete'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {selectedJob.stageLabel}
                  </span>
                </div>
                <h3 className="text-xl font-black m-0">{selectedJob.equipmentModel}</h3>
                <p className="text-xs text-slate-300 mt-1 mb-0">
                  สถานะปัจจุบัน: {selectedJob.status} • แหล่งข้อมูล: {selectedJob.source.toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer border-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* 2-step Stage Timeline */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                      <Wrench size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800 dark:text-white">1. รับเครื่องซ่อม</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedJob.receivedDate || selectedJob.reportedDate || 'รอดำเนินการ'}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        selectedJob.stage === 'complete' ? 'w-full bg-emerald-500' : 'w-1/2 bg-amber-400'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
                        selectedJob.stage === 'complete'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800 dark:text-white">2. ส่งเครื่องจบงาน</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedJob.returnDate || (selectedJob.stage === 'complete' ? 'เสร็จสิ้น' : 'รอดำเนินการ')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <Barcode size={13} /> หมายเลขครุภัณฑ์
                  </div>
                  <div className="text-sm font-black text-slate-800 dark:text-white">{selectedJob.assetNumber}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <ScanBarcode size={13} /> Serial Number (S/N)
                  </div>
                  <div className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 break-all">
                    {selectedJob.serialNumber}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <Building2 size={13} /> บริษัท / ผู้รับซ่อม
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">{selectedJob.companyName}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    {selectedJob.isWarranty ? <ShieldCheck size={13} className="text-emerald-500" /> : <ShieldX size={13} className="text-rose-500" />}
                    การรับประกัน
                  </div>
                  <div className={`text-sm font-black ${selectedJob.isWarranty ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {selectedJob.isWarranty ? 'อยู่ในระยะรับประกัน' : 'พ้นระยะรับประกัน'}
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/40">
                <div className="text-xs font-extrabold text-rose-600 dark:text-rose-400 mb-1">
                  อาการเสีย / รายละเอียดปัญหา
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {selectedJob.problemDescription}
                </div>
              </div>

              {/* Staff / Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">
                  <div className="font-bold text-slate-400 mb-1 flex items-center gap-1"><Calendar size={12} /> ผู้แจ้งซ่อม / วันที่แจ้ง</div>
                  <div className="font-bold text-slate-800 dark:text-white">{selectedJob.reporterName || '-'}</div>
                  <div>วันที่: {selectedJob.reportedDate || '-'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">
                  <div className="font-bold text-slate-400 mb-1 flex items-center gap-1"><Clock size={12} /> ผู้ส่งคืน / วันที่จบงาน</div>
                  <div className="font-bold text-slate-800 dark:text-white">{selectedJob.returnerName || selectedJob.staffReceiptName || '-'}</div>
                  <div>วันที่: {selectedJob.returnDate || selectedJob.staffReceiptDate || '-'}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-2">
                  {isAdmin_2 && selectedJob.source === 'firebase' && (
                    <>
                      <button
                        type="button"
                        disabled={updatingStage || selectedJob.stage === 'receive'}
                        onClick={() => handleToggleStage(selectedJob, 'receive')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-40 cursor-pointer border-0"
                      >
                        ตั้งเป็น: รับเครื่องซ่อม
                      </button>
                      <button
                        type="button"
                        disabled={updatingStage || selectedJob.stage === 'complete'}
                        onClick={() => handleToggleStage(selectedJob, 'complete')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 cursor-pointer border-0"
                      >
                        ตั้งเป็น: ส่งเครื่องจบงาน
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {selectedJob.source === 'firebase' && (
                    <Link
                      to={`/repair/view/${selectedJob.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold no-underline transition-colors"
                    >
                      <ExternalLink size={14} />
                      เปิดใบแจ้งซ่อม / พิมพ์
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer border-0"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin API Settings Modal */}
      {showApiModal && isAdmin_2 && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
          onClick={() => setShowApiModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Settings size={20} className="text-amber-400" />
                <div>
                  <h3 className="text-lg font-black m-0">ตั้งค่าเชื่อมต่อ API ค้นหา Jop</h3>
                  <p className="text-xs text-slate-300 m-0">เชื่อม API ภายนอก หรือใช้งานร่วมกับข้อมูล Firebase</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer border-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">โหมดการดึงข้อมูล</label>
                <select
                  value={draftApiConfig.mode}
                  onChange={(e) => setDraftApiConfig((p) => ({ ...p, mode: e.target.value as any }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold"
                >
                  <option value="firebase">Firebase (ฐานข้อมูลภายในระบบ)</option>
                  <option value="hybrid">Hybrid (Firebase + External API)</option>
                  <option value="api">External API อย่างเดียว</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">API Endpoint URL</label>
                <input
                  type="url"
                  value={draftApiConfig.apiUrl}
                  onChange={(e) => setDraftApiConfig((p) => ({ ...p, apiUrl: e.target.value }))}
                  placeholder="https://api.example.com/repair-jobs"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">Query Param คำค้นหา</label>
                  <input
                    type="text"
                    value={draftApiConfig.searchParam}
                    onChange={(e) => setDraftApiConfig((p) => ({ ...p, searchParam: e.target.value }))}
                    placeholder="q"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">Query Param ประเภทงาน</label>
                  <input
                    type="text"
                    value={draftApiConfig.typeParam}
                    onChange={(e) => setDraftApiConfig((p) => ({ ...p, typeParam: e.target.value }))}
                    placeholder="type"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">ค่าสำหรับ "รับเครื่องซ่อม"</label>
                  <input
                    type="text"
                    value={draftApiConfig.receiveValue}
                    onChange={(e) => setDraftApiConfig((p) => ({ ...p, receiveValue: e.target.value }))}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">ค่าสำหรับ "ส่งเครื่องจบงาน"</label>
                  <input
                    type="text"
                    value={draftApiConfig.completeValue}
                    onChange={(e) => setDraftApiConfig((p) => ({ ...p, completeValue: e.target.value }))}
                    placeholder="2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">Auth Header</label>
                  <input
                    type="text"
                    value={draftApiConfig.authHeaderName}
                    onChange={(e) => setDraftApiConfig((p) => ({ ...p, authHeaderName: e.target.value }))}
                    placeholder="Authorization"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">Token / API Key (ถ้ามี)</label>
                  <input
                    type="text"
                    value={draftApiConfig.authHeaderValue}
                    onChange={(e) => setDraftApiConfig((p) => ({ ...p, authHeaderValue: e.target.value }))}
                    placeholder="Bearer xxx..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-3.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="font-bold mb-1">ตัวอย่าง JSON Fields ที่รองรับอัตโนมัติ:</div>
                <code className="block font-mono text-[11px] break-all text-indigo-600 dark:text-indigo-300">
                  {`[{ "jobNumber": "JOB-001", "stage": "1" | "2", "assetNumber": "...", "serialNumber": "...", "equipmentModel": "...", "problemDescription": "...", "companyName": "...", "status": "..." }]`}
                </code>
              </div>

              {apiTestResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    apiTestResult.ok
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                  }`}
                >
                  {apiTestResult.ok ? <Check size={16} /> : <AlertCircle size={16} />}
                  {apiTestResult.msg}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestApi}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer border-0"
                >
                  ทดสอบเชื่อมต่อ API
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApiModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer border-0"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={savingApi}
                    onClick={handleSaveApiConfig}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md cursor-pointer border-0"
                  >
                    <ArrowRight size={14} />
                    {savingApi ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
