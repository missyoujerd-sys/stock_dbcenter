export type RepairStatus = 'รอดำเนินการ' | 'การซ่อมแซม' | 'สมบูรณ์' | 'กลับมาแล้ว' | 'ดำเนินการซ่อมแล้ว' | 'ส่งคืนหมดประกัน' | 'ส่งคืนค่าซ่อมไม่คุ้ม' | 'อื่นๆ';

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
  statusDetail?: string;
  createdAt: string;
  updatedAt: string;
}
