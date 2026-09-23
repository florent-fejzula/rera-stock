import React, { useState, useRef, useMemo } from "react";
import {
  Plus, Minus, Search, Pencil, Trash2, X, Package,
  AlertTriangle, Boxes, TrendingUp, Camera, Check, ChevronDown
} from "lucide-react";

// ── Demo brand palette: masculine, clean, high-contrast ──────────────
// Ink navy + warm steel + a single amber accent. Function-first UI.

const CATEGORIES = ["Wigs", "Extensions", "Care", "Tools", "Accessories"];

const LOW_STOCK_THRESHOLD = 5;

const fmtMKD = (n) =>
  new Intl.NumberFormat("mk-MK", { maximumFractionDigits: 0 }).format(n) + " ден.";

const seed = [
  { id: 1, name: "Lace Front Wig — Natural Black", category: "Wigs", price: 8900, qty: 12, image: null },
  { id: 2, name: "Clip-In Extensions 50cm", category: "Extensions", price: 3200, qty: 4, image: null },
  { id: 3, name: "Argan Repair Oil 100ml", category: "Care", price: 750, qty: 28, image: null },
  { id: 4, name: "Professional Shears 6\"", category: "Tools", price: 4500, qty: 3, image: null },
  { id: 5, name: "Tape-In Extensions Blonde", category: "Extensions", price: 2800, qty: 0, image: null },
  { id: 6, name: "Silk Wig Cap (pack of 5)", category: "Accessories", price: 350, qty: 40, image: null },
  { id: 7, name: "Curly Bundle 18\"", category: "Extensions", price: 5400, qty: 6, image: null },
  { id: 8, name: "Keratin Treatment Kit", category: "Care", price: 6200, qty: 2, image: null },
];

let nextId = 9;

export default function RoraStock() {
  const [products, setProducts] = useState(seed);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [modal, setModal] = useState(null); // {mode:'add'|'edit', product}
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCat === "All" || p.category === activeCat;
      const matchQ = p.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchCat && matchQ;
    });
  }, [products, query, activeCat]);

  const stats = useMemo(() => {
    const totalUnits = products.reduce((s, p) => s + p.qty, 0);
    const totalValue = products.reduce((s, p) => s + p.qty * p.price, 0);
    const lowCount = products.filter((p) => p.qty <= LOW_STOCK_THRESHOLD).length;
    return { count: products.length, totalUnits, totalValue, lowCount };
  }, [products]);

  const adjustQty = (id, delta) =>
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p))
    );

  const saveProduct = (data) => {
    if (modal.mode === "add") {
      setProducts((prev) => [{ ...data, id: nextId++ }, ...prev]);
    } else {
      setProducts((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    }
    setModal(null);
  };

  const removeProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setConfirmDelete(null);
  };

  return (
    <div style={S.app}>
      <style>{CSS}</style>

      {/* Header */}
      <header style={S.header}>
        <div style={S.brandRow}>
          <div style={S.logoMark}>R</div>
          <div>
            <div style={S.brandName}>RERA HAIR FASHION</div>
            <div style={S.brandSub}>Stock Manager · Demo</div>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <section style={S.statGrid}>
        <Stat icon={<Boxes size={16} />} label="Products" value={stats.count} />
        <Stat icon={<Package size={16} />} label="Total units" value={stats.totalUnits} />
        <Stat
          icon={<TrendingUp size={16} />}
          label="Stock value"
          value={fmtMKD(stats.totalValue)}
          wide
        />
        <Stat
          icon={<AlertTriangle size={16} />}
          label="Low stock"
          value={stats.lowCount}
          alert={stats.lowCount > 0}
        />
      </section>

      {/* Search */}
      <div style={S.searchWrap}>
        <Search size={18} style={{ color: "var(--muted)", flexShrink: 0 }} />
        <input
          style={S.searchInput}
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button style={S.clearBtn} onClick={() => setQuery("")}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="chip-scroll" style={S.chipRow}>
        {["All", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            style={{ ...S.chip, ...(activeCat === c ? S.chipActive : {}) }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* List */}
      <main style={S.list}>
        {filtered.length === 0 && (
          <div style={S.empty}>
            <Package size={40} style={{ color: "var(--line)" }} />
            <p style={{ margin: "12px 0 0", color: "var(--muted)" }}>
              No products found
            </p>
          </div>
        )}

        {filtered.map((p) => {
          const low = p.qty <= LOW_STOCK_THRESHOLD;
          const out = p.qty === 0;
          return (
            <article key={p.id} style={S.card}>
              <div style={S.thumb}>
                {p.image ? (
                  <img src={p.image} alt="" style={S.thumbImg} />
                ) : (
                  <Package size={24} style={{ color: "var(--line)" }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.cardTop}>
                  <span style={S.catTag}>{p.category}</span>
                  {out ? (
                    <span style={{ ...S.badge, ...S.badgeOut }}>Out of stock</span>
                  ) : low ? (
                    <span style={{ ...S.badge, ...S.badgeLow }}>
                      <AlertTriangle size={11} /> Low
                    </span>
                  ) : null}
                </div>
                <h3 style={S.cardName}>{p.name}</h3>
                <div style={S.price}>{fmtMKD(p.price)}</div>

                <div style={S.cardBottom}>
                  <div style={S.stepper}>
                    <button
                      style={S.stepBtn}
                      onClick={() => adjustQty(p.id, -1)}
                      disabled={p.qty === 0}
                      aria-label="decrease"
                    >
                      <Minus size={16} />
                    </button>
                    <span style={{ ...S.qtyNum, color: out ? "var(--danger)" : low ? "var(--accent)" : "var(--ink)" }}>
                      {p.qty}
                    </span>
                    <button style={S.stepBtn} onClick={() => adjustQty(p.id, 1)} aria-label="increase">
                      <Plus size={16} />
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={S.iconBtn}
                      onClick={() => setModal({ mode: "edit", product: p })}
                      aria-label="edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      style={{ ...S.iconBtn, ...S.iconBtnDanger }}
                      onClick={() => setConfirmDelete(p)}
                      aria-label="delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        <div style={{ height: 90 }} />
      </main>

      {/* FAB */}
      <button style={S.fab} onClick={() => setModal({ mode: "add" })}>
        <Plus size={24} />
      </button>

      {modal && (
        <ProductModal
          mode={modal.mode}
          product={modal.product}
          onClose={() => setModal(null)}
          onSave={saveProduct}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          product={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => removeProduct(confirmDelete.id)}
        />
      )}
    </div>
  );
}

function Stat({ icon, label, value, wide, alert }) {
  return (
    <div style={{ ...S.statCard, ...(wide ? { gridColumn: "span 2" } : {}) }}>
      <div style={{ ...S.statIcon, ...(alert ? { background: "var(--danger-soft)", color: "var(--danger)" } : {}) }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...S.statValue, ...(alert && value > 0 ? { color: "var(--danger)" } : {}) }}>
          {value}
        </div>
        <div style={S.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function ProductModal({ mode, product, onClose, onSave }) {
  const [name, setName] = useState(product?.name || "");
  const [category, setCategory] = useState(product?.category || CATEGORIES[0]);
  const [price, setPrice] = useState(product?.price ?? "");
  const [qty, setQty] = useState(product?.qty ?? 0);
  const [image, setImage] = useState(product?.image || null);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!name.trim()) return setErr("Product name is required");
    if (price === "" || isNaN(price) || Number(price) < 0)
      return setErr("Enter a valid price");
    onSave({
      id: product?.id,
      name: name.trim(),
      category,
      price: Number(price),
      qty: Number(qty) || 0,
      image,
    });
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div className="sheet" style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={S.sheetGrip} />
        <div style={S.sheetHead}>
          <h2 style={S.sheetTitle}>{mode === "add" ? "Add product" : "Edit product"}</h2>
          <button style={S.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div style={S.sheetBody}>
          {/* Image picker */}
          <button style={S.imagePick} onClick={() => fileRef.current?.click()}>
            {image ? (
              <img src={image} alt="" style={S.imagePreview} />
            ) : (
              <div style={S.imagePlaceholder}>
                <Camera size={22} style={{ color: "var(--muted)" }} />
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Add photo</span>
              </div>
            )}
            {image && <div style={S.imageEdit}><Camera size={14} /></div>}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={pickImage}
            style={{ display: "none" }}
          />

          <Field label="Name">
            <input
              style={S.input}
              value={name}
              onChange={(e) => { setName(e.target.value); setErr(""); }}
              placeholder="e.g. Lace Front Wig"
            />
          </Field>

          <Field label="Category">
            <div style={S.selectWrap}>
              <select
                style={S.select}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={16} style={S.selectIcon} />
            </div>
          </Field>

          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Price (MKD)" style={{ flex: 1 }}>
              <input
                style={S.input}
                type="number"
                inputMode="numeric"
                value={price}
                onChange={(e) => { setPrice(e.target.value); setErr(""); }}
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

          {err && <div style={S.error}>{err}</div>}
        </div>

        <div style={S.sheetFoot}>
          <button style={S.btnGhost} onClick={onClose}>Cancel</button>
          <button style={S.btnPrimary} onClick={submit}>
            <Check size={18} /> {mode === "add" ? "Add product" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ product, onCancel, onConfirm }) {
  return (
    <div style={S.overlay} onClick={onCancel}>
      <div style={S.confirmBox} onClick={(e) => e.stopPropagation()}>
        <div style={S.confirmIcon}><Trash2 size={22} /></div>
        <h3 style={{ margin: "0 0 6px", fontSize: 17, color: "var(--ink)" }}>Delete product?</h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
          "{product.name}" will be permanently removed.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...S.btnGhost, flex: 1 }} onClick={onCancel}>Cancel</button>
          <button style={{ ...S.btnDanger, flex: 1 }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <label style={{ display: "block", ...style }}>
      <span style={S.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const S = {
  app: {
    "--ink": "#13151c",
    "--ink-2": "#2a2e3a",
    "--muted": "#8b919e",
    "--line": "#dfe2e8",
    "--bg": "#f4f5f7",
    "--card": "#ffffff",
    "--accent": "#c8821f",
    "--accent-soft": "#fbf0dd",
    "--danger": "#d33b3b",
    "--danger-soft": "#fbe5e5",
    "--ok": "#2f9e6b",
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    background: "var(--bg)",
    minHeight: "100vh",
    maxWidth: 480,
    margin: "0 auto",
    color: "var(--ink)",
    position: "relative",
    paddingBottom: 20,
  },
  header: { padding: "20px 18px 14px" },
  brandRow: { display: "flex", alignItems: "center", gap: 12 },
  logoMark: {
    width: 42, height: 42, borderRadius: 12, background: "var(--ink)",
    color: "#fff", display: "grid", placeItems: "center",
    fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px",
  },
  brandName: { fontWeight: 800, fontSize: 16, letterSpacing: "0.5px" },
  brandSub: { fontSize: 12, color: "var(--muted)", marginTop: 1, letterSpacing: "0.3px" },

  statGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
    padding: "0 18px 16px",
  },
  statCard: {
    background: "var(--card)", borderRadius: 14, padding: "12px 14px",
    display: "flex", alignItems: "center", gap: 10,
    border: "1px solid var(--line)",
  },
  statIcon: {
    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
    background: "var(--ink)", color: "#fff",
    display: "grid", placeItems: "center",
  },
  statValue: { fontWeight: 700, fontSize: 17, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  statLabel: { fontSize: 11, color: "var(--muted)", marginTop: 2 },

  searchWrap: {
    margin: "0 18px 12px", background: "var(--card)",
    border: "1px solid var(--line)", borderRadius: 12,
    display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
  },
  searchInput: {
    flex: 1, border: "none", outline: "none", background: "transparent",
    padding: "13px 0", fontSize: 15, color: "var(--ink)", fontFamily: "inherit",
  },
  clearBtn: { border: "none", background: "none", color: "var(--muted)", cursor: "pointer", padding: 4, display: "flex" },

  chipRow: {
    display: "flex", gap: 8, padding: "0 18px 14px",
    overflowX: "auto", WebkitOverflowScrolling: "touch",
  },
  chip: {
    flexShrink: 0, border: "1px solid var(--line)", background: "var(--card)",
    color: "var(--ink-2)", padding: "7px 15px", borderRadius: 100,
    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    transition: "all .15s",
  },
  chipActive: { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" },

  list: { padding: "0 18px", display: "flex", flexDirection: "column", gap: 12 },
  card: {
    background: "var(--card)", borderRadius: 16, padding: 14,
    display: "flex", gap: 14, border: "1px solid var(--line)",
  },
  thumb: {
    width: 64, height: 64, borderRadius: 12, flexShrink: 0,
    background: "var(--bg)", display: "grid", placeItems: "center", overflow: "hidden",
    border: "1px solid var(--line)",
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  cardTop: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5 },
  catTag: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase",
    color: "var(--accent)", background: "var(--accent-soft)",
    padding: "2px 8px", borderRadius: 6,
  },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 3,
    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
  },
  badgeLow: { color: "var(--accent)", background: "var(--accent-soft)" },
  badgeOut: { color: "var(--danger)", background: "var(--danger-soft)" },
  cardName: {
    margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.3,
    color: "var(--ink)", letterSpacing: "-0.2px",
  },
  price: { fontSize: 14, fontWeight: 700, color: "var(--ink-2)", marginTop: 3 },
  cardBottom: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginTop: 12,
  },
  stepper: {
    display: "flex", alignItems: "center", gap: 2,
    background: "var(--bg)", borderRadius: 10, padding: 3,
    border: "1px solid var(--line)",
  },
  stepBtn: {
    width: 32, height: 32, borderRadius: 8, border: "none",
    background: "var(--card)", color: "var(--ink)", cursor: "pointer",
    display: "grid", placeItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,.06)",
  },
  qtyNum: { minWidth: 30, textAlign: "center", fontWeight: 800, fontSize: 15 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line)",
    background: "var(--card)", color: "var(--ink-2)", cursor: "pointer",
    display: "grid", placeItems: "center",
  },
  iconBtnDanger: { color: "var(--danger)" },

  empty: { textAlign: "center", padding: "60px 20px" },

  fab: {
    position: "fixed", bottom: 24, right: "50%", transform: "translateX(220px)",
    width: 58, height: 58, borderRadius: 18, border: "none",
    background: "var(--ink)", color: "#fff", cursor: "pointer",
    display: "grid", placeItems: "center",
    boxShadow: "0 8px 24px rgba(19,21,28,.35)", zIndex: 50,
  },

  overlay: {
    position: "fixed", inset: 0, background: "rgba(19,21,28,.5)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    zIndex: 100, backdropFilter: "blur(2px)",
  },
  sheet: {
    background: "var(--card)", width: "100%", maxWidth: 480,
    borderRadius: "24px 24px 0 0", maxHeight: "92vh",
    display: "flex", flexDirection: "column",
  },
  sheetGrip: {
    width: 40, height: 4, borderRadius: 4, background: "var(--line)",
    margin: "10px auto 0",
  },
  sheetHead: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 20px 8px",
  },
  sheetTitle: { margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.3px" },
  closeBtn: {
    border: "none", background: "var(--bg)", borderRadius: 10,
    width: 36, height: 36, display: "grid", placeItems: "center",
    cursor: "pointer", color: "var(--ink-2)",
  },
  sheetBody: { padding: "8px 20px 16px", overflowY: "auto" },

  imagePick: {
    width: "100%", height: 120, borderRadius: 14, marginBottom: 16,
    border: "1.5px dashed var(--line)", background: "var(--bg)",
    cursor: "pointer", position: "relative", overflow: "hidden",
    display: "grid", placeItems: "center", padding: 0,
  },
  imagePlaceholder: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  imagePreview: { width: "100%", height: "100%", objectFit: "cover" },
  imageEdit: {
    position: "absolute", bottom: 8, right: 8, background: "var(--ink)",
    color: "#fff", width: 30, height: 30, borderRadius: 8,
    display: "grid", placeItems: "center",
  },

  fieldLabel: {
    display: "block", fontSize: 12, fontWeight: 700, color: "var(--ink-2)",
    marginBottom: 6, letterSpacing: "0.2px",
  },
  input: {
    width: "100%", boxSizing: "border-box", border: "1px solid var(--line)",
    borderRadius: 11, padding: "12px 14px", fontSize: 15, fontFamily: "inherit",
    color: "var(--ink)", outline: "none", background: "var(--card)",
    marginBottom: 14,
  },
  selectWrap: { position: "relative", marginBottom: 14 },
  select: {
    width: "100%", boxSizing: "border-box", border: "1px solid var(--line)",
    borderRadius: 11, padding: "12px 14px", fontSize: 15, fontFamily: "inherit",
    color: "var(--ink)", outline: "none", background: "var(--card)",
    appearance: "none", WebkitAppearance: "none",
  },
  selectIcon: { position: "absolute", right: 14, top: 14, color: "var(--muted)", pointerEvents: "none" },

  error: {
    background: "var(--danger-soft)", color: "var(--danger)",
    padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
  },
  sheetFoot: {
    display: "flex", gap: 10, padding: "12px 20px",
    borderTop: "1px solid var(--line)",
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
  },
  btnGhost: {
    border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink-2)",
    padding: "13px 18px", borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  btnPrimary: {
    flex: 1, border: "none", background: "var(--ink)", color: "#fff",
    padding: "13px 18px", borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnDanger: {
    border: "none", background: "var(--danger)", color: "#fff",
    padding: "13px 18px", borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },

  confirmBox: {
    background: "var(--card)", borderRadius: 20, padding: 24, margin: "auto 20px",
    maxWidth: 340, textAlign: "center", alignSelf: "center",
  },
  confirmIcon: {
    width: 52, height: 52, borderRadius: 14, background: "var(--danger-soft)",
    color: "var(--danger)", display: "grid", placeItems: "center", margin: "0 auto 14px",
  },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
* { -webkit-tap-highlight-color: transparent; }
.chip-scroll::-webkit-scrollbar { display: none; }
.sheet { animation: slideUp .28s cubic-bezier(.16,1,.3,1); }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
button:active { transform: scale(.96); transition: transform .1s; }
input:focus, select:focus { border-color: var(--ink) !important; }
`;
