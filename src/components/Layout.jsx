import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  Box, 
  ClipboardList, 
  LogOut, 
  Truck, 
  Wrench, 
  LayoutDashboard, 
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  Package,
  Eye,
  Activity,
  Calendar,
  Clock,
  ArrowLeftRight
} from "lucide-react";
import emblemSvg from "../assets/emblem.svg";
import ThemeToggle from "./ThemeToggle";


export default function Layout({ children }) {
  const { currentUser, isAdmin, isAdmin_2, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };


  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch {
      console.error("Failed to log out");
    }
  }

  const navItems = [
    { name: "หน้าหลัก", path: "/", icon: LayoutDashboard },
    { name: "รับเข้า Stock", path: "/incoming", icon: Package },
    { name: "จำหน่ายสินค้า", path: "/distribution", icon: Truck },
    ...(isAdmin ? [{ name: "คลังพัสดุ (Admin)", path: "/inventory", icon: Box }] : []),
    { name: "ทะเบียน ยืม-คืน", path: "/borrow", icon: ArrowLeftRight },
    { name: "แจ้งซ่อมบริษัท", path: "/repair/entry", icon: Wrench },
    { name: "งานซ่อมทั้งหมด", path: "/repair/dashboard", icon: ClipboardList },
  ];

  const SidebarContent = () => (
    <div className={`flex flex-col h-full bg-[#030712] dark:bg-[#02040a] text-white transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] relative overflow-hidden border-r border-white-[0.03] dark:border-white/[0.05] select-none w-72 shadow-[30px_0_70px_rgba(0,0,0,0.8)] dark:shadow-[30px_0_70px_rgba(0,0,0,0.9)]`}>
      {/* Moving Glass Shine Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shine_4s_infinite] pointer-events-none`}></div>
      
      {/* Elite Atmospheric Lighting */}
      <div className="absolute top-[-10%] right-[-15%] w-[120%] h-[40%] bg-blue-600/[0.08] dark:bg-blue-600/[0.12] blur-[140px] rounded-full pointer-events-none transition-colors duration-[1000ms]"></div>
      <div className="absolute bottom-[-10%] left-[-15%] w-[100%] h-[30%] bg-indigo-700/[0.06] dark:bg-indigo-700/[0.1] blur-[120px] rounded-full pointer-events-none transition-colors duration-[1000ms]"></div>
      
      {/* Micro-light Edge */}
      <div className="absolute right-0 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-[0.25]"></div>

      <div className={`p-6 flex flex-col h-full relative z-10 transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] px-6`}>
        {/* Elite Branding Section */}
        <div className={`flex items-center gap-4 mb-10 group transition-all duration-[600ms] px-1`}>
          <div className="relative shrink-0">
            {/* Pulsing Core Glow */}
            <div className={`relative bg-transparent p-1 rounded-[1.1rem] transform transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] scale-100 group-hover:scale-105`}>
              <img src="/cnkp-logo-transparent.png" alt="Hospital Logo" className="relative z-10 w-11 h-11 object-contain drop-shadow-md" style={{ filter: 'brightness(1.1)' }} />
            </div>
          </div>
          <div className="overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-6 duration-[800ms] flex flex-col justify-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[16px] font-bold text-slate-300 font-['Prompt'] leading-tight tracking-wide drop-shadow-sm">ระบบ</span>
                
                {/* Online Status Pill - Sidebar Version */}
                <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 backdrop-blur-sm shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400/50 opacity-100"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-tr from-green-600 via-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                  </div>
                  <span className="text-[9px] font-black text-green-400 font-['Prompt'] tracking-[0.15em] uppercase leading-none">สถานะระบบ</span>
                </div>
              </div>
              <h1 className="text-[26px] font-[900] tracking-[-0.04em] leading-none text-white font-['Prompt'] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] -mt-1 mb-1.5">
                จัดการ
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-blue-400 tracking-[0.25em] uppercase">STOCK-แจ้งซ่อมบริษัท</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-400/30 to-transparent"></div>
              </div>
            </div>
            <p className="text-[11px] text-blue-300/90 font-black tracking-widest uppercase leading-none mt-3 group-hover:text-blue-400 transition-colors duration-[900ms] drop-shadow-sm">ห้องซ่อมบำรุงคอมพิวเตอร์</p>
          </div>
        </div>

        {/* Elite Glass Navigation */}
        <nav className="space-y-2.5 flex-1 overflow-y-auto sidebar-scrollbar py-2 pr-1 mr-[-4px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ease-out cursor-pointer w-full select-none ${
                  isActive 
                    ? "text-white bg-gradient-to-b from-[#1e293b] to-[#020617] shadow-[0_6px_15px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.6)] border border-[#3b82f6]/40" 
                    : "text-slate-300 dark:text-slate-400 bg-gradient-to-b from-[#1e293b]/40 to-[#020617]/60 shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_-1px_3px_rgba(0,0,0,0.5)] border border-slate-700/50 hover:text-white dark:hover:text-white hover:from-[#1e293b]/70 hover:to-[#020617]/80 hover:shadow-[0_4px_15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_4px_rgba(0,0,0,0.6)] hover:border-slate-500/60"
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* 3D Glass Highlight overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-transparent ${isActive ? 'via-white/[0.04] to-white/[0.1]' : 'via-transparent to-white/[0.03] group-hover:to-white/[0.06]'} pointer-events-none rounded-xl`}></div>
                <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${isActive ? 'via-blue-400/60' : 'via-slate-400/30 group-hover:via-slate-300/50'} to-transparent pointer-events-none`}></div>
                
                {/* Icon Wrapper Circle */}
                <div className={`relative shrink-0 flex items-center justify-center w-[2.6rem] h-[2.6rem] rounded-full transition-all duration-200 border-2 overflow-hidden ${
                  isActive 
                    ? "bg-gradient-to-b from-[#2563eb] to-[#1e3a8a] border-[#93c5fd] shadow-[0_0_15px_rgba(59,130,246,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)]" 
                    : "bg-gradient-to-b from-[#1f2937] to-[#111827] border-slate-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] group-hover:border-slate-400 group-hover:from-[#374151] group-hover:to-[#1f2937]"
                }`}>
                  {/* Subtle Icon Glow */}
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-300 opacity-50 blur-[6px] animate-pulse pointer-events-none"></div>
                  )}
                  
                  <div className={`relative z-10 transition-all duration-200 ${isActive ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" : "text-slate-400 group-hover:text-white"}`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </div>

                  {/* Glass Shine on Circle */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${isActive ? 'from-white/[0.2]' : 'from-white/[0.05] group-hover:from-white/[0.15]'} to-transparent pointer-events-none transition-opacity duration-200`}></div>
                </div>
                
                <div className="flex flex-col flex-1 overflow-visible min-w-0 z-10 justify-center h-full">
                   <span className={`font-bold text-[0.88rem] xl:text-[0.92rem] whitespace-nowrap font-['Prompt'] transition-all duration-200 ${isActive ? 'text-[#e0f2fe] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]' : 'group-hover:text-white drop-shadow-sm'}`}>
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="h-[2px] w-8 bg-gradient-to-r from-[#38bdf8] to-[#818cf8] rounded-full mt-1.5 shadow-[0_0_10px_rgba(56,189,248,0.9)]"></div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Elite Footer Section */}
        <div className="mt-auto pt-6 border-t border-white/[0.06] dark:border-white/[0.1] space-y-5">
          {currentUser && (
            <div className="space-y-5">
              <div className={`flex items-center gap-4 group/avatar transition-all duration-[600ms] px-2`}>
                <div className="relative shrink-0">
                  {/* Luxury Avatar Ring */}
                  <div className={`absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-[8px] transition duration-[1000ms] opacity-25 group-hover/avatar:opacity-60`}></div>
                  <div className={`relative rounded-full bg-[#0a0f1d] flex items-center justify-center border border-white/10 shadow-3xl transition-all duration-[600ms] overflow-hidden w-11 h-11 group-hover/avatar:scale-105`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-indigo-500/20"></div>
                    <User size={22} className="text-blue-400 relative z-10 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-bottom-3 duration-[800ms]">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-1.5">ยินดีต้อนรับ</p>
                  <p className="text-[14px] font-bold text-slate-200 truncate tracking-tight group-hover/avatar:text-white transition-colors duration-[300ms]">
                    {currentUser.email.split('@')[0]}
                  </p>
                </div>
              </div>
              
              <div className="px-1">
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3.5 py-3.5 rounded-[1.2rem] bg-white/[0.02] text-slate-500 hover:bg-rose-500/[0.1] hover:text-rose-400 transition-all duration-[600ms] font-black text-[13px] border border-white/[0.06] hover:border-rose-500/30 group/logout ease-[cubic-bezier(0.2,0.8,0.2,1)] justify-center px-4`}
                >
                  <LogOut size={18} className="shrink-0 transition-transform duration-[500ms] group-hover/logout:rotate-[-8deg] group-hover/logout:scale-110" />
                  <span className="overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-4 duration-[700ms] font-['Prompt'] tracking-widest">SIGN OUT</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#060a12] flex overflow-x-hidden font-['Prompt'] transition-colors duration-500">
      <aside className={`hidden lg:block min-h-screen shrink-0 w-72 transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-80 max-w-[85vw] h-full shadow-[20px_0_50px_rgba(0,0,0,0.5)] dark:shadow-[30px_0_70px_rgba(0,0,0,0.8)] animate-in slide-in-from-left duration-300">
            <SidebarContent />
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-[-50px] p-2 bg-slate-900 dark:bg-slate-800 rounded-full text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-50 dark:bg-[#0a0f1d] transition-colors duration-500">
        
        {/* Desktop Quick Header */}
        <div className="hidden lg:flex h-20 items-center justify-between pl-8 pr-6 sticky top-0 z-40 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-500 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-4 xl:gap-6">
            <img src="/cnkp-logo-horizontal.png" alt="Nakornping Hospital Logo" className="h-10 object-contain drop-shadow-sm transition-transform hover:scale-105 duration-300" />
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
            <div className="hidden md:flex flex-col justify-center gap-1.5">
              <span className="whitespace-nowrap text-[20px] lg:text-[24px] font-[900] bg-gradient-to-r from-slate-800 via-rose-700 to-rose-900 dark:from-white dark:via-rose-400 dark:to-rose-600 bg-clip-text text-transparent font-['Prompt'] tracking-tight leading-none drop-shadow-sm">
                ห้องซ่อมบำรุงคอมพิวเตอร์
              </span>
              <div className="flex items-center gap-2 px-0.5">
                <div className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500/40 opacity-100"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                </div>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">
                  ระบบพร้อมใช้งาน • NAKORNPING HOSPITAL
                </span>
              </div>
            </div>
            
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 hidden xl:block opacity-50"></div>

            {/* Header Grand Date Pill - Compacted to prevent overlap */}
            <div className="hidden xl:flex items-center shrink-0 p-1 rounded-full bg-slate-50 dark:bg-[#0f172a]/40 border border-slate-200 dark:border-white/5 shadow-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800/60 group/date cursor-default">
              <div className="flex items-center gap-3 pl-2.5 pr-4 py-1">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/20 transition-transform group-hover/date:scale-105 duration-500">
                  <Calendar className="text-white" size={20} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[17px] font-[900] text-slate-800 dark:text-white font-['Prompt'] tracking-tight leading-none">
                    {formatDate(currentTime)}
                  </span>
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-sm transition-all group-hover/date:bg-blue-500/20">
                    <Clock size={11} className="text-blue-500" />
                    <span className="text-[14px] font-[900] tabular-nums text-blue-600 dark:text-blue-400 font-mono tracking-tighter leading-none">
                      {formatTime(currentTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-3.5 px-5 py-2 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/50 dark:border-white/5 shadow-sm transition-all hover:shadow-md hover:border-slate-300/50 dark:hover:border-white/10 group">
                <div className="relative shrink-0">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-lg bg-gradient-to-tr from-blue-500 to-indigo-600">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <User size={20} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400/60 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-tr from-green-500 to-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                    </div>
                    <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.15em]">
                      {isAdmin_2 ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                    </span>
                  </div>
                  <span className="text-[15px] font-[800] text-slate-800 dark:text-white font-['Prompt'] tracking-tight">
                    {currentUser.displayName || currentUser.email.split('@')[0]}
                  </span>
                </div>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-500 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col">
            <img src="/cnkp-logo-horizontal.png" alt="Nakornping Hospital Logo" className="h-7 object-contain drop-shadow-sm mb-0.5" />
            <span className="text-[11px] font-black bg-gradient-to-r from-rose-500 via-rose-700 to-rose-900 dark:from-rose-400 dark:via-rose-300 dark:to-rose-500 bg-clip-text text-transparent font-['Prompt'] tracking-wider leading-none whitespace-nowrap">
              ห้องซ่อมบำรุงคอมพิวเตอร์
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-sm transition-all active:scale-95">
                <Eye size={10} className="text-blue-500" />
                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">1.2K</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                <span className="text-[9px] font-black text-green-600 dark:text-green-400 font-['Prompt'] tracking-wider">ONLINE</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
               <div className="flex flex-col items-end mr-1">
                 <div className="flex items-center gap-1.5 mb-0.5">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                   <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">ยินดีต้อนรับ</span>
                 </div>
                 <span className="text-[12px] font-bold text-slate-800 dark:text-white leading-none">{currentUser.email.split('@')[0]}</span>
               </div>
            )}
            <ThemeToggle />
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="flex-grow p-4 lg:p-10 w-full max-w-[1720px] mx-auto transition-all duration-500">

          <div className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] scale-100 opacity-100`}>
            {children}
          </div>
        </main>

        <footer className="py-6 px-10 border-t border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 text-sm flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/30 dark:bg-[#0f172a]/30 backdrop-blur-sm transition-colors duration-500">
          <p className="font-medium">&copy; {new Date().getFullYear()} ระบบจัดการ Stock พัสดุครุภัณฑ์</p>
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">
            <span>Dashboard ห้องซ่อมบำรุงคอมพิวเตอร์</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
