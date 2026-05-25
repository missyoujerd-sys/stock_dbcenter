import { RepairRecord } from '../types/repair';
import { db } from '../firebase';
import { ref, set, get, child, remove, update } from 'firebase/database';

// ─── สร้างเลขเอกสารอัตโนมัติ ───────────────────────────────────────────────
// Format มีประกัน:  WR-{พ.ศ.}-{4หลัก}   เช่น WR-2569-0042
// Format หมดประกัน: NW-{พ.ศ.}-{4หลัก}   เช่น NW-2569-0013
// ─────────────────────────────────────────────────────────────────────────────
async function generateDocNumber(isWarranty: boolean): Promise<string> {
  const thaiYear = new Date().getFullYear() + 543;
  const prefix = isWarranty ? 'WR' : 'NW';
  const counterKey = `counters/repair_${prefix}_${thaiYear}`;

  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, counterKey));
  const current = snapshot.exists() ? (snapshot.val() as number) : 0;
  const next = current + 1;

  // Save back incremented counter
  await set(ref(db, counterKey), next);

  const seq = String(next).padStart(4, '0');
  return `${prefix}-${thaiYear}-${seq}`;
}

export const RepairService = {
  getRepairs: async (): Promise<RepairRecord[]> => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `repairs`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.values(data);
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error fetching repairs:", error);
      return [];
    }
  },

  saveRepair: async (repair: Omit<RepairRecord, 'id' | 'createdAt' | 'updatedAt' | 'docNumber'>): Promise<RepairRecord | null> => {
    try {
      const newId = crypto.randomUUID();
      const docNumber = await generateDocNumber(repair.isWarranty);

      const newRepair: RepairRecord = {
        ...repair,
        id: newId,
        docNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(ref(db, `repairs/${newId}`), newRepair);
      return newRepair;
    } catch (error) {
      console.error("Error saving repair:", error);
      throw error;
    }
  },

  updateRepair: async (id: string, updates: Partial<RepairRecord>): Promise<RepairRecord | null> => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `repairs/${id}`));
      
      if (!snapshot.exists()) return null;

      const currentData = snapshot.val();
      const updatedRepair: RepairRecord = {
        ...currentData,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await update(ref(db, `repairs/${id}`), updatedRepair);
      return updatedRepair;
    } catch (error) {
       console.error("Error updating repair:", error);
       throw error;
    }
  },

  getRepairById: async (id: string): Promise<RepairRecord | null> => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `repairs/${id}`));
      if (snapshot.exists()) {
        return snapshot.val() as RepairRecord;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching repair by ID:", error);
      return null;
    }
  },

  deleteRepair: async (id: string): Promise<void> => {
    try {
      await remove(ref(db, `repairs/${id}`));
    } catch (error) {
      console.error("Error deleting repair:", error);
      throw error;
    }
  }
};
