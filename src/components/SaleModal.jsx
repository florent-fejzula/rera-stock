import React, { useState } from 'react';
import { ShoppingBag, Tag, X, Minus, Plus } from 'lucide-react';
import { C, fmtMKD } from '../theme';

/**
 * Shown when the user clicks "-" to decrease stock.
 * Step 1: pick quantity, then choose original price or discounted.
 * Step 2 (if discounted): enter the actual sold price.
 */
export default function SaleModal({ product, onClose, onConfirm }) {
  const [step, setStep] = useState(1); // 1 = choose, 2 = enter discount price
  const [qty, setQty] = useState(1);
  const [discountPrice, setDiscountPrice] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const clampQty = (n) => Math.max(1, Math.min(product.qty, n));

  const handleOriginal = async () => {
    setLoading(true);
    await onConfirm(product, product.price, qty);
    setLoading(false);
  };

  const handleDiscount = async () => {
    const val = parseFloat(discountPrice);
    if (!discountPrice || isNaN(val) || val < 0) {
      setErr('Enter a valid price');
      return;
    }
    if (val > product.price) {
      setErr('Discounted price cannot exceed the original price');
      return;
    }
    setLoading(true);
    await onConfirm(product, val, qty);
    setLoading(false);
  };

  return (
    <div className="modal-overlay" style={S.overlay} onClick={onClose}>
      <div className="sheet modal-sheet" style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div className="modal-grip" style={S.grip} />

        <div style={S.head}>
          <div style={S.headIcon}><ShoppingBag size={18} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.headTitle}>Record sale</div>
            <div style={S.headSub} title={product.name}>{product.name}</div>
          </div>
          <button style={S.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div style={S.body}>
          <div style={S.qtyRow}>
            <span style={S.labelText}>Quantity sold</span>
            <div style={S.qtyStepper}>
              <button
                type="button"
                style={S.qtyBtn}
                onClick={() => setQty((q) => clampQty(q - 1))}
                disabled={qty <= 1}
                aria-label="decrease quantity"
              >
                <Minus size={16} />
              </button>
              <input
                style={S.qtyInput}
                type="number"
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(clampQty(parseInt(e.target.value, 10) || 1))}
              />
              <button
                type="button"
                style={S.qtyBtn}
                onClick={() => setQty((q) => clampQty(q + 1))}
                disabled={qty >= product.qty}
                aria-label="increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
            <span style={S.qtyMax}>of {product.qty} in stock</span>
          </div>

          {step === 1 && (
            <>
              <p style={S.question}>At what price was it sold?</p>

              <button
                style={S.optionBtn}
                onClick={handleOriginal}
                disabled={loading}
              >
                <div style={S.optionIcon}><Tag size={18} /></div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={S.optionLabel}>Original price</div>
                  <div style={S.optionValue}>
                    {fmtMKD(product.price)}
                    {qty > 1 && <span style={S.optionTotal}> × {qty} = {fmtMKD(product.price * qty)}</span>}
                  </div>
                </div>
              </button>

              <button
                style={{ ...S.optionBtn, marginBottom: 0 }}
                onClick={() => setStep(2)}
              >
                <div style={{ ...S.optionIcon, background: C.accentSoft, color: C.accent }}>
                  <Tag size={18} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={S.optionLabel}>Discounted price</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Enter amount manually</div>
                </div>
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p style={S.question}>
                Enter the discounted price:
                <span style={{ color: C.muted, fontSize: 13, fontWeight: 500, display: 'block', marginTop: 2 }}>
                  Original: {fmtMKD(product.price)}
                </span>
              </p>

              <label style={S.fieldLabel}>
                <span style={S.labelText}>Sold price (MKD)</span>
                <input
                  style={S.input}
                  type="number"
                  inputMode="numeric"
                  value={discountPrice}
                  onChange={(e) => { setDiscountPrice(e.target.value); setErr(''); }}
                  placeholder="e.g. 2500"
                  autoFocus
                />
              </label>

              {err && <div style={S.error}>{err}</div>}

              <div style={S.row}>
                <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => { setStep(1); setErr(''); setDiscountPrice(''); }}>
                  Back
                </button>
                <button
                  style={{ ...S.btnPrimary, flex: 2, opacity: loading ? 0.6 : 1 }}
                  onClick={handleDiscount}
                  disabled={loading}
                >
                  {loading ? 'Saving…' : qty > 1 ? `Confirm sale (×${qty})` : 'Confirm sale'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(19,21,28,.5)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    zIndex: 200, backdropFilter: 'blur(2px)',
  },
  sheet: {
    background: C.card, width: '100%', maxWidth: 480,
    borderRadius: '24px 24px 0 0', maxHeight: '92vh',
    display: 'flex', flexDirection: 'column',
  },
  grip: {
    width: 40, height: 4, borderRadius: 4,
    background: C.line, margin: '10px auto 0',
  },
  head: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 20px 8px',
  },
  headIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: C.ink, color: '#fff',
    display: 'grid', placeItems: 'center', flexShrink: 0,
  },
  headTitle: { fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.3px', textTransform: 'uppercase' },
  headSub: {
    fontSize: 15, fontWeight: 700, color: C.ink,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  closeBtn: {
    border: 'none', background: C.bg, borderRadius: 10,
    width: 36, height: 36, display: 'grid', placeItems: 'center',
    cursor: 'pointer', color: C.ink2, flexShrink: 0,
  },
  body: { padding: '8px 20px 24px', overflowY: 'auto' },
  qtyRow: { marginBottom: 18 },
  qtyStepper: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: C.bg, border: '1px solid ' + C.line,
    borderRadius: 12, padding: 6, marginTop: 6,
  },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 9, border: 'none',
    background: C.card, color: C.ink, cursor: 'pointer',
    display: 'grid', placeItems: 'center',
    boxShadow: '0 1px 2px rgba(0,0,0,.06)',
  },
  qtyInput: {
    flex: 1, minWidth: 0, textAlign: 'center', fontWeight: 800, fontSize: 16,
    border: 'none', background: 'transparent', color: C.ink, fontFamily: 'inherit',
  },
  qtyMax: { display: 'block', fontSize: 12, color: C.muted, marginTop: 6 },
  optionTotal: { fontSize: 13, fontWeight: 600, color: C.muted },
  question: { fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 16 },
  optionBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
    background: C.bg, border: '1.5px solid ' + C.line,
    borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
    fontFamily: 'inherit', marginBottom: 12, transition: 'border-color .15s',
  },
  optionIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: C.ink, color: '#fff',
    display: 'grid', placeItems: 'center', flexShrink: 0,
  },
  optionLabel: { fontSize: 14, fontWeight: 700, color: C.ink },
  optionValue: { fontSize: 15, fontWeight: 800, color: C.ink, marginTop: 2 },
  fieldLabel: { display: 'block', marginBottom: 14 },
  labelText: {
    display: 'block', fontSize: 12, fontWeight: 700, color: C.ink2,
    marginBottom: 6, letterSpacing: '0.2px',
  },
  input: {
    width: '100%', border: '1px solid ' + C.line,
    borderRadius: 11, padding: '12px 14px', fontSize: 15,
    fontFamily: 'inherit', color: C.ink, background: C.card,
  },
  error: {
    background: C.dangerSoft, color: C.danger,
    padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    marginBottom: 14,
  },
  row: { display: 'flex', gap: 10 },
  btnGhost: {
    border: '1px solid ' + C.line, background: C.card, color: C.ink2,
    padding: '13px 18px', borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnPrimary: {
    border: 'none', background: C.ink, color: '#fff',
    padding: '13px 18px', borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
};
