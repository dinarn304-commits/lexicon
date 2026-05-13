const LOG = '[Lexicon storage]';

export async function requestPersistentStorage() {
  try {
    if (!('storage' in navigator) || !('persist' in navigator.storage)) return;

    if (await navigator.storage.persisted()) {
      console.log(`${LOG} Persistent storage already granted.`);
      return true;
    }

    const granted = await navigator.storage.persist();
    console.log(`${LOG} Persistent storage granted: ${granted}`);

    try {
      if ('estimate' in navigator.storage) {
        const { usage, quota } = await navigator.storage.estimate();
        const mb = (b) => (b / 1_048_576).toFixed(1);
        console.log(`${LOG} Usage: ${mb(usage)} MB / ${mb(quota)} MB quota`);
      }
    } catch (_) {}

    return granted;
  } catch (_) {}
}

export async function checkStorageHealth() {
  try {
    const key = 'lexicon-storage-test';
    const value = Date.now().toString();
    localStorage.setItem(key, value);
    const read = localStorage.getItem(key);
    localStorage.removeItem(key);
    if (read !== value) throw new Error('round-trip mismatch');
    return true;
  } catch (_) {
    console.warn(
      `${LOG} WARNING: localStorage is not working. The app may not save your data.` +
      ' This often happens in private/incognito mode or with strict browser privacy settings.'
    );
    return false;
  }
}
