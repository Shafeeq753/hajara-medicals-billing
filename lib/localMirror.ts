/**
 * Local-folder mirror using the File System Access API.
 *
 * Firestore is the source of truth. On top of that, the user may pick a folder
 * on their computer; we then mirror a single `hajara-data.json` file into it on
 * every change — a live local backup of everything in Firestore.
 *
 * Limitations (browser security, not ours):
 *  - Only works in Chromium browsers (Chrome / Edge). Firefox & Safari lack the API.
 *  - The directory handle is remembered (IndexedDB) across reloads, but the
 *    browser may ask the user to re-grant write permission after a restart.
 */

const MIRROR_FILENAME = 'hajara-data.json';
const IDB_NAME = 'hajara-mirror';
const IDB_STORE = 'handles';
const IDB_KEY = 'dir';

// The FS Access API types aren't in the default TS lib; keep it loose.
type DirHandle = any;

export const isFsAccessSupported = (): boolean =>
  typeof window !== 'undefined' && 'showDirectoryPicker' in window;

// ---- tiny IndexedDB helper (stores the FileSystemDirectoryHandle) ----------

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await idb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGet<T = unknown>(key: string): Promise<T | undefined> {
  const db = await idb();
  const result = await new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

async function idbDel(key: string): Promise<void> {
  const db = await idb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

// ---- permission helpers ----------------------------------------------------

async function ensurePermission(handle: DirHandle, prompt: boolean): Promise<boolean> {
  if (!handle) return false;
  const opts = { mode: 'readwrite' as const };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  if (!prompt) return false;
  return (await handle.requestPermission(opts)) === 'granted';
}

// ---- public API ------------------------------------------------------------

/** Open the OS folder picker and remember the chosen folder. Returns its name, or null if cancelled. */
export async function pickMirrorFolder(): Promise<string | null> {
  if (!isFsAccessSupported()) {
    throw new Error('This browser cannot save to a local folder. Use Chrome or Edge for the local backup.');
  }
  let handle: DirHandle;
  try {
    handle = await (window as any).showDirectoryPicker({ id: 'hajara-data', mode: 'readwrite' });
  } catch (err: any) {
    if (err && err.name === 'AbortError') return null; // user cancelled
    throw err;
  }
  const ok = await ensurePermission(handle, true);
  if (!ok) throw new Error('Write permission to the folder was not granted.');
  await idbSet(IDB_KEY, handle);
  return handle.name ?? 'selected folder';
}

/**
 * Re-attach to a previously chosen folder after a reload.
 * `prompt` controls whether the browser may show a permission dialog.
 * Returns the folder name if usable, otherwise null.
 */
export async function reconnectMirrorFolder(prompt = false): Promise<string | null> {
  if (!isFsAccessSupported()) return null;
  const handle = await idbGet<DirHandle>(IDB_KEY);
  if (!handle) return null;
  const ok = await ensurePermission(handle, prompt);
  if (!ok) return null;
  return handle.name ?? 'selected folder';
}

/** Forget the saved folder (stops mirroring). */
export async function forgetMirrorFolder(): Promise<void> {
  await idbDel(IDB_KEY);
}

/** True if a folder has been chosen (regardless of current permission state). */
export async function hasMirrorFolder(): Promise<boolean> {
  if (!isFsAccessSupported()) return false;
  return (await idbGet<DirHandle>(IDB_KEY)) !== undefined;
}

export interface MirrorStatus {
  hasFolder: boolean; // a folder was chosen at some point
  name: string | null;
  granted: boolean;   // we currently have write permission (no prompt needed)
}

/**
 * Report the saved folder + whether we currently hold write permission.
 * Never prompts — safe to call on load. Use `reconnectMirrorFolder(true)` to
 * re-grant when `hasFolder && !granted`.
 */
export async function getMirrorStatus(): Promise<MirrorStatus> {
  if (!isFsAccessSupported()) return { hasFolder: false, name: null, granted: false };
  const handle = await idbGet<DirHandle>(IDB_KEY);
  if (!handle) return { hasFolder: false, name: null, granted: false };
  let granted = false;
  try {
    granted = (await handle.queryPermission({ mode: 'readwrite' })) === 'granted';
  } catch { /* ignore */ }
  return { hasFolder: true, name: handle.name ?? 'selected folder', granted };
}

/**
 * Write the given data object as pretty JSON into hajara-data.json in the
 * remembered folder. Silently no-ops if no folder / no permission.
 * Returns true if the file was written.
 */
export async function writeMirror(data: unknown): Promise<boolean> {
  if (!isFsAccessSupported()) return false;
  const handle = await idbGet<DirHandle>(IDB_KEY);
  if (!handle) return false;
  if (!(await ensurePermission(handle, false))) return false;
  try {
    const fileHandle = await handle.getFileHandle(MIRROR_FILENAME, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return true;
  } catch (err) {
    console.error('Local mirror write failed:', err);
    return false;
  }
}

/** Trigger a browser download of the data as a JSON file (works in every browser). */
export function downloadJsonBackup(data: unknown, filename = MIRROR_FILENAME): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
