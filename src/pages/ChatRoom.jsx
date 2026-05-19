import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { ref, push, onValue, off, remove, serverTimestamp, query, limitToLast, orderByChild } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { Send, Trash2, MessageSquare, Users, Smile, ChevronDown } from 'lucide-react';

const CHAT_REF = 'chatMessages/general';
const MAX_MESSAGES = 200;

const EMOJIS = ['😊', '👍', '🎉', '❤️', '😂', '🙏', '✅', '🔧', '💻', '📦', '⚠️', '🚀'];

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return timeStr;
  return `${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} ${timeStr}`;
}

function formatDateDivider(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'วันนี้';
  if (d.toDateString() === yesterday.toDateString()) return 'เมื่อวาน';
  return d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function isSameDay(ts1, ts2) {
  if (!ts1 || !ts2) return false;
  return new Date(ts1).toDateString() === new Date(ts2).toDateString();
}

function MessageBubble({ msg, isOwn, isAdmin_2, onDelete, showAvatar, showName }) {
  const [showDeleteBtn, setShowDeleteBtn] = useState(false);

  return (
    <div
      className={`flex items-end gap-2 mb-1 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowDeleteBtn(true)}
      onMouseLeave={() => setShowDeleteBtn(false)}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md transition-opacity duration-300 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: isOwn ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'linear-gradient(135deg, #64748b, #94a3b8)' }}
      >
        {(msg.displayName || msg.email || '?')[0].toUpperCase()}
      </div>

      {/* Bubble content */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showName && !isOwn && (
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1 font-['Prompt']">
            {msg.displayName || msg.email?.split('@')[0] || 'ไม่ระบุชื่อ'}
          </span>
        )}
        <div className="flex items-end gap-2">
          {/* Delete button (admin or own message) */}
          {(isAdmin_2 || isOwn) && (
            <button
              onClick={() => onDelete(msg.id)}
              className={`shrink-0 p-1 rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all duration-200 ${isOwn ? 'order-first' : 'order-last'} ${showDeleteBtn ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
              title="ลบข้อความ"
            >
              <Trash2 size={13} />
            </button>
          )}
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-sm text-[14px] leading-relaxed font-['Prompt'] break-words transition-all duration-200 ${
              isOwn
                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm shadow-violet-500/20 shadow-md'
                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-600 rounded-bl-sm'
            }`}
          >
            {msg.text}
          </div>
        </div>
        <span className={`text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 ${isOwn ? 'mr-10' : 'ml-10'}`}>
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

export default function ChatRoom() {
  const { currentUser, isAdmin_2 } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [onlineCount] = useState(Math.floor(Math.random() * 3) + 1); // placeholder
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Load messages from Firebase
  useEffect(() => {
    const messagesRef = query(
      ref(db, CHAT_REF),
      orderByChild('timestamp'),
      limitToLast(MAX_MESSAGES)
    );

    const handleMessages = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(msgs);
      } else {
        setMessages([]);
      }
      setLoading(false);
    };

    onValue(messagesRef, handleMessages);
    return () => off(messagesRef, 'value', handleMessages);
  }, []);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (!showScrollBtn) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollBtn]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBtn(!isNearBottom);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBtn(false);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !currentUser || sending) return;
    setSending(true);
    setInputText('');
    setShowEmoji(false);
    try {
      await push(ref(db, CHAT_REF), {
        text,
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0],
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error('Send failed:', e);
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

  const handleDelete = async (msgId) => {
    if (!window.confirm('ลบข้อความนี้?')) return;
    try {
      await remove(ref(db, `${CHAT_REF}/${msgId}`));
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const addEmoji = (emoji) => {
    setInputText(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative rounded-t-3xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
        <div className="relative z-10 flex items-center gap-4 px-6 py-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/30">
            <MessageSquare size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-white font-['Prompt'] tracking-tight leading-none">
              ห้องพูดคุย
            </h2>
            <p className="text-white/70 text-[12px] font-['Prompt'] mt-0.5">ระบบห้องซ่อมบำรุงคอมพิวเตอร์ • Real-time Chat</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <Users size={13} className="text-white/80" />
            <span className="text-white/90 text-[12px] font-bold">{onlineCount} คน</span>
          </div>
        </div>
        {/* Animated gradient border */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-400 via-pink-400 to-indigo-400 opacity-80" />
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50 dark:bg-slate-900/50 space-y-0.5 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
            <p className="text-slate-400 font-['Prompt'] text-sm">กำลังโหลดข้อความ...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60">
            <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <MessageSquare size={36} className="text-violet-400" />
            </div>
            <p className="text-slate-400 dark:text-slate-500 font-['Prompt'] text-center text-sm">
              ยังไม่มีข้อความในห้องนี้<br />เป็นคนแรกที่เริ่มการสนทนา! 💬
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isOwn = msg.uid === currentUser?.uid;
              const prevMsg = messages[idx - 1];
              const nextMsg = messages[idx + 1];
              const showDivider = !prevMsg || !isSameDay(prevMsg.timestamp, msg.timestamp);
              const isSameAuthorAsPrev = prevMsg && prevMsg.uid === msg.uid && isSameDay(prevMsg.timestamp, msg.timestamp);
              const isSameAuthorAsNext = nextMsg && nextMsg.uid === msg.uid && isSameDay(nextMsg.timestamp, msg.timestamp);
              const showAvatar = !isSameAuthorAsNext;
              const showName = !isOwn && !isSameAuthorAsPrev;

              return (
                <React.Fragment key={msg.id}>
                  {showDivider && (
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-3 py-1 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm font-['Prompt']">
                        {formatDateDivider(msg.timestamp)}
                      </span>
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                    </div>
                  )}
                  <div
                    className="animate-in fade-in slide-in-from-bottom-1 duration-300"
                    style={{ marginBottom: isSameAuthorAsNext ? '2px' : '10px' }}
                  >
                    <MessageBubble
                      msg={msg}
                      isOwn={isOwn}
                      isAdmin_2={isAdmin_2}
                      onDelete={handleDelete}
                      showAvatar={showAvatar}
                      showName={showName}
                    />
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <div className="relative">
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-6 z-10 w-10 h-10 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-500/40 flex items-center justify-center hover:bg-violet-700 transition-all duration-200 hover:scale-110 animate-in fade-in slide-in-from-bottom-2"
          >
            <ChevronDown size={20} />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="relative bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-4 py-3 rounded-b-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {/* Emoji picker */}
        {showEmoji && (
          <div className="absolute bottom-full mb-2 left-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-3 flex flex-wrap gap-2 w-60 animate-in fade-in slide-in-from-bottom-2 duration-200 z-20">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => addEmoji(e)}
                className="text-xl hover:scale-125 transition-transform duration-150 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* Emoji toggle */}
          <button
            onClick={() => setShowEmoji(v => !v)}
            className={`shrink-0 p-2.5 rounded-xl transition-all duration-200 ${showEmoji ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600' : 'text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <Smile size={20} />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={e => {
                setInputText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="พิมพ์ข้อความ... (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
              className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500 font-['Prompt'] leading-relaxed max-h-[120px] overflow-y-auto"
              style={{ scrollbarWidth: 'thin' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 shadow-md ${
              inputText.trim() && !sending
                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 hover:scale-105 shadow-violet-500/30'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} className={inputText.trim() ? '' : ''} />
            )}
          </button>
        </div>

        <p className="text-[10px] text-slate-300 dark:text-slate-600 text-center mt-2 font-['Prompt']">
          กด Enter เพื่อส่ง • Shift+Enter เพื่อขึ้นบรรทัดใหม่
        </p>
      </div>
    </div>
  );
}
