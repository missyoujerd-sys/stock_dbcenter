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
  Trash2
} from 'lucide-react';
import { RepairService } from '../../services/repairService';
import { RepairRecord, RepairStatus } from '../../types/repair';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export let isAdmin = false;
let isAdmin_2 = false;

export default function RepairDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'all'>('all');
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

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

  // @ts-ignore
  const env = import.meta.env;
  isAdmin = currentUser?.email === env.VITE_ADMIN_EMAIL1|| currentUser?.email === env.VITE_ADMIN_EMAIL2 || currentUser?.email === env.VITE_ADMIN_EMAIL3 || currentUser?.email === env.VITE_ADMIN_EMAIL4 || currentUser?.email === env.VITE_ADMIN_EMAIL5; //สิทธิ์เฉพาะดูกลับสถานะไม่ได้
   
  isAdmin_2 = currentUser?.email === env.VITE_ADMIN_EMAIL1|| currentUser?.email === env.VITE_ADMIN_EMAIL2 ;//แก้ไขไม่ให้ลบได้
  console.log(isAdmin_2);

  const stats = useMemo(() => {
    return {
      total: repairs.length,
      repairing: repairs.filter(r => r.status === 'repairing' || r.status === 'pending').length,
      completed: repairs.filter(r => r.status === 'completed' || r.status === 'returned').length,
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
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      repairing: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      returned: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard งานซ่อม</h1>
          <p className="text-slate-500">ติดตามสถานะและประวัติการซ่อมบำรุงคอมพิวเตอร์</p>
        </div>
        <Link 
          to="/repair/entry"
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl transition-all shadow-xl shadow-slate-200"
        >
          <Plus size={20} />
          เพิ่มรายการซ่อมใหม่
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Database size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">รายการทั้งหมด</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">กำลังดำเนินการ</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.repairing}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">ซ่อมเสร็จสิ้น</p>
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
            placeholder="ค้นหา รุ่น, เลขครุภัณฑ์, หรือ Serial Number..."
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
            <option value="all">สถานะทั้งหมด</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="repairing">กำลังดำเนินการ</option>
            <option value="completed">ซ่อมเสร็จสิ้น</option>
            <option value="returned">ส่งกลับ</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">อุปกรณ์ / เลขครุภัณฑ์</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">อาการเสีย</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">ผู้รับซ่อม / วันที่</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">
                  {(isAdmin || isAdmin_2) && "จัดการ"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="text-sm font-bold text-slate-400 animate-pulse">กำลังโหลดข้อมูล...</p>
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
                    {(isAdmin || isAdmin_2) && (
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/repair/view/${repair.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all shadow-sm flex items-center justify-center" title="ดูรายละเอียด">
                          <Eye size={18} />
                        </Link>
                        {isAdmin_2 && (
                          <button 
                            onClick={() => handleDelete(repair.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="ลบข้อมูล"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        <Link to={`/repair/view/${repair.id}?action=print`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="พิมพ์/ส่งออกเอกสาร">
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
                      <p className="text-lg font-bold text-slate-400">ไม่พบรายการซ่อม</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
