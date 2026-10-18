import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

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
  const label = useId();
  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { node.close(); document.body.style.overflow = previous; };
  }, []);
  return <dialog ref={dialog} className="pp-dialog" aria-labelledby={label}
    onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }}>
    <div className="pp-dialog-inner">
      <button className="pp-close" aria-label="关闭" disabled={busy} onClick={onClose}><X size={18} /></button>
      <h2 id={label}>{title}</h2>{children}
    </div>
  </dialog>;
}
