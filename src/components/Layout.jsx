import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
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
  ArrowLeftRight,
  MessageSquare,
  Monitor
} from "lucide-react";
import emblemSvg from "../assets/emblem.svg";
import ThemeToggle from "./ThemeToggle";


export default function Layout({ children }) {
  const { currentUser, isAdmin, isAdmin_2, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isGridMode, setIsGridMode] = React.useState(false);
  const [gridVisible, setGridVisible] = React.useState(false);

  // -- สำหรับ Password Lock (Admin Inventory) --
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [passwordInput, setPasswordInput] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordShake, setPasswordShake] = React.useState(false);
  const [adminPassword, setAdminPassword] = React.useState('101988');

  React.useEffect(() => {
    const passRef = ref(db, 'settings/adminPassword');
    const unsubscribe = onValue(passRef, (snapshot) => {
      if (snapshot.exists()) {
        setAdminPassword(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAdminNavClick = (e) => {
    e.preventDefault();
    setPasswordInput('');
    setPasswordError(false);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === adminPassword) {
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
    }, 15 * 60 * 1000); // ตั้งค่า 15 นาที
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
    ...(isAdmin_2 ? [{ name: "คลังพัสดุ (Admin)", path: "/inventory", icon: Box, imgSrc: "/คลังพัสดุ.png", locked: true }] : []),
    { name: "อุปกรณ์คอมพิวเตอร์และต่อพ่วง", path: "/computer-equipment", icon: Monitor, imgSrc: "/คลังพัสดุ.png" },
    { name: "ทะเบียน ยืม-คืน", path: "/borrow", icon: ArrowLeftRight, imgSrc: "/ทะเบียนยืนคืน.png" },
    { name: "ห้องพูดคุย", path: "/chat", icon: MessageSquare },
    { name: "แจ้งซ่อมบริษัท", path: "/repair/entry", icon: Wrench, imgSrc: "/แจ้งซ่อม.png" },
    { name: "งานซ่อมทั้งหมด", path: "/repair/dashboard", icon: ClipboardList, imgSrc: "/รายงานสรุปแจ้งซ่อม.png" },
  ];

  const SidebarContent = () => (
      <div className={`flex flex-col h-full bg-[#050505] dark:bg-[#000000] text-slate-200 dark:text-slate-200 transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] relative overflow-hidden border-r border-slate-800 dark:border-slate-800 select-none w-full shadow-[30px_0_70px_rgba(0,0,0,0.8)] dark:shadow-[30px_0_70px_rgba(0,0,0,0.8)]`}>
       <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full animate-[shine_4s_infinite] pointer-events-none`}></div>
      
      {/* Elite Atmospheric Lighting */}
       <div className="absolute top-[-10%] right-[-15%] w-[120%] h-[40%] bg-purple-400/[0.15] dark:bg-white/[0.03] blur-[140px] rounded-full pointer-events-none transition-colors duration-[1000ms]"></div>
      <div className="absolute bottom-[-10%] left-[-15%] w-[100%] h-[30%] bg-fuchsia-400/[0.15] dark:bg-white/[0.02] blur-[120px] rounded-full pointer-events-none transition-colors duration-[1000ms]"></div>
      
      {/* Micro-light Edge */}
      <div className="absolute right-0 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-[0.25]"></div>

      <div className={`flex flex-col h-full relative z-10 transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isSidebarCollapsed ? 'py-6 px-2' : 'py-6 px-4'}`}>
        {/* Toggle Sidebar Button - inside top-right */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-4 right-3 z-[60] flex items-center justify-center w-8 h-8 rounded-lg shadow-md hover:scale-110 transition-all duration-300 cursor-pointer border border-rose-200 hover:border-rose-300 hover:shadow-rose-200/60"
          style={{ background: 'linear-gradient(135deg, #fff0f3 60%, #ffe4ea 100%)' }}
          title={isSidebarCollapsed ? 'เปิด Sidebar' : 'ซ่อน Sidebar'}
        >
          {isSidebarCollapsed
            ? <ChevronRight size={16} className="text-rose-500 drop-shadow-sm" strokeWidth={2.5} />
            : <ChevronLeft size={16} className="text-rose-500 drop-shadow-sm" strokeWidth={2.5} />
          }
        </button>
        {/* Elite Branding Section */}
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center mb-8' : 'gap-4 mb-10 px-1'} group transition-all duration-[600ms]`}>
          <div className="relative shrink-0">
            {/* Pulsing Core Glow */}
            <div className={`relative bg-white p-[-1px] rounded-full shadow-sm border border-purple-200/50 transform transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] scale-100 group-hover:scale-105 flex items-center justify-center`}>
              <img src="/โลโก้ ร.พ ข้างขวา.png" alt="Hospital Logo" className="relative z-10 w-11 h-11 object-contain rounded-full drop-shadow-sm" style={{ filter: 'brightness(1.1)' }} />
            </div>
          </div>
          <div className={`overflow-hidden whitespace-nowrap flex flex-col justify-center transition-all duration-[600ms] ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-[200px] opacity-100'}`}>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[16px] font-bold text-slate-700 dark:text-slate-200 font-['Prompt'] leading-tight tracking-wide drop-shadow-sm">ระบบ</span>
                
                {/* IT NKP Logo in place of Status Pill */}
                <img 
                  src="/it nkp-transparent.png" 
                  alt="IT NKP" 
                  className="h-[28px] object-contain opacity-90 block" 
                  style={{ clipPath: 'inset(2px)' }}
                />
              </div>
              <h1 className="text-[26px] font-[900] tracking-[-0.04em] leading-none text-slate-900 dark:text-white font-['Prompt'] -mt-1 mb-1.5">
                จัดการ
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-blue-400 dark:text-blue-400 tracking-[0.25em] uppercase">STOCK-แจ้งซ่อมบริษัท</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-400/30 to-transparent"></div>
              </div>
            </div>
            <p className="text-[11px] text-purple-600/90 dark:text-purple-400/80 font-black tracking-widest uppercase leading-none mt-3 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-[900ms] drop-shadow-sm">ห้องซ่อมบำรุงคอมพิวเตอร์</p>
          </div>
        </div>

        {/* View Toggle Button - Grid / List */}
        {!isSidebarCollapsed && (
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-black text-purple-400 dark:text-purple-500 uppercase tracking-[0.25em]">
              {isGridMode ? 'เมนูหลัก' : 'เมนูหลัก'}
            </span>
            <button
              onClick={() => {
                if (!isGridMode) {
                  setIsGridMode(true);
                  setTimeout(() => setGridVisible(true), 50);
                } else {
                  setGridVisible(false);
                  setTimeout(() => setIsGridMode(false), 400);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 border cursor-pointer"
              style={isGridMode
                ? { background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: 'white', borderColor: 'transparent', boxShadow: '0 4px 14px rgba(168,85,247,0.4)' }
                : { background: 'rgba(168,85,247,0.08)', color: '#9333ea', borderColor: 'rgba(168,85,247,0.2)' }
              }
              title={isGridMode ? 'สลับเป็น List' : 'สลับเป็น Grid'}
            >
              {isGridMode ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              )}
              {isGridMode ? 'List' : 'Grid'}
            </button>
          </div>
        )}

        {/* Elite Glass Navigation */}
        <nav className={`flex-1 overflow-y-auto sidebar-scrollbar py-2 pr-1 mr-[-4px] ${isGridMode && !isSidebarCollapsed ? '' : 'space-y-2.5'}`}>
          {/* GRID MODE */}
          {isGridMode && !isSidebarCollapsed ? (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: 'repeat(2, 1fr)',
                opacity: gridVisible ? 1 : 0,
                transform: gridVisible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 400ms cubic-bezier(0.2,0.8,0.2,1), transform 400ms cubic-bezier(0.2,0.8,0.2,1)',
              }}
            >
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const cardColors = [
                  { bg: 'linear-gradient(135deg,#fdf2f8,#fce7f3)', glow: 'rgba(236,72,153,0.18)', icon: 'linear-gradient(135deg,#f472b6,#ec4899)', border: 'rgba(244,114,182,0.25)', text: '#be185d', shine: '#fdf2f8' },
                  { bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', glow: 'rgba(139,92,246,0.18)', icon: 'linear-gradient(135deg,#a78bfa,#8b5cf6)', border: 'rgba(167,139,250,0.25)', text: '#6d28d9', shine: '#f5f3ff' },
                  { bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', glow: 'rgba(59,130,246,0.18)', icon: 'linear-gradient(135deg,#60a5fa,#3b82f6)', border: 'rgba(96,165,250,0.25)', text: '#1d4ed8', shine: '#eff6ff' },
                  { bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', glow: 'rgba(34,197,94,0.18)', icon: 'linear-gradient(135deg,#4ade80,#22c55e)', border: 'rgba(74,222,128,0.25)', text: '#15803d', shine: '#f0fdf4' },
                  { bg: 'linear-gradient(135deg,#fff7ed,#ffedd5)', glow: 'rgba(249,115,22,0.18)', icon: 'linear-gradient(135deg,#fb923c,#f97316)', border: 'rgba(251,146,60,0.25)', text: '#c2410c', shine: '#fff7ed' },
                  { bg: 'linear-gradient(135deg,#fefce8,#fef9c3)', glow: 'rgba(234,179,8,0.18)', icon: 'linear-gradient(135deg,#facc15,#eab308)', border: 'rgba(250,204,21,0.25)', text: '#a16207', shine: '#fefce8' },
                  { bg: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', glow: 'rgba(14,165,233,0.18)', icon: 'linear-gradient(135deg,#38bdf8,#0ea5e9)', border: 'rgba(56,189,248,0.25)', text: '#0369a1', shine: '#f0f9ff' },
                  { bg: 'linear-gradient(135deg,#fdf4ff,#fae8ff)', glow: 'rgba(217,70,239,0.18)', icon: 'linear-gradient(135deg,#e879f9,#d946ef)', border: 'rgba(232,121,249,0.25)', text: '#a21caf', shine: '#fdf4ff' },
                ];
                const c = cardColors[idx % cardColors.length];
                const cardContent = (
                  <div
                    className="relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl cursor-pointer select-none group/card overflow-hidden"
                    style={{
                      background: isActive
                        ? c.icon
                        : c.bg,
                      border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.4)' : c.border}`,
                      boxShadow: isActive
                        ? `0 8px 24px ${c.glow}, 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 1px rgba(255,255,255,0.35)`
                        : `0 4px 14px ${c.glow}, 0 1px 4px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.7)`,
                      minHeight: '88px',
                      animationDelay: `${idx * 60}ms`,
                      transition: 'all 0.38s cubic-bezier(0.2,0.8,0.2,1)',
                    }}
                  >
                    {/* Shine sweep */}
                    <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 pointer-events-none"
                      style={{ background: 'linear-gradient(120deg,transparent 30%,rgba(255,255,255,0.45) 50%,transparent 70%)', transition: 'opacity 0.4s ease', backgroundSize: '200% 100%' }}
                    />
                    {/* Active glow ring */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl animate-pulse" style={{ boxShadow: `inset 0 0 20px rgba(255,255,255,0.25)` }} />
                    )}
                    {/* Lock badge */}
                    {item.locked && (
                      <span className="absolute top-1.5 right-1.5 text-[11px] z-10">🔒</span>
                    )}
                    {/* Icon */}
                    <div
                      className="relative flex items-center justify-center rounded-xl shadow-sm"
                      style={{
                        width: '42px', height: '42px',
                        background: isActive ? 'rgba(255,255,255,0.28)' : c.icon,
                        boxShadow: `0 4px 12px ${c.glow}`,
                        transition: 'transform 0.35s cubic-bezier(0.2,0.8,0.2,1)',
                      }}
                    >
                      {item.imgSrc ? (
                        <img src={item.imgSrc} alt={item.name} className="w-6 h-6 object-contain drop-shadow" />
                      ) : (
                        <Icon size={20} className="text-white drop-shadow" strokeWidth={2.2} />
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className="text-center leading-tight font-['Prompt'] font-black"
                      style={{
                        fontSize: '10.5px',
                        color: isActive ? 'rgba(255,255,255,0.95)' : c.text,
                        letterSpacing: '0.01em',
                        textShadow: isActive ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
                        lineHeight: 1.25,
                        maxWidth: '80px',
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.name}
                    </span>
                    {/* Active underline dot */}
                    {isActive && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-white/80"></div>
                        <div className="w-1.5 h-1 rounded-full bg-white"></div>
                        <div className="w-1 h-1 rounded-full bg-white/80"></div>
                      </div>
                    )}
                  </div>
                );
                if (item.locked) {
                  return (
                    <a
                      key={item.path}
                      href="#"
                      onClick={handleAdminNavClick}
                      className="no-underline block nav-grid-card-hover"
                      style={{ textDecoration: 'none', animationDelay: `${idx * 60}ms` }}
                    >
                      {cardContent}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block nav-grid-card-hover"
                    style={{ textDecoration: 'none', animationDelay: `${idx * 60}ms` }}
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          ) : (
            /* LIST MODE */
            navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const linkContent = (
                <>
                  {/* Icon Wrapper Circle */}
                  <div className={`relative shrink-0 flex items-center justify-center w-11 h-11 rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] border overflow-hidden ${
                    isActive 
                      ? "bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-500/50 shadow-[0_4px_15px_rgba(168,85,247,0.3)] scale-105" 
                      : "bg-white/50 dark:bg-slate-800/50 border-purple-200/50 dark:border-slate-600/50 group-hover:bg-white/80 dark:group-hover:bg-slate-700/60 group-hover:border-purple-300 dark:group-hover:border-purple-500/50 group-hover:scale-110"
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
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-[800ms]"></div>
                  </div>

                  <div className={`flex flex-col flex-1 min-w-0 transition-all duration-[600ms] overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
                    <span className={`font-bold text-[15px] tracking-tight overflow-hidden whitespace-nowrap font-['Prompt'] ${isActive ? 'text-purple-700 dark:text-purple-300 translate-x-1' : 'text-slate-700 dark:text-slate-300 group-hover:translate-x-1'} transition-all duration-[300ms]`}>
                      {item.name}
                    </span>
                    {isActive && !isSidebarCollapsed && (
                      <div className="h-[2px] w-6 bg-purple-500 rounded-full mt-0.5 animate-in slide-in-from-left-2 duration-[600ms]"></div>
                    )}
                  </div>
                  {item.locked && (
                    <span className={`text-amber-500 shrink-0 transition-all duration-[300ms] ${isSidebarCollapsed ? 'absolute -top-1 -right-1 text-[12px] bg-white rounded-full w-5 h-5 flex items-center justify-center border border-purple-200 z-20' : 'text-[16px]'}`}>🔒</span>
                  )}
                </>
              );
              if (item.locked) {
                return (
                  <a
                    key={item.path}
                    href="#"
                    onClick={handleAdminNavClick}
                    className={`flex items-center ${isSidebarCollapsed ? 'justify-center p-2 mb-2' : 'gap-4 px-4 py-[0.85rem]'} rounded-[1.25rem] transition-all duration-[600ms] group relative ease-[cubic-bezier(0.2,0.8,0.2,1)] no-underline ${
                      isActive 
                        ? "text-purple-600 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-500/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]" 
                        : "text-slate-600 dark:text-slate-400 hover:text-purple-900 dark:hover:text-purple-200 hover:bg-purple-500/5 dark:hover:bg-purple-500/10"
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
                  className={`flex items-center ${isSidebarCollapsed ? 'justify-center p-2 mb-2' : 'gap-4 px-4 py-[0.85rem]'} rounded-[1.25rem] transition-all duration-[600ms] group relative ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                    isActive 
                      ? "text-purple-600 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-500/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]" 
                      : "text-slate-600 dark:text-slate-400 hover:text-purple-900 dark:hover:text-purple-200 hover:bg-purple-500/5 dark:hover:bg-purple-500/10"
                  }`}
                >
                  {linkContent}
                </Link>
              );
            })
          )}
        </nav>

        {/* Elite Footer Section */}
        <div className="mt-auto pt-6 border-t border-purple-200/50 dark:border-slate-700/50 space-y-5">
          {currentUser && (
            <div className={`flex flex-col ${isSidebarCollapsed ? 'space-y-4 items-center' : 'space-y-5'}`}>
              <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-2'} group/avatar transition-all duration-[600ms]`}>
                <div className="relative shrink-0">
                  {/* Luxury Avatar Ring */}
                  <div className={`absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-[8px] transition duration-[1000ms] opacity-25 group-hover/avatar:opacity-60`}></div>
                  <div className={`relative rounded-full bg-[#0a0f1d] flex items-center justify-center border border-white/10 shadow-3xl transition-all duration-[600ms] overflow-hidden w-11 h-11 group-hover/avatar:scale-105`}>
                    <div className="absolute inset-0 bg-black"></div>
                    {/* Sidebar (ล่างซ้าย) */}  
                    <img src="/cat-3.png" alt="Profile" className="w-full h-full object-cover relative z-10" />
                  </div>
                </div>
                <div className={`flex-1 min-w-0 transition-all duration-[600ms] overflow-hidden whitespace-nowrap ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
                  <p className="text-[12px] font-black text-indigo-800 dark:text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1.5 whitespace-nowrap">ยินดีต้อนรับ</p>
                  <p className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400 truncate tracking-tight group-hover/avatar:text-purple-900 dark:group-hover/avatar:text-purple-300 transition-colors duration-[300ms]">
                    {currentUser.email.split('@')[0]}
                  </p>
                </div>
              </div>
              
              <div className="px-1 w-full">
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center justify-center ${isSidebarCollapsed ? 'p-3 gap-0' : 'gap-3.5 py-3.5 px-4'} rounded-[1.2rem] bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-700 transition-all duration-[600ms] font-black text-[13px] border border-rose-200 dark:border-rose-500/20 hover:border-rose-300 group/logout ease-[cubic-bezier(0.2,0.8,0.2,1)]`}
                >
                  <LogOut size={18} className="shrink-0 transition-transform duration-[500ms] group-hover/logout:rotate-[-8deg] group-hover/logout:scale-110" />
                  <span className={`transition-all duration-[600ms] font-['Prompt'] tracking-widest overflow-hidden whitespace-nowrap ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-[110px] opacity-100'}`}>SIGN OUT</span>
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
      <aside className={`hidden lg:block h-full shrink-0 ${isSidebarCollapsed ? 'w-[80px]' : 'w-[320px]'} transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] relative z-50`}>
        {SidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className={`relative ${isSidebarCollapsed ? 'w-[80px]' : 'w-[320px] max-w-[85vw]'} h-full shadow-[20px_0_50px_rgba(0,0,0,0.5)] dark:shadow-[30px_0_70px_rgba(0,0,0,0.8)] animate-in slide-in-from-left duration-300 transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)]`}>
            {SidebarContent()}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`absolute top-4 ${isSidebarCollapsed ? 'right-[-45px]' : 'right-[-50px]'} p-2 bg-slate-900 dark:bg-slate-800 rounded-full text-white transition-all`}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto main-scrollbar scroll-smooth bg-slate-50 dark:bg-[#0a0f1d] transition-colors duration-500">
        
        {/* Desktop Quick Header */}
        <div className="hidden lg:flex h-20 items-center justify-between pl-8 pr-6 sticky top-0 z-40 bg-slate-200/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-800 transition-colors duration-500 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.3)]">
          
          {/* Left Branding */}
          <div className="flex items-center">
            <img src="/cnkp-logo-horizontal.png" alt="Nakornping Hospital Logo" className="h-[42px] object-contain drop-shadow-sm transition-transform hover:scale-105 duration-300" />
          </div>

          {/* Centered Department Title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex flex-col justify-center items-center mt-0.5">
            <div className="flex items-center gap-4 mb-1.5">
              {/* Mourning Ribbon Left */}
              <svg fill="#111111" viewBox="0 0 330 330" className="w-5 h-5 md:w-6 md:h-6 drop-shadow-md">
                <path d="M228.665,99.967c0-35.034-28.503-63.537-63.537-63.537s-63.537,28.503-63.537,63.537c0,27.148,22.868,54.89,68.032,82.531L75.529,322.253l25.864,15.111l63.734-109.079l64.129,109.756l25.864-15.111l-94.489-161.761C205.805,134.786,228.665,116.592,228.665,99.967z M165.127,159.263c-30.82-20.732-33.537-41.979-33.537-59.295c0-18.492,15.045-33.537,33.537-33.537s33.537,15.045,33.537,33.537C198.665,116.653,195.962,138.455,165.127,159.263z"/>
              </svg>
              <span className="whitespace-nowrap text-[22px] lg:text-[25px] font-[900] bg-gradient-to-r from-slate-800 via-rose-700 to-rose-900 dark:from-white dark:via-rose-400 dark:to-rose-600 bg-clip-text text-transparent font-['Prompt'] tracking-tight leading-none drop-shadow-sm">
                ห้องซ่อมบำรุงคอมพิวเตอร์
              </span>
              {/* Mourning Ribbon Right */}
              <svg fill="#111111" viewBox="0 0 330 330" className="w-5 h-5 md:w-6 md:h-6 drop-shadow-md">
                <path d="M228.665,99.967c0-35.034-28.503-63.537-63.537-63.537s-63.537,28.503-63.537,63.537c0,27.148,22.868,54.89,68.032,82.531L75.529,322.253l25.864,15.111l63.734-109.079l64.129,109.756l25.864-15.111l-94.489-161.761C205.805,134.786,228.665,116.592,228.665,99.967z M165.127,159.263c-30.82-20.732-33.537-41.979-33.537-59.295c0-18.492,15.045-33.537,33.537-33.537s33.537,15.045,33.537,33.537C198.665,116.653,195.962,138.455,165.127,159.263z"/>
              </svg>
            </div>
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
                    <div className="relative w-[38px] h-[38px] rounded-full overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm bg-white flex items-center justify-center p-[2px]">
                     {/*Header (บนขวา) * */}
                      <img src="/รูปโบว์ไว้อาลัย.png" alt="Profile" className="w-full h-full object-contain rounded-full" />
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
        <header className="lg:hidden h-16 bg-slate-200/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-500 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col">
            <img src="/cnkp-logo-horizontal.png" alt="Nakornping Hospital Logo" className="h-7 object-contain drop-shadow-sm mb-0.5" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black bg-gradient-to-r from-rose-500 via-rose-700 to-rose-900 dark:from-rose-400 dark:via-rose-300 dark:to-rose-500 bg-clip-text text-transparent font-['Prompt'] tracking-wider leading-none whitespace-nowrap">
                ห้องซ่อมบำรุงคอมพิวเตอร์
              </span>
              <svg fill="#111111" viewBox="0 0 330 330" className="w-3.5 h-3.5 drop-shadow-sm">
                <path d="M228.665,99.967c0-35.034-28.503-63.537-63.537-63.537s-63.537,28.503-63.537,63.537c0,27.148,22.868,54.89,68.032,82.531L75.529,322.253l25.864,15.111l63.734-109.079l64.129,109.756l25.864-15.111l-94.489-161.761C205.805,134.786,228.665,116.592,228.665,99.967z M165.127,159.263c-30.82-20.732-33.537-41.979-33.537-59.295c0-18.492,15.045-33.537,33.537-33.537s33.537,15.045,33.537,33.537C198.665,116.653,195.962,138.455,165.127,159.263z"/>
              </svg>
            </div>
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

        <main className="flex-grow p-2 sm:p-4 lg:p-10 w-full max-w-[1720px] mx-auto transition-all duration-500">

          <div className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] scale-100 opacity-100`}>
            {children}
          </div>
        </main>

        <footer className="py-4 px-4 sm:px-10 border-t border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 text-sm flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/30 dark:bg-[#0f172a]/30 backdrop-blur-sm transition-colors duration-500">
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
