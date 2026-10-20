import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ModalDismiss } from './modalDismiss';
import { DEFAULT_INK, markShades } from '../data/accents.js';

export function PortraitMark({ color = DEFAULT_INK }) {
  const shades = markShades(color || DEFAULT_INK);
  return <span className="pp-mark" style={{ '--ink': shades.ink, '--ink-light': shades.light, '--ink-dark': shades.dark, '--ink-counter': shades.counter }} aria-hidden="true"><span className="pp-mark-wash" /></span>;
}

// The one place that answers "is this account only here, or is there something
// on the server?" — identity state first, then how much of it is actually up.
export function CloudState({ registered, cloudRecords = 0 }) {
  return <p className={`pp-cloud-state ${registered ? 'is-cloud' : 'is-local'}`}>
    <i aria-hidden="true" />
    <strong>{registered ? '已存到云端' : '只在这台设备'}</strong>
    <span>{registered
      ? (cloudRecords ? `${cloudRecords} 份画像在云端` : '还没有画像上云')
      : '服务器上还没有你的任何东西'}</span>
  </p>;
}

export function PortraitField({ profile, color }) {
  return <div className="pp-field" style={{ '--ink': (color || profile.color || DEFAULT_INK).join(',') }} aria-hidden="true">
    <div className="pp-wash" /><div className="pp-orbit pp-orbit-one" /><div className="pp-orbit pp-orbit-two" /><div className="pp-orbit pp-orbit-three" />
    <span className="pp-field-symbol">{profile.symbol}</span><span className="pp-field-cross cross-one">+</span><span className="pp-field-cross cross-two">+</span><span className="pp-field-dot" />
  </div>;
}

export function PersonalModal({ title, onClose, busy = false, children }) {
  const dialog = useRef(null);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const finishedRef = useRef(false);
  const afterClose = useRef(null);
  const closeRef = useRef(onClose);
  const label = useId();

  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    closeRef.current();
    const after = afterClose.current;
    afterClose.current = null;
    if (after) after();
  };
  const dismiss = (after) => {
    if (closingRef.current) return;
    closingRef.current = true;
    afterClose.current = typeof after === 'function' ? after : null;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    setClosing(true);
  };
  const close = () => { if (!busy) dismiss(); };

  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { node.close(); document.body.style.overflow = previous; };
  }, []);
  // 退场动画结束再卸载；超时兜底防止动画被 --reduced-motion 之类的情况吞掉
  useEffect(() => {
    if (!closing) return;
    const node = dialog.current;
    const onEnd = (event) => { if (event.animationName === 'pp-dialog-out') finish(); };
    node.addEventListener('animationend', onEnd);
    const timer = setTimeout(finish, 280);
    return () => { node.removeEventListener('animationend', onEnd); clearTimeout(timer); };
  }, [closing]);

  return <dialog ref={dialog} className={`pp-dialog${closing ? ' is-closing' : ''}`} aria-labelledby={label}
    onCancel={(event) => { event.preventDefault(); close(); }}
    onClick={(event) => { if (event.target === dialog.current) close(); }}>
    <button className="pp-close" aria-label="关闭" disabled={busy} onClick={close}><X size={18} /></button>
    <div className="pp-dialog-inner">
      <h2 id={label}>{title}</h2>
      <ModalDismiss.Provider value={dismiss}>{children}</ModalDismiss.Provider>
    </div>
  </dialog>;
}
