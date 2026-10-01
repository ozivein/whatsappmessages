"use client";

import React from "react";
import { X, Share, PlusSquare, Smartphone, Heart } from "lucide-react";

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallModal({ isOpen, onClose }: InstallModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#1f2c34] border border-[#2a3942] rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8696a0] hover:text-white rounded-full hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Başlık */}
        <div className="text-center space-y-1 pt-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg mb-3">
            <Heart className="w-7 h-7 text-white fill-white animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white">
            iPhone&apos;a Uygulama Olarak Yükleme
          </h3>
          <p className="text-xs text-[#8696a0] leading-relaxed">
            Safari üzerinden ana ekrana ekleyerek adres çubuğu olmadan tam ekran WhatsApp deneyimi yaşayın.
          </p>
        </div>

        {/* Adımlar */}
        <div className="space-y-3 pt-1">
          {/* 1. Adım */}
          <div className="flex items-start gap-3 bg-[#111b21] p-3 rounded-2xl border border-[#2a3942]">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
              1
            </div>
            <div className="text-xs">
              <p className="font-semibold text-[#e9edef] flex items-center gap-1.5">
                Safari&apos;de Paylaş&apos;a Dokun
                <Share className="w-3.5 h-3.5 text-blue-400" />
              </p>
              <p className="text-[#8696a0] text-[11px] mt-0.5">
                Safari&apos;nin alt çubuğundaki kare içinden yukarı çıkan ok simgesine basın.
              </p>
            </div>
          </div>

          {/* 2. Adım */}
          <div className="flex items-start gap-3 bg-[#111b21] p-3 rounded-2xl border border-[#2a3942]">
            <div className="w-8 h-8 rounded-xl bg-[#00a884]/10 text-[#00a884] flex items-center justify-center shrink-0 font-bold text-xs">
              2
            </div>
            <div className="text-xs">
              <p className="font-semibold text-[#e9edef] flex items-center gap-1.5">
                &quot;Ana Ekrana Ekle&quot;yi Seç
                <PlusSquare className="w-3.5 h-3.5 text-[#00a884]" />
              </p>
              <p className="text-[#8696a0] text-[11px] mt-0.5">
                Açılan menüyü aşağı kaydırıp <b>&quot;Ana Ekrana Ekle&quot;</b> seçeneğine dokunun.
              </p>
            </div>
          </div>

          {/* 3. Adım */}
          <div className="flex items-start gap-3 bg-[#111b21] p-3 rounded-2xl border border-[#2a3942]">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 font-bold text-xs">
              3
            </div>
            <div className="text-xs">
              <p className="font-semibold text-[#e9edef] flex items-center gap-1.5">
                Sağ Üstten &quot;Ekle&quot; De
                <Smartphone className="w-3.5 h-3.5 text-rose-400" />
              </p>
              <p className="text-[#8696a0] text-[11px] mt-0.5">
                Başlık otomatik olarak <b>Bizim Hikayemiz ❤️</b> gelecektir. Ekle&apos;ye bastığınızda uygulama telefonunuza yüklenir!
              </p>
            </div>
          </div>
        </div>

        {/* Anladım Butonu */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold shadow-lg transition active:scale-98"
        >
          Harika, Anladım!
        </button>
      </div>
    </div>
  );
}
