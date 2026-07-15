export type RepairStatus = 'รอดำเนินการ' | 'การซ่อมแซม' | 'ดำเนินการซ่อมแล้ว' | 'ส่งคืนหมดประกัน' | 'ส่งคืนค่าซ่อมไม่คุ้ม' | 'อื่นๆ' | 'สมบูรณ์' | 'กลับมาแล้ว' | 'pending';

export interface RepairRecord {
  id: string;
  docNumber?: string;
  assetNumber: string;
  equipmentModel: string;
  serialNumber: string;
  problemDescription: string;
  
  reporterName: string;
  reportedDate: string;
  reporterSignature: string;
  
  receiverName: string;
  receivedDate: string;
  receiverSignature: string;
  
  staffReceiptName: string;
  staffReceiptDate: string;
  staffReceiptSignature: string;
  
  returnerName: string;
  returnDate: string;
  returnerSignature: string;
  
  isWarranty: boolean;
  status: RepairStatus;
  statusDetail: string;
  
  createdAt: string;
  updatedAt: string;
}
