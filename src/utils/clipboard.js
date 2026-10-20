// Copying is a capability, not a browser check. `navigator.clipboard` is absent
// in some shells and rejects in others (permission, focus, gesture), while
// `document.execCommand('copy')` is deprecated but still works there. Try the
// modern path first, keep the legacy one as a net, and report which path won so
// a caller can offer manual selection instead of leaving a dead button.

export const COPY_MANUAL_HINT = '无法自动复制，请长按文字选中后手动复制。';

/**
 * @returns {Promise<'clipboard' | 'legacy' | 'manual'>} 'manual' means neither
 * path worked; it is a result, not an error, so callers can decide the wording.
 */
export async function copyText(text, { nav = globalThis.navigator, doc = globalThis.document } = {}) {
  const value = String(text ?? '');
  if (!value) return 'manual';
  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(value);
      return 'clipboard';
    }
  } catch { /* The legacy path below still has a chance. */ }
  return legacyCopy(value, doc) ? 'legacy' : 'manual';
}

function legacyCopy(value, doc) {
  if (!doc?.body || typeof doc.createElement !== 'function' || typeof doc.execCommand !== 'function') return false;
  const previous = doc.activeElement;
  const field = doc.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', ''); // Keeps the iOS keyboard down.
  field.setAttribute('aria-hidden', 'true');
  // It has to be rendered: iOS refuses to copy from a display:none field, and
  // 1px boxes make select() unreliable, so use a small invisible hit area.
  field.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:0;outline:0;box-shadow:none;background:transparent;opacity:0;pointer-events:none;';
  doc.body.appendChild(field);
  try {
    field.select();
    field.setSelectionRange(0, value.length); // iOS copies nothing without an explicit range.
    return doc.execCommand('copy') === true;
  } catch {
    return false;
  } finally {
    if (typeof field.remove === 'function') field.remove();
    else doc.body.removeChild(field);
    if (previous && previous !== field && typeof previous.focus === 'function') {
      try { previous.focus({ preventScroll: true }); } catch { /* Focus is a courtesy, not a requirement. */ }
    }
  }
}
