"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { parseWhatsAppText, processUploadedFile, findMediaBlob } from "@/lib/parser";
import {
  saveChatToStorage,
  loadChatFromStorage,
  updateSavedSender,
  clearChatStorage,
  saveStarredIds,
  loadStarredIds,
} from "@/lib/storage";
import { ChatMessage } from "@/types/chat";
import { MediaBubble } from "@/components/MediaBubble";
import { Lightbox } from "@/components/Lightbox";
import { StatsTab } from "@/components/StatsTab";
import { GalleryTab } from "@/components/GalleryTab";
import { InstallModal } from "@/components/InstallModal";
import {
  Upload,
  Heart,
  RotateCcw,
  UserCheck,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ImageOff,
  Sparkles,
  Loader2,
  FileArchive,
  Image as ImageIcon,
  AlertTriangle,
  Database,
  Check,
  Search,
  X,
  MessageSquare,
  BarChart3,
  Calendar,
  Star,
  FilterX,
  Smartphone,
} from "lucide-react";

// Örnek sohbet metni (Oğuzhan & Şüheda)
const SAMPLE_CHAT_TXT = `7.11.2021 07:48 - Oğuzhan: 20dk
7.11.2021 07:48 - Oğuzhan: Olmuş
7.11.2021 07:48 - Şüheda: Yani milattan önce
7.11.2021 07:48 - Oğuzhan: <Medya dahil edilmedi>
7.11.2021 07:48 - Şüheda: Dhskhdskd
7.11.2021 07:48 - Şüheda: Bu nE
7.11.2021 07:48 - Şüheda: Şişko çıkmışım
7.11.2021 07:48 - Şüheda: Seri
7.11.2021 07:48 - Şüheda: İmha
7.11.2021 07:49 - Şüheda: Bide ben geri dönerken aradım
7.11.2021 07:49 - Şüheda: Neredesiniz diye
7.11.2021 07:51 - Oğuzhan: Yok be sende
7.11.2021 07:52 - Oğuzhan: <Medya dahil edilmedi>
7.11.2021 07:59 - Şüheda: Yalnız bu bir savaş başlangıcı
7.11.2021 07:59 - Şüheda: Dhwkdhsjshsjd`;

// Türkçe ay isimleri ile tarih rozeti biçimlendirme
function formatBadgeDate(dateStr: string): string {
  try {
    const parts = dateStr.split(/[./-]/);
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);

      if (year < 100) year += 2000;

      const months = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
      ];

      if (month >= 1 && month <= 12) {
        return `${day} ${months[month - 1]} ${year}`;
      }
    }
  } catch {
    // Fallback
  }
  return dateStr;
}

// Tarih eşleştirme yardımcısı (YYYY-MM-DD vs GG.AA.YYYY)
function matchesIsoDate(dateStr: string, isoDate: string): boolean {
  if (!isoDate) return true;
  const partsIso = isoDate.split("-");
  if (partsIso.length !== 3) return true;

  const yNum = parseInt(partsIso[0], 10);
  const mNum = parseInt(partsIso[1], 10);
  const dNum = parseInt(partsIso[2], 10);

  const partsMsg = dateStr.split(/[./-]/);
  if (partsMsg.length >= 3) {
    const msgD = parseInt(partsMsg[0], 10);
    const msgM = parseInt(partsMsg[1], 10);
    let msgY = parseInt(partsMsg[2], 10);
    if (msgY < 100) msgY += 2000;

    return msgD === dNum && msgM === mNum && msgY === yNum;
  }
  return false;
}

// Arama vurgulama bileşeni
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <span>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-400 text-black px-0.5 rounded font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mySenderName, setMySenderName] = useState<string>("Oğuzhan");
  const [mediaBlobs, setMediaBlobs] = useState<Record<string, Blob>>({});
  
  // Yıldızlı Mesaj ID Seti (Kalıcı)
  const [starredIds, setStarredIds] = useState<number[]>([]);
  const [showOnlyStarred, setShowOnlyStarred] = useState<boolean>(false);

  // Tarih Filtresi State'i
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(""); // YYYY-MM-DD

  // Aktif Sekme: "chat" | "gallery" | "wrapped"
  const [activeTab, setActiveTab] = useState<"chat" | "gallery" | "wrapped">("chat");

  // Arama State'i
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Yükleme & Durum State'leri
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);
  const [displayCount, setDisplayCount] = useState<number>(200);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Sıfırlama Onay Modalı State'i
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // Lightbox Modal State
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    imageUrl: string;
    sender?: string;
    dateStr?: string;
    timeStr?: string;
    caption?: string;
  }>({
    isOpen: false,
    imageUrl: "",
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Sayfa ilk açıldığında IndexedDB'den sohbeti ve yıldızlı mesajları yükle
  useEffect(() => {
    async function initStorage() {
      try {
        const [stored, savedStarred] = await Promise.all([
          loadChatFromStorage(),
          loadStarredIds(),
        ]);

        if (stored && stored.messages && stored.messages.length > 0) {
          const normalizedMsgs = stored.messages.map((m) => ({
            ...m,
            sender:
              m.sender.toLowerCase().includes("oğuzhan") ||
              m.sender.toLowerCase().includes("oguzhan")
                ? "Oğuzhan"
                : "Şüheda",
          }));
          setMessages(normalizedMsgs);
          setMySenderName(stored.mySenderName === "Şüheda" ? "Şüheda" : "Oğuzhan");
          setMediaBlobs(stored.mediaBlobs || {});
        }

        if (savedStarred && savedStarred.length > 0) {
          setStarredIds(savedStarred);
        }
      } catch (err) {
        console.error("IndexedDB başlatılırken hata:", err);
      } finally {
        setIsInitializing(false);
      }
    }

    initStorage();
  }, []);

  // WhatsApp Gibi: Sohbet açıldığında doğrudan EN SON konuşmaya in
  useEffect(() => {
    if (messages.length > 0 && activeTab === "chat" && !searchQuery.trim() && !selectedDate && !showOnlyStarred) {
      const timer = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [messages.length, activeTab, searchQuery, selectedDate, showOnlyStarred]);

  // Karşı tarafın başlığı
  const partnerTitle = mySenderName === "Oğuzhan" ? "Şüheda 🤎" : "Oğuzhan ❤️";

  // Toplam medya sayısı
  const totalMediaCount = useMemo(() => {
    return Object.keys(mediaBlobs).length;
  }, [mediaBlobs]);

  // Yıldızlama Toggle
  const toggleStarMessage = async (msgId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    let newStarred: number[];
    if (starredIds.includes(msgId)) {
      newStarred = starredIds.filter((id) => id !== msgId);
    } else {
      newStarred = [...starredIds, msgId];
    }
    setStarredIds(newStarred);
    await saveStarredIds(newStarred);
  };

  // Taraf değiştirildiğinde
  const handleSenderChange = async (newSender: string) => {
    setMySenderName(newSender);
    await updateSavedSender(newSender);
  };

  // Dosya işleme ve otomatik IndexedDB kaydetme
  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    try {
      const { messages: parsedMsgs, mediaBlobs: blobs } =
        await processUploadedFile(file);

      const normalizedMsgs = parsedMsgs.map((m) => ({
        ...m,
        sender:
          m.sender.toLowerCase().includes("oğuzhan") ||
          m.sender.toLowerCase().includes("oguzhan")
            ? "Oğuzhan"
            : "Şüheda",
      }));

      setMessages(normalizedMsgs);
      setMediaBlobs(blobs);
      setMySenderName("Oğuzhan");
      setDisplayCount(200);

      setIsSaving(true);
      const isSaved = await saveChatToStorage({
        messages: normalizedMsgs,
        participants: ["Oğuzhan", "Şüheda"],
        mySenderName: "Oğuzhan",
        mediaBlobs: blobs,
      });
      setIsSaving(false);

      if (isSaved) {
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 3000);
      }
    } catch (err) {
      console.error("Dosya işlenirken hata oluştu:", err);
      alert("Dosya ayrıştırılırken bir hata oluştu. Lütfen geçerli bir WhatsApp yedeği yükleyin.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleProcessFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await handleProcessFile(file);
  };

  // Örnek sohbet
  const handleLoadSample = async () => {
    setIsLoading(true);
    const { messages: parsedMsgs } = parseWhatsAppText(SAMPLE_CHAT_TXT);
    const normalizedMsgs = parsedMsgs.map((m) => ({
      ...m,
      sender:
        m.sender.toLowerCase().includes("oğuzhan") ||
        m.sender.toLowerCase().includes("oguzhan")
          ? "Oğuzhan"
          : "Şüheda",
    }));

    setMessages(normalizedMsgs);
    setMediaBlobs({});
    setMySenderName("Oğuzhan");
    setDisplayCount(200);

    await saveChatToStorage({
      messages: normalizedMsgs,
      participants: ["Oğuzhan", "Şüheda"],
      mySenderName: "Oğuzhan",
      mediaBlobs: {},
    });

    setIsLoading(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Sıfırlama
  const handleConfirmReset = async () => {
    await clearChatStorage();
    setMessages([]);
    setStarredIds([]);
    setMySenderName("Oğuzhan");
    setMediaBlobs({});
    setDisplayCount(200);
    setSelectedDate("");
    setShowOnlyStarred(false);
    setActiveTab("chat");
    setShowResetConfirm(false);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    if (displayCount < messages.length) {
      setDisplayCount(messages.length);
    }
    setTimeout(() => {
      chatContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  // WhatsApp Tarzı Yukarı Kaydırma (Eski Mesajları Yükleme)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (
      target.scrollTop <= 150 &&
      displayCount < messages.length &&
      !searchQuery.trim() &&
      !selectedDate &&
      !showOnlyStarred
    ) {
      const prevScrollHeight = target.scrollHeight;
      const prevScrollTop = target.scrollTop;

      setDisplayCount((prev) => Math.min(prev + 150, messages.length));

      requestAnimationFrame(() => {
        const newScrollHeight = target.scrollHeight;
        target.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
      });
    }
  };

  const openLightbox = (imageUrl: string, msg: ChatMessage) => {
    setLightbox({
      isOpen: true,
      imageUrl,
      sender: msg.sender,
      dateStr: msg.dateStr,
      timeStr: msg.timeStr,
      caption: msg.text,
    });
  };

  const closeLightbox = () => {
    setLightbox((prev) => ({ ...prev, isOpen: false }));
  };

  // Filtrelenen Mesajlar: Arama, Tarih Filtresi veya Yıldızlı Filtresi
  const filteredMessages = useMemo(() => {
    let result = messages;

    // 1. Yıldızlı Filtresi
    if (showOnlyStarred) {
      const set = new Set(starredIds);
      result = result.filter((m) => set.has(m.id));
    }

    // 2. Tarih Filtresi
    if (selectedDate) {
      result = result.filter((m) => matchesIsoDate(m.dateStr, selectedDate));
    }

    // 3. Kelime Araması
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.text.toLowerCase().includes(q) ||
          m.dateStr.toLowerCase().includes(q) ||
          m.sender.toLowerCase().includes(q)
      );
    }

    return result;
  }, [messages, showOnlyStarred, starredIds, selectedDate, searchQuery]);

  // Görünür mesajlar: Filtre aktifse filtrelenenler, değilse WhatsApp gibi son konuşmalar
  const visibleMessages = useMemo(() => {
    if (searchQuery.trim() || selectedDate || showOnlyStarred) {
      return filteredMessages.slice(0, 1000);
    }
    return messages.slice(-displayCount);
  }, [messages, filteredMessages, searchQuery, selectedDate, showOnlyStarred, displayCount]);

  // İlk Açılış Kontrolü (Splash Screen)
  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0b141a] text-[#e9edef] whatsapp-bg">
        <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-2xl mb-4 animate-bounce">
          <Heart className="w-8 h-8 text-white fill-white" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Anı Kapsülü Açılıyor...</h2>
        <p className="text-xs text-[#8696a0] mt-1 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[#00a884]" /> Hafızadaki anılar yükleniyor
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[#0b141a] text-[#e9edef] select-text relative">
      {/* Toast Bildirimleri */}
      {showSavedToast && (
        <div className="absolute top-16 right-4 z-40 bg-[#111b21] border border-[#00a884] text-[#00a884] px-3.5 py-2 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4" />
          <span>Sohbet hafızaya kaydedildi! Sayfayı yenilediğinizde de burada olacak.</span>
        </div>
      )}

      {/* 1. WHATSAPP HEADER */}
      <header className="bg-[#202c33] border-b border-[#2a3942] px-3 sm:px-4 py-2.5 pt-safe flex items-center justify-between z-20 shrink-0 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shrink-0 shadow-inner">
            <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
          </div>

          <div className="min-w-0">
            <h1 className="font-semibold text-sm sm:text-base leading-tight truncate">
              {messages.length > 0 ? partnerTitle : "WhatsApp Anı Kapsülü"}
            </h1>
            <p className="text-[11px] sm:text-xs text-[#00a884] truncate flex items-center gap-1.5 font-medium">
              {messages.length > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#00a884] inline-block animate-pulse" />
                  <span>çevrimiçi</span>
                  <span className="text-[#8696a0] font-normal ml-1">
                    &bull; {messages.length.toLocaleString("tr-TR")} mesaj
                  </span>
                  {totalMediaCount > 0 && (
                    <span className="text-[#8696a0] font-normal flex items-center gap-0.5 ml-1">
                      &bull; <ImageIcon className="w-3 h-3 text-[#00a884]" /> {totalMediaCount}
                    </span>
                  )}
                </>
              ) : (
                "Bir WhatsApp yedeği (.zip veya .txt) yükleyin"
              )}
            </p>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        {messages.length > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Yıldızlı Mesajlar Filtre Butonu */}
            <button
              onClick={() => {
                setActiveTab("chat");
                setShowOnlyStarred((prev) => !prev);
              }}
              className={`p-2 border rounded-lg transition shadow-sm ${
                showOnlyStarred
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                  : "bg-[#111b21] hover:bg-[#2a3942] border-[#2a3942] text-[#8696a0] hover:text-amber-400"
              }`}
              title={showOnlyStarred ? "Tüm Mesajları Göster" : "Sadece Yıldızlı Mesajları Göster"}
            >
              <Star className={`w-4 h-4 ${showOnlyStarred ? "fill-amber-400" : ""}`} />
            </button>

            {/* Tarih Filtresi Butonu */}
            <div className="relative">
              <button
                onClick={() => setIsDatePickerOpen((prev) => !prev)}
                className={`p-2 border rounded-lg transition shadow-sm ${
                  selectedDate
                    ? "bg-[#00a884]/20 text-[#00a884] border-[#00a884]/50"
                    : "bg-[#111b21] hover:bg-[#2a3942] border-[#2a3942] text-[#8696a0] hover:text-[#00a884]"
                }`}
                title="Tarihe Göre Filtrele"
              >
                <Calendar className="w-4 h-4" />
              </button>

              {/* Mini Tarih Seçici Açılır Paneli */}
              {isDatePickerOpen && (
                <div className="absolute right-0 top-11 z-50 bg-[#1f2c34] border border-[#2a3942] p-3 rounded-2xl shadow-2xl w-64 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#00a884]" /> Tarihe Git / Filtrele
                    </span>
                    <button
                      onClick={() => setIsDatePickerOpen(false)}
                      className="text-[#8696a0] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setActiveTab("chat");
                    }}
                    className="w-full bg-[#111b21] text-xs text-white border border-[#2a3942] rounded-xl px-2.5 py-2 outline-none focus:border-[#00a884]"
                  />
                  {selectedDate && (
                    <button
                      onClick={() => {
                        setSelectedDate("");
                        setIsDatePickerOpen(false);
                      }}
                      className="w-full py-1 text-[11px] text-rose-400 hover:text-rose-300 flex items-center justify-center gap-1"
                    >
                      <FilterX className="w-3 h-3" /> Tarih Filtresini Kaldır
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Arama Aç/Kapa Butonu */}
            <button
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (!isSearchOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                } else {
                  setSearchQuery("");
                }
              }}
              className={`p-2 border rounded-lg transition shadow-sm ${
                isSearchOpen
                  ? "bg-[#00a884] text-white border-[#00a884]"
                  : "bg-[#111b21] hover:bg-[#2a3942] border-[#2a3942] text-[#8696a0] hover:text-[#00a884]"
              }`}
              title="Sohbette Ara"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* SADECE OĞUZHAN VE ŞÜHEDA SEÇİCİ */}
            <div className="relative inline-flex items-center">
              <div className="relative flex items-center bg-[#111b21] hover:bg-[#2a3942] transition border border-[#2a3942] rounded-lg px-2 sm:px-2.5 py-1.5 cursor-pointer">
                <UserCheck className="w-3.5 h-3.5 text-[#00a884] mr-1 shrink-0" />
                <select
                  value={mySenderName}
                  onChange={(e) => handleSenderChange(e.target.value)}
                  className="bg-transparent text-xs text-[#e9edef] font-medium outline-none cursor-pointer pr-3.5 appearance-none max-w-[100px] sm:max-w-none truncate"
                  aria-label="Ben kimim seçimi"
                >
                  <option value="Oğuzhan" className="bg-[#202c33] text-white">
                    Ben: Oğuzhan
                  </option>
                  <option value="Şüheda" className="bg-[#202c33] text-white">
                    Ben: Şüheda
                  </option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#8696a0] absolute right-1.5 pointer-events-none" />
              </div>
            </div>

            {/* iPhone Kurulum Rehberi */}
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="p-2 bg-[#111b21] hover:bg-[#2a3942] border border-[#2a3942] text-[#8696a0] hover:text-[#00a884] rounded-lg transition"
              title="iPhone'a Uygulama Olarak Yükle"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Sıfırla / Yeni Yükle (Modal Açıcı) */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2 bg-[#111b21] hover:bg-[#2a3942] border border-[#2a3942] text-[#8696a0] hover:text-rose-400 rounded-lg transition"
              title="Yedeği Sıfırla / Yeni Dosya Yükle"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* ARAMA ÇUBUĞU */}
      {messages.length > 0 && isSearchOpen && (
        <div className="bg-[#111b21] border-b border-[#2a3942] px-4 py-2.5 flex items-center gap-2 z-15 shadow-inner animate-in slide-in-from-top duration-150">
          <Search className="w-4 h-4 text-[#8696a0] shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Mesajlarda veya tarihlerde ara... (örn: seni seviyorum, 7.11.2021)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none"
          />
          {searchQuery && (
            <span className="text-xs text-[#00a884] font-medium shrink-0">
              {filteredMessages.length} sonuç
            </span>
          )}
          <button
            onClick={() => {
              setSearchQuery("");
              setIsSearchOpen(false);
            }}
            className="p-1 text-[#8696a0] hover:text-white rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AKTİF FİLTRE ROZETLERİ (TARİH VEYA YILDIZ) */}
      {(selectedDate || showOnlyStarred) && messages.length > 0 && (
        <div className="bg-[#111b21]/90 backdrop-blur-sm border-b border-[#222e35] px-4 py-2 flex items-center justify-between text-xs z-10">
          <div className="flex items-center gap-2">
            {showOnlyStarred && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                <Star className="w-3 h-3 fill-amber-300" /> Yıldızlı Mesajlar ({filteredMessages.length})
              </span>
            )}
            {selectedDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00a884]/20 text-[#00a884] font-medium">
                <Calendar className="w-3 h-3" /> {formatBadgeDate(selectedDate.split("-").reverse().join("."))} ({filteredMessages.length} mesaj)
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setSelectedDate("");
              setShowOnlyStarred(false);
            }}
            className="text-[#8696a0] hover:text-white flex items-center gap-1 text-[11px] underline"
          >
            Filtreyi Temizle
          </button>
        </div>
      )}

      {/* 2. ANA İÇERİK ALANI */}
      {messages.length === 0 ? (
        /* YÜKLEME EKRANI */
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 whatsapp-bg overflow-y-auto">
          <div className="max-w-md w-full bg-[#111b21]/90 backdrop-blur-md border border-[#222e35] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#00a884]/10 border border-[#00a884]/20 flex items-center justify-center text-[#00a884] shadow-lg">
              <Heart className="w-8 h-8 fill-[#00a884]" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
                Oğuzhan &amp; Şüheda Anı Kapsülü
              </h2>
              <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
                WhatsApp yedeğinizi yükleyin. Yüklediğiniz tüm sohbet ve fotoğraflar güvenle tarayıcınızın hafızasına (IndexedDB) kaydedilir, internet olmasa bile silinmez.
              </p>
            </div>

            {/* Dosya Yükleme Alanı (.zip ve .txt) */}
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`block cursor-pointer border-2 border-dashed rounded-2xl p-6 transition duration-200 ${
                isDragOver
                  ? "border-[#00a884] bg-[#00a884]/5 scale-[1.01]"
                  : "border-[#2a3942] hover:border-[#00a884]/60 bg-[#202c33]/40 hover:bg-[#202c33]/70"
              }`}
            >
              {isLoading || isSaving ? (
                <div className="py-4 flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-[#00a884] animate-spin" />
                  <span className="text-sm font-medium text-white">
                    {isLoading ? "Medya ve sohbet ayrıştırılıyor..." : "Hafızaya (IndexedDB) kaydediliyor..."}
                  </span>
                  <span className="text-xs text-[#8696a0]">
                    Bu işlem dosya boyutuna göre birkaç saniye sürebilir
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <FileArchive className="w-8 h-8 text-[#00a884]" />
                    <Upload className="w-8 h-8 text-[#53bdeb]" />
                  </div>
                  <span className="block text-sm font-semibold text-white mb-1">
                    Sohbet Yedeğini (.zip veya .txt) Seç
                  </span>
                  <span className="block text-xs text-[#8696a0] mb-2">
                    Fotoğraflar ve sesler için medyalı <b>.zip</b> yedeğini yükleyin
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#202c33] border border-[#2a3942] rounded-full text-[11px] text-[#00a884]">
                    <Database className="w-3 h-3" /> IndexedDB Kalıcı Hafıza &bull; %100 Gizli
                  </span>
                </>
              )}
              <input
                type="file"
                accept=".zip,.txt"
                disabled={isLoading || isSaving}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Örnek Sohbet Butonu */}
            <div className="pt-2 border-t border-[#222e35] space-y-2">
              <button
                type="button"
                disabled={isLoading || isSaving}
                onClick={handleLoadSample}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-xs font-medium text-[#00a884] border border-[#2a3942] transition"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Örnek Sohbetle Hemen Dene (Oğuzhan &amp; Şüheda 🤎)
              </button>

              <button
                type="button"
                onClick={() => setIsInstallModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#111b21] hover:bg-[#1f2c34] text-xs font-medium text-[#8696a0] hover:text-[#e9edef] border border-[#2a3942] transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                iPhone 11 &amp; Safari Uygulama Kurulum Rehberi
              </button>
            </div>
          </div>
        </main>
      ) : activeTab === "gallery" ? (
        /* 2.1 GALERİ SEKMESİ */
        <GalleryTab
          messages={messages}
          mediaBlobs={mediaBlobs}
          onOpenLightbox={openLightbox}
        />
      ) : activeTab === "wrapped" ? (
        /* 2.2 İLİŞKİ WRAPPED (ÖZET) SEKMESİ */
        <StatsTab
          messages={messages}
          participants={["Oğuzhan", "Şüheda"]}
          mySenderName={mySenderName}
        />
      ) : (
        /* 2.3 SOHBET BALONLARI ALANI - YATAY & WHATSAPP GERÇEK BALONLARI */
        <main
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 whatsapp-bg relative scroll-smooth pb-24"
        >
          <div className="max-w-3xl mx-auto pb-12">
            {/* Eski Mesajları Yükleme Göstergesi */}
            {displayCount < messages.length && !searchQuery && !selectedDate && !showOnlyStarred && (
              <div className="text-center py-2 mb-2">
                <span className="text-[11px] text-[#8696a0] bg-[#182229]/80 px-3 py-1 rounded-full border border-[#222e35]">
                  Eski mesajlar için yukarı kaydırın ({displayCount.toLocaleString("tr-TR")} / {messages.length.toLocaleString("tr-TR")})
                </span>
              </div>
            )}

            {/* Arama veya Filtre Sonuç Bilgisi */}
            {(searchQuery || selectedDate || showOnlyStarred) && (
              <div className="text-center py-2 mb-3">
                <span className="bg-[#182229] text-[#00a884] text-xs px-3 py-1 rounded-full border border-[#222e35]">
                  {filteredMessages.length} sonuç bulundu
                </span>
              </div>
            )}

            {visibleMessages.length === 0 && (
              <div className="text-center py-12 text-[#8696a0] text-xs">
                {showOnlyStarred
                  ? "Henüz yıldızlı mesajınız yok. Sevdiğiniz mesajların yanındaki yıldıza dokunarak buraya ekleyebilirsiniz ⭐"
                  : "Bu filtreye uygun mesaj bulunamadı."}
              </div>
            )}

            {visibleMessages.map((msg, index) => {
              const isMe = msg.sender === mySenderName;
              const prevMsg = visibleMessages[index - 1];
              const showDateBadge = !prevMsg || prevMsg.dateStr !== msg.dateStr;
              const isFirstInGroup = !prevMsg || prevMsg.sender !== msg.sender || showDateBadge;
              const isStarred = starredIds.includes(msg.id);

              const mediaBlob = msg.mediaFileName
                ? findMediaBlob(mediaBlobs, msg.mediaFileName)
                : undefined;

              return (
                <React.Fragment key={msg.id}>
                  {/* Gün Değişim Ayracı Rozeti */}
                  {showDateBadge && (
                    <div className="flex justify-center my-4 sticky top-2 z-10">
                      <span className="bg-[#182229]/95 backdrop-blur-sm text-[#8696a0] text-[11px] font-medium tracking-wide uppercase px-3.5 py-1 rounded-lg shadow-sm border border-[#222e35]">
                        {formatBadgeDate(msg.dateStr)}
                      </span>
                    </div>
                  )}

                  {/* Mesaj Satırı */}
                  <div
                    id={`msg-${msg.id}`}
                    className={`group flex items-end ${
                      isMe ? "justify-end" : "justify-start"
                    } ${isFirstInGroup ? "mt-2.5" : "mt-1"}`}
                  >
                    {/* YATAY & GERÇEK WHATSAPP BALONU */}
                    <div
                      className={`relative min-w-[78px] max-w-[84%] sm:max-w-[65%] px-3.5 py-1.5 text-sm shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] transition-all duration-200 ${
                        isMe
                          ? `bg-[#005c4b] text-[#e9edef] rounded-2xl ${
                              isFirstInGroup ? "rounded-tr-xs" : ""
                            }`
                          : `bg-[#202c33] text-[#e9edef] rounded-2xl ${
                              isFirstInGroup ? "rounded-tl-xs" : ""
                            }`
                      }`}
                    >
                      {/* Yıldız Butonu (Hover'da veya Dokunulduğunda) */}
                      <button
                        type="button"
                        onClick={(e) => toggleStarMessage(msg.id, e)}
                        className={`absolute -top-2 ${
                          isMe ? "-left-3" : "-right-3"
                        } p-1 rounded-full bg-[#182229] border border-[#2a3942] transition shadow-md z-10 ${
                          isStarred
                            ? "opacity-100 text-amber-400"
                            : "opacity-0 group-hover:opacity-100 text-[#8696a0] hover:text-amber-400"
                        }`}
                        title={isStarred ? "Yıldızı Kaldır" : "Mesajı Yıldızla"}
                      >
                        <Star className={`w-3 h-3 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>

                      {/* Medya Varsa */}
                      {msg.mediaFileName && (
                        <div className="mb-1">
                          <MediaBubble
                            message={msg}
                            mediaBlob={mediaBlob}
                            isMe={isMe}
                            onOpenLightbox={openLightbox}
                          />
                        </div>
                      )}

                      {/* Medya Dahil Edilmedi */}
                      {msg.isMediaOmitted && (
                        <div className="flex items-center gap-2 py-0.5 text-[#8696a0] italic text-xs">
                          <ImageOff className="w-4 h-4 text-[#8696a0] shrink-0" />
                          <span>Medya dahil edilmedi</span>
                        </div>
                      )}

                      {/* Metin & Saat: Yatay, kompakt ve bitişik düzen */}
                      {(msg.text || !msg.mediaFileName) && !msg.isMediaOmitted && (
                        <div className="flex flex-wrap items-baseline justify-end gap-x-2.5 gap-y-0.5 max-w-full">
                          {/* Metin İçeriği */}
                          <span className="text-[14px] sm:text-[14.5px] leading-[19px] break-words text-[#e9edef] pr-1">
                            <HighlightedText text={msg.text} query={searchQuery} />
                          </span>

                          {/* Saat, Yıldız & Çift Tik: Metinle aynı satırda sağa yaslı */}
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-[#8696a0] select-none ml-auto shrink-0 self-end pb-0.5">
                            {/* Yıldızlıysa Küçük Sarı Yıldız */}
                            {isStarred && (
                              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                            )}
                            <span>{msg.timeStr}</span>
                            {isMe && (
                              <svg
                                className="w-4 h-3.5 text-[#53bdeb]"
                                viewBox="0 0 16 15"
                                fill="currentColor"
                              >
                                <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.512z" />
                              </svg>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* En Son Mesaj Referansı (En Alt) */}
            <div ref={bottomRef} className="h-2" />
          </div>

          {/* Hızlı Gezinme Butonları */}
          <div className="fixed right-4 bottom-20 flex flex-col gap-2 z-20">
            <button
              onClick={scrollToTop}
              className="p-2.5 bg-[#202c33]/90 hover:bg-[#2a3942] text-[#8696a0] hover:text-white rounded-full shadow-lg border border-[#2a3942] transition backdrop-blur-sm"
              title="İlk Anıya Git"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={scrollToBottom}
              className="p-2.5 bg-[#202c33]/90 hover:bg-[#2a3942] text-[#8696a0] hover:text-white rounded-full shadow-lg border border-[#2a3942] transition backdrop-blur-sm"
              title="En Son Konuşmaya Git"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </main>
      )}

      {/* 3. ALT GEZİNME BARI (TAB BAR) */}
      {messages.length > 0 && (
        <nav className="bg-[#202c33] border-t border-[#2a3942] px-6 py-2 pb-safe flex items-center justify-around z-30 shrink-0 shadow-2xl">
          {/* Sohbet Sekmesi */}
          <button
            onClick={() => {
              setActiveTab("chat");
              setShowOnlyStarred(false);
            }}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === "chat" && !showOnlyStarred
                ? "text-[#00a884] font-semibold scale-105"
                : "text-[#8696a0] hover:text-white"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px]">Sohbet</span>
          </button>

          {/* Galeri Sekmesi */}
          <button
            onClick={() => setActiveTab("gallery")}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === "gallery"
                ? "text-[#00a884] font-semibold scale-105"
                : "text-[#8696a0] hover:text-white"
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px]">Galeri</span>
          </button>

          {/* İlişki Wrapped Sekmesi */}
          <button
            onClick={() => setActiveTab("wrapped")}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === "wrapped"
                ? "text-rose-400 font-semibold scale-105"
                : "text-[#8696a0] hover:text-white"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px]">Wrapped ❤️</span>
          </button>
        </nav>
      )}

      {/* 4. LIGHTBOX TAM EKRAN FOTOĞRAF MODAL */}
      <Lightbox
        isOpen={lightbox.isOpen}
        onClose={closeLightbox}
        imageUrl={lightbox.imageUrl}
        sender={lightbox.sender}
        dateStr={lightbox.dateStr}
        timeStr={lightbox.timeStr}
        caption={lightbox.caption}
      />

      {/* 5. YEDEĞİ SIFIRLAMA ONAY MODALI */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#1f2c34] border border-[#2a3942] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-white">Yedeği Sıfırlamak İstiyor Musunuz?</h3>
              <p className="text-xs text-[#8696a0] mt-1.5 leading-relaxed">
                Kayıtlı mesajlar, yıldızlar ve medya IndexedDB hafızasından silinecektir. Tekrar görüntülemek için dosyanızı yeniden yüklemeniz gerekecektir.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 px-3 bg-[#2a3942] hover:bg-[#3b4a54] text-xs font-medium text-[#e9edef] rounded-xl transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-xs font-medium text-white rounded-xl transition shadow"
              >
                Evet, Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. IPHONE KURULUM REHBERİ MODALI */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}