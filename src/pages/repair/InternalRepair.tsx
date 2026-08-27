import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Monitor, 
  FileText, 
  History, 
  FileSignature, 
  MonitorOff, 
  Save, 
  Upload, 
  ChevronRight 
} from 'lucide-react';

const InternalRepair = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('request'); // 'list', 'history', 'request'
  const [repairData, setRepairData] = useState({
    category: 'ครุภัณฑ์',
    equipmentId: '',
    itemName: '',
    reason: '',
    file: null as File | null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRepairData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRepairData(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    alert('บันทึกข้อมูลสำเร็จ (Demo)');
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
            {activeTab === 'request' && 'เสนอขอซ่อม'}
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

              {/* Submit Button */}
              <div className="pt-4">
                <button 
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-8 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2"
                >
                  บันทึกข้อมูล
                </button>
              </div>

            </form>
          )}

          {activeTab === 'list' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <FileText className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-lg font-medium">ยังไม่มีรายการแจ้งซ่อม</p>
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
