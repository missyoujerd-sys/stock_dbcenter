import { db } from '../firebase';
import { ref, push, set, get, child } from 'firebase/database';

const EXTERNAL_REPAIRS_PATH = 'external_repairs';

/**
 * สร้างเลขที่ใบรับซ่อม: EXT-YYYYMMDD-XXXX
 */
async function generateDocNumber() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate());

  // ดึงเลขล่าสุดของวันนี้
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, EXTERNAL_REPAIRS_PATH));
  let maxSeq = 0;
  if (snapshot.exists()) {
    const data = snapshot.val();
    Object.values(data).forEach((record) => {
      if (record.docNumber && record.docNumber.startsWith(`EXT-${dateStr}-`)) {
        const parts = record.docNumber.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });
  }

  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `EXT-${dateStr}-${nextSeq}`;
}

export const ExternalRepairService = {
  async saveExternalRepair(data) {
    const repairsRef = ref(db, EXTERNAL_REPAIRS_PATH);
    const newRef = push(repairsRef);
    const now = new Date().toISOString();
    const docNumber = await generateDocNumber();

    const record = {
      ...data,
      id: newRef.key,
      docNumber,
      createdAt: now,
      updatedAt: now,
    };

    await set(newRef, record);
    return record;
  },

  async getExternalRepairs() {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, EXTERNAL_REPAIRS_PATH));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
    return [];
  },

  async getExternalRepairById(id) {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `${EXTERNAL_REPAIRS_PATH}/${id}`));
    if (snapshot.exists()) return snapshot.val();
    return null;
  },
};
