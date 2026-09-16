const STORAGE_KEY = 'renewal-radar-subscriptions';

// Returns null when nothing has ever been saved (a brand-new visitor),
// as opposed to an empty array (someone who deleted every subscription).
// Callers use that distinction to decide whether to show starter data.
export function loadSubscriptions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (error) {
    console.error('Could not load subscriptions from storage.', error);
    return [];
  }
}

export function saveSubscriptions(subscriptions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (error) {
    console.error('Could not save subscriptions to storage.', error);
  }
}
