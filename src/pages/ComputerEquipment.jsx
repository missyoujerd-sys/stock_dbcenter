import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, push, update, remove, serverTimestamp } from 'firebase/database';
import { 
  Monitor, 
  Search, 
  Plus, 
  Filter, 
  AlertTriangle,
  CheckCircle2,
  Package,
  Activity,
  X,
  Save
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ComputerEquipment() {
  const { currentUser, isAdmin } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Modal & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    assetCode: '',
    name: '',
    category: 'hardware',
    status: 'Available',
    quantity: 1,
    minStock: 2,
    location: '',
    recorderName: '',
    entryDate: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats for the widgets
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    lowStock: 0,
    outOfStock: 0
  });

  useEffect(() => {
    // Listen to equipment node
    const equipmentRef = ref(db, 'equipment');
    const unsubscribe = onValue(equipmentRef, (snapshot) => {
      const data = snapshot.val();
      const loadedEquipment = [];
      let total = 0, available = 0, lowStock = 0, outOfStock = 0;

      if (data) {
        Object.entries(data).forEach(([key, item]) => {
          loadedEquipment.push({ id: key, ...item });
          
          total++;
          if (item.status === 'Available' || item.status === 'พร้อมใช้งาน') available++;
          if (item.quantity <= (item.minStock || 2) && item.quantity > 0) lowStock++;
          if (item.quantity === 0) outOfStock++;
        });
      }

      setEquipmentList(loadedEquipment);
      setStats({ total, available, lowStock, outOfStock });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categories = [
    { id: 'all', name: 'ทั้งหมด' },
    { id: 'hardware', name: 'คอมพิวเตอร์ / ฮาร์ดแวร์' },
    { id: 'peripheral', name: 'อุปกรณ์ต่อพ่วง' },
    { id: 'storage', name: 'อุปกรณ์จัดเก็บข้อมูล' },
    { id: 'network', name: 'อุปกรณ์เครือข่าย' },
    { id: 'accessory', name: 'สายเคเบิล & เบ็ดเตล็ด' },
  ];

  const equipmentTypes = [
    {
      group: 'อุปกรณ์คอมพิวเตอร์หลัก (Computer Hardware)',
      items: ['เคส (Case)', 'เมนบอร์ด (Motherboard)', 'หน่วยประมวลผล (CPU)', 'หน่วยความจำ (RAM)', 'ฮาร์ดดิสก์ (HDD)', 'โซลิดสเตตไดรฟ์ (SSD)', 'การ์ดจอ (Graphics Card / GPU)', 'พาวเวอร์ซัพพลาย (Power Supply)', 'ชุดระบายความร้อน CPU', 'ไดรฟ์อ่าน/เขียนแผ่น CD/DVD']
    },
    {
      group: 'อุปกรณ์ต่อพ่วง (Peripherals)',
      items: ['จอภาพ (Monitor)', 'แป้นพิมพ์ (Keyboard)', 'เมาส์ (Mouse)', 'เครื่องพิมพ์ (Printer)', 'เครื่องสแกน (Scanner)', 'เว็บแคม (Webcam)', 'ลำโพง (Speaker)', 'หูฟัง (Headset)', 'ไมโครโฟน (Microphone)', 'เครื่องฉายภาพ (Projector)', 'เครื่องอ่านบัตร (Card Reader)', 'เครื่องอ่านลายนิ้วมือ (Fingerprint Scanner)', 'เครื่องสำรองไฟ (UPS)']
    },
    {
      group: 'อุปกรณ์จัดเก็บข้อมูล',
      items: ['USB Flash Drive', 'External HDD', 'External SSD', 'SD Card', 'MicroSD Card']
    },
    {
      group: 'อุปกรณ์เครือข่าย',
      items: ['เราเตอร์ (Router)', 'สวิตช์ (Switch)', 'โมเด็ม (Modem)', 'Access Point', 'LAN Card', 'สาย LAN']
    },
    {
      group: 'สายเชื่อมต่อและอุปกรณ์เสริม',
      items: ['สาย HDMI', 'สาย DisplayPort', 'สาย VGA', 'สาย DVI', 'สาย USB', 'สาย USB-C', 'สาย LAN', 'USB Hub', 'Bluetooth Adapter', 'Wi-Fi Adapter']
    }
  ];

  const filteredEquipment = equipmentList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.assetCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === 'all' || item.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      let autoCategory = formData.category;
      for (const group of equipmentTypes) {
        if (group.items.includes(value)) {
          if (group.group.includes('Hardware')) autoCategory = 'hardware';
          else if (group.group.includes('Peripherals')) autoCategory = 'peripheral';
          else if (group.group.includes('จัดเก็บข้อมูล')) autoCategory = 'storage';
          else if (group.group.includes('เครือข่าย')) autoCategory = 'network';
          else if (group.group.includes('สายเชื่อมต่อ')) autoCategory = 'accessory';
          break;
        }
      }
      setFormData(prev => ({
        ...prev,
        [name]: value,
        category: autoCategory
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'quantity' || name === 'minStock' ? Number(value) : value
      }));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.recorderName || formData.recorderName.trim() === '') {
      alert("กรุณาระบุชื่อผู้ลงข้อมูลก่อนบันทึก");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editId) {
        const equipmentRef = ref(db, `equipment/${editId}`);
        await update(equipmentRef, {
          ...formData,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.email || 'Unknown'
        });
      } else {
        const equipmentRef = ref(db, 'equipment');
        await push(equipmentRef, {
          ...formData,
          createdAt: serverTimestamp(),
          createdBy: currentUser?.email || 'Unknown',
          updatedAt: serverTimestamp()
        });
      }
      
      // Reset form
      setFormData({
        code: '',
        assetCode: '',
        name: '',
        category: 'hardware',
        status: 'Available',
        quantity: 1,
        minStock: 2,
        location: '',
        recorderName: '',
        entryDate: new Date().toISOString().split('T')[0]
      });
      setEditId(null);
      setShowAddModal(false);
      // Optional: Add toast success here if react-hot-toast is available
    } catch (error) {
      console.error("Error adding equipment: ", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      code: item.code || '',
      assetCode: item.assetCode || '',
      name: item.name || '',
      category: item.category || 'hardware',
      status: item.status || 'Available',
      quantity: item.quantity || 1,
      minStock: item.minStock || 2,
      location: item.location || '',
      recorderName: item.recorderName || '',
      entryDate: item.entryDate || new Date().toISOString().split('T')[0]
    });
    setEditId(item.id);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("คุณต้องการลบอุปกรณ์นี้ใช่หรือไม่?")) {
      try {
        await remove(ref(db, `equipment/${id}`));
      } catch (error) {
        console.error("Error deleting equipment: ", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล: " + error.message);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 font-['Prompt']">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 p-6 rounded-3xl backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h1 className="text-2xl md:text-3xl font-[900] text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 tracking-tight flex items-center gap-3">
            <Monitor className="text-blue-600 dark:text-blue-400" size={32} strokeWidth={2.5} />
            ระบบคลังอุปกรณ์คอมพิวเตอร์
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 text-sm md:text-base">
            จัดการสต๊อกฮาร์ดแวร์และอุปกรณ์ต่อพ่วง (Computer Hardware & Peripherals Inventory)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm active:scale-95 group">
            <Filter size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            ตัวกรอง
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] transition-all active:scale-95 group border border-indigo-500/30"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
            เพิ่มอุปกรณ์
          </button>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <WidgetCard 
          title="อุปกรณ์ทั้งหมด" 
          value={stats.total} 
          icon={<Package size={24} />} 
          colors="from-blue-500 to-cyan-500"
          bgLight="bg-blue-50 dark:bg-blue-500/10"
          borderLight="border-blue-200/50 dark:border-blue-500/20"
        />
        <WidgetCard 
          title="พร้อมใช้งาน" 
          value={stats.available} 
          icon={<CheckCircle2 size={24} />} 
          colors="from-emerald-500 to-green-500"
          bgLight="bg-emerald-50 dark:bg-emerald-500/10"
          borderLight="border-emerald-200/50 dark:border-emerald-500/20"
        />
        <WidgetCard 
          title="สต๊อกเหลือน้อย" 
          value={stats.lowStock} 
          icon={<AlertTriangle size={24} />} 
          colors="from-amber-500 to-orange-500"
          bgLight="bg-amber-50 dark:bg-amber-500/10"
          borderLight="border-amber-200/50 dark:border-amber-500/20"
        />
        <WidgetCard 
          title="ของหมด (Out of Stock)" 
          value={stats.outOfStock} 
          icon={<Activity size={24} />} 
          colors="from-rose-500 to-red-500"
          bgLight="bg-rose-50 dark:bg-rose-500/10"
          borderLight="border-rose-200/50 dark:border-rose-500/20"
        />
      </div>

      {/* Main Content Area */}
      <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xl overflow-hidden flex flex-col">
        
        {/* Controls Bar */}
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/40 dark:bg-slate-800/40">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === cat.id
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200 dark:border-indigo-700/50'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาอุปกรณ์, รหัส, หมวดหมู่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 shadow-sm"
            />
          </div>
        </div>

        {/* Data Table / Empty State */}
        <div className="p-0 overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="font-bold tracking-wide">กำลังโหลดข้อมูลอุปกรณ์...</p>
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400 p-8 text-center animate-in zoom-in-95 duration-500">
              <div className="w-32 h-32 mb-6 relative">
                <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-2xl opacity-60"></div>
                <Monitor className="w-full h-full text-indigo-300 dark:text-indigo-800 relative z-10" strokeWidth={1} />
              </div>
              <h3 className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2">ยังไม่มีข้อมูลอุปกรณ์คอมพิวเตอร์</h3>
              <p className="text-sm max-w-md mx-auto mb-6">คุณสามารถเพิ่มคอมพิวเตอร์ ฮาร์ดแวร์ อุปกรณ์ต่อพ่วง หรืออุปกรณ์เครือข่ายเข้าสู่ระบบเพื่อเริ่มต้นการจัดการสต๊อก</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:shadow-lg transition-all active:scale-95"
              >
                <Plus size={20} />
                เพิ่มอุปกรณ์ใหม่ชิ้นแรก
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  <th className="px-6 py-4">รูปภาพ/รหัส</th>
                  <th className="px-6 py-4">รายการอุปกรณ์</th>
                  <th className="px-6 py-4">หมวดหมู่</th>
                  <th className="px-6 py-4">วันที่บันทึก</th>
                  <th className="px-6 py-4 text-center">คงเหลือ</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredEquipment.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                          {item.name?.charAt(0) || <Monitor size={18} />}
                        </div>
                        <div>
                          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {item.assetCode ? `ครุภัณฑ์: ${item.assetCode}` : (item.code ? `S/N: ${item.code}` : '-')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {categories.find(c => c.id === item.category)?.name || item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {item.entryDate ? new Date(item.entryDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === 'Available' || item.status === 'พร้อมใช้งาน' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                          : item.status === 'Repair' 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin && (
                        <>
                          <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700 text-sm font-bold mr-3 transition-colors">แก้ไข</button>
                          <button onClick={() => handleDelete(item.id)} className="text-rose-500 hover:text-rose-700 text-sm font-bold transition-colors">ลบ</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Monitor size={20} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-[900] text-slate-800 dark:text-white tracking-tight">เพิ่มอุปกรณ์ใหม่</h2>
              </div>
              <button 
                onClick={() => {
                  setEditId(null);
                  setFormData({
                    code: '', assetCode: '', name: '', category: 'hardware', status: 'Available', quantity: 1, minStock: 2, location: '', recorderName: '', entryDate: new Date().toISOString().split('T')[0]
                  });
                  setShowAddModal(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 transition-colors flex items-center justify-center"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">วันที่บันทึก/วันที่รับเข้า <span className="text-rose-500">*</span></label>
                  <input 
                    type="date" 
                    name="entryDate"
                    required
                    value={formData.entryDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ชื่อ/ประเภทอุปกรณ์ <span className="text-rose-500">*</span></label>
                  <select 
                    name="name" 
                    required 
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  >
                    <option value="">-- เลือกประเภทอุปกรณ์ --</option>
                    {equipmentTypes.map((group, idx) => (
                      <optgroup key={idx} label={group.group}>
                        {group.items.map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">รหัสครุภัณฑ์</label>
                  <input 
                    type="text" 
                    name="assetCode"
                    value={formData.assetCode}
                    onChange={handleInputChange}
                    placeholder="เช่น 1234-567-89" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">หมวดหมู่ <span className="text-rose-500">*</span></label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  >
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">รหัสอุปกรณ์ / S/N</label>
                  <input 
                    type="text" 
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="รหัสอ้างอิง หรือ Serial Number" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">จำนวน <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    name="quantity"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">สต๊อกขั้นต่ำ <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    name="minStock"
                    min="0"
                    required
                    value={formData.minStock}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">สถานะ</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  >
                    <option value="Available">พร้อมใช้งาน</option>
                    <option value="In Use">กำลังใช้งาน</option>
                    <option value="Repair">ส่งซ่อม</option>
                    <option value="Broken">ชำรุด/แทงจำหน่าย</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">สถานที่เก็บ</label>
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="เช่น ตู้ A1 ชั้น 2" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ชื่อผู้ลงข้อมูล <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    name="recorderName"
                    required
                    value={formData.recorderName}
                    onChange={handleInputChange}
                    placeholder="ระบุชื่อผู้บันทึกข้อมูล" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>

              </div>

              <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setFormData({
                      code: '', assetCode: '', name: '', category: 'hardware', status: 'Available', quantity: 1, minStock: 2, location: '', recorderName: ''
                    });
                    setShowAddModal(false);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <Save size={18} />
                  )}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function WidgetCard({ title, value, icon, colors, bgLight, borderLight }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl p-5 ${bgLight} border ${borderLight} shadow-sm group hover:shadow-md transition-all duration-300`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors} rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 -translate-y-10 translate-x-10`}></div>
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1 tracking-tight">{title}</p>
          <h3 className="text-3xl font-[900] text-slate-800 dark:text-white tracking-tight font-mono">{value}</h3>
        </div>
        <div className={`p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-white/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
