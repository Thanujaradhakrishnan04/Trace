/**
 * vaultStorage.js
 * Native HTML5 IndexedDB storage engine for Evidence Vault.
 * Provides high-capacity persistence for video, audio, and photo files
 * without the 5MB browser localStorage quota limitation.
 */

const DB_NAME = 'StreetSentinelVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'vault_records';

function openVaultDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVaultRecordDB(record) {
  if (!record || !record.id) return null;
  try {
    const db = await openVaultDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[VaultStorage] IndexedDB save warning:', err);
    return null;
  }
}

export async function getAllVaultRecordsDB() {
  try {
    const db = await openVaultDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = (req.result || []).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        resolve(records);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[VaultStorage] IndexedDB read warning:', err);
    return [];
  }
}

export async function deleteVaultRecordDB(id) {
  try {
    const db = await openVaultDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[VaultStorage] IndexedDB delete warning:', err);
    return false;
  }
}

