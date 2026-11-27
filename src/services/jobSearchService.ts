import { db } from '../firebase';
import { ref, get, update } from 'firebase/database';
import { RepairService } from './repairService';
import { RepairRecord } from '../types/repair';

export type JobStage = 'receive' | 'complete';
export type JobFilterMode = 'all' | 'receive' | 'complete';
export type JobSearchField = 'all' | 'jobNumber' | 'assetNumber' | 'serialNumber' | 'companyOrReporter';
export type JobSourceMode = 'firebase' | 'api' | 'hybrid';

export interface JobRecord {
  id: string;
  jobNumber: string;
  stage: JobStage;
  stageLabel: 'รับเครื่องซ่อม' | 'ส่งเครื่องจบงาน';
  status: string;
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

const COMPLETED_STATUSES = new Set([
  'ดำเนินการซ่อมแล้ว',
  'สมบูรณ์',
  'กลับมาแล้ว',
  'ส่งคืนหมดประกัน',
  'ส่งคืนค่าซ่อมไม่คุ้ม',
  'completed',
  'complete',
  'finished',
  'done',
  'closed',
  'ส่งเครื่องจบงาน',
  'จบงาน',
]);

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
  return {
    id: r.id,
    jobNumber: r.docNumber || r.id,
    stage,
    stageLabel: stage === 'complete' ? 'ส่งเครื่องจบงาน' : 'รับเครื่องซ่อม',
    status: r.status === 'pending' ? 'รอดำเนินการ' : (r.status || 'รอดำเนินการ'),
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
    createdAt: r.createdAt || '',
    updatedAt: r.updatedAt || '',
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

  const term = keyword.trim().toLowerCase();
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
    job.stageLabel,
  ].some((val) => (val || '').toLowerCase().includes(term));
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
      const repairs = await RepairService.getRepairs();
      jobs.push(...repairs.map(normalizeFirebaseRepair));
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

    jobs.sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || a.receivedDate || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || b.receivedDate || 0).getTime();
      return tb - ta;
    });

    return { jobs, apiError, sourcesUsed };
  },

  async updateFirebaseJobStage(jobId: string, nextStage: JobStage, operatorName?: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    if (nextStage === 'complete') {
      await RepairService.updateRepair(jobId, {
        status: 'ดำเนินการซ่อมแล้ว',
        returnDate: today,
        ...(operatorName ? { returnerName: operatorName } : {}),
      });
    } else {
      await RepairService.updateRepair(jobId, {
        status: 'การซ่อมแซม',
        returnDate: '',
      });
    }
  },
};
