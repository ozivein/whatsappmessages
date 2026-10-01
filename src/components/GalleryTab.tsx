"use client";

import React, { useMemo } from "react";
import { ChatMessage } from "@/types/chat";
import { findMediaBlob } from "@/lib/parser";
import { Image as ImageIcon, Calendar, User, FileArchive } from "lucide-react";

interface GalleryTabProps {
  messages: ChatMessage[];
  mediaBlobs: Record<string, Blob>;
  onOpenLightbox: (imageUrl: string, message: ChatMessage) => void;
}

export function GalleryTab({
  messages,
  mediaBlobs,
  onOpenLightbox,
}: GalleryTabProps) {
  // Sadece fotoğraf içeren mesajları filtrele
  const photoMessages = useMemo(() => {
    return messages.filter((m) => {
      if (m.mediaType === "image") return true;
      if (
        m.mediaFileName &&
        /\.(jpg|jpeg|png|webp|gif)$/i.test(m.mediaFileName)
      ) {
        return true;
      }
      return false;
    });
  }, [messages]);

  // Fotoğrafların Object URL'lerini hazırla
  const photoItems = useMemo(() => {
    return photoMessages.map((msg) => {
      const blob = msg.mediaFileName
        ? findMediaBlob(mediaBlobs, msg.mediaFileName)
        : undefined;
      const url = blob ? URL.createObjectURL(blob) : null;
      return {
        msg,
        url,
      };
    });
  }, [photoMessages, mediaBlobs]);

  if (photoItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#202c33] border border-[#2a3942] flex items-center justify-center text-[#8696a0] mb-3">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">
          Henüz Fotoğraf Yok
        </h3>
        <p className="text-xs text-[#8696a0] leading-relaxed mb-4">
          Fotoğraflarınızı burada albüm gibi görebilmek için WhatsApp&apos;tan <b>&quot;Medyayı Dahil Et&quot;</b> diyerek dışa aktardığınız <b>.zip</b> dosyasını yükleyin.
        </p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111b21] border border-[#222e35] text-[11px] text-[#00a884]">
          <FileArchive className="w-3.5 h-3.5" /> .zip Yedekleri Desteklenir
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 max-w-4xl mx-auto w-full pb-24">
      {/* Üst Bilgi Rozeti */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#00a884]" />
          <h2 className="text-sm font-semibold text-white">Anı Galerimiz</h2>
        </div>
        <span className="text-xs text-[#8696a0]">
          Toplam {photoItems.length} Fotoğraf
        </span>
      </div>

      {/* Fotoğraf Izgarası (Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
        {photoItems.map(({ msg, url }, idx) => {
          if (!url) {
            // Blob bulunamadıysa (sadece .txt yüklendiyse)
            return (
              <div
                key={msg.id || idx}
                className="aspect-square rounded-2xl bg-[#111b21] border border-[#222e35] p-3 flex flex-col justify-between text-xs text-[#8696a0]"
              >
                <div className="flex items-center justify-between">
                  <ImageIcon className="w-4 h-4 text-amber-500/70" />
                  <span className="text-[10px]">{msg.dateStr}</span>
                </div>
                <p className="truncate font-medium text-[#e9edef] text-[11px]">
                  {msg.mediaFileName}
                </p>
                <span className="text-[9px] text-[#8696a0]">.zip olmadan önizlenemez</span>
              </div>
            );
          }

          return (
            <div
              key={msg.id || idx}
              onClick={() => onOpenLightbox(url, msg)}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#111b21] border border-[#222e35] cursor-pointer shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:border-[#00a884]/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={msg.text || msg.mediaFileName || "Anı"}
                loading="lazy"
                className="w-full h-full object-cover transition duration-300 group-hover:brightness-95"
              />

              {/* Alt Karartma ve Bilgi */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex items-center justify-between text-[10px] text-white/90">
                  <span className="flex items-center gap-1 truncate max-w-[65%]">
                    <User className="w-3 h-3 text-[#00a884]" />
                    {msg.sender}
                  </span>
                  <span className="flex items-center gap-1 shrink-0 text-[#8696a0]">
                    <Calendar className="w-2.5 h-2.5" />
                    {msg.dateStr}
                  </span>
                </div>
                {msg.text && (
                  <p className="text-[11px] text-[#e9edef] truncate mt-0.5">
                    {msg.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
