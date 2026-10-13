import React, { useEffect, useRef, useId } from 'react';
import Icon from './Icon';

export default function Modal({ title, onClose, children, className = '' }) {
  const dialog = useRef(null);
  const titleId = useId();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const element = dialog.current, previous = document.activeElement;
    element.showModal();
    const escape = event => { event.preventDefault(); close.current(); };
    const keepFocus = event => {
      if (event.key !== 'Tab') return;
      const controls = [...element.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
        .filter(control => control.tabIndex >= 0 && !control.disabled && control.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    element.addEventListener('cancel', escape);
    element.addEventListener('keydown', keepFocus);
    document.body.classList.add('modal-open');
    return () => {
      element.removeEventListener('cancel', escape);
      element.removeEventListener('keydown', keepFocus);
      element.close();
      document.body.classList.remove('modal-open');
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <dialog ref={dialog} className={`modal ${className}`} aria-labelledby={titleId} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <div className="modal-inner"><div className="modal-heading"><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><Icon name="close" /></button></div>{children}</div>
  </dialog>;
}
