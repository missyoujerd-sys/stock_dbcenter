import React from 'react';
import {
  ArrowUp,
  Check,
  Globe,
  Grid2x2,
  Radio,
  ShieldCheck,
  Star,
  Wrench,
  Zap,
} from 'lucide-react';

/** Renders the signature emblem/logo badge for a partner company. */
export default function CompanyEmblem({ company }) {
  if (!company) return null;

  switch (company.emblemType) {
    case 'chichang':
      return (
        <div className="w-full h-full bg-[#09090b] text-white flex flex-col items-center justify-center rounded-2xl px-1">
          <span className="text-[10px] font-black tracking-[0.14em] leading-tight text-center">CHI CHANG</span>
        </div>
      );
    case 'canon':
      return (
        <div className="flex flex-col items-center justify-center">
          <span className="text-[15px] font-black tracking-tight text-red-600 leading-none">Canon</span>
          <span className="text-[7px] font-bold text-slate-400 tracking-widest mt-1">AUTHORIZED</span>
        </div>
      );
    case 'medica':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-9 h-9 rounded-full border-2 border-amber-500 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shadow-inner">
            <span className="text-base font-black text-amber-800">M</span>
          </div>
          <span className="text-[6px] font-bold text-slate-500 mt-0.5 tracking-tight">MEDICA PACKING</span>
        </div>
      );
    case 'others':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center mb-1">
            <Grid2x2 size={15} />
          </div>
          <span className="text-[8px] font-black text-slate-700 leading-none">OTHERS</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">คู่ค้ารายย่อย</span>
        </div>
      );
    case 'goodspeed':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-amber-300 flex items-center justify-center mb-1 shadow-sm">
            <Zap size={14} fill="currentColor" />
          </div>
          <span className="text-[7.5px] font-black text-indigo-700 leading-none">GOODSPEED</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">COMPUTER</span>
        </div>
      );
    case 'northern':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rotate-45 rounded-md bg-gradient-to-tr from-purple-700 to-fuchsia-500 flex items-center justify-center mb-1.5 shadow-sm">
            <div className="w-2.5 h-2.5 bg-white/90 rounded-xs" />
          </div>
          <span className="text-[8px] font-black text-purple-800 leading-none">NORTHERN</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">SYSTEMS</span>
        </div>
      );
    case 'simmaster':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center mb-1 shadow-sm font-black text-[11px]">
            II
          </div>
          <span className="text-[8px] font-black text-cyan-800 leading-none">SIM</span>
          <span className="text-[7px] font-bold text-slate-500 mt-0.5">MASTER</span>
        </div>
      );
    case 'isan':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1 shadow-sm">
            <ArrowUp size={15} strokeWidth={3} />
          </div>
          <span className="text-[9px] font-black text-amber-700 leading-none">ISAN</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">COMPUTER</span>
        </div>
      );
    case 'atp':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-teal-500 text-white flex items-center justify-center mb-1 shadow-sm">
            <ShieldCheck size={15} />
          </div>
          <span className="text-[9px] font-black text-teal-700 leading-none">ATP</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">TECHNOLOGY</span>
        </div>
      );
    case 'supatchar':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center mb-1 shadow-sm">
            <Wrench size={14} />
          </div>
          <span className="text-[7.5px] font-black text-orange-700 leading-none">SUPATCHAR</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">SERVICE</span>
        </div>
      );
    case 'tns':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-sky-700 text-white flex items-center justify-center mb-1 shadow-sm">
            <Radio size={14} />
          </div>
          <span className="text-[9px] font-black text-slate-800 leading-none">TNS</span>
          <span className="text-[6px] font-semibold text-slate-400 mt-0.5">TELECOM NETWORK</span>
        </div>
      );
    case 'gnet':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1 shadow-sm">
            <Globe size={15} />
          </div>
          <span className="text-[8.5px] font-black text-emerald-700 leading-none">G-NET</span>
          <span className="text-[6px] font-semibold text-slate-400 mt-0.5">SYSTEMS &amp; NETWORK</span>
        </div>
      );
    case 'denchai':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center mb-1 shadow-sm">
            <Star size={14} fill="currentColor" />
          </div>
          <span className="text-[8px] font-black text-rose-700 leading-none">DENCHAI</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">TRADING</span>
        </div>
      );
    case 'gotit':
    default:
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center mb-1 shadow-sm">
            <Check size={15} strokeWidth={3} />
          </div>
          <span className="text-[8.5px] font-black text-purple-800 leading-none">GOT IT</span>
          <span className="text-[6.5px] font-semibold text-slate-400 mt-0.5">SOLUTIONS</span>
        </div>
      );
  }
}
