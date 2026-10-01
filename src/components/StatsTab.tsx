"use client";

import React, { useMemo } from "react";
import { ChatMessage } from "@/types/chat";
import {
  Heart,
  MessageCircle,
  Calendar,
  Flame,
  Moon,
  Sparkles,
  Trophy,
} from "lucide-react";
import confetti from "canvas-confetti";

interface StatsTabProps {
  messages: ChatMessage[];
  participants: string[];
  mySenderName: string;
}

export function StatsTab({
  messages,
  participants,
  mySenderName,
}: StatsTabProps) {
  // 1. İstatistik Hesaplamaları (Memoized)
  const stats = useMemo(() => {
    if (messages.length === 0) return null;

    const senderCounts: Record<string, number> = {};
    const dateCounts: Record<string, number> = {};
    const hourCounts: Record<string, number> = {
      night: 0, // 00:00 - 05:59
      morning: 0, // 06:00 - 11:59
      afternoon: 0, // 12:00 - 17:59
      evening: 0, // 18:00 - 23:59
    };

    // Sevgi sözcükleri listesi
    const loveWordsList = [
      { key: "seni seviyorum", regex: /seni\s+seviyorum/gi },
      { key: "aşkım / askim", regex: /a[şs]k[ıi]m/gi },
      { key: "sevgilim", regex: /sevgilim/gi },
      { key: "özledim / ozledim", regex: /[öo]zledim/gi },
      { key: "fıstığım / fistigim", regex: /f[ıi]st[ıi][ğg][ıi]m/gi },
      { key: "canım / canim", regex: /can[ıi]m/gi },
      { key: "bebeğim / bebegim", regex: /bebe[ğg]im/gi },
      { key: "hayatım / hayatim", regex: /hayat[ıi]m/gi },
    ];

    const loveWordCounts: Record<string, { total: number; bySender: Record<string, number> }> = {};
    loveWordsList.forEach((w) => {
      loveWordCounts[w.key] = { total: 0, bySender: {} };
    });

    // Emoji frekansı
    const emojiCounts: Record<string, number> = {};
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;

    messages.forEach((msg) => {
      // Gönderen mesaj sayısı
      senderCounts[msg.sender] = (senderCounts[msg.sender] || 0) + 1;

      // Günlük mesaj sayısı
      dateCounts[msg.dateStr] = (dateCounts[msg.dateStr] || 0) + 1;

      // Saat dilimi
      const hour = parseInt(msg.timeStr.slice(0, 2), 10);
      if (!isNaN(hour)) {
        if (hour >= 0 && hour < 6) hourCounts.night++;
        else if (hour >= 6 && hour < 12) hourCounts.morning++;
        else if (hour >= 12 && hour < 18) hourCounts.afternoon++;
        else hourCounts.evening++;
      }

      // Sevgi sözcükleri taraması
      const text = msg.text || "";
      loveWordsList.forEach((lw) => {
        const matches = text.match(lw.regex);
        if (matches) {
          const count = matches.length;
          loveWordCounts[lw.key].total += count;
          loveWordCounts[lw.key].bySender[msg.sender] =
            (loveWordCounts[lw.key].bySender[msg.sender] || 0) + count;
        }
      });

      // Emoji taraması
      const emojiMatches = text.match(emojiRegex);
      if (emojiMatches) {
        emojiMatches.forEach((em) => {
          // Sayı, ASCII kontrol emojilerini ele
          if (!/[0-9#*]/.test(em)) {
            emojiCounts[em] = (emojiCounts[em] || 0) + 1;
          }
        });
      }
    });

    // En çok konuşulan gün
    let maxDate = "";
    let maxDateCount = 0;
    Object.entries(dateCounts).forEach(([d, count]) => {
      if (count > maxDateCount) {
        maxDateCount = count;
        maxDate = d;
      }
    });

    // En popüler ilk 6 emoji
    const topEmojis = Object.entries(emojiCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const firstMsgDate = messages[0]?.dateStr || "";
    const lastMsgDate = messages[messages.length - 1]?.dateStr || "";

    return {
      totalMessages: messages.length,
      senderCounts,
      firstMsgDate,
      lastMsgDate,
      maxDate,
      maxDateCount,
      hourCounts,
      loveWordCounts,
      topEmojis,
    };
  }, [messages]);

  const fireLoveConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#ff4081", "#e91e63", "#9c27b0", "#00a884", "#ffd700"],
    });
  };

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center text-[#8696a0]">
        İstatistiklerin hesaplanması için henüz mesaj bulunmuyor.
      </div>
    );
  }

  const p1 = "Oğuzhan";
  const p2 = "Şüheda";
  const p1Count = stats.senderCounts[p1] || 0;
  const p2Count = stats.senderCounts[p2] || 0;
  const p1Percent = Math.round((p1Count / stats.totalMessages) * 100) || 50;
  const p2Percent = 100 - p1Percent;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full space-y-6 select-none pb-24">
      {/* 1. BAŞLIK VE KUTLAMA KARTI */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950/60 via-[#111b21] to-emerald-950/40 border border-rose-500/20 p-6 text-center shadow-xl">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Heart className="w-7 h-7 fill-rose-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Bizim Hikayemiz &bull; İlişki Özeti
        </h2>
        <p className="text-xs text-[#8696a0] mt-1">
          {stats.firstMsgDate} &mdash; {stats.lastMsgDate} tarihleri arasındaki aşk yolculuğumuz
        </p>

        <button
          type="button"
          onClick={fireLoveConfetti}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/40 transition active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          Aşkımızı Kutla! 🎉
        </button>
      </div>

      {/* 2. MESAJ SAYISI VE KİM DAHA ÇOK YAZDI */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <MessageCircle className="w-4 h-4 text-[#00a884]" />
            <span>Toplam Mesajlaşma</span>
          </div>
          <span className="text-base font-bold text-[#00a884]">
            {stats.totalMessages.toLocaleString("tr-TR")} Mesaj
          </span>
        </div>

        {/* Dağılım Çubuğu */}
        <div className="space-y-2">
          <div className="h-3 w-full bg-[#202c33] rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${p1Percent}%` }}
              className="bg-[#00a884] h-full transition-all duration-500"
              title={`${p1}: %${p1Percent}`}
            />
            <div
              style={{ width: `${p2Percent}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title={`${p2}: %${p2Percent}`}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-[#8696a0]">
            <span className="flex items-center gap-1.5 font-medium text-[#e9edef]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00a884] inline-block" />
              {p1}: {p1Count.toLocaleString("tr-TR")} (%{p1Percent})
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[#e9edef]">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              {p2}: {p2Count.toLocaleString("tr-TR")} (%{p2Percent})
            </span>
          </div>
        </div>
      </div>

      {/* 3. REKOR GÜN & ZAMAN ANALİZİ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* En Çok Konuşulan Gün */}
        <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-4 shadow-md space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-medium text-xs">
            <Flame className="w-4 h-4" />
            <span>Rekor Mesaj Günü</span>
          </div>
          <p className="text-lg font-bold text-white">{stats.maxDate}</p>
          <p className="text-xs text-[#8696a0]">
            Tam <span className="text-[#00a884] font-semibold">{stats.maxDateCount} mesaj</span> ile konuşma rekoru kırıldı!
          </p>
        </div>

        {/* Gece Sohbetleri */}
        <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-4 shadow-md space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-medium text-xs">
            <Moon className="w-4 h-4" />
            <span>Gece Kuşları (00:00 - 06:00)</span>
          </div>
          <p className="text-lg font-bold text-white">
            {stats.hourCounts.night.toLocaleString("tr-TR")} Mesaj
          </p>
          <p className="text-xs text-[#8696a0]">
            Uykudan feragat edip sabaha kadar süren tatlı sohbetler
          </p>
        </div>
      </div>

      {/* 4. SEVGİ SÖZCÜKLERİ SAYACI */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <Trophy className="w-4 h-4" />
            <span>Sevgi Sözcükleri Sayacı</span>
          </div>
          <span className="text-[11px] text-[#8696a0]">Kelimelerin Aşk Karnesi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {Object.entries(stats.loveWordCounts).map(([word, data]) => {
            if (data.total === 0) return null;
            return (
              <div
                key={word}
                className="bg-[#182229] border border-[#222e35] rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <span className="block text-xs font-semibold text-white capitalize">
                    {word}
                  </span>
                  <span className="text-[10px] text-[#8696a0]">
                    <span className="mr-2.5 text-[#00a884] font-medium">
                      Oğuzhan: {data.bySender["Oğuzhan"] || 0}
                    </span>
                    <span className="text-rose-400 font-medium">
                      Şüheda: {data.bySender["Şüheda"] || 0}
                    </span>
                  </span>
                </div>
                <span className="text-sm font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                  {data.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. EN ÇOK KULLANILAN EMOJİLER */}
      {stats.topEmojis.length > 0 && (
        <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-5 shadow-md space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Favori Emojilerimiz</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {stats.topEmojis.map(([emoji, count]) => (
              <div
                key={emoji}
                className="bg-[#182229] border border-[#222e35] rounded-xl p-2.5 text-center flex flex-col items-center justify-center hover:scale-105 transition"
              >
                <span className="text-2xl mb-1">{emoji}</span>
                <span className="text-[11px] font-semibold text-[#8696a0]">
                  {count.toLocaleString("tr-TR")} kez
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
