const STORAGE_KEY = 'renewal-radar-subscriptions';

export function loadSubscriptions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
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
