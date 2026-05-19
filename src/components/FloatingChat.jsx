import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase';
import { ref, push, onValue, off, query, limitToLast, orderByChild } from 'firebase/database';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Send, X, ChevronDown, Minimize2, Bell, BellOff, Volume2, VolumeX, ImageIcon, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { STICKER_CATEGORIES } from '../utils/chatStickers';

const CHAT_REF = 'chatMessages/general';
const NOTIF_ICON = '/โลโก้ ร.พ.png';

function formatTime(ts) {
  return ts ? new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
}

function sendBrowserNotification(title, body, onClick) {
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, { body, icon: NOTIF_ICON, tag: 'chat-message', renotify: true, silent: true });
    n.onclick = () => { window.focus(); onClick?.(); n.close(); };
    setTimeout(() => n.close(), 6000);
  } catch (_) {}
}

// Mini sticker picker for floating panel
function MiniStickerPicker({ onSelect, onClose }) {
  const [tab, setTab] = useState(0);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex border-b border-slate-100 dark:border-slate-700">
        {STICKER_CATEGORIES.map((cat, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`flex-1 py-2 text-[11px] font-bold font-['Prompt'] transition-all ${
              tab === i ? 'text-violet-600 border-b-2 border-violet-500 bg-violet-50/50 dark:bg-violet-900/20' : 'text-slate-400'
            }`}
          >
            {cat.icon}
          </button>
        ))}
        <button onClick={onClose} className="px-2 text-slate-300 hover:text-slate-500">
          <X size={12} />
        </button>
      </div>
      <div className="p-1.5 grid grid-cols-4 gap-0.5 h-[120px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {STICKER_CATEGORIES[tab].stickers.map(s => (
          <button key={s.id} onClick={() => onSelect(s)}
            className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:scale-110 transition-all duration-150"
          >
            <span className="text-2xl leading-none">{s.e}</span>
            <span className="text-[7px] text-slate-400 font-['Prompt'] text-center leading-tight">{s.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FloatingChat() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showStickers, setShowStickers] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const [notifPermission, setNotifPermission] = useState(Notification.permission);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showNotifHint, setShowNotifHint] = useState(false);
  const [toasts, setToasts] = useState([]);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevOpenRef = useRef(false);
  const prevMsgCountRef = useRef(null);
  const isOpenRef = useRef(false);
  const isMinimizedRef = useRef(false);
  const soundRef = useRef(true);

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { isMinimizedRef.current = isMinimized; }, [isMinimized]);
  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);

  if (location.pathname === '/chat') return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const q = query(ref(db, CHAT_REF), orderByChild('timestamp'), limitToLast(50));
    const handler = snap => {
      const data = snap.val();
      const msgs = data
        ? Object.entries(data).map(([id, v]) => ({ id, ...v })).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
        : [];
      setMessages(msgs);

      if (prevMsgCountRef.current === null) { prevMsgCountRef.current = msgs.length; return; }
      const newMsgs = msgs.slice(prevMsgCountRef.current);
      prevMsgCountRef.current = msgs.length;
      const othersNew = newMsgs.filter(m => m.uid !== currentUser?.uid);
      if (!othersNew.length) return;

      const chatVisible = isOpenRef.current && !isMinimizedRef.current;
      if (!chatVisible) setUnreadCount(c => c + othersNew.length);

      othersNew.forEach(msg => {
        const sender = msg.displayName || msg.email?.split('@')[0] || 'ผู้ใช้';
        let preview = msg.type === 'sticker' ? `${msg.stickerEmoji} ${msg.stickerLabel}` : msg.type === 'image' ? '📷 ส่งรูปภาพ' : (msg.text?.slice(0, 60) || '');
        if (soundRef.current) playNotificationSound();
        if (!chatVisible || !document.hasFocus()) sendBrowserNotification(`💬 ${sender} • ห้องพูดคุย`, preview, () => setIsOpen(true));
        if (!chatVisible) {
          const id = Date.now() + Math.random();
          setToasts(t => [...t.slice(-2), { id, sender, preview }]);
          setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
        }
      });
    };
    onValue(q, handler);
    return () => off(q, 'value', handler);
  }, [currentUser?.uid]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isOpen && !isMinimized) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, [messages, isOpen, isMinimized]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) setUnreadCount(0);
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  const requestNotifPermission = async () => {
    const p = await Notification.requestPermission();
    setNotifPermission(p); setShowNotifHint(false);
    if (p === 'granted') sendBrowserNotification('✅ เปิดการแจ้งเตือนแล้ว', 'คุณจะได้รับแจ้งเตือนเมื่อมีข้อความใหม่', null);
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
    setPendingImage(file); setPendingPreview(URL.createObjectURL(file));
    setShowStickers(false);
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !pendingImage) || !currentUser || sending) return;
    setSending(true);
    try {
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
        clearPendingImage(); setUploading(false);
      }
      if (inputText.trim()) {
        await push(ref(db, CHAT_REF), {
          type: 'text', text: inputText.trim(),
          uid: currentUser.uid, email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0],
          timestamp: Date.now(),
        });
        setInputText('');
      }
    } catch (err) { console.error(err); setUploading(false); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleSendSticker = async sticker => {
    if (!currentUser) return;
    setShowStickers(false);
    await push(ref(db, CHAT_REF), {
      type: 'sticker', stickerEmoji: sticker.e, stickerLabel: sticker.l,
      uid: currentUser.uid, email: currentUser.email,
      displayName: currentUser.displayName || currentUser.email?.split('@')[0],
      timestamp: Date.now(),
    }).catch(console.error);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[1100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className="pointer-events-auto flex items-start gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-violet-200 dark:border-violet-700/50 px-4 py-3 max-w-[300px] animate-in slide-in-from-right-4 fade-in duration-300"
            style={{ boxShadow: '0 8px 30px rgba(124,58,237,0.2)' }}
          >
            <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <MessageSquare size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-violet-600 dark:text-violet-400 font-['Prompt'] mb-0.5">💬 {t.sender}</p>
              <p className="text-[12px] text-slate-700 dark:text-slate-200 font-['Prompt'] leading-snug line-clamp-2">{t.preview}</p>
            </div>
            <button onClick={() => { setToasts(x => x.filter(i => i.id !== t.id)); setIsOpen(true); }}
              className="shrink-0 text-[10px] font-bold text-violet-500 hover:text-violet-700 bg-violet-50 dark:bg-violet-900/40 px-2 py-1 rounded-lg font-['Prompt']"
            >เปิด</button>
          </div>
        ))}
      </div>

      {/* Floating Panel */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-[999] w-[340px] rounded-3xl shadow-2xl shadow-violet-500/20 border border-violet-200/50 dark:border-violet-800/50 overflow-hidden flex flex-col transition-all duration-300 ${isMinimized ? 'h-[56px]' : 'h-[500px]'} animate-in fade-in slide-in-from-bottom-4`}
          style={{ backdropFilter: 'blur(20px)' }}
        >
          {/* Header */}
          <div className="relative flex items-center gap-3 px-4 py-3 shrink-0 cursor-pointer select-none"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
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
              <button onClick={e => { e.stopPropagation(); setSoundEnabled(v => !v); }}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
              <button onClick={e => { e.stopPropagation(); if (notifPermission === 'default') requestNotifPermission(); else if (notifPermission === 'denied') setShowNotifHint(h => !h); }}
                className={`p-1.5 rounded-lg transition-colors ${notifPermission === 'granted' ? 'text-emerald-300 hover:bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                title={notifPermission === 'granted' ? 'แจ้งเตือนเปิดอยู่ ✅' : notifPermission === 'denied' ? 'ถูกบล็อก ❌' : 'เปิดแจ้งเตือน'}
              >
                {notifPermission === 'denied' ? <BellOff size={13} /> : <Bell size={13} />}
              </button>
              <button onClick={e => { e.stopPropagation(); setIsMinimized(v => !v); }}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isMinimized ? <ChevronDown size={14} /> : <Minimize2 size={14} />}
              </button>
              <button onClick={e => { e.stopPropagation(); setIsOpen(false); }}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Banners */}
          {showNotifHint && !isMinimized && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700/50 px-4 py-2 flex items-start gap-2">
              <BellOff size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-['Prompt'] leading-snug">ถูกบล็อก กรุณาอนุญาตในการตั้งค่า Browser แล้วรีโหลด</p>
            </div>
          )}
          {notifPermission === 'default' && !isMinimized && (
            <div className="bg-violet-50 dark:bg-violet-900/30 border-b border-violet-200 dark:border-violet-700/50 px-4 py-2 flex items-center gap-2">
              <Bell size={14} className="text-violet-500 shrink-0" />
              <p className="text-[11px] text-violet-700 dark:text-violet-300 font-['Prompt'] flex-1">เปิดการแจ้งเตือน Browser</p>
              <button onClick={requestNotifPermission}
                className="text-[10px] font-black text-white bg-violet-600 hover:bg-violet-700 px-2.5 py-1 rounded-lg font-['Prompt']"
              >เปิด</button>
            </div>
          )}

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 bg-white dark:bg-slate-900 space-y-2"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.2) transparent' }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                    <MessageSquare size={28} className="text-slate-300" />
                    <p className="text-slate-400 text-[12px] font-['Prompt'] text-center">ยังไม่มีข้อความ เริ่มสนทนาได้เลย!</p>
                  </div>
                ) : messages.map(msg => {
                  const isOwn = msg.uid === currentUser?.uid;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: isOwn ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'linear-gradient(135deg,#64748b,#94a3b8)' }}
                      >
                        {(msg.displayName || msg.email || '?')[0].toUpperCase()}
                      </div>
                      <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                        {!isOwn && <span className="text-[10px] text-slate-400 mb-0.5 ml-1 font-['Prompt']">{msg.displayName || msg.email?.split('@')[0]}</span>}
                        {msg.type === 'sticker' ? (
                          <div className="p-1 text-center hover:scale-110 transition-transform duration-150 cursor-default">
                            <div className="text-[40px] leading-none">{msg.stickerEmoji}</div>
                            <div className="text-[8px] text-slate-400 font-['Prompt']">{msg.stickerLabel}</div>
                          </div>
                        ) : msg.type === 'image' ? (
                          <img src={msg.imageUrl} alt="รูป"
                            className={`max-w-[160px] max-h-[140px] object-cover rounded-xl cursor-pointer hover:opacity-95 shadow-md ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                            onClick={() => setLightboxUrl(msg.imageUrl)}
                          />
                        ) : (
                          <div className={`px-3 py-2 rounded-2xl text-[13px] font-['Prompt'] leading-snug break-words ${
                            isOwn ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                          }`}>{msg.text}</div>
                        )}
                        <span className="text-[9px] text-slate-300 dark:text-slate-600 mt-0.5 mx-1">{formatTime(msg.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Sticker picker */}
              {showStickers && (
                <div className="px-2 pb-1">
                  <MiniStickerPicker onSelect={handleSendSticker} onClose={() => setShowStickers(false)} />
                </div>
              )}

              {/* Image preview */}
              {pendingPreview && (
                <div className="px-3 pb-1">
                  <div className="relative inline-block">
                    <img src={pendingPreview} alt="preview" className="h-14 rounded-lg object-cover border-2 border-violet-300 shadow" />
                    <button onClick={clearPendingImage}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center shadow"
                    ><X size={9} /></button>
                    {uploading && (
                      <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center">
                        <Loader2 size={16} className="text-white animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="shrink-0 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-3 py-2 flex items-center gap-1.5">
                {/* Image button */}
                <button onClick={() => { setShowStickers(false); fileInputRef.current?.click(); }}
                  className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-all"
                  title="แนบรูปภาพ"
                >
                  <ImageIcon size={17} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

                {/* Sticker button */}
                <button onClick={() => setShowStickers(v => !v)}
                  className={`shrink-0 p-1.5 rounded-xl transition-all text-lg leading-none ${showStickers ? 'bg-violet-100 dark:bg-violet-900/40' : 'hover:bg-violet-50 dark:hover:bg-violet-900/30'}`}
                  title="สติกเกอร์"
                >🙂</button>

                <input ref={inputRef} type="text" value={inputText}
                  onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="พิมพ์ข้อความ..."
                  className="flex-1 text-[13px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition-all font-['Prompt'] placeholder-slate-400"
                  autoFocus
                />
                <button onClick={handleSend}
                  disabled={(!inputText.trim() && !pendingImage) || sending || uploading}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    (inputText.trim() || pendingImage) && !sending && !uploading
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:scale-105 shadow-md shadow-violet-500/30'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {(sending || uploading) ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button onClick={() => setIsOpen(v => !v)}
        className={`fixed bottom-6 right-6 z-[998] w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-slate-600 dark:bg-slate-700 shadow-slate-500/30' : 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-500/40'
        }`}
      >
        <div className="relative">
          {isOpen ? <X size={24} className="text-white" /> : <MessageSquare size={24} className="text-white" />}
          {!isOpen && unreadCount > 0 && (
            <div className="absolute -top-2.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 animate-in zoom-in duration-200">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
        {!isOpen && unreadCount > 0 && <div className="absolute inset-0 rounded-2xl bg-violet-500/40 animate-ping" />}
      </button>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="ดูรูป" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
            <X size={22} />
          </button>
        </div>
      )}
    </>
  );
}
