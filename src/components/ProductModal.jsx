import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Camera, Check, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { db } from '../firebase';
import { C, compressImage } from '../theme';

// Sentinel <option> value — picking it swaps the select for an inline name input
// instead of setting a category.
const NEW_CAT = '__new_category__';

// Desktop-ish pointer — used to decide whether the Ctrl+V hint is worth showing.
const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches;

export default function ProductModal({ mode, product, categories = [], onClose, onSave }) {
  const [code, setCode] = useState(product?.code || '');
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || categories[0] || '');
  const [price, setPrice] = useState(product?.price ?? '');
  const [qty, setQty] = useState(product?.qty ?? 0);
  // `image` is the existing Storage download URL (edit mode) or null.
  // `imageBlob` is only set once the user picks a *new* photo — that's the
  // one we actually upload on save; until then we just keep using `image`.
  const [image, setImage] = useState(product?.image || null);
  const [imageBlob, setImageBlob] = useState(null);
  const [preview, setPreview] = useState(product?.image || null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPasteHint] = useState(hasFinePointer);
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const previewRef = useRef(preview);
  previewRef.current = preview;

  const applyFile = async (file) => {
    if (!file) return;
    const { blob, previewUrl } = await compressImage(file);
    if (previewRef.current?.startsWith('blob:')) URL.revokeObjectURL(previewRef.current);
    setImageBlob(blob);
    setPreview(previewUrl);
  };

  const pickImage = (e) => applyFile(e.target.files?.[0]);

  // Desktop convenience: paste a copied image straight into the modal (Ctrl/Cmd+V).
  useEffect(() => {
    const onPaste = (e) => {
      const file = [...(e.clipboardData?.items ?? [])]
        .find((it) => it.type.startsWith('image/'))
        ?.getAsFile();
      if (!file) return;
      e.preventDefault();
      applyFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const cancelNewCat = () => {
    setAddingCat(false);
    setNewCat('');
    setErr('');
  };

  // Creates the category in Firestore and selects it, so the user never has to
  // leave the product form to add one.
  const createCategory = async () => {
    const value = newCat.trim();
    if (!value) return setErr('Category name is required');
    const existing = categories.find((c) => c.toLowerCase() === value.toLowerCase());
    if (existing) {
      // Already there — just select it rather than creating a duplicate.
      setCategory(existing);
      cancelNewCat();
      return;
    }
    setCatSaving(true);
    setErr('');
    try {
      await addDoc(collection(db, 'categories'), { name: value, createdAt: serverTimestamp() });
      setCategory(value);
      cancelNewCat();
    } catch {
      setErr('Could not add the category. Please try again.');
    } finally {
      setCatSaving(false);
    }
  };

  const submit = async () => {
    if (!name.trim()) return setErr('Product name is required');
    if (price === '' || isNaN(price) || Number(price) < 0) return setErr('Enter a valid price');
    setSaving(true);
    try {
      await onSave({
        id: product?.id,
        code: code.trim(),
        name: name.trim(),
        category,
        price: Number(price),
        qty: Number(qty) || 0,
        image,       // existing Storage URL, unchanged unless imageBlob is set
        imageBlob,   // new photo pending upload, or null
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={S.overlay} onClick={onClose}>
      <div className="sheet modal-sheet product-modal-sheet" style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div className="modal-grip" style={S.grip} />

        <div style={S.head}>
          <h2 style={S.title}>{mode === 'add' ? 'Add product' : 'Edit product'}</h2>
          <button style={S.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div style={S.body}>
          <div className="product-modal-grid" style={S.grid}>
            {/* Image picker — full left column on desktop */}
            <div className="product-modal-image-col" style={S.imageCol}>
              {preview ? (
                <div className="product-modal-image-btn" style={{ ...S.imagePick, marginBottom: showPasteHint ? 10 : 16 }}>
                  <img
                    src={preview}
                    alt=""
                    style={S.imagePreview}
                    onClick={() => setShowPreview(true)}
                  />
                  <div style={S.badgeRow}>
                    <button
                      type="button"
                      style={S.imageEditBadge}
                      onClick={() => galleryRef.current?.click()}
                      aria-label="Choose from gallery"
                      title="Choose from gallery"
                    >
                      <ImageIcon size={14} />
                    </button>
                    <button
                      type="button"
                      style={S.imageEditBadge}
                      onClick={() => cameraRef.current?.click()}
                      aria-label="Take a photo"
                      title="Take a photo"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="product-modal-image-btn" style={{ ...S.imagePick, marginBottom: showPasteHint ? 10 : 16 }}>
                  <button type="button" style={S.placeholderBtn} onClick={() => cameraRef.current?.click()}>
                    <div style={S.imagePlaceholder}>
                      <Camera size={22} style={{ color: C.muted }} />
                      <span style={{ fontSize: 12, color: C.muted }}>Add photo</span>
                    </div>
                  </button>
                  <div style={S.badgeRow}>
                    <button
                      type="button"
                      style={S.imageEditBadge}
                      onClick={() => galleryRef.current?.click()}
                      aria-label="Choose from gallery"
                      title="Choose from gallery"
                    >
                      <ImageIcon size={14} />
                    </button>
                  </div>
                </div>
              )}
              {showPasteHint && (
                <div style={S.pasteHint}>or press Ctrl + V to paste a copied image</div>
              )}
              {/* Camera-first on mobile; `capture` is ignored on desktop. */}
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={pickImage}
                style={{ display: 'none' }}
              />
              {/* No `capture` → OS gallery / file picker. */}
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                onChange={pickImage}
                style={{ display: 'none' }}
              />
            </div>

            {/* Fields — right column on desktop */}
            <div className="product-modal-fields-col" style={S.fieldsCol}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Product Code" style={{ flex: 1 }}>
                  <input
                    style={S.input}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. WIG-001"
                  />
                </Field>
                <Field label="Category" style={{ flex: 1 }}>
                  {addingCat ? (
                    <div style={S.newCatWrap}>
                      <input
                        style={{ ...S.input, marginBottom: 8 }}
                        value={newCat}
                        onChange={(e) => { setNewCat(e.target.value); setErr(''); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); createCategory(); }
                          if (e.key === 'Escape') cancelNewCat();
                        }}
                        placeholder="New category name"
                        autoFocus
                      />
                      <div style={S.newCatRow}>
                        <button
                          type="button"
                          style={{ ...S.newCatAdd, opacity: catSaving ? 0.6 : 1 }}
                          onClick={createCategory}
                          disabled={catSaving}
                        >
                          <Check size={15} /> {catSaving ? 'Adding…' : 'Add'}
                        </button>
                        <button type="button" style={S.newCatCancel} onClick={cancelNewCat}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={S.selectWrap}>
                      <select
                        style={S.select}
                        value={category}
                        onChange={(e) => {
                          if (e.target.value === NEW_CAT) { setAddingCat(true); return; }
                          setCategory(e.target.value);
                        }}
                      >
                        {/* Keeps the select valid for a just-created category that
                            the Firestore snapshot hasn't delivered back yet. */}
                        {category && !categories.includes(category) && <option>{category}</option>}
                        {categories.map((c) => <option key={c}>{c}</option>)}
                        <option value={NEW_CAT}>+ New category…</option>
                      </select>
                      <ChevronDown size={16} style={S.selectIcon} />
                    </div>
                  )}
                </Field>
              </div>

              <Field label="Name">
                <input
                  style={S.input}
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErr(''); }}
                  placeholder="e.g. Lace Front Wig — Natural Black"
                />
              </Field>

              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Price (MKD)" style={{ flex: 1 }}>
                  <input
                    style={S.input}
                    type="number"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => { setPrice(e.target.value); setErr(''); }}
                    placeholder="0"
                  />
                </Field>
                <Field label="Quantity" style={{ flex: 1 }}>
                  <input
                    style={S.input}
                    type="number"
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0"
                  />
                </Field>
              </div>
            </div>
          </div>

          {err && <div style={S.error}>{err}</div>}
        </div>

        <div style={S.foot}>
          <button style={S.btnGhost} onClick={onClose}>Cancel</button>
          <button style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={submit} disabled={saving}>
            <Check size={18} />
            {saving ? 'Saving…' : mode === 'add' ? 'Add product' : 'Save changes'}
          </button>
        </div>
      </div>

      {showPreview && preview && (
        <div style={S.previewOverlay} onClick={(e) => { e.stopPropagation(); setShowPreview(false); }}>
          <button style={S.previewClose} onClick={(e) => { e.stopPropagation(); setShowPreview(false); }}><X size={22} /></button>
          <img src={preview} alt="" style={S.previewImage} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <label style={{ display: 'block', ...style }}>
      <span style={S.fieldLabel}>{label}</span>
      {children}
    </label>
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
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px 8px',
  },
  title: { margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: '-0.3px' },
  closeBtn: {
    border: 'none', background: C.bg, borderRadius: 10,
    width: 36, height: 36, display: 'grid', placeItems: 'center',
    cursor: 'pointer', color: C.ink2,
  },
  body: { padding: '8px 20px 16px', overflowY: 'auto' },
  grid: { display: 'block' },
  imageCol: { marginBottom: 0 },
  fieldsCol: {},
  imagePick: {
    width: '100%', height: 180, borderRadius: 14, marginBottom: 16,
    border: '1.5px dashed ' + C.line, background: C.bg,
    cursor: 'pointer', position: 'relative', overflow: 'hidden',
    display: 'grid', placeItems: 'center', padding: 0,
  },
  imagePlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  imagePreview: { width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' },
  placeholderBtn: {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    border: 'none', background: 'transparent', cursor: 'pointer',
    display: 'grid', placeItems: 'center', padding: 0, fontFamily: 'inherit',
  },
  badgeRow: {
    position: 'absolute', bottom: 8, right: 8,
    display: 'flex', gap: 6,
  },
  imageEditBadge: {
    border: 'none', background: C.ink, color: '#fff', width: 28, height: 28,
    borderRadius: 8, display: 'grid', placeItems: 'center', cursor: 'pointer',
  },
  pasteHint: {
    fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 14,
  },
  previewOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 300, padding: 20,
  },
  previewClose: {
    position: 'absolute', top: 16, right: 16,
    border: 'none', background: 'rgba(255,255,255,.15)', color: '#fff',
    width: 40, height: 40, borderRadius: 20, display: 'grid', placeItems: 'center',
    cursor: 'pointer',
  },
  previewImage: {
    maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8,
  },
  fieldLabel: {
    display: 'block', fontSize: 12, fontWeight: 700, color: C.ink2,
    marginBottom: 6, letterSpacing: '0.2px',
  },
  input: {
    width: '100%', border: '1px solid ' + C.line,
    borderRadius: 11, padding: '12px 14px', fontSize: 15,
    fontFamily: 'inherit', color: C.ink, background: C.card,
    marginBottom: 14, display: 'block',
  },
  selectWrap: { position: 'relative', marginBottom: 14 },
  newCatWrap: { marginBottom: 14 },
  newCatRow: { display: 'flex', gap: 8 },
  newCatAdd: {
    flex: 1, border: 'none', background: C.ink, color: '#fff',
    padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  newCatCancel: {
    border: '1px solid ' + C.line, background: C.card, color: C.ink2,
    padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  select: {
    width: '100%', border: '1px solid ' + C.line,
    borderRadius: 11, padding: '12px 14px', fontSize: 15,
    fontFamily: 'inherit', color: C.ink, background: C.card,
    appearance: 'none', WebkitAppearance: 'none',
  },
  selectIcon: {
    position: 'absolute', right: 14, top: 14,
    color: C.muted, pointerEvents: 'none',
  },
  error: {
    background: C.dangerSoft, color: C.danger,
    padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    marginBottom: 8,
  },
  foot: {
    display: 'flex', gap: 10, padding: '12px 20px',
    borderTop: '1px solid ' + C.line,
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
  },
  btnGhost: {
    border: '1px solid ' + C.line, background: C.card, color: C.ink2,
    padding: '13px 18px', borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnPrimary: {
    flex: 1, border: 'none', background: C.ink, color: '#fff',
    padding: '13px 18px', borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
};
