"use client";

import React, { useEffect } from "react";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  sender?: string;
  dateStr?: string;
  timeStr?: string;
  caption?: string;
}

export function Lightbox({
  isOpen,
  onClose,
  imageUrl,
  sender,
  dateStr,
  timeStr,
  caption,
}: LightboxProps) {
  const [scale, setScale] = React.useState<number>(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
      setScale(1);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `whatsapp-ani-${dateStr || "photo"}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Üst Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-[#111b21]/80 border-b border-white/10 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-[#8696a0] hover:text-white hover:bg-white/10 rounded-full transition"
            title="Kapat (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-sm font-semibold text-[#e9edef] leading-tight">
              {sender || "Fotoğraf"}
            </h3>
            <p className="text-[11px] text-[#8696a0]">
              {dateStr} {timeStr && `• ${timeStr}`}
            </p>
          </div>
        </div>

        {/* Aksiyonlar: Yakınlaştır, Uzaklaştır, İndir */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setScale((s) => Math.min(s + 0.3, 3))}
            className="p-2 text-[#8696a0] hover:text-white hover:bg-white/10 rounded-full transition"
            title="Yakınlaştır"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.3, 0.7))}
            className="p-2 text-[#8696a0] hover:text-white hover:bg-white/10 rounded-full transition"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-[#8696a0] hover:text-white hover:bg-white/10 rounded-full transition"
            title="İndir"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orta Görsel Alanı */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => {
          // Çift tıklamada zoom toggle
          if (e.detail === 2) {
            setScale((s) => (s > 1 ? 1 : 2));
          }
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="WhatsApp Anı Fotoğrafı"
          style={{ transform: `scale(${scale})` }}
          className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl transition-transform duration-200 cursor-zoom-in"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Alt Açıklama (Varsa Caption) */}
      {caption && (
        <div
          className="p-4 bg-[#111b21]/90 border-t border-white/10 text-center z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-[#e9edef] max-w-xl mx-auto break-words">
            {caption}
          </p>
        </div>
      )}
    </div>
  );
}
