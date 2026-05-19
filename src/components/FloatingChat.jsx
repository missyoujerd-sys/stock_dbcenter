import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { ref, push, onValue, off, query, limitToLast, orderByChild } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Send, X, ChevronDown, Minimize2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const CHAT_REF = 'chatMessages/general';

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export default function FloatingChat() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTimestamp, setLastReadTimestamp] = useState(Date.now());
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const prevOpenRef = useRef(false);

  // Don't show on chat page
  if (location.pathname === '/chat') return null;

  // Load messages
  useEffect(() => {
    const messagesRef = query(
      ref(db, CHAT_REF),
      orderByChild('timestamp'),
      limitToLast(50)
    );
    const handler = (snap) => {
      const data = snap.val();
      if (data) {
        const msgs = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(msgs);
        // Count unread
        if (!isOpen) {
          const unread = msgs.filter(m => m.timestamp > lastReadTimestamp && m.uid !== currentUser?.uid).length;
          setUnreadCount(unread);
        }
      } else {
        setMessages([]);
      }
    };
    onValue(messagesRef, handler);
    return () => off(messagesRef, 'value', handler);
  }, [isOpen, lastReadTimestamp, currentUser?.uid]);

  // Scroll to bottom when opened or new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, isOpen, isMinimized]);

  // Mark as read when opened
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setUnreadCount(0);
      setLastReadTimestamp(Date.now());
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !currentUser || sending) return;
    setSending(true);
    setInputText('');
    try {
      await push(ref(db, CHAT_REF), {
        text,
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0],
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 z-[999] w-[340px] rounded-3xl shadow-2xl shadow-violet-500/20 border border-violet-200/50 dark:border-violet-800/50 overflow-hidden flex flex-col transition-all duration-300 ${
            isMinimized ? 'h-[56px]' : 'h-[480px]'
          } animate-in fade-in slide-in-from-bottom-4`}
          style={{ backdropFilter: 'blur(20px)' }}
        >
          {/* Panel Header */}
          <div className="relative flex items-center gap-3 px-4 py-3 shrink-0 cursor-pointer select-none"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            onClick={() => setIsMinimized(v => !v)}
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageSquare size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-[14px] font-['Prompt'] leading-none">ห้องพูดคุย</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/70 text-[10px] font-['Prompt']">ออนไลน์</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={e => { e.stopPropagation(); setIsMinimized(v => !v); }}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title={isMinimized ? 'ขยาย' : 'ย่อ'}
              >
                {isMinimized ? <ChevronDown size={14} /> : <Minimize2 size={14} />}
              </button>
              <button
                onClick={e => { e.stopPropagation(); setIsOpen(false); }}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="ปิด"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-3 py-3 bg-white dark:bg-slate-900 space-y-2"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.2) transparent' }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                    <MessageSquare size={28} className="text-slate-300" />
                    <p className="text-slate-400 text-[12px] font-['Prompt'] text-center">ยังไม่มีข้อความ<br/>เริ่มสนทนาได้เลย!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.uid === currentUser?.uid;
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div
                          className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ background: isOwn ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'linear-gradient(135deg, #64748b, #94a3b8)' }}
                        >
                          {(msg.displayName || msg.email || '?')[0].toUpperCase()}
                        </div>
                        <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                          {!isOwn && (
                            <span className="text-[10px] text-slate-400 mb-0.5 ml-1 font-['Prompt']">
                              {msg.displayName || msg.email?.split('@')[0]}
                            </span>
                          )}
                          <div className={`px-3 py-2 rounded-2xl text-[13px] font-['Prompt'] leading-snug break-words ${
                            isOwn
                              ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[9px] text-slate-300 dark:text-slate-600 mt-0.5 mx-1">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-3 py-2.5 flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="พิมพ์ข้อความ..."
                  className="flex-1 text-[13px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition-all font-['Prompt'] placeholder-slate-400"
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    inputText.trim() && !sending
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:scale-105 shadow-md shadow-violet-500/30'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {sending
                    ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send size={15} />
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className={`fixed bottom-6 right-6 z-[998] w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen
            ? 'bg-slate-600 dark:bg-slate-700 shadow-slate-500/30 rotate-0'
            : 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-500/40'
        }`}
        title={isOpen ? 'ปิดห้องพูดคุย' : 'เปิดห้องพูดคุย'}
      >
        <div className="relative">
          {isOpen ? (
            <X size={24} className="text-white" />
          ) : (
            <MessageSquare size={24} className="text-white" />
          )}
          {/* Unread badge */}
          {!isOpen && unreadCount > 0 && (
            <div className="absolute -top-2.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200 border-2 border-white dark:border-slate-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
        {/* Pulse ring when unread */}
        {!isOpen && unreadCount > 0 && (
          <div className="absolute inset-0 rounded-2xl bg-violet-500/40 animate-ping" />
        )}
      </button>
    </>
  );
}
