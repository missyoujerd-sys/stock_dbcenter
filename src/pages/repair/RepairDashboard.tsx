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
        r.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
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
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-all mb-6 group font-bold"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:bg-slate-50 transition-all">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </div>
            <span className="text-sm uppercase tracking-[0.2em] font-black">ย้อนกลับสู่หน้าหลัก</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                ระบบบริหารจัดการ <span className="text-blue-600">งานซ่อมบำรุง</span>
              </h1>
              <p className="text-slate-500 font-medium">ระบบติดตามสถานะและตรวจสอบประวัติการซ่อมบำรุงอุปกรณ์คอมพิวเตอร์อย่างมีประสิทธิภาพ</p>
            </div>
            <Link 
              to="/repair/entry"
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-slate-200 group font-bold"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              เพิ่มรายการแจ้งซ่อมใหม่
            </Link>
          </div>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Database size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">จำนวนรายการทั้งหมด</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">อยู่ระหว่างดำเนินการ</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.repairing}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">ดำเนินการเสร็จสิ้น</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.completed}</h3>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาตามรุ่น, หมายเลขครุภัณฑ์ หรือหมายเลขซีเรียล..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={18} />
          <select 
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-600"
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
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">รายละเอียดอุปกรณ์ / หมายเลขครุภัณฑ์</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">รายละเอียดอาการเสีย / ข้อขัดข้อง</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">สถานะการดำเนินการ</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">เจ้าหน้าที่รับซ่อม / วันที่รับรายการ</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">
                  {isAdmin && "การจัดการ"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                <tr key={repair.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-800">{repair.equipmentModel}</div>
                    <div className="text-xs font-semibold text-slate-400 mt-0.5">{repair.assetNumber}</div>
                    <div className="text-[10px] text-slate-300 uppercase">{repair.serialNumber}</div>
                  </td>
                  <td className="px-6 py-5 max-w-[250px]">
                    <div className="text-sm text-slate-600 line-clamp-2">{repair.problemDescription}</div>
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(repair.status)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-slate-700">{repair.receiverName}</div>
                    <div className="text-xs text-slate-400">
                      {repair.receivedDate}
                      {repair.createdAt && (
                        <span className="ml-1 text-[10px] text-slate-300">
                          {new Date(repair.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {isAdmin && (
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/repair/view/${repair.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all shadow-sm flex items-center justify-center" title="ตรวจสอบรายละเอียด">
                          <Eye size={18} />
                        </Link>
                        {isAdmin && (
                          <Link to={`/repair/edit/${repair.id}`} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="แก้ไขข้อมูลรายการ">
                            <Pencil size={18} />
                          </Link>
                        )}
                        {isAdmin_2 && (
                          <button 
                            onClick={() => handleDelete(repair.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="ลบข้อมูลรายการ"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        <Link to={`/repair/view/${repair.id}?action=print`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="พิมพ์/ส่งออกเอกสารราชการ">
                          <Printer size={18} />
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
