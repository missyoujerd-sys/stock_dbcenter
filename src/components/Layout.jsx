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
  Package
} from "lucide-react";

export default function Layout({ children }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const isAdmin =
    currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL1||
    currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL2 ||
    currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL3 ||
    currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL4 ||
    currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL5 ||
    currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL6 ||
    currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL7 ||
    currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL8 ||
    currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL9 ||
    currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL10;

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
    ...(isAdmin ? [{ name: "คลังพัสดุ(Admin)", path: "/inventory", icon: Box }] : []),
    { name: "แจ้งซ่อมบริษัท", path: "/repair/entry", icon: Wrench },
    { name: "งานซ่อมทั้งหมด", path: "/repair/dashboard", icon: ClipboardList },
  ];

  const SidebarContent = ({ collapsible = false }) => (
    <div className={`flex flex-col h-full bg-[#030712] text-white transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] relative overflow-hidden border-r border-white-[0.03] select-none ${collapsible && isCollapsed ? 'w-24' : 'w-72 shadow-[30px_0_70px_rgba(0,0,0,0.8)]'}`}>
      {/* Moving Glass Shine Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full ${!isCollapsed ? 'animate-[shine_4s_infinite]' : ''} pointer-events-none`}></div>
      
      {/* Elite Atmospheric Lighting */}
      <div className="absolute top-[-10%] right-[-15%] w-[120%] h-[40%] bg-blue-600/[0.08] blur-[140px] rounded-full pointer-events-none transition-colors duration-[1000ms]"></div>
      <div className="absolute bottom-[-10%] left-[-15%] w-[100%] h-[30%] bg-indigo-700/[0.06] blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Micro-light Edge */}
      <div className="absolute right-0 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-[0.25]"></div>

      <div className={`p-6 flex flex-col h-full relative z-10 transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${collapsible && isCollapsed ? 'px-3' : 'px-6'}`}>
        {/* Elite Branding Section */}
        <div className={`flex items-center gap-4 mb-10 group transition-all duration-[600ms] ${collapsible && isCollapsed ? 'justify-center' : 'px-1'}`}>
          <div className="relative shrink-0">
            {/* Pulsing Core Glow */}
            <div className={`absolute -inset-2 bg-blue-500 rounded-[1.3rem] blur-xl transition-opacity duration-[800ms] animate-pulse ${isCollapsed ? 'opacity-[0.05]' : 'opacity-20'}`}></div>
            <div className={`relative bg-[#0F172A] p-2.5 rounded-[1.1rem] shadow-2xl transform transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] border border-white/20 ${isCollapsed ? 'scale-90' : 'scale-100 group-hover:scale-105'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-600/30 rounded-[1.1rem]"></div>
              <Box size={22} className="text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,250,0.5)]" />
            </div>
          </div>
          {(!collapsible || !isCollapsed) && (
            <div className="overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-6 duration-[800ms] flex flex-col justify-center">
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-slate-400 font-['Prompt'] leading-tight tracking-wide">ระบบ</span>
                <h1 className="text-[26px] font-[900] tracking-[-0.04em] leading-none text-white font-['Prompt'] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] -mt-1 mb-1.5">
                  จัดการ
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-blue-400 tracking-[0.25em] uppercase">STOCK CENTER</span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-400/30 to-transparent"></div>
                </div>
              </div>
              <p className="text-[7px] text-blue-300/40 font-black tracking-[0.5em] uppercase leading-none mt-3 group-hover:text-blue-400/70 transition-colors duration-[600ms]">PREMIUM EDITION</p>
            </div>
          )}
        </div>

        {/* Elite Glass Navigation */}
        <nav className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                title={collapsible && isCollapsed ? item.name : ''}
                className={`flex items-center gap-4 px-4 py-[0.85rem] rounded-[1.25rem] transition-all duration-[600ms] group relative ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                  isActive 
                    ? "text-white bg-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                    : "text-slate-500 hover:text-slate-100"
                } ${collapsible && isCollapsed ? 'justify-center px-0 mx-1' : ''}`}
              >
                {/* Icon Wrapper Circle */}
                <div className={`relative shrink-0 flex items-center justify-center w-11 h-11 rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] border overflow-hidden ${
                  isActive 
                    ? "bg-[#1e293b] border-blue-500/50 shadow-[0_4px_15px_rgba(59,130,246,0.2)] scale-105" 
                    : "bg-white/[0.02] border-white/[0.05] group-hover:bg-white/[0.06] group-hover:border-white/10 group-hover:scale-110"
                }`}>
                  {/* Subtle Icon Glow */}
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-500 opacity-20 blur-[8px] animate-pulse"></div>
                  )}
                  
                  <div className={`relative z-10 transition-all duration-[600ms] ${isActive ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" : "text-slate-500 group-hover:text-blue-300"}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>

                  {/* Glass Shine on Circle */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-[800ms]"></div>
                </div>
                
                {(!collapsible || !isCollapsed) && (
                  <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                    <span className={`font-bold text-[15px] tracking-tight overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-4 duration-[600ms] font-['Prompt'] ${isActive ? 'text-white translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-[300ms]`}>
                      {item.name}
                    </span>
                    {isActive && (
                      <div className="h-[2px] w-6 bg-blue-500 rounded-full mt-0.5 animate-in slide-in-from-left-2 duration-[600ms]"></div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Elite Footer Section */}
        <div className="mt-auto pt-6 border-t border-white/[0.06] space-y-5">
          {currentUser && (
            <div className="space-y-5">
              <div className={`flex items-center gap-4 group/avatar transition-all duration-[600ms] ${collapsible && isCollapsed ? 'justify-center border border-white/5 p-2 rounded-2xl bg-white/[0.02]' : 'px-2'}`}>
                <div className="relative shrink-0">
                  {/* Luxury Avatar Ring */}
                  <div className={`absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-[8px] transition duration-[1000ms] ${isCollapsed ? 'opacity-[0.05]' : 'opacity-25 group-hover/avatar:opacity-60'}`}></div>
                  <div className={`relative rounded-full bg-[#0a0f1d] flex items-center justify-center border border-white/10 shadow-3xl transition-all duration-[600ms] overflow-hidden ${isCollapsed ? 'w-9 h-9' : 'w-11 h-11 group-hover/avatar:scale-105'}`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-indigo-500/20"></div>
                    <User size={isCollapsed ? 18 : 22} className="text-blue-400 relative z-10 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                  </div>
                </div>
                {(!collapsible || !isCollapsed) && (
                  <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-bottom-3 duration-[800ms]">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-1.5">OPERATOR</p>
                    <p className="text-[14px] font-bold text-slate-200 truncate tracking-tight group-hover/avatar:text-white transition-colors duration-[300ms]">
                      {currentUser.email.split('@')[0]}
                    </p>
                  </div>
                )}
              </div>
              
              <div className={`${isCollapsed ? 'px-0' : 'px-1'}`}>
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3.5 py-3.5 rounded-[1.2rem] bg-white/[0.02] text-slate-500 hover:bg-rose-500/[0.1] hover:text-rose-400 transition-all duration-[600ms] font-black text-[13px] border border-white/[0.06] hover:border-rose-500/30 group/logout ease-[cubic-bezier(0.2,0.8,0.2,1)] ${collapsible && isCollapsed ? 'justify-center px-0' : 'justify-center px-4'}`}
                  title={collapsible && isCollapsed ? 'ออกจากระบบ' : ''}
                >
                  <LogOut size={18} className="shrink-0 transition-transform duration-[500ms] group-hover/logout:rotate-[-8deg] group-hover/logout:scale-110" />
                  {(!collapsible || !isCollapsed) && (
                    <span className="overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-4 duration-[700ms] font-['Prompt'] tracking-widest">SIGN OUT</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex overflow-x-hidden font-['Prompt']">
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:block h-screen sticky top-0 shrink-0 transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCollapsed ? 'w-24' : 'w-72'}`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <SidebarContent collapsible={true} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-300">
            <SidebarContent />
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-[-50px] p-2 bg-slate-900 rounded-full text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Box size={18} className="text-white" />
            </div>
            <span className="font-black text-slate-800">STOCK</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-grow p-4 lg:p-10 w-full max-w-[1720px] mx-auto transition-all duration-[600ms]">
          <div className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCollapsed ? 'scale-[0.992] opacity-[0.97]' : 'scale-100 opacity-100'}`}>
            {children}
          </div>
        </main>

        <footer className="py-6 px-10 border-t border-slate-200 text-slate-400 text-sm flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/30 backdrop-blur-sm">
          <p className="font-medium">&copy; {new Date().getFullYear()} ระบบจัดการ Stock พัสดุครุภัณฑ์</p>
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-300">
            <span>Premium Dashboard Interface</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
