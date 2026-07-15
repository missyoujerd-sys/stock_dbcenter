import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  Database,
  Eye,
  Printer,
  Plus,
  Trash2,
  Pencil,
  ArrowLeft
} from 'lucide-react';
import { RepairService } from '../../services/repairService';
import { RepairRecord, RepairStatus } from '../../types/repair';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';


export default function RepairDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'all'>('all');
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, isAdmin, isAdmin_2 } = useAuth();

  useEffect(() => {
    const fetchRepairs = async () => {
      setLoading(true);
      try {
        const data = await RepairService.getRepairs();
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRepairs(data);
      } catch (error) {
        console.error("Failed to fetch repairs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRepairs();
  }, []);


  const stats = useMemo(() => {
    return {
      total: repairs.length,
      repairing: repairs.filter(r => r.status === 'การซ่อมแซม' || r.status === 'รอดำเนินการ').length,
      completed: repairs.filter(r => r.status === 'สมบูรณ์' || r.status === 'กลับมาแล้ว').length,
    };
  }, [repairs]);

  const filteredRepairs = useMemo(() => {
    return repairs.filter(r => {
      const matchesSearch = 
        r.equipmentModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.docNumber && r.docNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [repairs, searchTerm, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!isAdmin_2) {
      alert('ลบได้เฉพาะ Admin เท่านั้น');
      return;
    }
    if (window.confirm('คุณต้องการลบข้อมูลการซ่อมนี้ใช่หรือไม่?')) {
      try {
        await RepairService.deleteRepair(id);
        setRepairs(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        console.error("Failed to delete repair:", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  const getStatusBadge = (status: RepairStatus) => {
    const styles: Record<string, string> = {
      'รอดำเนินการ': 'bg-amber-50 text-amber-700 border-amber-200/60 shadow-inner',
      'การซ่อมแซม': 'bg-blue-50 text-blue-700 border-blue-200/60 shadow-inner',
      'สมบูรณ์': 'bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-inner',
      'กลับมาแล้ว': 'bg-slate-50 text-slate-600 border-slate-200/60 shadow-inner',
      'ดำเนินการซ่อมแล้ว': 'bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-inner',
      'ส่งคืนหมดประกัน': 'bg-rose-50 text-rose-700 border-rose-200/60 shadow-inner',
      'ส่งคืนค่าซ่อมไม่คุ้ม': 'bg-rose-50 text-rose-700 border-rose-200/60 shadow-inner',
      'อื่นๆ': 'bg-purple-50 text-purple-700 border-purple-200/60 shadow-inner',
      pending: 'bg-amber-50 text-amber-700 border-amber-200/60 shadow-inner',
    };
    
    const dotColors: Record<string, string> = {
      'รอดำเนินการ': 'bg-amber-500',
      'การซ่อมแซม': 'bg-blue-500',
      'สมบูรณ์': 'bg-emerald-500',
      'กลับมาแล้ว': 'bg-slate-400',
      'ดำเนินการซ่อมแล้ว': 'bg-emerald-500',
      'ส่งคืนหมดประกัน': 'bg-rose-500',
      'ส่งคืนค่าซ่อมไม่คุ้ม': 'bg-rose-500',
      'อื่นๆ': 'bg-purple-500',
      pending: 'bg-amber-500',
    };

    const labels: Record<string, string> = {
      'รอดำเนินการ': 'รอดำเนินการ',
      'การซ่อมแซม': 'กำลังซ่อมแซม',
      'สมบูรณ์': 'ซ่อมบำรุงเสร็จสิ้น',
      'กลับมาแล้ว': 'กลับมาแล้ว',
      'ดำเนินการซ่อมแล้ว': 'ดำเนินการซ่อมแล้ว',
      'ส่งคืนหมดประกัน': 'ส่งคืนหมดประกัน',
      'ส่งคืนค่าซ่อมไม่คุ้ม': 'ส่งคืนค่าซ่อมไม่คุ้ม',
      'อื่นๆ': 'อื่นๆ',
      pending: 'รอดำเนินการ',
    };

    // ใช้ fallback เป็นค่าว่างหากไม่พบสถานะ (เพื่อป้องกัน runtime error แม้ TS จะดักไว้แล้ว)
    const currentStyle = styles[status] || styles.pending;
    const currentDot = dotColors[status] || dotColors.pending;
    const currentLabel = labels[status] || labels.pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border tracking-tight shadow-sm transition-all hover:brightness-95 ${currentStyle}`}>
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentDot}`} />
        {currentLabel}
      </span>
    );
  };

  const getRowStyle = (status: RepairStatus) => {
    const styles: Record<string, string> = {
      'รอดำเนินการ': 'border-l-[4px] border-l-amber-500 hover:bg-amber-50/50',
      'การซ่อมแซม': 'border-l-[4px] border-l-blue-500 hover:bg-blue-50/50',
      'สมบูรณ์': 'border-l-[4px] border-l-emerald-500 hover:bg-emerald-50/50',
      'กลับมาแล้ว': 'border-l-[4px] border-l-slate-400 hover:bg-slate-50/50',
      'ดำเนินการซ่อมแล้ว': 'border-l-[4px] border-l-emerald-500 hover:bg-emerald-50/50',
      'ส่งคืนหมดประกัน': 'border-l-[4px] border-l-rose-500 hover:bg-rose-50/50',
      'ส่งคืนค่าซ่อมไม่คุ้ม': 'border-l-[4px] border-l-rose-500 hover:bg-rose-50/50',
      'อื่นๆ': 'border-l-[4px] border-l-purple-500 hover:bg-purple-50/50',
      pending: 'border-l-[4px] border-l-amber-500 hover:bg-amber-50/50',
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="p-4 md:p-8 relative min-h-screen overflow-hidden">
      {/* Premium Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-indigo-400/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-slate-400/5 blur-[130px] rounded-full"></div>
      </div>

      <div className="relative z-10 space-y-8">
        {/* Back Button and Header */}
        <div>
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border-2 border-blue-200/80 hover:border-blue-400 text-blue-600 hover:text-blue-700 px-5 py-2.5 rounded-2xl transition-all mb-6 group shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-white"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[14px] font-bold tracking-wide">ย้อนกลับสู่หน้าหลัก</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                ระบบบริหารจัดการ <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">งานซ่อมบำรุง</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm mt-1">ระบบติดตามสถานะและตรวจสอบประวัติการซ่อมบำรุงอุปกรณ์คอมพิวเตอร์อย่างมีประสิทธิภาพ</p>
            </div>
            <Link 
              to="/repair/entry"
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl transition-all hover:scale-105 shadow-[0_8px_30px_rgba(59,130,246,0.4)] group font-black text-base border-2 border-white/20"
            >
              <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
              เพิ่มรายการแจ้งซ่อมใหม่
            </Link>
          </div>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-[4px] border-l-indigo-500 border-y border-r border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <Database size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">จำนวนรายการทั้งหมด</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-[4px] border-l-amber-500 border-y border-r border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">อยู่ระหว่างดำเนินการ</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.repairing}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-[4px] border-l-emerald-500 border-y border-r border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">ดำเนินการเสร็จสิ้น</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.completed}</h3>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 flex flex-col md:flex-row justify-between gap-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
        <div className="relative w-full md:w-[400px] pl-2">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
          <input 
            type="text" 
            placeholder="ค้นหาตามรุ่น, หมายเลขครุภัณฑ์ หรือหมายเลขซีเรียล..."
            className="w-full pl-10 pr-4 py-2 bg-blue-50/30 border border-blue-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all text-sm text-slate-700"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-blue-400" size={16} />
          <select 
            className="bg-blue-50/30 border border-blue-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all font-semibold text-slate-600 text-sm cursor-pointer hover:bg-blue-50/60"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="all">แสดงสถานะทั้งหมด</option>
            <option value="รอดำเนินการ">รอดำเนินการ</option>
            <option value="การซ่อมแซม">กำลังซ่อมแซม</option>
            <option value="ดำเนินการซ่อมแล้ว">ดำเนินการซ่อมแล้ว</option>
            <option value="ส่งคืนหมดประกัน">ส่งคืนหมดประกัน</option>
            <option value="ส่งคืนค่าซ่อมไม่คุ้ม">ส่งคืนค่าซ่อมไม่คุ้ม</option>
            <option value="อื่นๆ">อื่นๆ</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 border-b-0 divide-x divide-white/20 shadow-md">
                <th className="px-6 py-4 text-[13px] font-black text-white uppercase tracking-wider whitespace-nowrap">รายละเอียดอุปกรณ์ / หมายเลขครุภัณฑ์</th>
                <th className="px-6 py-4 text-[13px] font-black text-white uppercase tracking-wider whitespace-nowrap">รายละเอียดอาการเสีย / ข้อขัดข้อง</th>
                <th className="px-6 py-4 text-[13px] font-black text-white uppercase tracking-wider whitespace-nowrap text-center">สถานะการดำเนินการ</th>
                <th className="px-6 py-4 text-[13px] font-black text-white uppercase tracking-wider whitespace-nowrap">เจ้าหน้าที่รับซ่อม / วันที่รับรายการ</th>
                <th className="px-6 py-4 text-[13px] font-black text-white uppercase tracking-wider whitespace-nowrap text-center">
                  {isAdmin ? "การจัดการ" : "ข้อมูล"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="text-sm font-bold text-slate-400 animate-pulse">กำลังประมวลผลข้อมูล...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRepairs.length > 0 ? filteredRepairs.map((repair) => (
                <tr key={repair.id} className={`transition-colors group divide-x divide-slate-200 bg-white ${getRowStyle(repair.status)}`}>
                  <td className="px-6 py-4 align-top">
                    {repair.docNumber && (
                      <div className="mb-1.5">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${repair.docNumber.startsWith('IN') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {repair.docNumber}
                        </span>
                      </div>
                    )}
                    <div className="font-bold text-slate-800 text-[14px]">{repair.equipmentModel}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-1">ครุภัณฑ์: {repair.assetNumber}</div>
                    <div className="text-[10px] text-slate-400 uppercase">S/N: {repair.serialNumber}</div>
                  </td>
                  <td className="px-6 py-4 align-top max-w-[250px]">
                    <div className="text-sm text-slate-600 line-clamp-2">{repair.problemDescription}</div>
                  </td>
                  <td className="px-6 py-4 align-top text-center">
                    {getStatusBadge(repair.status)}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm font-bold text-slate-700">{repair.receiverName}</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">
                      {repair.receivedDate}
                      {repair.createdAt && (
                        <span className="ml-1 text-[10px] text-slate-400">
                          {new Date(repair.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    {isAdmin && (
                      <div className="flex items-center justify-center gap-2">
                        <Link to={`/repair/view/${repair.id}`} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 hover:scale-110 rounded-xl transition-all shadow-sm flex items-center justify-center border border-blue-100" title="ตรวจสอบรายละเอียด">
                          <Eye size={20} />
                        </Link>
                        {isAdmin && (
                          <Link to={`/repair/edit/${repair.id}`} className="p-2.5 text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 hover:scale-110 rounded-xl transition-all shadow-sm border border-amber-100" title="แก้ไขข้อมูลรายการ">
                            <Pencil size={20} />
                          </Link>
                        )}
                        {isAdmin_2 && (
                          <button 
                            onClick={() => handleDelete(repair.id)}
                            className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 hover:scale-110 rounded-xl transition-all shadow-sm border border-rose-100"
                            title="ลบข้อมูลรายการ"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                        <Link to={`/repair/view/${repair.id}?action=print`} className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 hover:scale-110 rounded-xl transition-all shadow-sm border border-indigo-100" title="พิมพ์/ส่งออกเอกสารราชการ">
                          <Printer size={20} />
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                        <Database size={64} />
                      </div>
                      <p className="text-lg font-bold text-slate-400">ไม่พบข้อมูลรายการซ่อมในระบบ</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
