import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] border shadow-[0_4px_15px_rgba(0,0,0,0.1)] overflow-hidden group hover:scale-105 active:scale-95 ${
        isDarkMode 
        ? 'bg-[#1e293b] border-blue-500/50 hover:border-blue-400' 
        : 'bg-white/80 border-amber-200/50 hover:border-amber-300'
      }`}
      aria-label="Toggle Dark Mode"
    >
      {/* Background glow effects */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-[8px] ${
        isDarkMode ? 'bg-blue-500' : 'bg-amber-400'
      }`}></div>
      
      {/* Container for absolute positioning animations */}
      <div className="relative w-[22px] h-[22px] flex items-center justify-center">
        {/* Sun Icon */}
        <div className={`absolute transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] origin-center ${
          isDarkMode ? 'opacity-0 scale-50 -rotate-90' : 'opacity-100 scale-100 rotate-0'
        }`}>
          <Sun size={20} className="text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" strokeWidth={2.5} />
        </div>
        
        {/* Moon Icon */}
        <div className={`absolute transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] origin-center ${
          isDarkMode ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'
        }`}>
          <Moon size={20} className="text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.6)]" strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
}
