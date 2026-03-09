export type RepairStatus = 'pending' | 'repairing' | 'completed' | 'returned';

export interface RepairRecord {
  id: string;
  equipmentModel: string;
  assetNumber: string;
  serialNumber: string;
  problemDescription: string;
  
  // Reported by
  reporterName: string;
  reportedDate: string;
  
  // Received for repair
  receiverName: string;
  receivedDate: string;
  
  // Staff who received repaired device
  staffReceiptName: string;
  staffReceiptDate: string;
  
  // Person who returned the device
  returnerName: string;
  returnDate: string;
  
  // Warranty status
  isWarranty: boolean;
  
  status: RepairStatus;
  createdAt: string;
  updatedAt: string;
}
