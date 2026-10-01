"use client";

import React, { useMemo } from "react";
import { ChatMessage } from "@/types/chat";
import { AudioPlayer } from "./AudioPlayer";
import { Film, Image as ImageIcon, Music, AlertCircle } from "lucide-react";

interface MediaBubbleProps {
  message: ChatMessage;
  mediaBlob?: Blob;
  isMe: boolean;
  onOpenLightbox: (imageUrl: string, message: ChatMessage) => void;
}

export function MediaBubble({
  message,
  mediaBlob,
  isMe,
  onOpenLightbox,
}: MediaBubbleProps) {
  // Blob'dan Object URL üret
  const mediaUrl = useMemo(() => {
    if (!mediaBlob) return null;
    return URL.createObjectURL(mediaBlob);
  }, [mediaBlob]);

  // Medya tipi tespiti
  const mediaType = message.mediaType || "image";

  // Eğer blob yoksa (örneğin sadece .txt yüklendiyse ama mesajda ekli dosya varsa)
  if (!mediaUrl) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-[#111b21]/50 border border-[#2a3942] rounded-lg my-1 text-xs">
        {mediaType === "image" && <ImageIcon className="w-4 h-4 text-[#00a884] shrink-0" />}
        {mediaType === "video" && <Film className="w-4 h-4 text-[#00a884] shrink-0" />}
        {mediaType === "audio" && <Music className="w-4 h-4 text-[#00a884] shrink-0" />}
        <div className="min-w-0">
          <p className="font-medium text-[#e9edef] truncate">{message.mediaFileName}</p>
          <p className="text-[10px] text-[#8696a0] flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-500" /> Medyayı görmek için .zip yükleyin
          </p>
        </div>
      </div>
    );
  }

  // 1. FOTOĞRAF
  if (mediaType === "image") {
    return (
      <div className="my-1 overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt={message.mediaFileName || "Fotoğraf"}
          loading="lazy"
          onClick={() => onOpenLightbox(mediaUrl, message)}
          className="max-h-72 w-full object-cover rounded-lg cursor-pointer hover:opacity-95 transition-all duration-150 active:scale-[0.99] shadow-sm"
        />
      </div>
    );
  }

  // 2. VİDEO
  if (mediaType === "video") {
    return (
      <div className="my-1 overflow-hidden rounded-lg bg-black/30">
        <video
          src={mediaUrl}
          controls
          playsInline
          preload="metadata"
          className="max-h-72 w-full rounded-lg shadow-sm"
        />
      </div>
    );
  }

  // 3. SES (Audio / Voice Note)
  if (mediaType === "audio") {
    return (
      <div className="my-1">
        <AudioPlayer audioUrl={mediaUrl} isMe={isMe} />
      </div>
    );
  }

  return null;
}
