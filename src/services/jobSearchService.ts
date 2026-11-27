import { db } from '../firebase';
import { ref, get, update, onValue } from 'firebase/database';
import { RepairService } from './repairService';
import { RepairRecord } from '../types/repair';

export type JobStage = 'receive' | 'complete';
export type JobFilterMode = 'all' | 'receive' | 'complete';
export type JobStatusTab = 'all' | 'waiting' | 'in_progress' | 'completed';
export type JobSearchField = 'all' | 'jobNumber' | 'assetNumber' | 'serialNumber' | 'companyOrReporter';
export type JobSourceMode = 'firebase' | 'api' | 'hybrid';
export type JobActionType = 'accept' | 'waiting_parts' | 'complete' | 'unrepairable' | 'reopen';

export interface PartnerActivity {
  acceptedAt?: string;
  acceptedBy?: string;
  acceptedCompany?: string;
  completedAt?: string;
  completedBy?: string;
  lastNote?: string;
  lastAction?: string;
}

export interface JobRecord {
  id: string;
  jobNumber: string;
  stage: JobStage;
  stageLabel: 'รับเครื่องซ่อม' | 'ส่งเครื่องจบงาน';
  status: string;
  rawStatus?: string;
  statusDetail?: string;
  assetNumber: string;
  serialNumber: string;
  equipmentModel: string;
  problemDescription: string;
  companyName: string;
  reporterName: string;
  reportedDate: string;
  receiverName: string;
  receivedDate: string;
  staffReceiptName: string;
  staffReceiptDate: string;
  returnerName: string;
  returnDate: string;
  isWarranty: boolean;
  source: 'firebase' | 'api';
  firebaseNode?: 'partner_repair_cases' | 'repairs';
  department?: string;
  solution?: string;
  assignedTech?: string;
  serviceType?: string;
  category?: string;
  syncSource?: string;
  syncVersion?: number;
  partnerActivity?: PartnerActivity;
  createdAt: string;
  updatedAt: string;
  raw?: Record<string, any>;
}

export interface JobApiConfig {
  mode: JobSourceMode;
  apiUrl: string;
  searchParam: string;
  typeParam: string;
  receiveValue: string;
  completeValue: string;
  authHeaderName: string;
  authHeaderValue: string;
}

export interface JobAdvancedFilters {
  field: JobSearchField;
  warranty: 'all' | 'in_warranty' | 'out_warranty';
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_JOB_API_CONFIG: JobApiConfig = {
  mode: import.meta.env.VITE_JOB_API_URL ? 'hybrid' : 'firebase',
  apiUrl: import.meta.env.VITE_JOB_API_URL || '',
  searchParam: 'q',
  typeParam: 'type',
  receiveValue: '1',
  completeValue: '2',
  authHeaderName: 'Authorization',
  authHeaderValue: '',
};

const API_CONFIG_PATH = 'settings/jobApiConfig';
const PARTNER_CASES_PATH = 'partner_repair_cases';
const REPAIRS_PATH = 'repairs';

export const PARTNER_STATUS_TH: Record<string, string> = {
  Received: 'รับแจ้งซ่อมแล้ว (รอรับเคส)',
  'Waiting for Inspection': 'รอตรวจสอบ',
  'Under Repair': 'กำลังดำเนินการซ่อม',
  'Waiting for Parts': 'รออะไหล่',
  Completed: 'ซ่อมเสร็จสมบูรณ์',
  Unrepairable: 'ไม่สามารถซ่อมได้',
};

const PARTNER_MATCH_KEYWORDS: Record<string, string[]> = {
  chichang: ['ชิชาง', 'chichang', 'chi chang'],
  canon: ['canon', 'แคนนอน'],
  medica: ['เมดิกา', 'medica'],
  others: ['อื่นๆ', 'other'],
  goodspeed: ['goodspeed', 'กู๊ดสปีด'],
  northern: ['นอร์ทเทิร์น', 'northern'],
  simmaster: ['ซิมมาสเตอร์', 'simmaster', 'sim master'],
  isan: ['isan', 'อีสาน'],
  atp: ['atp', 'เอทีพี'],
  supatchar: ['สุพัชร', 'supatchar'],
  tns: ['tns', 'ทีเอ็นเอส'],
  gnet: ['จีเน็ต', 'g-net', 'gnet'],
  denchai: ['เด่นชัย', 'denchai'],
  gotit: ['ก๊อท อิท', 'ก็อท อิท', 'got it', 'gotit'],
};

const COMPLETED_STATUSES = new Set([
  'ดำเนินการซ่อมแล้ว',
  'สมบูรณ์',
  'กลับมาแล้ว',
  'ส่งคืนหมดประกัน',
  'ส่งคืนค่าซ่อมไม่คุ้ม',
  'completed',
  'complete',
  'unrepairable',
  'ซ่อมเสร็จสมบูรณ์',
  'ไม่สามารถซ่อมได้',
  'finished',
  'done',
  'closed',
  'ส่งเครื่องจบงาน',
  'จบงาน',
]);

export function getJobBucket(job: JobRecord): Exclude<JobStatusTab, 'all'> {
  const raw = (job.rawStatus || job.status || '').trim();
  const lower = raw.toLowerCase();
  if (
    job.stage === 'complete' ||
    COMPLETED_STATUSES.has(raw) ||
    COMPLETED_STATUSES.has(lower)
  ) {
    return 'completed';
  }
  if (
    raw === 'Received' ||
    raw === 'รอดำเนินการ' ||
    lower === 'pending' ||
    lower === 'received'
  ) {
    return 'waiting';
  }
  return 'in_progress';
}

export function matchesPartnerCompany(
  job: JobRecord,
  partnerCompany: { id?: string; name?: string } | null
): boolean {
  if (!partnerCompany) return true;
  const targetText = `${job.companyName || ''} ${job.receiverName || ''} ${job.partnerActivity?.acceptedCompany || ''}`.toLowerCase();
  if (!targetText.trim() || targetText.trim() === '-') return false;

  const keywords = partnerCompany.id ? PARTNER_MATCH_KEYWORDS[partnerCompany.id] : undefined;
  if (keywords && keywords.some((kw) => targetText.includes(kw.toLowerCase()))) {
    return true;
  }

  const cleanName = String(partnerCompany.name || '')
    .replace(/^บริษัท\s*/i, '')
    .replace(/^ร้าน\s*/i, '')
    .trim()
    .toLowerCase();
  if (cleanName && targetText.includes(cleanName)) {
    return true;
  }

  return false;
}

export function classifyJobStage(rawStatus?: string, explicitStage?: string | number, returnDate?: string): JobStage {
  if (explicitStage !== undefined && explicitStage !== null && String(explicitStage).trim() !== '') {
    const norm = String(explicitStage).trim().toLowerCase();
    if (norm === '2' || norm === 'complete' || norm === 'completed' || norm === 'ส่งเครื่องจบงาน' || norm === 'จบงาน') {
      return 'complete';
    }
    if (norm === '1' || norm === 'receive' || norm === 'received' || norm === 'รับเครื่องซ่อม') {
      return 'receive';
    }
  }

  const normalizedStatus = (rawStatus || '').trim().toLowerCase();
  if (COMPLETED_STATUSES.has(normalizedStatus) || COMPLETED_STATUSES.has((rawStatus || '').trim())) {
    return 'complete';
  }
  if (returnDate && returnDate.trim() !== '') {
    return 'complete';
  }
  return 'receive';
}

export function normalizeFirebaseRepair(r: RepairRecord): JobRecord {
  const stage = classifyJobStage(r.status, undefined, r.returnDate);
  const rawStatus = r.status === 'pending' ? 'รอดำเนินการ' : (r.status || 'รอดำเนินการ');
  return {
    id: r.id,
    jobNumber: r.docNumber || r.id,
    stage,
    stageLabel: stage === 'complete' ? 'ส่งเครื่องจบงาน' : 'รับเครื่องซ่อม',
    status: rawStatus,
    rawStatus,
    statusDetail: r.statusDetail || '',
    assetNumber: r.assetNumber || '-',
    serialNumber: r.serialNumber || '-',
    equipmentModel: r.equipmentModel || '-',
    problemDescription: r.problemDescription || '-',
    companyName: r.receiverName || '-',
    reporterName: r.reporterName || '-',
    reportedDate: r.reportedDate || '',
    receiverName: r.receiverName || '-',
    receivedDate: r.receivedDate || '',
    staffReceiptName: r.staffReceiptName || '',
    staffReceiptDate: r.staffReceiptDate || '',
    returnerName: r.returnerName || '',
    returnDate: r.returnDate || '',
    isWarranty: r.isWarranty !== false,
    source: 'firebase',
    firebaseNode: 'repairs',
    syncSource: (r as any).syncSource || '',
    createdAt: r.createdAt || '',
    updatedAt: r.updatedAt || '',
  };
}

export function normalizePartnerRepairCase(c: Record<string, any>, fallbackKey = ''): JobRecord {
  const rawStatus = String(c.status || 'Received').trim() || 'Received';
  const returnDate = String(c.completedDate || '').trim();
  const stage = classifyJobStage(rawStatus, undefined, returnDate);
  const techName = String(c.assignedTech || c.signatures?.technician?.name || '').trim();
  const symptomParts = [String(c.symptom || '').trim(), String(c.symptomDetail || '').trim()].filter(Boolean);

  return {
    id: String(c.id || fallbackKey),
    jobNumber: String(c.caseNo || c.id || fallbackKey),
    stage,
    stageLabel: stage === 'complete' ? 'ส่งเครื่องจบงาน' : 'รับเครื่องซ่อม',
    status: PARTNER_STATUS_TH[rawStatus] || rawStatus,
    rawStatus,
    statusDetail: String(c.solution || c.qcNote || c.partnerActivity?.lastNote || ''),
    assetNumber: String(c.equipmentNo || '-'),
    serialNumber: String(c.serialNumber || '-'),
    equipmentModel: String(c.model || '-'),
    problemDescription: symptomParts.join(' • ') || '-',
    companyName: String(c.company || '-'),
    reporterName: String(c.customerName || c.createdBy || '-'),
    reportedDate: String(c.dateReported || ''),
    receiverName: String(c.signatures?.receiver?.name || c.company || '-'),
    receivedDate: String(c.receivedDate || c.dateReported || ''),
    staffReceiptName: String(c.signatures?.approver?.name || ''),
    staffReceiptDate: returnDate,
    returnerName: techName,
    returnDate,
    isWarranty: String(c.warrantyStatus || '') !== 'Out of Warranty',
    source: 'firebase',
    firebaseNode: 'partner_repair_cases',
    department: String(c.department || ''),
    solution: String(c.solution || ''),
    assignedTech: techName,
    serviceType: String(c.serviceType || 'Repair'),
    category: String(c.category || ''),
    syncSource: String(c.syncSource || ''),
    syncVersion: Number(c.syncVersion || 0),
    partnerActivity: c.partnerActivity && typeof c.partnerActivity === 'object' ? c.partnerActivity : undefined,
    createdAt: String(c.createdAt || ''),
    updatedAt: String(c.updatedAt || c.createdAt || ''),
    raw: c,
  };
}

export function normalizeApiJob(item: Record<string, any>, index: number): JobRecord {
  const statusStr = String(
    item.status ?? item.job_status ?? item.repair_status ?? item.state ?? 'รอดำเนินการ'
  );
  const explicitStage = item.stage ?? item.job_type ?? item.type ?? item.jobType ?? item.mode;
  const returnDate = String(item.returnDate ?? item.return_date ?? item.finish_date ?? item.completed_at ?? '');
  const stage = classifyJobStage(statusStr, explicitStage, returnDate);

  const jobNumber = String(
    item.jobNumber ?? item.job_no ?? item.jop_no ?? item.jop ?? item.docNumber ?? item.doc_no ?? item.code ?? item.id ?? `API-${index + 1}`
  );
  const id = String(item.id ?? item.job_id ?? jobNumber);
  const warrantyRaw = item.isWarranty ?? item.is_warranty ?? item.warranty;
  const isWarranty =
    typeof warrantyRaw === 'boolean'
      ? warrantyRaw
      : !['false', '0', 'no', 'expired', 'หมดประกัน'].includes(String(warrantyRaw || '').toLowerCase());

  return {
    id,
    jobNumber,
    stage,
    stageLabel: stage === 'complete' ? 'ส่งเครื่องจบงาน' : 'รับเครื่องซ่อม',
    status: statusStr,
    rawStatus: statusStr,
    statusDetail: String(item.statusDetail ?? item.status_detail ?? item.remark ?? ''),
    assetNumber: String(item.assetNumber ?? item.asset_no ?? item.asset_id ?? item.asset ?? '-'),
    serialNumber: String(item.serialNumber ?? item.serial_no ?? item.serial ?? item.sn ?? '-'),
    equipmentModel: String(item.equipmentModel ?? item.model ?? item.equipment ?? item.item_name ?? '-'),
    problemDescription: String(item.problemDescription ?? item.problem ?? item.symptom ?? item.detail ?? '-'),
    companyName: String(item.companyName ?? item.company ?? item.vendor ?? item.receiverName ?? item.receiver_name ?? '-'),
    reporterName: String(item.reporterName ?? item.reporter ?? item.requester ?? '-'),
    reportedDate: String(item.reportedDate ?? item.reported_date ?? item.request_date ?? ''),
    receiverName: String(item.receiverName ?? item.receiver_name ?? item.company ?? item.vendor ?? '-'),
    receivedDate: String(item.receivedDate ?? item.received_date ?? item.receive_date ?? ''),
    staffReceiptName: String(item.staffReceiptName ?? item.staff_receipt_name ?? ''),
    staffReceiptDate: String(item.staffReceiptDate ?? item.staff_receipt_date ?? ''),
    returnerName: String(item.returnerName ?? item.returner_name ?? ''),
    returnDate,
    isWarranty,
    source: 'api',
    createdAt: String(item.createdAt ?? item.created_at ?? ''),
    updatedAt: String(item.updatedAt ?? item.updated_at ?? ''),
    raw: item,
  };
}

function extractApiItems(payload: any): Record<string, any>[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['data', 'items', 'jobs', 'results', 'result', 'rows', 'records']) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  if (payload.id || payload.jobNumber || payload.job_no || payload.docNumber || payload.assetNumber) {
    return [payload];
  }
  return [];
}

function sortJobsDesc(jobs: JobRecord[]): JobRecord[] {
  return [...jobs].sort((a, b) => {
    const ta = new Date(a.updatedAt || a.createdAt || a.receivedDate || a.reportedDate || 0).getTime();
    const tb = new Date(b.updatedAt || b.createdAt || b.receivedDate || b.reportedDate || 0).getTime();
    return tb - ta;
  });
}

export function matchesJobFilter(
  job: JobRecord,
  keyword: string,
  mode: JobFilterMode,
  advanced?: JobAdvancedFilters
): boolean {
  if (mode !== 'all' && job.stage !== mode) {
    return false;
  }

  if (advanced) {
    if (advanced.warranty === 'in_warranty' && !job.isWarranty) return false;
    if (advanced.warranty === 'out_warranty' && job.isWarranty) return false;

    const jobDate = (job.receivedDate || job.reportedDate || job.createdAt || '').slice(0, 10);
    if (advanced.dateFrom && (!jobDate || jobDate < advanced.dateFrom)) return false;
    if (advanced.dateTo && (!jobDate || jobDate > advanced.dateTo)) return false;
  }

  const term = keyword.trim().replace(/^#/, '').toLowerCase();
  if (!term) return true;

  const field = advanced?.field || 'all';
  if (field === 'jobNumber') {
    return job.jobNumber.toLowerCase().includes(term) || job.id.toLowerCase().includes(term);
  }
  if (field === 'assetNumber') {
    return job.assetNumber.toLowerCase().includes(term);
  }
  if (field === 'serialNumber') {
    return job.serialNumber.toLowerCase().includes(term);
  }
  if (field === 'companyOrReporter') {
    return (
      job.companyName.toLowerCase().includes(term) ||
      job.receiverName.toLowerCase().includes(term) ||
      job.reporterName.toLowerCase().includes(term)
    );
  }

  return [
    job.id,
    job.jobNumber,
    job.assetNumber,
    job.serialNumber,
    job.equipmentModel,
    job.problemDescription,
    job.companyName,
    job.reporterName,
    job.receiverName,
    job.status,
    job.rawStatus || '',
    job.department || '',
    job.stageLabel,
  ].some((val) => (val || '').toLowerCase().includes(term));
}

function getTodayLocalIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
}

export const JobSearchService = {
  async getApiConfig(): Promise<JobApiConfig> {
    try {
      const snap = await get(ref(db, API_CONFIG_PATH));
      if (snap.exists()) {
        return { ...DEFAULT_JOB_API_CONFIG, ...snap.val() };
      }
    } catch (err) {
      console.warn('Could not load jobApiConfig from Firebase:', err);
    }
    return DEFAULT_JOB_API_CONFIG;
  },

  async saveApiConfig(config: JobApiConfig): Promise<void> {
    await update(ref(db, API_CONFIG_PATH), config);
  },

  async fetchExternalJobs(config: JobApiConfig, queryText = '', mode: JobFilterMode = 'all'): Promise<JobRecord[]> {
    const baseUrl = (config.apiUrl || '').trim();
    if (!baseUrl) return [];

    const url = new URL(baseUrl, window.location.origin);
    if (queryText.trim()) {
      url.searchParams.set(config.searchParam || 'q', queryText.trim());
    }
    if (mode === 'receive') {
      url.searchParams.set(config.typeParam || 'type', config.receiveValue || '1');
    } else if (mode === 'complete') {
      url.searchParams.set(config.typeParam || 'type', config.completeValue || '2');
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (config.authHeaderValue?.trim() && config.authHeaderName?.trim()) {
      headers[config.authHeaderName.trim()] = config.authHeaderValue.trim();
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(url.toString(), { headers, signal: controller.signal });
      if (!res.ok) {
        throw new Error(`API HTTP ${res.status}`);
      }
      const json = await res.json();
      return extractApiItems(json).map(normalizeApiJob);
    } finally {
      clearTimeout(timer);
    }
  },

  async fetchPartnerRepairCases(): Promise<JobRecord[]> {
    const snap = await get(ref(db, PARTNER_CASES_PATH));
    if (!snap.exists()) return [];
    const data = snap.val() || {};
    return Object.entries(data)
      .filter(([, val]) => val && typeof val === 'object')
      .map(([key, val]) => normalizePartnerRepairCase(val as Record<string, any>, key));
  },

  subscribeFirebaseJobs(
    onUpdate: (jobs: JobRecord[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    let partnerCases: JobRecord[] = [];
    let repairCases: JobRecord[] = [];
    let partnerReady = false;
    let repairsReady = false;

    const emitMerged = () => {
      if (!partnerReady && !repairsReady) return;
      onUpdate(sortJobsDesc([...partnerCases, ...repairCases]));
    };

    const unsubPartner = onValue(
      ref(db, PARTNER_CASES_PATH),
      (snap) => {
        partnerReady = true;
        if (snap.exists()) {
          const val = snap.val() || {};
          partnerCases = Object.entries(val)
            .filter(([, item]) => item && typeof item === 'object')
            .map(([key, item]) => normalizePartnerRepairCase(item as Record<string, any>, key));
        } else {
          partnerCases = [];
        }
        emitMerged();
      },
      (err) => {
        onError?.(err);
      }
    );

    const unsubRepairs = onValue(
      ref(db, REPAIRS_PATH),
      (snap) => {
        repairsReady = true;
        if (snap.exists()) {
          const val = snap.val() || {};
          repairCases = Object.values(val)
            .filter((item) => item && typeof item === 'object')
            .map((item) => normalizeFirebaseRepair(item as RepairRecord));
        } else {
          repairCases = [];
        }
        emitMerged();
      },
      (err) => {
        onError?.(err);
      }
    );

    return () => {
      unsubPartner();
      unsubRepairs();
    };
  },

  async fetchAllJobs(config?: JobApiConfig, queryText = '', mode: JobFilterMode = 'all'): Promise<{
    jobs: JobRecord[];
    apiError: string | null;
    sourcesUsed: ('firebase' | 'api')[];
  }> {
    const activeConfig = config || (await this.getApiConfig());
    const jobs: JobRecord[] = [];
    const sourcesUsed: ('firebase' | 'api')[] = [];
    let apiError: string | null = null;

    if (activeConfig.mode === 'firebase' || activeConfig.mode === 'hybrid') {
      const [partnerJobs, repairs] = await Promise.all([
        this.fetchPartnerRepairCases().catch(() => []),
        RepairService.getRepairs().catch(() => []),
      ]);
      jobs.push(...partnerJobs, ...repairs.map(normalizeFirebaseRepair));
      sourcesUsed.push('firebase');
    }

    if ((activeConfig.mode === 'api' || activeConfig.mode === 'hybrid') && activeConfig.apiUrl?.trim()) {
      try {
        const apiJobs = await this.fetchExternalJobs(activeConfig, queryText, mode);
        jobs.push(...apiJobs);
        sourcesUsed.push('api');
      } catch (err: any) {
        apiError = err?.message || 'เชื่อมต่อ API ภายนอกไม่สำเร็จ';
      }
    }

    return { jobs: sortJobsDesc(jobs), apiError, sourcesUsed };
  },

  async updateFirebaseJobAction(
    job: JobRecord,
    action: JobActionType,
    opts?: { operatorName?: string; companyName?: string; note?: string }
  ): Promise<void> {
    const now = new Date().toISOString();
    const today = getTodayLocalIso();
    const operatorName = (opts?.operatorName || '').trim();
    const companyName = (opts?.companyName || '').trim();
    const note = (opts?.note || '').trim();

    if (job.firebaseNode === 'partner_repair_cases') {
      const prevAct = job.partnerActivity || {};
      const nextVersion = (job.syncVersion || 0) + 1;
      const updates: Record<string, any> = {
        syncSource: 'vercel',
        syncVersion: nextVersion,
        updatedAt: now,
        updatedBy: operatorName || companyName || 'vercel',
      };

      if (action === 'accept') {
        updates.status = 'Under Repair';
        updates.receivedDate = job.receivedDate || today;
        if (operatorName) updates.assignedTech = operatorName;
        updates.partnerActivity = {
          ...prevAct,
          acceptedAt: prevAct.acceptedAt || now,
          acceptedBy: operatorName || prevAct.acceptedBy || companyName || 'Partner',
          acceptedCompany: companyName || prevAct.acceptedCompany || job.companyName || '',
          lastAction: 'accept',
          ...(note ? { lastNote: note } : {}),
        };
      } else if (action === 'waiting_parts') {
        updates.status = 'Waiting for Parts';
        if (operatorName) updates.assignedTech = operatorName;
        updates.partnerActivity = {
          ...prevAct,
          acceptedAt: prevAct.acceptedAt || now,
          acceptedBy: prevAct.acceptedBy || operatorName || companyName || 'Partner',
          acceptedCompany: companyName || prevAct.acceptedCompany || job.companyName || '',
          lastAction: 'waiting_parts',
          ...(note ? { lastNote: note } : {}),
        };
      } else if (action === 'complete') {
        updates.status = 'Completed';
        updates.completedDate = today;
        if (operatorName) {
          updates.assignedTech = operatorName;
          updates['signatures/technician/name'] = operatorName;
        }
        if (note) updates.solution = note;
        updates.partnerActivity = {
          ...prevAct,
          acceptedAt: prevAct.acceptedAt || now,
          acceptedBy: prevAct.acceptedBy || operatorName || companyName || 'Partner',
          acceptedCompany: companyName || prevAct.acceptedCompany || job.companyName || '',
          completedAt: now,
          completedBy: operatorName || companyName || prevAct.acceptedBy || 'Partner',
          lastAction: 'complete',
          ...(note ? { lastNote: note } : {}),
        };
      } else if (action === 'unrepairable') {
        updates.status = 'Unrepairable';
        updates.completedDate = today;
        if (operatorName) updates.assignedTech = operatorName;
        if (note) updates.solution = note;
        updates.partnerActivity = {
          ...prevAct,
          acceptedAt: prevAct.acceptedAt || now,
          acceptedBy: prevAct.acceptedBy || operatorName || companyName || 'Partner',
          acceptedCompany: companyName || prevAct.acceptedCompany || job.companyName || '',
          completedAt: now,
          completedBy: operatorName || companyName || prevAct.acceptedBy || 'Partner',
          lastAction: 'unrepairable',
          ...(note ? { lastNote: note } : {}),
        };
      } else if (action === 'reopen') {
        updates.status = 'Under Repair';
        updates.completedDate = '';
        updates.partnerActivity = {
          ...prevAct,
          completedAt: '',
          completedBy: '',
          lastAction: 'reopen',
          ...(note ? { lastNote: note } : {}),
        };
      }

      await update(ref(db, `${PARTNER_CASES_PATH}/${job.id}`), updates);
      return;
    }

    // Standard repairs node
    const repairUpdates: Record<string, any> = {
      syncSource: 'vercel',
      updatedAt: now,
    };

    if (action === 'accept' || action === 'reopen') {
      repairUpdates.status = 'การซ่อมแซม';
      repairUpdates.receivedDate = job.receivedDate || today;
      repairUpdates.returnDate = '';
      if (operatorName) repairUpdates.receiverName = operatorName;
      if (note) repairUpdates.statusDetail = note;
    } else if (action === 'waiting_parts') {
      repairUpdates.status = 'การซ่อมแซม';
      if (note) repairUpdates.statusDetail = `รออะไหล่: ${note}`;
    } else if (action === 'complete') {
      repairUpdates.status = 'ดำเนินการซ่อมแล้ว';
      repairUpdates.returnDate = today;
      if (operatorName) repairUpdates.returnerName = operatorName;
      if (note) repairUpdates.statusDetail = note;
    } else if (action === 'unrepairable') {
      repairUpdates.status = 'ส่งคืนค่าซ่อมไม่คุ้ม';
      repairUpdates.returnDate = today;
      if (operatorName) repairUpdates.returnerName = operatorName;
      if (note) repairUpdates.statusDetail = note;
    }

    await RepairService.updateRepair(job.id, repairUpdates as Partial<RepairRecord>);
  },

  async updateFirebaseJobStage(jobId: string, nextStage: JobStage, operatorName?: string): Promise<void> {
    const today = getTodayLocalIso();
    if (nextStage === 'complete') {
      await RepairService.updateRepair(jobId, {
        status: 'ดำเนินการซ่อมแล้ว',
        returnDate: today,
        syncSource: 'vercel',
        ...(operatorName ? { returnerName: operatorName } : {}),
      } as Partial<RepairRecord>);
    } else {
      await RepairService.updateRepair(jobId, {
        status: 'การซ่อมแซม',
        returnDate: '',
        syncSource: 'vercel',
      } as Partial<RepairRecord>);
    }
  },
};
