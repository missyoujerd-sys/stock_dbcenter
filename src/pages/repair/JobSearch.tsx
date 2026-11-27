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
import CompanyEmblem from '../../components/CompanyEmblem';
import {
  JobSearchService,
  JobRecord,
  JobFilterMode,
  JobStatusTab,
  JobActionType,
  JobApiConfig,
  DEFAULT_JOB_API_CONFIG,
  matchesJobFilter,
  matchesPartnerCompany,
  getJobBucket,
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
  const [statusTab, setStatusTab] = useState<JobStatusTab>('all');
  const [onlyMyCompany, setOnlyMyCompany] = useState<boolean>(() => Boolean(partnerCompany && !isAdmin_2));
  const [inputKeyword, setInputKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [firebaseJobs, setFirebaseJobs] = useState<JobRecord[]>([]);
  const [externalJobs, setExternalJobs] = useState<JobRecord[]>([]);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState<JobApiConfig>(DEFAULT_JOB_API_CONFIG);

  const [lastScannedCode, setLastScannedCode] = useState('');

  // Detail & API config modals
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [operatorInput, setOperatorInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [actionBanner, setActionBanner] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [draftApiConfig, setDraftApiConfig] = useState<JobApiConfig>(DEFAULT_JOB_API_CONFIG);
  const [savingApi, setSavingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [updatingStage, setUpdatingStage] = useState(false);

  const allJobs = useMemo(() => {
    const merged: JobRecord[] = [];
    if (apiConfig.mode === 'firebase' || apiConfig.mode === 'hybrid') {
      merged.push(...firebaseJobs);
    }
    if ((apiConfig.mode === 'api' || apiConfig.mode === 'hybrid') && apiConfig.apiUrl.trim()) {
      merged.push(...externalJobs);
    }
    return merged.sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || a.receivedDate || a.reportedDate || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || b.receivedDate || b.reportedDate || 0).getTime();
      return tb - ta;
    });
  }, [apiConfig.mode, apiConfig.apiUrl, firebaseJobs, externalJobs]);

  const loadJobs = useCallback(async (cfg?: JobApiConfig, queryText = '', mode: JobFilterMode = 'all') => {
    setLoading(true);
    try {
      const activeCfg = cfg || (await JobSearchService.getApiConfig());
      setApiConfig(activeCfg);
      setDraftApiConfig(activeCfg);

      if ((activeCfg.mode === 'api' || activeCfg.mode === 'hybrid') && activeCfg.apiUrl?.trim()) {
        try {
          const ext = await JobSearchService.fetchExternalJobs(activeCfg, queryText, mode);
          setExternalJobs(ext);
          setApiError(null);
        } catch (err: any) {
          setApiError(err?.message || 'เชื่อมต่อ API ภายนอกไม่สำเร็จ');
        }
      } else {
        setExternalJobs([]);
        setApiError(null);
      }

      if (activeCfg.mode === 'api') {
        setLoading(false);
      }
      return [];
    } catch (err: any) {
      setApiError(err?.message || 'ไม่สามารถโหลดข้อมูลได้');
      setLoading(false);
      return [];
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Live Firebase Realtime subscription for both partner_repair_cases (from Local) and repairs
  useEffect(() => {
    const unsub = JobSearchService.subscribeFirebaseJobs(
      (jobs) => {
        setFirebaseJobs(jobs);
        setFirebaseConnected(true);
        setLoading(false);
      },
      (err) => {
        setFirebaseConnected(false);
        setApiError(err?.message || 'เชื่อมต่อ Firebase Realtime ไม่สำเร็จ');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Keep selectedJob synced live when Firebase updates
  useEffect(() => {
    if (!selectedJob) return;
    const fresh = allJobs.find((j) => j.id === selectedJob.id && j.source === selectedJob.source);
    if (fresh && fresh !== selectedJob) {
      setSelectedJob(fresh);
    }
  }, [allJobs, selectedJob]);

  // Pre-fill operator name & note whenever a job modal opens
  const openJobDetail = useCallback((job: JobRecord) => {
    setSelectedJob(job);
    setActionBanner(null);
    const defaultOp =
      job.assignedTech ||
      job.returnerName ||
      partnerCompany?.name ||
      currentUser?.displayName ||
      currentUser?.email?.split('@')[0] ||
      '';
    setOperatorInput(defaultOp);
    setNoteInput(job.solution || job.partnerActivity?.lastNote || job.statusDetail || '');
  }, [partnerCompany, currentUser]);

  useEffect(() => {
    if (!showApiModal && !selectedJob) {
      searchInputRef.current?.focus();
    }
  }, [showApiModal, selectedJob]);

  const companyScopedJobs = useMemo(() => {
    if (!onlyMyCompany || !partnerCompany || isAdmin_2) return allJobs;
    return allJobs.filter((job) => matchesPartnerCompany(job, partnerCompany));
  }, [allJobs, onlyMyCompany, partnerCompany, isAdmin_2]);

  const bucketCounts = useMemo(() => {
    let waiting = 0;
    let inProgress = 0;
    let completed = 0;
    for (const j of companyScopedJobs) {
      const b = getJobBucket(j);
      if (b === 'waiting') waiting += 1;
      else if (b === 'in_progress') inProgress += 1;
      else completed += 1;
    }
    return {
      all: companyScopedJobs.length,
      waiting,
      in_progress: inProgress,
      completed,
    };
  }, [companyScopedJobs]);

  const filteredJobs = useMemo(() => {
    return companyScopedJobs.filter((job) => {
      if (statusTab !== 'all' && getJobBucket(job) !== statusTab) return false;
      return matchesJobFilter(job, appliedKeyword, filterMode);
    });
  }, [companyScopedJobs, statusTab, appliedKeyword, filterMode]);

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

    if ((apiConfig.mode === 'api' || apiConfig.mode === 'hybrid') && apiConfig.apiUrl.trim()) {
      await loadJobs(apiConfig, keyword, targetMode);
    }

    const matched = companyScopedJobs.filter((job) =>
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

  const handleJobAction = async (
    job: JobRecord,
    action: JobActionType,
    customOperator?: string,
    customNote?: string
  ) => {
    if (!currentUser || job.source !== 'firebase') return;
    setUpdatingStage(true);
    setActionBanner(null);
    try {
      const operator =
        (customOperator ?? operatorInput).trim() ||
        partnerCompany?.name ||
        currentUser?.displayName ||
        currentUser?.email?.split('@')[0] ||
        'Partner';
      const note = (customNote ?? noteInput).trim();
      await JobSearchService.updateFirebaseJobAction(job, action, {
        operatorName: operator,
        companyName: partnerCompany?.name || job.companyName || '',
        note,
      });
      playBeep('success');
      const actionLabelMap: Record<JobActionType, string> = {
        accept: 'รับเคสซ่อมเรียบร้อยแล้ว (กำลังซิงค์กลับ Local)',
        waiting_parts: 'อัปเดตสถานะเป็น "รออะไหล่" แล้ว',
        complete: 'บันทึกซ่อมเสร็จ / ส่งเครื่องจบงานเรียบร้อยแล้ว',
        unrepairable: 'บันทึกสถานะ "ไม่สามารถซ่อมได้" เรียบร้อยแล้ว',
        reopen: 'เปิดเคสกลับมาซ่อมอีกครั้งแล้ว',
      };
      setActionBanner({ ok: true, msg: actionLabelMap[action] });
    } catch (err: any) {
      playBeep('error');
      setActionBanner({ ok: false, msg: `อัปเดตสถานะไม่สำเร็จ: ${err?.message || 'Error'}` });
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
                </div>
                <p className="text-sm sm:text-base font-bold text-amber-200/95 mt-1.5 mb-0 tracking-wide drop-shadow-xs">
                  ระบบสืบค้นและตรวจสอบงานซ่อมบริษัทคู่ค้า • โรงพยาบาลนครพิงค์
                </p>
              </div>
            </div>

            {/* Selected Partner Company Logo + Name Showcase & Utility Controls */}
            <div className="relative z-10 flex flex-wrap items-center gap-3">
              {partnerCompany && (
                <div
                  style={{
                    background: partnerCompany.gradient,
                    boxShadow: `0 12px 26px -8px ${partnerCompany.shadow || 'rgba(0,0,0,0.45)'}`,
                  }}
                  className="flex items-center gap-3 px-3.5 py-2 rounded-2xl border border-amber-300/65 text-white"
                >
                  <div className="w-14 h-14 rounded-xl bg-white p-1 shadow-md border border-amber-200 shrink-0 flex items-center justify-center overflow-hidden">
                    <CompanyEmblem company={partnerCompany} />
                  </div>
                  <div className="flex flex-col leading-tight pr-1">
                    <span className="text-[10px] font-extrabold text-amber-200 uppercase tracking-wider">
                      บริษัทคู่ค้าที่เลือก
                    </span>
                    <span className="text-sm sm:text-base font-black text-white drop-shadow-xs mt-0.5">
                      {partnerCompany.name}
                    </span>
                  </div>
                </div>
              )}

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                firebaseConnected
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50'
                  : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{firebaseConnected ? `Realtime Sync (${allJobs.length})` : 'กำลังเชื่อม Firebase...'}</span>
              </div>

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

      {/* Live Firebase Realtime Results & Status Board */}
      <div className="relative z-10 space-y-4">
        {/* Exact Barcode Hit Spotlight Card */}
        {hasSearched && exactMatchJob && (
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
                  #{exactMatchJob.jobNumber} — {exactMatchJob.equipmentModel}
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
                onClick={() => openJobDetail(exactMatchJob)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-all cursor-pointer shrink-0 border-0"
              >
                <Eye size={16} />
                จัดการ / ดูรายละเอียด Jop
              </button>
            </div>
          </div>
        )}

        {/* Live Repair Queue Table */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                <span className="font-extrabold text-slate-800 dark:text-white text-base">
                  รายการแจ้งซ่อม Realtime ({filteredJobs.length} รายการ)
                </span>
                {appliedKeyword && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    ค้นหา: "{appliedKeyword}"
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {partnerCompany && !isAdmin_2 && (
                  <button
                    type="button"
                    onClick={() => setOnlyMyCompany((v) => !v)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer transition-all ${
                      onlyMyCompany
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {onlyMyCompany ? `เฉพาะ: ${partnerCompany.name}` : 'แสดงทุกบริษัท'}
                  </button>
                )}
                {(hasSearched || appliedKeyword) && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 cursor-pointer border-0"
                  >
                    ล้างคำค้นหา
                  </button>
                )}
              </div>
            </div>

            {/* KPI Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {([
                { id: 'all', label: 'ทั้งหมด', count: bucketCounts.all, active: 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900', idle: 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
                { id: 'waiting', label: 'รอรับเคส', count: bucketCounts.waiting, active: 'bg-amber-500 text-white border-amber-500', idle: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' },
                { id: 'in_progress', label: 'กำลังซ่อม / รออะไหล่', count: bucketCounts.in_progress, active: 'bg-blue-600 text-white border-blue-600', idle: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30' },
                { id: 'completed', label: 'ซ่อมเสร็จ / จบงาน', count: bucketCounts.completed, active: 'bg-emerald-600 text-white border-emerald-600', idle: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' },
              ] as const).map((tab) => {
                const isAct = statusTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer transition-all ${
                      isAct ? `${tab.active} shadow-sm` : tab.idle
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-black ${
                      isAct ? 'bg-white/25 text-white dark:bg-slate-900/20' : 'bg-white/80 dark:bg-slate-900/50'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-9 h-9 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm font-bold mb-0">กำลังซิงค์ข้อมูลจาก Firebase Realtime...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 px-4 text-center">
              <ScanBarcode size={44} className="text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-0">
                ไม่พบรายการ Jop ที่ตรงกับเงื่อนไข
              </p>
              {onlyMyCompany && partnerCompany && allJobs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOnlyMyCompany(false)}
                  className="mt-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold border border-indigo-200 dark:border-indigo-500/30 cursor-pointer"
                >
                  ลองแสดงเคสจากทุกบริษัท ({allJobs.length} รายการ)
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-900 text-white text-xs uppercase tracking-wider">
                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">สถานะงาน</th>
                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">เลขที่ Jop / อุปกรณ์</th>
                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">เลขครุภัณฑ์ / S/N</th>
                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">อาการเสีย</th>
                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">บริษัท / วันที่แจ้ง</th>
                    <th className="px-5 py-3.5 font-bold whitespace-nowrap text-center">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredJobs.map((job) => {
                    const bucket = getJobBucket(job);
                    return (
                    <tr
                      key={`${job.source}-${job.firebaseNode || 'ext'}-${job.id}`}
                      onClick={() => openJobDetail(job)}
                      className="hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                            bucket === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                              : bucket === 'waiting'
                              ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30'
                          }`}
                        >
                          {bucket === 'completed' ? (
                            <CheckCircle2 size={13} />
                          ) : bucket === 'waiting' ? (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          ) : (
                            <Wrench size={13} />
                          )}
                          {job.status}
                        </span>
                        {job.firebaseNode === 'partner_repair_cases' && (
                          <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 mt-1">
                            ศูนย์ซ่อมคู่ค้า (Local)
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs font-black text-indigo-600 dark:text-indigo-300">#{job.jobNumber}</div>
                        <div className="font-bold text-slate-800 dark:text-white text-sm">{job.equipmentModel}</div>
                        {job.department && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{job.department}</div>
                        )}
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
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {job.reportedDate || job.receivedDate || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-center gap-1.5 flex-wrap">
                          {currentUser && job.source === 'firebase' && bucket === 'waiting' && (
                            <button
                              type="button"
                              disabled={updatingStage}
                              onClick={() => handleJobAction(job, 'accept')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-xs cursor-pointer border-0"
                            >
                              <Wrench size={13} />
                              รับเคส
                            </button>
                          )}
                          {currentUser && job.source === 'firebase' && bucket === 'in_progress' && (
                            <button
                              type="button"
                              disabled={updatingStage}
                              onClick={() => handleJobAction(job, 'complete')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs cursor-pointer border-0"
                            >
                              <CheckCircle2 size={13} />
                              ซ่อมเสร็จ
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openJobDetail(job)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 text-xs font-bold border border-blue-200/70 dark:border-blue-500/30 cursor-pointer"
                          >
                            <Eye size={14} />
                            รายละเอียด
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
              {/* 3-step Stage Timeline */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4">
                {(() => {
                  const bucket = getJobBucket(selectedJob);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-800 dark:text-white">1. แจ้งซ่อมจาก รพ.</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {selectedJob.reportedDate || '-'} {selectedJob.reporterName && selectedJob.reporterName !== '-' ? `• ${selectedJob.reporterName}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm shrink-0 ${
                          bucket !== 'waiting'
                            ? 'bg-blue-600 text-white'
                            : 'bg-amber-400 text-slate-950'
                        }`}>
                          <Wrench size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-800 dark:text-white">2. รับเคส / กำลังซ่อม</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {selectedJob.partnerActivity?.acceptedBy || selectedJob.assignedTech || (bucket === 'waiting' ? 'รอคู่ค้ารับเคส' : 'กำลังดำเนินการ')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm shrink-0 ${
                          bucket === 'completed'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}>
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-800 dark:text-white">3. ซ่อมเสร็จ / ส่งเครื่องจบงาน</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {selectedJob.returnDate || (bucket === 'completed' ? 'เสร็จสิ้น' : 'รอดำเนินการ')}
                            {selectedJob.partnerActivity?.completedBy ? ` • ${selectedJob.partnerActivity.completedBy}` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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

              {/* Partner / Admin Action Form & Status Controls */}
              {currentUser && selectedJob.source === 'firebase' && (
                <div className="rounded-2xl bg-sky-50/70 dark:bg-sky-950/25 border border-sky-200 dark:border-sky-800/50 p-4 space-y-3">
                  <div className="text-xs font-black text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                    <Wrench size={14} />
                    บันทึกการรับเคส / อัปเดตสถานะงานซ่อม (ซิงค์กลับระบบ Local ทันที)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        ชื่อผู้รับเคส / ช่างผู้ดำเนินการ
                      </label>
                      <input
                        type="text"
                        value={operatorInput}
                        onChange={(e) => setOperatorInput(e.target.value)}
                        placeholder="ระบุชื่อช่างหรือเจ้าหน้าที่คู่ค้า..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        หมายเหตุ / สรุปผลการซ่อม
                      </label>
                      <input
                        type="text"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="เช่น เปลี่ยนอะไหล่ / รออะไหล่ / ซ่อมเสร็จพร้อมส่งคืน..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                      />
                    </div>
                  </div>

                  {actionBanner && (
                    <div className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      actionBanner.ok
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                    }`}>
                      {actionBanner.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                      <span>{actionBanner.msg}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={updatingStage}
                      onClick={() => handleJobAction(selectedJob, 'accept')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-45 cursor-pointer border-0 shadow-xs"
                    >
                      <Wrench size={14} />
                      รับเคสซ่อม
                    </button>
                    <button
                      type="button"
                      disabled={updatingStage}
                      onClick={() => handleJobAction(selectedJob, 'waiting_parts')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-45 cursor-pointer border-0 shadow-xs"
                    >
                      <Clock size={14} />
                      รออะไหล่
                    </button>
                    <button
                      type="button"
                      disabled={updatingStage}
                      onClick={() => handleJobAction(selectedJob, 'complete')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-45 cursor-pointer border-0 shadow-xs"
                    >
                      <CheckCircle2 size={14} />
                      ซ่อมเสร็จ / ส่งเครื่องจบงาน
                    </button>
                    <button
                      type="button"
                      disabled={updatingStage}
                      onClick={() => handleJobAction(selectedJob, 'unrepairable')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-45 cursor-pointer border-0 shadow-xs"
                    >
                      <X size={14} />
                      ไม่สามารถซ่อมได้
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 ml-auto">
                  {selectedJob.source === 'firebase' && selectedJob.firebaseNode !== 'partner_repair_cases' && (
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
