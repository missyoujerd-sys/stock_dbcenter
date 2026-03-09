import { RepairRecord } from '../types/repair';
import { db } from '../firebase';
import { ref, set, get, child, remove, update } from 'firebase/database';

export const RepairService = {
  getRepairs: async (): Promise<RepairRecord[]> => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `repairs`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Convert object mapping to array
        return Object.values(data);
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error fetching repairs:", error);
      return [];
    }
  },

  saveRepair: async (repair: Omit<RepairRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<RepairRecord | null> => {
    try {
      const newId = crypto.randomUUID();
      const newRepair: RepairRecord = {
        ...repair,
        id: newId,
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
