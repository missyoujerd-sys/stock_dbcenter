import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { ref, push, onValue, remove, update, serverTimestamp } from 'firebase/database';
import { 
  Monitor, 
  FileText, 
  History, 
  FileSignature, 
  MonitorOff, 
  Save, 
  Upload, 
  ChevronRight,
  Trash2,
  Edit,
  X
} from 'lucide-react';

const InternalRepair = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('request'); // 'list', 'history', 'request'
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);

  const [repairData, setRepairData] = useState({
    category: 'ครุภัณฑ์',
    equipmentId: '',
    itemName: '',
    reason: '',
    status: 'Pending',
    file: null as File | null
  });

  useEffect(() => {
    const repairsRef = ref(db, 'internal_repairs');
    const unsubscribe = onValue(repairsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedRepairs: any[] = [];
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          loadedRepairs.push({ id: key, ...(value as any) });
        });
      }
      loadedRepairs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRepairs(loadedRepairs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRepairData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRepairData(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        const repairRef = ref(db, `internal_repairs/${editId}`);
        await update(repairRef, {
          category: repairData.category,
          equipmentId: repairData.equipmentId,
          itemName: repairData.itemName,
          reason: repairData.reason,
          status: repairData.status,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.email || 'Unknown'
        });
        alert('แก้ไขข้อมูลสำเร็จ');
      } else {
        const repairsRef = ref(db, 'internal_repairs');
        await push(repairsRef, {
          category: repairData.category,
          equipmentId: repairData.equipmentId,
          itemName: repairData.itemName,
          reason: repairData.reason,
          status: 'Pending',
          requester: currentUser?.name || currentUser?.email || 'นายแพทย์ / เจ้าหน้าที่',
          createdAt: serverTimestamp()
        });
        alert('บันทึกข้อมูลสำเร็จ');
      }
      
      setRepairData({
        category: 'ครุภัณฑ์',
        equipmentId: '',
        itemName: '',
        reason: '',
        status: 'Pending',
        file: null
      });
      setEditId(null);
      setActiveTab('list');
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleEdit = (repair: any) => {
    setRepairData({
      category: repair.category || 'ครุภัณฑ์',
      equipmentId: repair.equipmentId || '',
      itemName: repair.itemName || '',
      reason: repair.reason || '',
      status: repair.status || 'Pending',
      file: null
    });
    setEditId(repair.id);
    setActiveTab('request');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      try {
        await remove(ref(db, `internal_repairs/${id}`));
      } catch (error: any) {
        alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
      }
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-900 font-['Prompt'] p-4 gap-6">
      
      {/* Sidebar Navigation */}
      <div className="w-64 shrink-0 flex flex-col">
        <div className="bg-white dark:bg-[#1a1c23] rounded-2xl overflow-hidden shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-slate-800 dark:text-slate-200 font-semibold text-lg flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              เมนูระบบแจ้งซ่อม
            </h2>
          </div>
          
          <div className="p-3 flex flex-col gap-1.5">
            <button 
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'list' 
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-slate-200'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border-2 ${activeTab === 'list' ? 'bg-white border-white' : 'border-slate-400 dark:border-slate-500'}`}></div>
              <span className="font-medium text-sm">รายการแจ้งซ่อม</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'history' 
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-slate-200'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border-2 ${activeTab === 'history' ? 'bg-white border-white' : 'border-slate-400 dark:border-slate-500'}`}></div>
              <span className="font-medium text-sm">ประวัติแจ้งซ่อม</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('request')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'request' 
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-slate-200'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border-2 ${activeTab === 'request' ? 'bg-white border-white' : 'border-slate-400 dark:border-slate-500'}`}></div>
              <span className="font-medium text-sm">เสนอขอซ่อม</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        {/* Breadcrumb Header */}
        <div className="bg-pink-50/50 dark:bg-slate-800/50 border-b border-pink-100 dark:border-slate-700 px-6 py-4 flex items-center gap-2">
          <MonitorOff className="text-slate-500 dark:text-slate-400 w-5 h-5" />
          <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm">ระบบแจ้งซ่อม</span>
          <ChevronRight className="text-slate-400 w-4 h-4" />
          <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
            {activeTab === 'list' && 'รายการแจ้งซ่อม'}
            {activeTab === 'history' && 'ประวัติแจ้งซ่อม'}
            {activeTab === 'request' && (editId ? 'แก้ไขการแจ้งซ่อม' : 'เสนอขอซ่อม')}
          </span>
        </div>

        {/* Dynamic Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'request' && (
            <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
              
              {/* Requester Info */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  ผู้ขอแจ้งซ่อม:
                </label>
                <div className="bg-slate-100 dark:bg-slate-700/50 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-medium">
                  {currentUser?.name || currentUser?.email || 'นายแพทย์ / เจ้าหน้าที่'}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    ประเภทการแจ้งซ่อม <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="category"
                    value={repairData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                  >
                    <option value="ครุภัณฑ์">ครุภัณฑ์</option>
                    <option value="คอมพิวเตอร์">คอมพิวเตอร์</option>
                    <option value="ปริ้นเตอร์">ปริ้นเตอร์</option>
                    <option value="ระบบเครือข่าย (Network)">ระบบเครือข่าย (Network)</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    เลขที่ครุภัณฑ์
                  </label>
                  <input 
                    type="text" 
                    name="equipmentId"
                    value={repairData.equipmentId}
                    onChange={handleInputChange}
                    placeholder="เลขที่ครุภัณฑ์"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  ชื่อรายการ <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="itemName"
                  value={repairData.itemName}
                  onChange={handleInputChange}
                  required
                  placeholder="ชื่อรายการ"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  สาเหตุที่ส่งซ่อม <span className="text-red-500">*</span>
                </label>
                <textarea 
                  name="reason"
                  value={repairData.reason}
                  onChange={handleInputChange}
                  required
                  placeholder="สาเหตุที่ส่งซ่อม"
                  rows={4}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm resize-none"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  เอกสาร/รูปภาพ ประกอบการแจ้งซ่อม (ถ้ามี)
                </label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300">
                    Choose File
                    <input type="file" className="hidden" onChange={handleFileChange} />
                  </label>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {repairData.file ? repairData.file.name : 'No file chosen'}
                  </span>
                </div>
              </div>

              {isAdmin && editId && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    สถานะการซ่อม <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="status"
                    value={repairData.status}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                  >
                    <option value="Pending">รอตรวจสอบ</option>
                    <option value="In Progress">กำลังดำเนินการ</option>
                    <option value="Completed">ซ่อมเสร็จแล้ว</option>
                    <option value="Cancelled">ยกเลิก</option>
                  </select>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-8 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2"
                >
                  {editId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                </button>
                {editId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditId(null);
                      setRepairData({
                        category: 'ครุภัณฑ์',
                        equipmentId: '',
                        itemName: '',
                        reason: '',
                        status: 'Pending',
                        file: null
                      });
                      setActiveTab('list');
                    }}
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-8 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>

            </form>
          )}

          {activeTab === 'list' && (
            <div className="h-full">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-medium">กำลังโหลดข้อมูล...</p>
                </div>
              ) : repairs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <FileText className="w-16 h-16 mb-4 text-slate-300" />
                  <p className="text-lg font-medium">ยังไม่มีรายการแจ้งซ่อม</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300">
                        <th className="px-4 py-3 font-semibold">วันที่</th>
                        <th className="px-4 py-3 font-semibold">ผู้แจ้ง</th>
                        <th className="px-4 py-3 font-semibold">รายการ</th>
                        <th className="px-4 py-3 font-semibold">สาเหตุ</th>
                        <th className="px-4 py-3 font-semibold">สถานะ</th>
                        {isAdmin && <th className="px-4 py-3 font-semibold text-right">จัดการ</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {repairs.map(repair => (
                        <tr key={repair.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {repair.createdAt ? new Date(repair.createdAt).toLocaleDateString('th-TH') : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200">{repair.requester}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                            {repair.itemName}
                            {repair.equipmentId && <div className="text-xs text-slate-500 font-normal mt-0.5">{repair.equipmentId}</div>}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{repair.reason}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              repair.status === 'Completed' 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                                : repair.status === 'In Progress' 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                                : repair.status === 'Cancelled'
                                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                            }`}>
                              {repair.status === 'Pending' ? 'รอตรวจสอบ' : repair.status === 'In Progress' ? 'กำลังดำเนินการ' : repair.status === 'Completed' ? 'ซ่อมเสร็จแล้ว' : repair.status === 'Cancelled' ? 'ยกเลิก' : repair.status}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => handleEdit(repair)} className="text-blue-500 hover:text-blue-700 mr-3 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="แก้ไข">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDelete(repair.id)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors" title="ลบ">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <History className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-lg font-medium">ยังไม่มีประวัติการแจ้งซ่อม</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default InternalRepair;
