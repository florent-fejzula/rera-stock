import React from 'react';
import { Trash2 } from 'lucide-react';
import { C } from '../theme';

export default function ConfirmModal({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}) {
  return (
    <div style={S.overlay} onClick={onCancel}>
      <div className="confirm-box" style={S.box} onClick={(e) => e.stopPropagation()}>
        <div style={S.icon}><Trash2 size={22} /></div>
        <h3 style={S.title}>{title}</h3>
        {message && <p style={S.body}>{message}</p>}
        <div style={S.btns}>
          <button style={{ ...S.btnGhost, flex: 1 }} onClick={onCancel}>Cancel</button>
          <button style={{ ...S.btnDanger, flex: 1 }} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(19,21,28,.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, backdropFilter: 'blur(2px)',
    padding: 20,
  },
  box: {
    background: C.card, borderRadius: 20, padding: 24,
    maxWidth: 340, width: '100%', textAlign: 'center',
  },
  icon: {
    width: 52, height: 52, borderRadius: 14,
    background: C.dangerSoft, color: C.danger,
    display: 'grid', placeItems: 'center', margin: '0 auto 14px',
  },
  title: { margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: C.ink },
  body: { margin: '0 0 20px', fontSize: 14, color: C.muted, lineHeight: 1.5 },
  btns: { display: 'flex', gap: 10, marginTop: 20 },
  btnGhost: {
    border: '1px solid ' + C.line, background: C.card, color: C.ink2,
    padding: '13px 18px', borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDanger: {
    border: 'none', background: C.danger, color: '#fff',
    padding: '13px 18px', borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
};
