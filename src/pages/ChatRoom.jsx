import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase';
import { ref, push, onValue, off, remove, query, limitToLast, orderByChild } from 'firebase/database';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { Send, Trash2, MessageSquare, Users, ChevronDown, ImageIcon, Sticker, X, Loader2 } from 'lucide-react';
import { STICKER_CATEGORIES } from '../utils/chatStickers';

const CHAT_REF = 'chatMessages/general';
const MAX_MESSAGES = 200;

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === now.toDateString()
    ? timeStr
    : `${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} ${timeStr}`;
}

function formatDateDivider(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'วันนี้';
  if (d.toDateString() === yesterday.toDateString()) return 'เมื่อวาน';
  return d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });
}

function isSameDay(ts1, ts2) {
  return ts1 && ts2 && new Date(ts1).toDateString() === new Date(ts2).toDateString();
}

// ── StickerPicker ─────────────────────────────────────────────────────────────
function StickerPicker({ onSelect, onClose }) {
  const [tab, setTab] = useState(0);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden w-[300px] animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-700">
        {STICKER_CATEGORIES.map((cat, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`flex-1 py-2.5 text-[13px] font-bold font-['Prompt'] transition-all duration-200 ${
              tab === i
                ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500 bg-violet-50/50 dark:bg-violet-900/20'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
        <button onClick={onClose} className="px-3 text-slate-300 hover:text-slate-500 transition-colors">
          <X size={14} />
        </button>
      </div>
      {/* Grid */}
      <div className="p-2 grid grid-cols-4 gap-1 h-[160px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {STICKER_CATEGORIES[tab].stickers.map(s => (
          <button key={s.id} onClick={() => onSelect(s)}
            className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:scale-110 transition-all duration-150 active:scale-95"
          >
            <span className="text-3xl leading-none">{s.e}</span>
            <span className="text-[8px] text-slate-400 dark:text-slate-500 font-['Prompt'] text-center leading-tight">{s.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, isAdmin_2, onDelete, showAvatar, showName, onImageClick }) {
  const [hover, setHover] = useState(false);
  const isSticker = msg.type === 'sticker';
  const isImage = msg.type === 'image';

  return (
    <div
      className={`flex items-end gap-2 mb-1 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md transition-opacity ${showAvatar ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: isOwn ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'linear-gradient(135deg,#64748b,#94a3b8)' }}
      >
        {(msg.displayName || msg.email || '?')[0].toUpperCase()}
      </div>

      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showName && !isOwn && (
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1 font-['Prompt']">
            {msg.displayName || msg.email?.split('@')[0]}
          </span>
        )}

        <div className="flex items-end gap-2">
          {/* Delete btn */}
          {(isAdmin_2 || isOwn) && (
            <button onClick={() => onDelete(msg.id)}
              className={`shrink-0 p-1 rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all ${isOwn ? 'order-first' : 'order-last'} ${hover ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
            >
              <Trash2 size={13} />
            </button>
          )}

          {/* Content */}
          {isSticker ? (
            // Sticker — no background bubble
            <div className={`p-2 text-center transition-transform duration-200 hover:scale-110 cursor-default`}>
              <div className="text-[56px] leading-none">{msg.stickerEmoji}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-['Prompt']">{msg.stickerLabel}</div>
            </div>
          ) : isImage ? (
            // Image bubble
            <div className={`rounded-2xl overflow-hidden shadow-md cursor-pointer hover:opacity-95 transition-opacity ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
              onClick={() => onImageClick(msg.imageUrl)}
            >
              <img src={msg.imageUrl} alt="รูปภาพ"
                className="max-w-[220px] max-h-[200px] object-cover block"
                onError={e => { e.target.style.display='none'; }}
              />
            </div>
          ) : (
            // Text bubble
            <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-[14px] leading-relaxed font-['Prompt'] break-words ${
              isOwn
                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm shadow-violet-500/20 shadow-md'
                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-600 rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
          )}
        </div>

        <span className={`text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 ${isOwn ? 'mr-10' : 'ml-10'}`}>
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ── Main ChatRoom ─────────────────────────────────────────────────────────────
export default function ChatRoom() {
  const { currentUser, isAdmin_2 } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const q = query(ref(db, CHAT_REF), orderByChild('timestamp'), limitToLast(MAX_MESSAGES));
    const handler = snap => {
      const data = snap.val();
      const msgs = data
        ? Object.entries(data).map(([id, v]) => ({ id, ...v })).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
        : [];
      setMessages(msgs);
      setLoading(false);
    };
    onValue(q, handler);
    return () => off(q, 'value', handler);
  }, []);

  useEffect(() => {
    if (!showScrollBtn) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showScrollBtn]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  const clearPendingImage = () => {
    setPendingImage(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImagePick = e => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 8 * 1024 * 1024) { alert('ขนาดไฟล์ต้องไม่เกิน 8 MB'); return; }
    setPendingImage(file);
    setPendingPreview(URL.createObjectURL(file));
    setShowStickers(false);
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !pendingImage) || !currentUser || sending) return;
    setSending(true);
    try {
      // Upload image first if any
      if (pendingImage) {
        setUploading(true);
        const fileRef = sRef(storage, `chatImages/${Date.now()}_${pendingImage.name}`);
        const snap = await uploadBytes(fileRef, pendingImage);
        const url = await getDownloadURL(snap.ref);
        await push(ref(db, CHAT_REF), {
          type: 'image', imageUrl: url,
          uid: currentUser.uid, email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0],
          timestamp: Date.now(),
        });
        clearPendingImage();
        setUploading(false);
      }
      // Send text if any
      if (inputText.trim()) {
        await push(ref(db, CHAT_REF), {
          type: 'text', text: inputText.trim(),
          uid: currentUser.uid, email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0],
          timestamp: Date.now(),
        });
        setInputText('');
      }
    } catch (err) {
      console.error('Send failed:', err);
      setUploading(false);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSendSticker = async sticker => {
    if (!currentUser) return;
    setShowStickers(false);
    try {
      await push(ref(db, CHAT_REF), {
        type: 'sticker', stickerEmoji: sticker.e, stickerLabel: sticker.l,
        uid: currentUser.uid, email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0],
        timestamp: Date.now(),
      });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async id => {
    if (!window.confirm('ลบข้อความนี้?')) return;
    await remove(ref(db, `${CHAT_REF}/${id}`)).catch(console.error);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] max-w-4xl mx-auto">

      {/* Header */}
      <div className="relative rounded-t-3xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
        <div className="relative z-10 flex items-center gap-4 px-6 py-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/30">
            <MessageSquare size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-white font-['Prompt'] tracking-tight leading-none">ห้องพูดคุย</h2>
            <p className="text-white/70 text-[12px] font-['Prompt'] mt-0.5">Real-time Chat • รองรับรูปภาพและสติกเกอร์</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <Users size={13} className="text-white/80" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-400 via-pink-400 to-indigo-400 opacity-80" />
      </div>

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50 dark:bg-slate-900/50"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
            <p className="text-slate-400 font-['Prompt'] text-sm">กำลังโหลด...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60">
            <MessageSquare size={36} className="text-violet-400" />
            <p className="text-slate-400 dark:text-slate-500 font-['Prompt'] text-center text-sm">
              ยังไม่มีข้อความ เริ่มสนทนาได้เลย! 💬
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.uid === currentUser?.uid;
            const prev = messages[idx - 1];
            const next = messages[idx + 1];
            const showDivider = !prev || !isSameDay(prev.timestamp, msg.timestamp);
            const samePrev = prev && prev.uid === msg.uid && isSameDay(prev.timestamp, msg.timestamp);
            const sameNext = next && next.uid === msg.uid && isSameDay(next.timestamp, msg.timestamp);
            return (
              <React.Fragment key={msg.id}>
                {showDivider && (
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                    <span className="text-[11px] font-bold text-slate-400 px-3 py-1 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm font-['Prompt']">
                      {formatDateDivider(msg.timestamp)}
                    </span>
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                  </div>
                )}
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-300"
                  style={{ marginBottom: sameNext ? '2px' : '10px' }}
                >
                  <MessageBubble
                    msg={msg} isOwn={isOwn} isAdmin_2={isAdmin_2}
                    onDelete={handleDelete} showAvatar={!sameNext} showName={!samePrev}
                    onImageClick={setLightboxUrl}
                  />
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <div className="relative h-0">
          <button onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }}
            className="absolute bottom-4 right-6 z-10 w-10 h-10 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center hover:bg-violet-700 transition-all hover:scale-110 animate-in fade-in"
          >
            <ChevronDown size={20} />
          </button>
        </div>
      )}

      {/* Sticker picker (above input) */}
      {showStickers && (
        <div className="px-4 pb-2 flex justify-start">
          <StickerPicker onSelect={handleSendSticker} onClose={() => setShowStickers(false)} />
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-4 py-3 rounded-b-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">

        {/* Image preview */}
        {pendingPreview && (
          <div className="mb-3 relative inline-block">
            <img src={pendingPreview} alt="preview"
              className="h-20 rounded-xl object-cover border-2 border-violet-300 shadow-md"
            />
            <button onClick={clearPendingImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
            >
              <X size={11} />
            </button>
            {uploading && (
              <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
            )}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Image button */}
          <button onClick={() => { setShowStickers(false); fileInputRef.current?.click(); }}
            className="shrink-0 p-2.5 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-all duration-200"
            title="แนบรูปภาพ"
          >
            <ImageIcon size={20} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

          {/* Sticker button */}
          <button onClick={() => setShowStickers(v => !v)}
            className={`shrink-0 p-2.5 rounded-xl transition-all duration-200 ${
              showStickers
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600'
                : 'text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30'
            }`}
            title="สติกเกอร์"
          >
            <span className="text-xl leading-none">🙂</span>
          </button>

          {/* Text input */}
          <textarea ref={inputRef} rows={1} value={inputText}
            onChange={e => {
              setInputText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์ข้อความ... (Enter ส่ง)"
            className="flex-1 resize-none rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition-all placeholder-slate-400 font-['Prompt'] leading-relaxed max-h-[120px] overflow-y-auto"
          />

          {/* Send button */}
          <button onClick={handleSend}
            disabled={(!inputText.trim() && !pendingImage) || sending || uploading}
            className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-md ${
              (inputText.trim() || pendingImage) && !sending && !uploading
                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:scale-105 shadow-violet-500/30'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-300 cursor-not-allowed'
            }`}
          >
            {sending || uploading
              ? <Loader2 size={18} className="animate-spin" />
              : <Send size={18} />
            }
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="ดูรูป"
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
