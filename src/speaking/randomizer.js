const STORAGE_KEYS = {
  a1a2: 'srs-speaking-recent-a1a2',
  b1b2: 'srs-speaking-recent-b1b2',
};

function loadQueue(level) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[level]);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(level, queue) {
  try {
    localStorage.setItem(STORAGE_KEYS[level], JSON.stringify(queue));
  } catch {}
}

export function pickTopic(topics, level) {
  if (topics.length === 0) return null;

  const maxRecent = Math.floor(topics.length * 0.3);
  const recent = loadQueue(level);

  const available = topics.filter((t) => !recent.includes(t));
  const pool = available.length > 0 ? available : topics;

  const chosen = pool[Math.floor(Math.random() * pool.length)];

  const updated = [...recent.filter((t) => t !== chosen), chosen].slice(-maxRecent);
  saveQueue(level, updated);

  return chosen;
}
