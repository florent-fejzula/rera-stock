import React, { useState, useMemo, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc,
  doc, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  Plus, Search, X, Package, AlertTriangle, Boxes, TrendingUp, Pencil, Trash2, Minus,
} from 'lucide-react';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { C, LOW_STOCK_THRESHOLD, fmtMKD } from '../theme';
import { useCategories } from '../hooks/useCategories';
import ProductModal from '../components/ProductModal';
import SaleModal from '../components/SaleModal';
import ConfirmModal from '../components/ConfirmModal';

export default function Stock() {
  const { user, role } = useAuth();
  const { names: categoryNames } = useCategories();
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', product? }
  const [saleTarget, setSaleTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setProducts(docs);
      setLoadingData(false);
    });
    return unsub;
  }, []);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const matchCat = activeCat === 'All' || p.category === activeCat;
        const q = query.trim().toLowerCase();
        const matchQ =
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.code || '').toLowerCase().includes(q);
        return matchCat && matchQ;
      }),
    [products, query, activeCat]
  );

  const stats = useMemo(() => {
    const totalUnits = products.reduce((s, p) => s + (p.qty || 0), 0);
    const totalValue = products.reduce((s, p) => s + (p.qty || 0) * (p.price || 0), 0);
    const lowCount = products.filter((p) => p.qty > 0 && p.qty <= LOW_STOCK_THRESHOLD).length;
    const outCount = products.filter((p) => p.qty === 0).length;
    return { count: products.length, totalUnits, totalValue, lowCount, outCount };
  }, [products]);

  // Triggered when user presses "-" — opens SaleModal before updating qty
  const handleDecrease = (product) => {
    if (product.qty <= 0) return;
    setSaleTarget(product);
  };

  const handleIncrease = async (product) => {
    await updateDoc(doc(db, 'products', product.id), {
      qty: (product.qty || 0) + 1,
      updatedAt: serverTimestamp(),
    });
  };

  const recordSale = async (product, soldPrice, qtySold = 1) => {
    await updateDoc(doc(db, 'products', product.id), {
      qty: product.qty - qtySold,
      updatedAt: serverTimestamp(),
    });
    await addDoc(collection(db, 'sales'), {
      productId: product.id,
      productName: product.name,
      productCode: product.code || '',
      category: product.category,
      qtySold,
      originalPrice: product.price,
      soldPrice,
      isDiscounted: soldPrice < product.price,
      discountAmount: Math.max(0, product.price - soldPrice),
      soldAt: serverTimestamp(),
      soldBy: user.uid,
      soldByEmail: user.email,
    });
    setSaleTarget(null);
  };

  const saveProduct = async (data) => {
    const { id: existingId, imageBlob, image, ...fields } = data;
    const isAdd = modal.mode === 'add';
    const id = existingId || doc(collection(db, 'products')).id;

    // Photos live at a path keyed by the product id, so picking a new photo
    // just overwrites the old file in place — no orphaned files to track down.
    let imageUrl = image;
    if (imageBlob) {
      const photoRef = ref(storage, `products/${id}.jpg`);
      await uploadBytes(photoRef, imageBlob, { contentType: 'image/jpeg' });
      imageUrl = await getDownloadURL(photoRef);
    }

    const productFields = { ...fields, image: imageUrl || null };

    if (isAdd) {
      await setDoc(doc(db, 'products', id), {
        ...productFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'products', id), {
        ...productFields,
        updatedAt: serverTimestamp(),
      });
    }

    // Public-safe mirror the website reads — name/category/image only,
    // never price or stock qty. merge:true on edit keeps its own createdAt.
    await setDoc(
      doc(db, 'public_products', id),
      {
        name: productFields.name,
        category: productFields.category,
        image: productFields.image,
        updatedAt: serverTimestamp(),
        ...(isAdd ? { createdAt: serverTimestamp() } : {}),
      },
      { merge: true }
    );

    setModal(null);
  };

  const removeProduct = async (id) => {
    await deleteDoc(doc(db, 'products', id));
    await deleteDoc(doc(db, 'public_products', id));
    await deleteObject(ref(storage, `products/${id}.jpg`)).catch(() => {});
    setConfirmDelete(null);
  };

  if (loadingData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: C.muted, fontSize: 15 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* Stats */}
      <section className="stat-grid" style={S.statGrid}>
        <StatCard icon={<Boxes size={16} />} label="Products" value={stats.count} />
        <StatCard icon={<Package size={16} />} label="Total units" value={stats.totalUnits} />
        {role === 'admin' && (
          <StatCard icon={<TrendingUp size={16} />} label="Stock value" value={fmtMKD(stats.totalValue)} wide />
        )}
        <StatCard
          icon={<AlertTriangle size={16} />}
          label="Low stock"
          value={stats.lowCount}
          alert={stats.lowCount > 0}
        />
      </section>

      {/* Toolbar */}
      <div className="toolbar-wrap" style={S.toolbar}>
        <div style={S.searchWrap}>
          <Search size={18} style={{ color: C.muted, flexShrink: 0 }} />
          <input
            style={S.searchInput}
            placeholder="Search by name or code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button style={S.clearBtn} onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Desktop only: Add button in toolbar */}
        <button
          className="desktop-add-btn"
          style={S.desktopAddBtn}
          onClick={() => setModal({ mode: 'add' })}
        >
          <Plus size={18} /> Add product
        </button>
      </div>

      {/* Category chips */}
      <div className="chip-scroll chip-row-wrap" style={S.chipRow}>
        {['All', ...categoryNames].map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            style={{ ...S.chip, ...(activeCat === c ? S.chipActive : {}) }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Product list/grid */}
      <main className="product-list" style={S.list}>
        {filtered.length === 0 && (
          <div style={S.empty}>
            <Package size={40} style={{ color: C.line }} />
            <p style={{ margin: '12px 0 0', color: C.muted }}>No products found</p>
          </div>
        )}
        {filtered.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onDecrease={() => handleDecrease(p)}
            onIncrease={() => handleIncrease(p)}
            onEdit={() => setModal({ mode: 'edit', product: p })}
            onDelete={() => setConfirmDelete(p)}
          />
        ))}
        <div style={{ height: 80 }} />
      </main>

      {/* Mobile FAB */}
      <button
        className="mobile-fab"
        style={S.fab}
        onClick={() => setModal({ mode: 'add' })}
        aria-label="Add product"
      >
        <Plus size={24} />
      </button>

      {modal && (
        <ProductModal
          mode={modal.mode}
          product={modal.product}
          categories={categoryNames}
          onClose={() => setModal(null)}
          onSave={saveProduct}
        />
      )}
      {saleTarget && (
        <SaleModal
          product={saleTarget}
          onClose={() => setSaleTarget(null)}
          onConfirm={recordSale}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Delete product?"
          message={`"${confirmDelete.name}" will be permanently removed from stock.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => removeProduct(confirmDelete.id)}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, wide, alert }) {
  return (
    <div style={{ ...S.statCard, ...(wide ? { gridColumn: 'span 2' } : {}) }}>
      <div style={{ ...S.statIcon, ...(alert ? { background: C.dangerSoft, color: C.danger } : {}) }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...S.statValue, ...(alert && value > 0 ? { color: C.danger } : {}) }}>
          {value}
        </div>
        <div style={S.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function ProductCard({ product: p, onDecrease, onIncrease, onEdit, onDelete }) {
  const low = p.qty > 0 && p.qty <= LOW_STOCK_THRESHOLD;
  const out = p.qty === 0;
  return (
    <article style={S.card}>
      <div style={S.thumb}>
        {p.image
          ? <img src={p.image} alt="" style={S.thumbImg} />
          : <Package size={24} style={{ color: C.line }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.cardTop}>
          <span style={S.catTag}>{p.category}</span>
          {p.code && <span style={S.codeTag}>{p.code}</span>}
          {out
            ? <span style={{ ...S.badge, ...S.badgeOut }}>Out of stock</span>
            : low
              ? <span style={{ ...S.badge, ...S.badgeLow }}><AlertTriangle size={11} /> Low</span>
              : null
          }
        </div>
        <h3 style={S.cardName}>{p.name}</h3>
        <div style={S.price}>{fmtMKD(p.price)}</div>
        <div style={S.cardBottom}>
          <div style={S.stepper}>
            <button
              style={S.stepBtn}
              onClick={onDecrease}
              disabled={p.qty === 0}
              aria-label="decrease"
            >
              <Minus size={16} />
            </button>
            <span style={{ ...S.qtyNum, color: out ? C.danger : low ? C.accent : C.ink }}>
              {p.qty}
            </span>
            <button style={S.stepBtn} onClick={onIncrease} aria-label="increase">
              <Plus size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={S.iconBtn} onClick={onEdit} aria-label="edit">
              <Pencil size={16} />
            </button>
            <button style={{ ...S.iconBtn, ...S.iconBtnDanger }} onClick={onDelete} aria-label="delete">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

const S = {
  page: { paddingBottom: 20 },
  statGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
    padding: '16px 18px 16px',
  },
  statCard: {
    background: C.card, borderRadius: 14, padding: '12px 14px',
    display: 'flex', alignItems: 'center', gap: 10,
    border: '1px solid ' + C.line,
  },
  statIcon: {
    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
    background: C.ink, color: '#fff', display: 'grid', placeItems: 'center',
  },
  statValue: {
    fontWeight: 700, fontSize: 17, lineHeight: 1.1,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  statLabel: { fontSize: 11, color: C.muted, marginTop: 2 },

  toolbar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '0 18px 12px',
  },
  searchWrap: {
    flex: 1, background: C.card, border: '1px solid ' + C.line,
    borderRadius: 12, display: 'flex', alignItems: 'center',
    gap: 10, padding: '0 14px',
  },
  searchInput: {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    padding: '13px 0', fontSize: 15, color: C.ink, fontFamily: 'inherit',
  },
  clearBtn: {
    border: 'none', background: 'none', color: C.muted,
    cursor: 'pointer', padding: 4, display: 'flex',
  },
  desktopAddBtn: {
    display: 'none', // overridden by CSS
    border: 'none', background: C.ink, color: '#fff',
    padding: '0 20px', height: 46, borderRadius: 12,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', alignItems: 'center', gap: 8,
    whiteSpace: 'nowrap', flexShrink: 0,
  },

  chipRow: {
    display: 'flex', gap: 8, padding: '0 18px 16px',
    overflowX: 'auto', WebkitOverflowScrolling: 'touch',
  },
  chip: {
    flexShrink: 0, border: '1px solid ' + C.line, background: C.card,
    color: C.ink2, padding: '7px 15px', borderRadius: 100,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all .15s',
  },
  chipActive: { background: C.ink, color: '#fff', borderColor: C.ink },

  list: {
    padding: '0 18px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  empty: { textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' },

  card: {
    background: C.card, borderRadius: 16, padding: 14,
    display: 'flex', gap: 14, border: '1px solid ' + C.line,
  },
  thumb: {
    width: 112, height: 112, borderRadius: 12, flexShrink: 0,
    background: C.bg, display: 'grid', placeItems: 'center',
    overflow: 'hidden', border: '1px solid ' + C.line,
  },
  // `contain` (not `cover`) so tall/wide product photos stay fully visible
  // instead of being centre-cropped down to an unrecognisable sliver.
  thumbImg: { width: '100%', height: '100%', objectFit: 'contain' },
  cardTop: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' },
  catTag: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.4px',
    textTransform: 'uppercase', color: C.accent, background: C.accentSoft,
    padding: '2px 8px', borderRadius: 6,
  },
  codeTag: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.4px',
    color: C.muted, background: C.bg,
    padding: '2px 8px', borderRadius: 6, border: '1px solid ' + C.line,
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
  },
  badgeLow: { color: C.accent, background: C.accentSoft },
  badgeOut: { color: C.danger, background: C.dangerSoft },
  cardName: {
    margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.3,
    color: C.ink, letterSpacing: '-0.2px',
  },
  price: { fontSize: 14, fontWeight: 700, color: C.ink2, marginTop: 3 },
  cardBottom: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12,
  },
  stepper: {
    display: 'flex', alignItems: 'center', gap: 2,
    background: C.bg, borderRadius: 10, padding: 3,
    border: '1px solid ' + C.line,
  },
  stepBtn: {
    width: 32, height: 32, borderRadius: 8, border: 'none',
    background: C.card, color: C.ink, cursor: 'pointer',
    display: 'grid', placeItems: 'center',
    boxShadow: '0 1px 2px rgba(0,0,0,.06)',
  },
  qtyNum: {
    minWidth: 30, textAlign: 'center', fontWeight: 800, fontSize: 15,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, border: '1px solid ' + C.line,
    background: C.card, color: C.ink2, cursor: 'pointer',
    display: 'grid', placeItems: 'center',
  },
  iconBtnDanger: { color: C.danger },

  fab: {
    position: 'fixed', bottom: 24, right: 24,
    width: 58, height: 58, borderRadius: 18, border: 'none',
    background: C.ink, color: '#fff', cursor: 'pointer',
    display: 'grid', placeItems: 'center',
    boxShadow: '0 8px 24px rgba(19,21,28,.35)', zIndex: 50,
  },
};
