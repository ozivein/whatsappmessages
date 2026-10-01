import { get, set, del } from "idb-keyval";
import { StoredChatData } from "@/types/chat";

const CHAT_DATA_KEY = "whatsapp_capsule_chat_data_v1";
const SENDER_PREF_KEY = "whatsapp_capsule_sender_pref_v1";
const STARRED_MSGS_KEY = "whatsapp_capsule_starred_ids_v1";

/**
 * Sohbet verisini (mesajlar, katılımcılar, medya blobları) IndexedDB'ye kaydeder.
 */
export async function saveChatToStorage(data: StoredChatData): Promise<boolean> {
  try {
    await set(CHAT_DATA_KEY, data);
    if (data.mySenderName) {
      await set(SENDER_PREF_KEY, data.mySenderName);
    }
    return true;
  } catch (error) {
    console.error("IndexedDB kaydetme hatası:", error);
    return false;
  }
}

/**
 * Kayıtlı sohbet verisini IndexedDB'den yükler.
 */
export async function loadChatFromStorage(): Promise<StoredChatData | undefined> {
  try {
    const data = await get<StoredChatData>(CHAT_DATA_KEY);
    if (!data) return undefined;

    // Kullanıcının son seçtiği taraf tercihini al
    const savedSender = await get<string>(SENDER_PREF_KEY);
    if (savedSender && data.participants.includes(savedSender)) {
      data.mySenderName = savedSender;
    }

    return data;
  } catch (error) {
    console.error("IndexedDB okuma hatası:", error);
    return undefined;
  }
}

/**
 * 'Ben kimim' seçimini günceller.
 */
export async function updateSavedSender(senderName: string): Promise<void> {
  try {
    await set(SENDER_PREF_KEY, senderName);
    // Ana nesnedeki değeri de güncelle
    const data = await get<StoredChatData>(CHAT_DATA_KEY);
    if (data) {
      data.mySenderName = senderName;
      await set(CHAT_DATA_KEY, data);
    }
  } catch (error) {
    console.error("Gönderen tercihi kaydedilemedi:", error);
  }
}

/**
 * Yıldızlı mesaj ID listesini kaydeder.
 */
export async function saveStarredIds(ids: number[]): Promise<void> {
  try {
    await set(STARRED_MSGS_KEY, ids);
  } catch (error) {
    console.error("Yıldızlı mesajlar kaydedilemedi:", error);
  }
}

/**
 * Yıldızlı mesaj ID listesini okur.
 */
export async function loadStarredIds(): Promise<number[]> {
  try {
    const ids = await get<number[]>(STARRED_MSGS_KEY);
    return ids || [];
  } catch (error) {
    console.error("Yıldızlı mesajlar okunamadı:", error);
    return [];
  }
}

/**
 * Tüm kayıtlı sohbet ve medya verilerini IndexedDB'den temizler.
 */
export async function clearChatStorage(): Promise<boolean> {
  try {
    await del(CHAT_DATA_KEY);
    await del(SENDER_PREF_KEY);
    await del(STARRED_MSGS_KEY);
    return true;
  } catch (error) {
    console.error("IndexedDB temizleme hatası:", error);
    return false;
  }
}