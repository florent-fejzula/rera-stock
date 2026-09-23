import React, { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, where, getDocs, writeBatch,
} from 'firebase/firestore';
import { Plus, Pencil, Trash2, Check, X, Tag } from 'lucide-react';
import { db } from '../firebase';
import { C } from '../theme';
import ConfirmModal from '../components/ConfirmModal';

/** Turns a Firestore write rejection into something the user can act on. */
function writeError(e, action) {
  if (e?.code === 'permission-denied') {
    return `You don't have permission to ${action}. Ask an admin to check your account.`;
  }
  if (e?.code === 'unavailable') {
    return `Couldn't reach the server — check your connection and try again.`;
  }
  return `Couldn't ${action}. Please try again.`;
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name'));
    return onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map((d) => ({ category: d.data().category })));
    });
  }, []);

  const countProducts = (name) => products.filter((p) => p.category === name).length;

  const isDuplicate = (name, excludeId = null) =>
    categories.some(
      (c) => c.id !== excludeId && c.name.toLowerCase() === name.trim().toLowerCase()
    );

  const addCategory = async () => {
    const name = newName.trim();
    if (!name) return;
    if (isDuplicate(name)) return setErr('A category with that name already exists.');
    setAdding(true);
    setErr('');
    try {
      await addDoc(collection(db, 'categories'), { name, createdAt: serverTimestamp() });
      setNewName('');
    } catch (e) {
      // Without this the write fails silently: Firestore shows the new row
      // locally (latency compensation) and then quietly rolls it back, so the
      // category looks added until the next reload.
      setErr(writeError(e, 'add the category'));
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditValue(cat.name);
    setErr('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setErr('');
  };

  const saveEdit = async (cat) => {
    const name = editValue.trim();
    if (!name) return setErr('Name cannot be empty.');
    if (isDuplicate(name, cat.id)) return setErr('A category with that name already exists.');
    if (name === cat.name) { setEditingId(null); return; }

    setSavingId(cat.id);
    setErr('');
    try {
      const batch = writeBatch(db);

      // Rename the category doc
      batch.update(doc(db, 'categories', cat.id), { name, updatedAt: serverTimestamp() });

      // Update all products that carry the old category name
      const snap = await getDocs(
        query(collection(db, 'products'), where('category', '==', cat.name))
      );
      snap.docs.forEach((d) => batch.update(d.ref, { category: name }));

      await batch.commit();
      setEditingId(null);
    } catch (e) {
      setErr(writeError(e, 'rename the category'));
    } finally {
      setSavingId(null);
    }
  };

  const confirmAndDelete = async () => {
    const cat = confirmDelete;
    setConfirmDelete(null);
    setErr('');
    try {
      const batch = writeBatch(db);

      // Reassign affected products to "Uncategorized"
      const snap = await getDocs(
        query(collection(db, 'products'), where('category', '==', cat.name))
      );
      snap.docs.forEach((d) => batch.update(d.ref, { category: 'Uncategorized' }));

      batch.delete(doc(db, 'categories', cat.id));
      await batch.commit();
    } catch (e) {
      setErr(writeError(e, 'delete the category'));
    }
  };

  const affectedCount = confirmDelete ? countProducts(confirmDelete.name) : 0;

  return (
    <div style={S.page}>
      <div className="sales-page-head" style={S.pageHead}>
        <h1 style={S.pageTitle}>Categories</h1>
        <p style={S.pageSub}>Add, rename, or remove the categories used across your stock</p>
      </div>

      {/* Add new */}
      <div className="sales-filters-row" style={S.addRow}>
        <input
          style={S.addInput}
          placeholder="New category name…"
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setErr(''); }}
          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          maxLength={40}
        />
        <button
          style={{ ...S.addBtn, opacity: adding ? 0.6 : 1 }}
          onClick={addCategory}
          disabled={adding}
        >
          <Plus size={18} /> Add category
        </button>
      </div>

      {err && (
        <div className="sales-filters-row" style={{ padding: '0 18px 12px' }}>
          <div style={S.error}>{err}</div>
        </div>
      )}

      {/* Category list */}
      <div className="sales-table-wrap" style={S.listWrap}>
        {loading ? (
          <div style={S.emptyState}>Loading…</div>
        ) : categories.length === 0 ? (
          <div style={S.emptyState}>No categories yet. Add one above.</div>
        ) : (
          categories.map((cat) => {
            const count = countProducts(cat.name);
            const isEditing = editingId === cat.id;
            const isSaving = savingId === cat.id;
            return (
              <div key={cat.id} style={S.row}>
                <div style={S.rowIcon}><Tag size={16} /></div>

                {isEditing ? (
                  <input
                    style={S.editInput}
                    value={editValue}
                    autoFocus
                    maxLength={40}
                    onChange={(e) => { setEditValue(e.target.value); setErr(''); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(cat);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                  />
                ) : (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.rowName}>{cat.name}</div>
                    <div style={S.rowMeta}>
                      {count} product{count !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {isEditing ? (
                    <>
                      <button
                        style={{ ...S.iconBtn, ...S.iconBtnOk }}
                        onClick={() => saveEdit(cat)}
                        disabled={isSaving}
                        title="Save"
                      >
                        <Check size={16} />
                      </button>
                      <button style={S.iconBtn} onClick={cancelEdit} title="Cancel">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button style={S.iconBtn} onClick={() => startEdit(cat)} title="Rename">
                        <Pencil size={16} />
                      </button>
                      <button
                        style={{ ...S.iconBtn, ...S.iconBtnDanger }}
                        onClick={() => setConfirmDelete(cat)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title={`Delete "${confirmDelete.name}"?`}
          message={
            affectedCount > 0
              ? `${affectedCount} product${affectedCount !== 1 ? 's' : ''} using this category will be moved to "Uncategorized".`
              : 'This category will be permanently removed.'
          }
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmAndDelete}
        />
      )}
    </div>
  );
}

const S = {
  page: { paddingBottom: 32 },
  pageHead: { padding: '24px 18px 12px' },
  pageTitle: { fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: '-0.4px', marginBottom: 4 },
  pageSub: { fontSize: 14, color: C.muted },

  addRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '0 18px 16px', flexWrap: 'wrap',
  },
  addInput: {
    flex: 1, minWidth: 200,
    border: '1px solid ' + C.line, background: C.card,
    borderRadius: 11, padding: '11px 14px', fontSize: 15,
    fontFamily: 'inherit', color: C.ink,
  },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    border: 'none', background: C.ink, color: '#fff',
    padding: '0 20px', height: 44, borderRadius: 11,
    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    flexShrink: 0, whiteSpace: 'nowrap',
  },
  error: {
    background: C.dangerSoft, color: C.danger,
    padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    width: '100%',
  },

  listWrap: {
    margin: '0 18px', background: C.card,
    border: '1px solid ' + C.line, borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px',
    borderBottom: '1px solid ' + C.line,
    transition: 'background .1s',
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
    background: C.accentSoft, color: C.accent,
    display: 'grid', placeItems: 'center',
  },
  rowName: { fontSize: 15, fontWeight: 700, color: C.ink },
  rowMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  editInput: {
    flex: 1, border: '1.5px solid ' + C.ink,
    borderRadius: 9, padding: '8px 12px',
    fontSize: 15, fontWeight: 600, fontFamily: 'inherit', color: C.ink,
    background: C.card, outline: 'none',
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 9,
    border: '1px solid ' + C.line, background: C.card,
    color: C.ink2, cursor: 'pointer', display: 'grid', placeItems: 'center',
  },
  iconBtnOk: { color: C.ok, borderColor: C.ok, background: '#f0faf5' },
  iconBtnDanger: { color: C.danger },

  emptyState: {
    padding: '48px 20px', textAlign: 'center', color: C.muted, fontSize: 14,
  },
};
