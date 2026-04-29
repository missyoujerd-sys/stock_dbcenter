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

  // -- สำหรับ Password Lock (Admin Inventory) --
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [passwordInput, setPasswordInput] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordShake, setPasswordShake] = React.useState(false);
  const ADMIN_PASSWORD = '101988';

  const handleAdminNavClick = (e) => {
    e.preventDefault();
    setPasswordInput('');
    setPasswordError(false);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError(false);
      setIsMobileMenuOpen(false);
      navigate('/inventory');
    } else {
      setPasswordError(true);
      setPasswordShake(true);
      setPasswordInput('');
      setTimeout(() => setPasswordShake(false), 600);
    }
  };

  // -- สำหรับ Auto Logout --
  const [showLogoutWarning, setShowLogoutWarning] = React.useState(false);
  const [logoutCountdown, setLogoutCountdown] = React.useState(10);
  const showLogoutWarningRef = React.useRef(false);
  const idleTimeoutRef = React.useRef(null);
  const countdownIntervalRef = React.useRef(null);


  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch {
      console.error("Failed to log out");
    }
  }

  // --- ตั้งเวลาออกโปรแกรมอัตโนมัติเมื่อไม่มีการใช้งาน (Auto Logout) ---
  const performAutoLogout = React.useCallback(async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Auto logout failed", err);
    }
  }, [logout, navigate]);

  const resetTimer = React.useCallback(() => {
    if (showLogoutWarningRef.current) return;
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    idleTimeoutRef.current = setTimeout(() => {
      setShowLogoutWarning(true);
      showLogoutWarningRef.current = true;
      setLogoutCountdown(10);
      
      let timeLeft = 10;
      countdownIntervalRef.current = setInterval(() => {
        timeLeft -= 1;
        setLogoutCountdown(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(countdownIntervalRef.current);
          performAutoLogout();
        }
      }, 1000);
    }, 1 * 60 * 1000); // ตั้งค่า 1 นาที
  }, [performAutoLogout]);

  const extendSession = React.useCallback(() => {
    setShowLogoutWarning(false);
    showLogoutWarningRef.current = false;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    resetTimer();
  }, [resetTimer]);

  React.useEffect(() => {
    resetTimer();

    const handleActivity = () => {
      if (!showLogoutWarningRef.current) {
        resetTimer();
      }
    };

    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      events.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [resetTimer]);
  // -----------------------------------------------------------------

  const navItems = [
    { name: "หน้าหลัก", path: "/", icon: LayoutDashboard, imgSrc: "/หน้าหลัก.png" },
    { name: "รับเข้า Stock", path: "/incoming", icon: Package, imgSrc: "/รับเข้าสต๊อก.png" },
    { name: "จำหน่ายสินค้า", path: "/distribution", icon: Truck, imgSrc: "/เตรียมจำหน่าย.png" },
    ...(isAdmin ? [{ name: "คลังพัสดุ (Admin)", path: "/inventory", icon: Box, imgSrc: "/คลังพัสดุ.png", locked: true }] : []),
    { name: "ทะเบียน ยืม-คืน", path: "/borrow", icon: ArrowLeftRight, imgSrc: "/ทะเบียนยืนคืน.png" },
    { name: "แจ้งซ่อมบริษัท", path: "/repair/entry", icon: Wrench, imgSrc: "/แจ้งซ่อมบริษัท.png" },
    { name: "งานซ่อมทั้งหมด", path: "/repair/dashboard", icon: ClipboardList, imgSrc: "/รายงานสรุปแจ้งซ่อม.png" },
  ];

  const SidebarContent = () => (
    <div className={`flex flex-col h-full bg-[#f3e8ff] dark:bg-[#f3e8ff] text-slate-800 transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] relative overflow-hidden border-r border-purple-200 select-none w-full shadow-[30px_0_70px_rgba(147,51,234,0.15)]`}>
      {/* Moving Glass Shine Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shine_4s_infinite] pointer-events-none`}></div>
      
      {/* Elite Atmospheric Lighting */}
      <div className="absolute top-[-10%] right-[-15%] w-[120%] h-[40%] bg-purple-400/[0.15] blur-[140px] rounded-full pointer-events-none transition-colors duration-[1000ms]"></div>
      <div className="absolute bottom-[-10%] left-[-15%] w-[100%] h-[30%] bg-fuchsia-400/[0.15] blur-[120px] rounded-full pointer-events-none transition-colors duration-[1000ms]"></div>
      
      {/* Micro-light Edge */}
      <div className="absolute right-0 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-[0.25]"></div>

      <div className={`p-6 flex flex-col h-full relative z-10 transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] px-6`}>
        {/* Elite Branding Section */}
        <div className={`flex items-center gap-4 mb-10 group transition-all duration-[600ms] px-1`}>
          <div className="relative shrink-0">
            {/* Pulsing Core Glow */}
            <div className={`relative bg-[#f3e8ff] p-1 rounded-[1.1rem] transform transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] scale-100 group-hover:scale-105`}>
              <img src="/cnkp-logo-transparent.png" alt="Hospital Logo" className="relative z-10 w-11 h-11 object-contain drop-shadow-md" style={{ filter: 'brightness(1.1)' }} />
            </div>
          </div>
          <div className="overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-6 duration-[800ms] flex flex-col justify-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[16px] font-bold text-slate-700 font-['Prompt'] leading-tight tracking-wide drop-shadow-sm">ระบบ</span>
                
                {/* IT NKP Logo in place of Status Pill */}
                <img 
                  src="/it nkp-transparent.png" 
                  alt="IT NKP" 
                  className="h-[28px] object-contain opacity-90 block" 
                  style={{ clipPath: 'inset(2px)' }}
                />
              </div>
              <h1 className="text-[26px] font-[900] tracking-[-0.04em] leading-none text-slate-900 font-['Prompt'] -mt-1 mb-1.5">
                จัดการ
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-blue-400 tracking-[0.25em] uppercase">STOCK-แจ้งซ่อมบริษัท</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-400/30 to-transparent"></div>
              </div>
            </div>
            <p className="text-[11px] text-purple-600/90 font-black tracking-widest uppercase leading-none mt-3 group-hover:text-purple-700 transition-colors duration-[900ms] drop-shadow-sm">ห้องซ่อมบำรุงคอมพิวเตอร์</p>
          </div>
        </div>

        {/* Elite Glass Navigation */}
        <nav className="space-y-2.5 flex-1 overflow-y-auto sidebar-scrollbar py-2 pr-1 mr-[-4px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const linkContent = (
              <>
                {/* Icon Wrapper Circle */}
                <div className={`relative shrink-0 flex items-center justify-center w-11 h-11 rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] border overflow-hidden ${
                  isActive 
                    ? "bg-purple-100 border-purple-300 shadow-[0_4px_15px_rgba(168,85,247,0.3)] scale-105" 
                    : "bg-white/50 border-purple-200/50 group-hover:bg-white/80 group-hover:border-purple-300 group-hover:scale-110"
                }`}>
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-500 opacity-20 blur-[8px] animate-pulse"></div>
                  )}
                  <div className={`relative z-10 transition-all duration-[600ms] ${isActive ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" : "text-slate-500 group-hover:text-blue-300"}`}>
                    {item.imgSrc ? (
                      <img src={item.imgSrc} alt={item.name} className="w-7 h-7 object-contain drop-shadow" />
                    ) : (
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    )}
                  </div>
                  {/* Glass Shine on Circle */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-[800ms]"></div>
                </div>

                <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                  <span className={`font-bold text-[15px] tracking-tight overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-4 duration-[600ms] font-['Prompt'] ${isActive ? 'text-purple-700 translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-[300ms]`}>
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="h-[2px] w-6 bg-purple-500 rounded-full mt-0.5 animate-in slide-in-from-left-2 duration-[600ms]"></div>
                  )}
                </div>
                {/* Lock icon badge */}
                {item.locked && (
                  <span className="text-amber-500 text-[16px] shrink-0">🔒</span>
                )}
              </>
            );
            if (item.locked) {
              return (
                <a
                  key={item.path}
                  href="#"
                  onClick={handleAdminNavClick}
                  className={`flex items-center gap-4 px-4 py-[0.85rem] rounded-[1.25rem] transition-all duration-[600ms] group relative ease-[cubic-bezier(0.2,0.8,0.2,1)] no-underline ${
                    isActive 
                      ? "text-purple-600 bg-purple-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]" 
                      : "text-slate-600 hover:text-purple-900 hover:bg-purple-500/5"
                  }`}
                >
                  {linkContent}
                </a>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-[0.85rem] rounded-[1.25rem] transition-all duration-[600ms] group relative ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                  isActive 
                    ? "text-purple-600 bg-purple-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]" 
                    : "text-slate-600 hover:text-purple-900 hover:bg-purple-500/5"
                }`}
              >
                {linkContent}
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
                    <div className="absolute inset-0 bg-black"></div>
                    {/* Sidebar (ล่างซ้าย) */}  
                    <img src="/cat-3.png" alt="Profile" className="w-full h-full object-cover relative z-10" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-bottom-3 duration-[800ms]">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-1.5">ยินดีต้อนรับ</p>
                  <p className="text-[14px] font-bold text-slate-800 truncate tracking-tight group-hover/avatar:text-purple-900 transition-colors duration-[300ms]">
                    {currentUser.email.split('@')[0]}
                  </p>
                </div>
              </div>
              
              <div className="px-1">
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3.5 py-3.5 rounded-[1.2rem] bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-700 transition-all duration-[600ms] font-black text-[13px] border border-rose-200 dark:border-rose-500/20 hover:border-rose-300 group/logout ease-[cubic-bezier(0.2,0.8,0.2,1)] justify-center px-4`}
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
    <div className="h-screen bg-[#fcfcfd] dark:bg-[#060a12] flex overflow-hidden font-['Prompt'] transition-colors duration-500">
      <aside className={`hidden lg:block h-full shrink-0 w-[320px] transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]`}>
        {SidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-80 max-w-[85vw] h-full shadow-[20px_0_50px_rgba(0,0,0,0.5)] dark:shadow-[30px_0_70px_rgba(0,0,0,0.8)] animate-in slide-in-from-left duration-300">
            {SidebarContent()}
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto main-scrollbar scroll-smooth bg-slate-50 dark:bg-[#0a0f1d] transition-colors duration-500">
        
        {/* Desktop Quick Header */}
        <div className="hidden lg:flex h-20 items-center justify-between pl-8 pr-6 sticky top-0 z-40 bg-pink-100/90 dark:bg-pink-950/80 backdrop-blur-md border-b border-pink-200 dark:border-pink-900 transition-colors duration-500 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.3)]">
          
          {/* Left Branding */}
          <div className="flex items-center">
            <img src="/cnkp-logo-horizontal.png" alt="Nakornping Hospital Logo" className="h-[42px] object-contain drop-shadow-sm transition-transform hover:scale-105 duration-300" />
          </div>

          {/* Centered Department Title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex flex-col justify-center items-center gap-1.5 mt-0.5">
            <span className="whitespace-nowrap text-[22px] lg:text-[25px] font-[900] bg-gradient-to-r from-slate-800 via-rose-700 to-rose-900 dark:from-white dark:via-rose-400 dark:to-rose-600 bg-clip-text text-transparent font-['Prompt'] tracking-tight leading-none drop-shadow-sm">
              ห้องซ่อมบำรุงคอมพิวเตอร์
            </span>
            <div className="flex items-center gap-2 px-0.5">
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500/40 opacity-100"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              </div>
              <span className="text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-0.5">
                ระบบพร้อมใช้งาน • NAKORNPING HOSPITAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-3 pl-4 pr-2 py-1.5 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/50 dark:border-white/5 shadow-sm transition-all hover:shadow-md hover:border-slate-300/50 dark:hover:border-white/10 group">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="relative w-[38px] h-[38px] rounded-full overflow-hidden border border-white/20 shadow-lg bg-black">
                     {/*Header (บนขวา) * */}
                      <img src="/cnkp-logo-transparent.png" alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex flex-col leading-tight mr-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400/60 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-tr from-green-500 to-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                      </div>
                      <span className="text-[9.5px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.15em]">
                        {isAdmin_2 ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                      </span>
                    </div>
                    <span className="text-[14px] font-[800] text-slate-800 dark:text-white font-['Prompt'] tracking-tight">
                      {currentUser.displayName || currentUser.email.split('@')[0]}
                    </span>
                  </div>
                </div>
                
                <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700 opacity-60 mx-1"></div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-700 hover:border-rose-300 transition-all flex items-center justify-center group/logout"
                  title="ออกจากระบบ"
                >
                  <LogOut size={18} className="transition-transform duration-300 group-hover/logout:scale-110 group-hover/logout:-translate-x-0.5" />
                </button>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-pink-100/90 dark:bg-pink-950/80 backdrop-blur-md border-b border-pink-200 dark:border-pink-900 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-500 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
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

      {/* -------------------- Password Lock Modal -------------------- */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden"
            style={passwordShake ? { animation: 'shake 0.5s ease' } : {}}
          >
            {/* Glow top */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-t-3xl"></div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-4 shadow-inner">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white font-['Prompt'] mb-1">คลังพัสดุ (Admin)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-['Prompt'] mb-6">กรุณาใส่รหัสผ่านเพื่อเข้าใช้งาน</p>

              <input
                type="password"
                autoFocus
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="รหัสผ่าน"
                className={`w-full px-4 py-3 rounded-2xl text-center text-lg font-bold tracking-[0.3em] border-2 outline-none transition-all duration-300 font-mono bg-slate-50 dark:bg-slate-700 dark:text-white mb-2 ${
                  passwordError
                    ? 'border-red-400 text-red-600 bg-red-50 dark:bg-red-500/10 placeholder-red-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-800 focus:border-amber-400'
                }`}
              />
              {passwordError && (
                <p className="text-red-500 text-sm font-bold font-['Prompt'] mb-3">❌ รหัสผ่านไม่ถูกต้อง</p>
              )}

              <div className="flex gap-3 w-full mt-3">
                <button
                  onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(false); }}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors font-['Prompt']"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-500/30 transition-all active:scale-95 font-['Prompt']"
                >
                  เข้าใช้งาน
                </button>
              </div>
            </div>

            <style>{`
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                20% { transform: translateX(-8px); }
                40% { transform: translateX(8px); }
                60% { transform: translateX(-6px); }
                80% { transform: translateX(6px); }
              }
            `}</style>
          </div>
        </div>
      )}
      {/* ----------------------------------------------------------------- */}

      {/* -------------------- Auto Logout Warning Modal -------------------- */}
      {showLogoutWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300 w-full h-[100vh]">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col items-center text-center">
            {/* Glowing warning ring */}
            <div className="absolute inset-0 bg-gradient-to-t from-rose-500/10 to-transparent pointer-events-none"></div>
            
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mb-6 relative shadow-inner">
              <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full animate-pulse"></div>
              <Clock className="w-10 h-10 text-rose-600 dark:text-rose-400 relative z-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-800 dark:text-white font-['Prompt'] mb-2">หมดเวลาการใช้งาน</h3>
            <p className="text-slate-600 dark:text-slate-400 font-['Prompt'] text-sm mb-6">
              ระบบจะทำการออกจากระบบอัตโนมัติในอีก
              <br/>
              <span className="text-3xl font-black text-rose-500 block my-4">{logoutCountdown} วินาที</span>
              คุณต้องการใช้งานต่อหรือไม่?
            </p>

            <div className="flex gap-3 w-full relative z-10">
              <button
                onClick={performAutoLogout}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-sm"
               >
                 ออกระบบ
              </button>
              <button
                onClick={extendSession}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
              >
                ใช้งานต่อ
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ----------------------------------------------------------------- */}
    </div>
  );
}
