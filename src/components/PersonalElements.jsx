import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ModalDismiss } from './modalDismiss';

export function PortraitMark({ color = [180, 185, 195] }) {
  return <span className="pp-mark" style={{ '--ink': color.join(',') }} aria-hidden="true"><i /><i /><i /></span>;
}

export function PortraitField({ profile }) {
  return <div className="pp-field" style={{ '--ink': (profile.color || [180, 185, 195]).join(',') }} aria-hidden="true">
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
