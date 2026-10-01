"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Mic } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
  isMe: boolean;
}

export function AudioPlayer({ audioUrl, isMe }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleRate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[220px] max-w-[280px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Oynat / Durdur Butonu */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition shadow-sm ${
          isMe
            ? "bg-[#00a884] text-white hover:bg-[#008f6f]"
            : "bg-[#00a884] text-white hover:bg-[#008f6f]"
        }`}
        aria-label={isPlaying ? "Durdur" : "Oynat"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-white" />
        ) : (
          <Play className="w-4 h-4 fill-white ml-0.5" />
        )}
      </button>

      {/* İlerleme Çubuğu ve Süre */}
      <div className="flex-1 flex flex-col justify-center">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-[#8696a0]/30 rounded-lg appearance-none cursor-pointer accent-[#00a884]"
        />

        <div className="flex justify-between items-center text-[10px] text-[#8696a0] mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : ""}</span>
        </div>
      </div>

      {/* Hız Butonu */}
      <button
        type="button"
        onClick={toggleRate}
        className="text-[10px] font-bold bg-[#111b21] hover:bg-[#2a3942] text-[#8696a0] hover:text-white px-1.5 py-0.5 rounded transition shrink-0"
        title="Oynatma Hızı"
      >
        {playbackRate}x
      </button>

      {/* Ses Kaydı Rozeti */}
      <div className="shrink-0" title="Ses Kaydı">
        <Mic className={`w-3.5 h-3.5 ${isMe ? "text-[#53bdeb]" : "text-[#8696a0]"}`} />
      </div>
    </div>
  );
}
