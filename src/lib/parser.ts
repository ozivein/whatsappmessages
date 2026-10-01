import JSZip from "jszip";
import { ChatMessage, MediaType } from "@/types/chat";

/**
 * WhatsApp metinlerindeki görünmez Unicode yönlendirme ve biçimlendirme karakterlerini temizler.
 */
export function cleanUnicode(str: string): string {
  return str
    .replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2060\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .trim();
}

/**
 * Dosya uzantısına göre uygun MIME tipini döner.
 * Özellikle iOS Safari ve mobil cihazlarda ses/video oynatımı için kritik önem taşır.
 */
export function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "opus":
      return "audio/ogg; codecs=opus";
    case "ogg":
      return "audio/ogg";
    case "m4a":
      return "audio/mp4";
    case "mp3":
      return "audio/mpeg";
    default:
      return "application/octet-stream";
  }
}

/**
 * Mesaj metninden ekli medya dosya adını (varsa) ayıklar.
 */
export function extractMediaFileName(text: string): {
  fileName?: string;
  cleanText: string;
  type?: MediaType;
  isMediaOmitted: boolean;
} {
  const trimmed = cleanUnicode(text);

  // Medya dahil edilmedi tespiti (<Medya dahil edilmedi>, <Media omitted> vb.)
  if (
    /^(?:<Medya dahil edilmedi>|<Media omitted>|Medya dahil edilmedi|Media omitted)$/i.test(
      trimmed
    )
  ) {
    return {
      fileName: undefined,
      cleanText: "Medya dahil edilmedi",
      type: undefined,
      isMediaOmitted: true,
    };
  }

  // iOS: <eklendi: 000001-PHOTO.jpg> | Android: IMG-2025-WA0001.jpg (dosya eklendi)
  const mediaRegex =
    /(?:<eklendi:\s*|<attached:\s*)?([\w\-. ]+\.(?:jpg|jpeg|png|webp|mp4|mov|opus|ogg|m4a|mp3))(?:\s*\((?:dosya eklendi|file attached)\)|>)?/i;
  const match = trimmed.match(mediaRegex);

  if (!match) {
    return { cleanText: text, isMediaOmitted: false };
  }

  const fileName = match[1].trim();
  const cleanText = trimmed.replace(match[0], "").trim();
  const ext = fileName.split(".").pop()?.toLowerCase();

  let type: MediaType | undefined;
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) type = "image";
  else if (["mp4", "mov"].includes(ext || "")) type = "video";
  else if (["opus", "ogg", "m4a", "mp3"].includes(ext || "")) type = "audio";

  return {
    fileName,
    cleanText,
    type,
    isMediaOmitted: false,
  };
}

/**
 * Bir satırın sistem mesajı olup olmadığını kontrol eder.
 */
function isSystemMessage(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes("uçtan uca şifrelidir") ||
    lower.includes("end-to-end encrypted") ||
    lower.includes("güvenlik kodunuz değişti") ||
    lower.includes("security code changed") ||
    lower.includes("grubu oluşturdu") ||
    lower.includes("gruptan ayrıldı") ||
    lower.includes("created group") ||
    lower.includes("left the group") ||
    lower.includes("bu mesaj silindi") ||
    lower.includes("this message was deleted")
  );
}

/**
 * Ham WhatsApp metin yedeğini mesaj dizisine dönüştürür.
 * iOS: [07.11.2021 07:48:12] Oğuzhan: ...
 * Android: 7.11.2021 07:48 - Oğuzhan: ...
 */
export function parseWhatsAppText(rawText: string): {
  messages: ChatMessage[];
  participants: string[];
} {
  const lines = rawText.split(/\r?\n/);
  const messages: ChatMessage[] = [];
  const sendersSet = new Set<string>();

  // 1) iOS formatı: [GG.AA.YYYY SS:DD:ss] veya [GG/AA/YYYY, SS:DD] İsim: Mesaj
  const iosRegex =
    /^\[(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPpÖö][MmSs])?)\]\s*([^:]+):\s*(.*)$/;

  // 2) Android formatı: GG.AA.YYYY SS:DD - İsim: Mesaj
  const androidRegex =
    /^(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPpÖö][MmSs])?)\s*-\s*([^:]+):\s*(.*)$/;

  let msgIdCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanLine = cleanUnicode(rawLine);

    if (!cleanLine) continue;

    // Satır iOS veya Android mesaj formatına uyuyor mu?
    const match = cleanLine.match(iosRegex) || cleanLine.match(androidRegex);

    if (match) {
      const [, dateStr, timeStr, senderRaw, messageContent] = match;
      const sender = senderRaw.trim();

      // Sistem bildirimlerini yoksay
      if (isSystemMessage(sender) || isSystemMessage(messageContent)) {
        continue;
      }

      // Göndereni kesin olarak Oğuzhan veya Şüheda olarak normalize et
      const isOguzhan =
        sender.toLowerCase().includes("oğuzhan") ||
        sender.toLowerCase().includes("oguzhan");
      const normalizedSender = isOguzhan ? "Oğuzhan" : "Şüheda";

      sendersSet.add(normalizedSender);
      const { fileName, cleanText, type, isMediaOmitted } =
        extractMediaFileName(messageContent);

      messages.push({
        id: ++msgIdCounter,
        dateStr: dateStr.trim(),
        timeStr: timeStr.slice(0, 5),
        sender: normalizedSender,
        text: cleanText,
        isMediaOmitted,
        mediaFileName: fileName,
        mediaType: type,
      });
    } else {
      // Önceki mesajın devamı (çok satırlı mesaj) olabilir
      if (messages.length > 0) {
        if (isSystemMessage(cleanLine)) {
          continue;
        }

        const lastMsg = messages[messages.length - 1];
        const { fileName, cleanText, type, isMediaOmitted } =
          extractMediaFileName(cleanLine);

        if (fileName) {
          lastMsg.mediaFileName = fileName;
          lastMsg.mediaType = type;
        }
        if (isMediaOmitted) {
          lastMsg.isMediaOmitted = true;
        }

        if (cleanText) {
          lastMsg.text = lastMsg.text ? `${lastMsg.text}\n${cleanText}` : cleanText;
        }
      }
    }
  }

  return {
    messages,
    participants: ["Oğuzhan", "Şüheda"],
  };
}

/**
 * Yüklenen .txt veya .zip dosyasını ayrıştırır.
 * Zip içindeki tüm medya dosyalarını uygun MIME tipiyle Blob olarak ayıklar.
 */
export async function processUploadedFile(file: File): Promise<{
  messages: ChatMessage[];
  participants: string[];
  mediaBlobs: Record<string, Blob>;
}> {
  const mediaBlobs: Record<string, Blob> = {};
  let chatTxtContent = "";

  if (file.name.endsWith(".zip")) {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);

    // Olası .txt dosyalarını ve medya dosyalarını tara
    const txtFiles: { name: string; contentPromise: () => Promise<string>; size: number }[] = [];

    for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
      // macOS gizli dosyalarını ve dizinleri atla
      if (zipEntry.dir || relativePath.includes("__MACOSX") || relativePath.startsWith(".")) {
        continue;
      }

      const baseName = relativePath.split("/").pop() || relativePath;

      if (baseName.toLowerCase().endsWith(".txt")) {
        txtFiles.push({
          name: baseName,
          contentPromise: () => zipEntry.async("string"),
          // JSZip entry data boyutu
          size: (zipEntry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0,
        });
      } else if (
        /\.(jpg|jpeg|png|webp|gif|mp4|mov|opus|ogg|m4a|mp3)$/i.test(baseName)
      ) {
        const mimeType = getMimeType(baseName);
        const arrayBuffer = await zipEntry.async("arraybuffer");
        const blob = new Blob([arrayBuffer], { type: mimeType });

        // Hem tam ad hem de küçük harfli ad ile indeksle
        mediaBlobs[baseName] = blob;
        mediaBlobs[baseName.toLowerCase()] = blob;
      }
    }

    if (txtFiles.length > 0) {
      // _chat.txt veya boyutu en büyük olanı tercih et
      const chatTxtEntry =
        txtFiles.find((f) => f.name.toLowerCase() === "_chat.txt") ||
        txtFiles.reduce((prev, curr) => (curr.size > prev.size ? curr : prev), txtFiles[0]);

      chatTxtContent = await chatTxtEntry.contentPromise();
    }
  } else if (file.name.endsWith(".txt")) {
    chatTxtContent = await file.text();
  }

  const { messages, participants } = parseWhatsAppText(chatTxtContent);
  return { messages, participants, mediaBlobs };
}

/**
 * Dosya adına göre mediaBlobs içinden eşleşen Blob'u bulur.
 */
export function findMediaBlob(
  mediaBlobs: Record<string, Blob>,
  fileName?: string
): Blob | undefined {
  if (!fileName) return undefined;
  if (mediaBlobs[fileName]) return mediaBlobs[fileName];

  const lower = fileName.toLowerCase();
  if (mediaBlobs[lower]) return mediaBlobs[lower];

  // Alternatif temizlenmiş arama (örn: boşluk veya önek farkları)
  for (const [key, blob] of Object.entries(mediaBlobs)) {
    if (key.toLowerCase().endsWith(lower) || lower.endsWith(key.toLowerCase())) {
      return blob;
    }
  }

  return undefined;
}