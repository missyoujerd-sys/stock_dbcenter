import { RepairRecord } from '../types/repair';

const STORAGE_KEY = 'stock_guaranteed_repairs';

export const RepairService = {
  getRepairs: (): RepairRecord[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveRepair: (repair: Omit<RepairRecord, 'id' | 'createdAt' | 'updatedAt'>): RepairRecord => {
    const repairs = RepairService.getRepairs();
    const newRepair: RepairRecord = {
      ...repair,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    repairs.push(newRepair);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repairs));
    return newRepair;
  },

  updateRepair: (id: string, updates: Partial<RepairRecord>): RepairRecord | null => {
    const repairs = RepairService.getRepairs();
    const index = repairs.findIndex(r => r.id === id);
    if (index === -1) return null;

    const updatedRepair: RepairRecord = {
      ...repairs[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    repairs[index] = updatedRepair;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repairs));
    return updatedRepair;
  },

  getRepairById: (id: string): RepairRecord | undefined => {
    return RepairService.getRepairs().find(r => r.id === id);
  },

  deleteRepair: (id: string): void => {
    const repairs = RepairService.getRepairs().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repairs));
  }
};
