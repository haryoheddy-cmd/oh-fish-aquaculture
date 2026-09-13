const listeners = new Set();

export function emitDataChanged() {
  listeners.forEach((callback) => callback());
}

export function subscribeDataChanged(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
