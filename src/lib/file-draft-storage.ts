export type FileDraftMap = Record<string, File>;

type StoredFileDraft = {
  name: string;
  type: string;
  lastModified: number;
  dataUrl: string;
};

const DB_NAME = "sth-file-drafts";
const STORE_NAME = "drafts";
const DB_VERSION = 1;

const openDraftDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const dataUrlToFile = (draft: StoredFileDraft) => {
  const [header, base64] = draft.dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || draft.type || "application/octet-stream";
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], draft.name, { type: mime, lastModified: draft.lastModified });
};

export const saveFileDrafts = async (key: string, files: FileDraftMap) => {
  const entries = Object.entries(files).filter(([, file]) => file instanceof File);
  const db = await openDraftDb();

  if (entries.length === 0) {
    await clearFileDrafts(key);
    db.close();
    return;
  }

  const value: Record<string, StoredFileDraft> = {};
  for (const [slot, file] of entries) {
    value[slot] = {
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
      dataUrl: await fileToDataUrl(file),
    };
  }

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};

export const loadFileDrafts = async (key: string): Promise<FileDraftMap> => {
  const db = await openDraftDb();
  const value = await new Promise<Record<string, StoredFileDraft> | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();

  if (!value) return {};
  return Object.fromEntries(Object.entries(value).map(([slot, draft]) => [slot, dataUrlToFile(draft)]));
};

export const clearFileDrafts = async (key: string) => {
  const db = await openDraftDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};