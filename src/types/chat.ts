export type MediaType = "image" | "video" | "audio";

export interface ChatMessage {
  id: number;
  dateStr: string; // Örn: "7.11.2021"
  timeStr: string; // Örn: "07:48"
  sender: string; // Örn: "Oğuzhan" veya "Fıstığım 🤎"
  text: string;
  isMediaOmitted?: boolean; // "<Medya dahil edilmedi>" durumu
  mediaFileName?: string;
  mediaType?: MediaType;
  isStarred?: boolean;
}

export interface StoredChatData {
  messages: ChatMessage[];
  participants: string[];
  mySenderName: string;
  // Fotoğraf/Video/Ses dosyalarını Blob olarak saklıyoruz
  mediaBlobs: Record<string, Blob>;
}