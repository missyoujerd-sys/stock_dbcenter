import { db } from '../firebase';
import { ref, push, set, get, child, remove, update } from 'firebase/database';
import { RepairRecord } from '../types/repair';

const REPAIRS_PATH = 'repairs';

export const RepairService = {
  async saveRepair(data: Omit<RepairRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const repairsRef = ref(db, REPAIRS_PATH);
    const newRef = push(repairsRef);
    const now = new Date().toISOString();
    
    const record: RepairRecord = {
      ...data,
      id: newRef.key as string,
      createdAt: now,
      updatedAt: now
    };
    
    await set(newRef, record);
    return record.id;
  },
  
  async updateRepair(id: string, data: Partial<RepairRecord>): Promise<void> {
    const repairRef = ref(db, `${REPAIRS_PATH}/${id}`);
    const now = new Date().toISOString();
    
    await update(repairRef, {
      ...data,
      updatedAt: now
    });
  },
  
  async getRepairs(): Promise<RepairRecord[]> {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, REPAIRS_PATH));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data) as RepairRecord[];
    }
    return [];
  },
  
  async getRepairById(id: string): Promise<RepairRecord | null> {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `${REPAIRS_PATH}/${id}`));
    if (snapshot.exists()) {
      return snapshot.val() as RepairRecord;
    }
    return null;
  },
  
  async deleteRepair(id: string): Promise<void> {
    const repairRef = ref(db, `${REPAIRS_PATH}/${id}`);
    await remove(repairRef);
  }
};
