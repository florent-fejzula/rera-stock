import React, { useState, useMemo, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { BarChart2, ShoppingBag, TrendingDown, Tag, Filter } from 'lucide-react';
import { db } from '../firebase';
import { C, fmtMKD, fmtDate } from '../theme';
import { useCategories } from '../hooks/useCategories';

const DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'Custom range', value: 'custom' },
  { label: 'All time', value: 'all' },
];

function toInputDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateRange(filter, customFrom, customTo) {
  const now = new Date();
  if (filter === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    return { start, end: null };
  }
  if (filter === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return { start, end: null };
  }
  if (filter === 'month') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: null };
  }
  if (filter === 'custom') {
    const start = customFrom ? new Date(customFrom + 'T00:00:00') : null;
    const end = customTo ? new Date(customTo + 'T23:59:59') : null;
    return { start, end };
  }
  return { start: null, end: null };
}

export default function Sales() {
  const { names: categoryNames } = useCategories();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('month');
  const [catFilter, setCatFilter] = useState('All');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('soldAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setSales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const { start, end } = getDateRange(dateFilter, customFrom, customTo);
    return sales.filter((s) => {
      const date = s.soldAt?.toDate ? s.soldAt.toDate() : null;
      if (start && date && date < start) return false;
      if (end && date && date > end) return false;
      if (catFilter !== 'All' && s.category !== catFilter) return false;
      return true;
    });
  }, [sales, dateFilter, catFilter, customFrom, customTo]);

  const summary = useMemo(() => {
    const totalItems = filtered.reduce((s, x) => s + x.qtySold, 0);
    const totalRevenue = filtered.reduce((s, x) => s + x.soldPrice * x.qtySold, 0);
    const originalRevenue = filtered.reduce((s, x) => s + x.originalPrice * x.qtySold, 0);
    const discountsGiven = Math.max(0, originalRevenue - totalRevenue);
    const discountedCount = filtered.filter((x) => x.isDiscounted).length;
    return { totalItems, totalRevenue, originalRevenue, discountsGiven, discountedCount };
  }, [filtered]);

  return (
    <div style={S.page}>
      {/* Page title */}
      <div className="sales-page-head" style={S.pageHead}>
        <h1 style={S.pageTitle}>Sales History</h1>
        <p style={S.pageSub}>Track what was sold, when, and at what price</p>
      </div>

      {/* Filters */}
      <div className="sales-filters-row" style={S.filtersRow}>
        <div className="chip-scroll" style={S.chipGroup}>
          {DATE_FILTERS.map((f) => (
            <button
              key={f.value}
              style={{ ...S.chip, ...(dateFilter === f.value ? S.chipActive : {}) }}
              onClick={() => {
                setDateFilter(f.value);
                if (f.value === 'custom' && !customFrom && !customTo) {
                  const now = new Date();
                  setCustomFrom(toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)));
                  setCustomTo(toInputDate(now));
                }
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={S.selectWrap}>
          <Filter size={14} style={{ color: C.muted, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <select
            style={S.select}
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="All">All categories</option>
            {categoryNames.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {dateFilter === 'custom' && (
        <div className="sales-filters-row" style={S.dateRangeRow}>
          <label style={S.dateLabel}>
            <span style={S.dateLabelText}>From</span>
            <input
              type="date"
              style={S.dateInput}
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </label>
          <span style={{ color: C.muted, fontSize: 13, paddingBottom: 9 }}>–</span>
          <label style={S.dateLabel}>
            <span style={S.dateLabelText}>To</span>
            <input
              type="date"
              style={S.dateInput}
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </label>
        </div>
      )}

      {/* Summary cards */}
      <section className="sales-summary-grid" style={S.summaryGrid}>
        <SummaryCard
          icon={<ShoppingBag size={16} />}
          label="Items sold"
          value={summary.totalItems}
        />
        <SummaryCard
          icon={<TrendingDown size={16} />}
          label="Total revenue"
          value={fmtMKD(summary.totalRevenue)}
          highlight
        />
        <SummaryCard
          icon={<Tag size={16} />}
          label="Discounts given"
          value={fmtMKD(summary.discountsGiven)}
          alert={summary.discountsGiven > 0}
          sub={summary.discountedCount > 0 ? `${summary.discountedCount} discounted sale${summary.discountedCount > 1 ? 's' : ''}` : undefined}
        />
        <SummaryCard
          icon={<BarChart2 size={16} />}
          label="Avg. per item"
          value={summary.totalItems > 0 ? fmtMKD(Math.round(summary.totalRevenue / summary.totalItems)) : '—'}
        />
      </section>

      {/* Desktop table — CSS class controls visibility */}
      <div className="sales-table sales-table-wrap" style={S.tableWrap}>
        {loading ? (
          <div style={S.emptyState}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={S.emptyState}>No sales found for this period.</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {['Date', 'Product', 'Code', 'Category', 'Qty', 'Original', 'Sold at', 'Discount', 'Staff'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={S.tr}>
                  <td style={S.td}>{s.soldAt?.toDate ? fmtDate(s.soldAt) : '—'}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{s.productName}</td>
                  <td style={S.td}>{s.productCode || '—'}</td>
                  <td style={S.td}>
                    <span style={S.catBadge}>{s.category}</span>
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>{s.qtySold}</td>
                  <td style={S.td}>{fmtMKD(s.originalPrice)}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: s.isDiscounted ? C.accent : C.ink }}>
                    {fmtMKD(s.soldPrice)}
                  </td>
                  <td style={{ ...S.td, color: s.isDiscounted ? C.danger : C.muted }}>
                    {s.isDiscounted ? `-${fmtMKD(s.discountAmount)}` : '—'}
                  </td>
                  <td style={{ ...S.td, color: C.muted, fontSize: 12 }}>{s.soldByEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards — CSS class controls visibility */}
      <div className="sales-cards sales-cards-wrap" style={S.saleCardList}>
        {loading ? (
          <div style={S.emptyState}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={S.emptyState}>No sales found for this period.</div>
        ) : (
          filtered.map((s) => <SaleCard key={s.id} sale={s} />)
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, alert, highlight, sub }) {
  return (
    <div style={S.summaryCard}>
      <div style={{
        ...S.summaryIcon,
        ...(alert ? { background: C.dangerSoft, color: C.danger } : {}),
        ...(highlight ? { background: C.ink, color: '#fff' } : {}),
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...S.summaryValue, ...(alert ? { color: C.danger } : {}) }}>{value}</div>
        <div style={S.summaryLabel}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SaleCard({ sale: s }) {
  return (
    <div style={S.saleCard}>
      <div style={S.saleCardHead}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.saleCardName}>{s.productName}</div>
          <div style={S.saleCardMeta}>
            {s.productCode && <span style={S.codeTag}>{s.productCode}</span>}
            <span style={S.catTag}>{s.category}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ ...S.salePrice, color: s.isDiscounted ? C.accent : C.ink }}>
            {fmtMKD(s.soldPrice)}
          </div>
          {s.isDiscounted && (
            <div style={S.originalPrice}>{fmtMKD(s.originalPrice)}</div>
          )}
        </div>
      </div>
      <div style={S.saleCardFoot}>
        <span style={{ fontSize: 12, color: C.muted }}>
          {s.soldAt?.toDate ? fmtDate(s.soldAt) : '—'}
        </span>
        {s.isDiscounted && (
          <span style={S.discountBadge}>-{fmtMKD(s.discountAmount)}</span>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { paddingBottom: 32 },
  pageHead: { padding: '24px 18px 12px' },
  pageTitle: { fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: '-0.4px', marginBottom: 4 },
  pageSub: { fontSize: 14, color: C.muted },

  filtersRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '0 18px 16px', flexWrap: 'wrap',
  },
  chipGroup: {
    display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch',
  },
  chip: {
    flexShrink: 0, border: '1px solid ' + C.line, background: C.card,
    color: C.ink2, padding: '7px 15px', borderRadius: 100,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  chipActive: { background: C.ink, color: '#fff', borderColor: C.ink },

  dateRangeRow: {
    display: 'flex', alignItems: 'flex-end', gap: 12,
    padding: '0 18px 16px', flexWrap: 'wrap',
  },
  dateLabel: { display: 'flex', flexDirection: 'column', gap: 4 },
  dateLabelText: {
    fontSize: 11, fontWeight: 700, color: C.ink2, letterSpacing: '0.3px',
  },
  dateInput: {
    border: '1px solid ' + C.line, borderRadius: 10,
    padding: '8px 10px', fontSize: 13, fontWeight: 600,
    color: C.ink, fontFamily: 'inherit', background: C.card,
    cursor: 'pointer',
  },

  selectWrap: { position: 'relative', flexShrink: 0 },
  select: {
    border: '1px solid ' + C.line, background: C.card,
    borderRadius: 10, padding: '8px 12px 8px 32px',
    fontSize: 13, fontWeight: 600, color: C.ink2,
    fontFamily: 'inherit', cursor: 'pointer', appearance: 'none',
  },

  summaryGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
    padding: '0 18px 20px',
  },
  summaryCard: {
    background: C.card, borderRadius: 14, padding: '12px 14px',
    display: 'flex', alignItems: 'center', gap: 10,
    border: '1px solid ' + C.line,
  },
  summaryIcon: {
    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
    background: C.bg, color: C.ink2, border: '1px solid ' + C.line,
    display: 'grid', placeItems: 'center',
  },
  summaryValue: { fontWeight: 700, fontSize: 16, lineHeight: 1.1 },
  summaryLabel: { fontSize: 11, color: C.muted, marginTop: 2 },

  tableWrap: {
    margin: '0 18px', background: C.card,
    border: '1px solid ' + C.line, borderRadius: 14,
    overflow: 'auto',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
    fontSize: 13, color: C.ink,
  },
  th: {
    padding: '12px 16px', textAlign: 'left',
    fontSize: 11, fontWeight: 700, color: C.muted,
    letterSpacing: '0.4px', textTransform: 'uppercase',
    borderBottom: '1px solid ' + C.line, whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid ' + C.line },
  td: { padding: '12px 16px', verticalAlign: 'middle' },
  catBadge: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.4px',
    textTransform: 'uppercase', color: C.accent, background: C.accentSoft,
    padding: '2px 7px', borderRadius: 6,
  },

  saleCardList: {
    flexDirection: 'column', gap: 10, padding: '0 18px',
  },
  saleCard: {
    background: C.card, borderRadius: 14, padding: '14px',
    border: '1px solid ' + C.line,
  },
  saleCardHead: {
    display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10,
  },
  saleCardName: { fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4 },
  saleCardMeta: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  catTag: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.4px',
    textTransform: 'uppercase', color: C.accent, background: C.accentSoft,
    padding: '2px 7px', borderRadius: 6,
  },
  codeTag: {
    fontSize: 10, fontWeight: 700, color: C.muted,
    background: C.bg, border: '1px solid ' + C.line,
    padding: '2px 7px', borderRadius: 6,
  },
  salePrice: { fontSize: 16, fontWeight: 800 },
  originalPrice: {
    fontSize: 12, color: C.muted, textDecoration: 'line-through', marginTop: 2,
  },
  saleCardFoot: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, borderTop: '1px solid ' + C.line,
  },
  discountBadge: {
    fontSize: 11, fontWeight: 700, color: C.danger,
    background: C.dangerSoft, padding: '2px 8px', borderRadius: 6,
  },

  emptyState: {
    padding: '48px 20px', textAlign: 'center', color: C.muted, fontSize: 14,
  },
};
