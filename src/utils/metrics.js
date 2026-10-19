// Anonymous, aggregate-only counters. No identifier, address or answer is sent,
// and every failure is swallowed: telemetry must never block the product.
const ENDPOINT = '/api/metrics/event';

export function recordEvent(event) {
  try {
    const payload = JSON.stringify({ event });
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
    fetch(ENDPOINT, {
      method: 'POST', body: payload, keepalive: true, cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  } catch { /* Metrics are best-effort. */ }
}
