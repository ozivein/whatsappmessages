"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Lock, Heart, Delete, Sparkles } from "lucide-react";

interface LockScreenProps {
  onUnlock: () => void;
}

const CORRECT_PIN = "0708";

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length < 4 && !isSuccess) {
        const nextPin = pin + digit;
        setPin(nextPin);
        setIsError(false);

        if (nextPin.length === 4) {
          if (nextPin === CORRECT_PIN) {
            setIsSuccess(true);
            setTimeout(() => {
              onUnlock();
            }, 300);
          } else {
            setIsError(true);
            setTimeout(() => {
              setPin("");
              setIsError(false);
            }, 700);
          }
        }
      }
    },
    [pin, isSuccess, onUnlock]
  );

  const handleDelete = useCallback(() => {
    if (pin.length > 0 && !isSuccess) {
      setPin((prev) => prev.slice(0, -1));
      setIsError(false);
    }
  }, [pin, isSuccess]);

  // Fiziksel klavye desteği (0-9 ve Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigit, handleDelete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between py-10 px-6 pt-safe pb-safe bg-[#0b141a] text-[#e9edef] whatsapp-bg select-none animate-in fade-in duration-300">
      {/* Üst Kısım: Kilit Simgesi & Başlık */}
      <div className="flex flex-col items-center text-center mt-4 space-y-3">
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-2xl shadow-rose-950/40">
          {isSuccess ? (
            <Sparkles className="w-10 h-10 text-white animate-spin" />
          ) : (
            <Lock className="w-10 h-10 text-white" />
          )}
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white mt-2">
          Anı Kapsülü Kilitli
        </h1>
        <p className="text-xs text-[#8696a0]">
          {isError ? (
            <span className="text-rose-400 font-semibold animate-pulse">
              Hatalı şifre, tekrar deneyin ❤️
            </span>
          ) : isSuccess ? (
            <span className="text-[#00a884] font-semibold">
              Kilit açılıyor... ✨
            </span>
          ) : (
            "Aşk kapsülümüzü açmak için 4 haneli şifreyi girin"
          )}
        </p>

        {/* 4 Haneli PIN Göstergesi */}
        <div
          className={`flex items-center gap-4 pt-4 transition-transform duration-150 ${
            isError ? "translate-x-1 scale-105" : ""
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  isSuccess
                    ? "bg-[#00a884] border-[#00a884] scale-110 shadow-lg shadow-[#00a884]/50"
                    : isError
                    ? "bg-rose-500 border-rose-500 scale-110 shadow-lg shadow-rose-500/50"
                    : isFilled
                    ? "bg-rose-500 border-rose-500 scale-105 shadow-md shadow-rose-500/30"
                    : "border-[#3b4a54] bg-transparent"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Orta/Alt Kısım: iOS / WhatsApp Numpad Tuş Takımı */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-3 sm:gap-4 mb-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="w-[70px] h-[70px] mx-auto rounded-full bg-[#1f2c34]/90 hover:bg-[#2a3942] active:bg-[#00a884]/30 active:scale-95 border border-[#2a3942] text-2xl font-semibold text-white flex items-center justify-center transition shadow-md touch-manipulation cursor-pointer"
          >
            {digit}
          </button>
        ))}

        {/* Boşluk / Romantik Kalp İpucu */}
        <div className="w-[70px] h-[70px] mx-auto flex items-center justify-center text-rose-500/40">
          <Heart className="w-6 h-6 fill-rose-500/20" />
        </div>

        {/* 0 Rakamı */}
        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="w-[70px] h-[70px] mx-auto rounded-full bg-[#1f2c34]/90 hover:bg-[#2a3942] active:bg-[#00a884]/30 active:scale-95 border border-[#2a3942] text-2xl font-semibold text-white flex items-center justify-center transition shadow-md touch-manipulation cursor-pointer"
        >
          0
        </button>

        {/* Silme (Backspace) Butonu */}
        <button
          type="button"
          onClick={handleDelete}
          className="w-[70px] h-[70px] mx-auto rounded-full text-[#8696a0] hover:text-white active:scale-90 flex items-center justify-center transition touch-manipulation cursor-pointer"
          title="Sil"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* Alt Bilgi */}
      <p className="text-[11px] text-[#8696a0]/60 text-center">
        Oğuzhan &amp; Şüheda &bull; Özel Anı Kapsülü
      </p>
    </div>
  );
}
