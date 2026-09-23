import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Package, BarChart2, Tag, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { C } from '../theme';

export default function Layout({ children }) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Close drawer if viewport grows to desktop size
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const navItems = (onNav) => (
    <>
      <NavItem to="/" icon={<Package size={18} />} label="Stock" onNav={onNav} />
      {role === 'admin' && (
        <NavItem to="/sales" icon={<BarChart2 size={18} />} label="Sales" onNav={onNav} />
      )}
      <NavItem to="/categories" icon={<Tag size={18} />} label="Categories" onNav={onNav} />
    </>
  );

  return (
    <div className="layout-root">
      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside className="sidebar" style={S.sidebar}>
        <NavLink to="/" style={S.sidebarBrand}>
          <div style={S.logoMark}>R</div>
          <div>
            <div style={S.brandName}>RERA HAIR</div>
            <div style={S.brandName2}>FASHION</div>
          </div>
        </NavLink>

        <div style={S.sidebarDivider} />

        <nav style={S.nav}>{navItems(null)}</nav>

        <div style={{ flex: 1 }} />

        <div style={S.sidebarFooter}>
          <div style={S.sidebarUser}>
            <div style={S.userAvatar}>{user?.email?.[0]?.toUpperCase() ?? 'U'}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={S.userEmail}>{user?.email}</div>
              <div style={S.userRole}>{role === 'admin' ? 'Admin' : 'Staff'}</div>
            </div>
          </div>
          <button style={S.signOutBtn} onClick={handleSignOut} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="main-content">
        {/* Mobile header */}
        <header className="mobile-header" style={S.mobileHeader}>
          <div style={S.mobileHeaderInner}>
            <NavLink to="/" style={S.mobileBrand}>
              <div style={{ ...S.logoMark, width: 36, height: 36, fontSize: 18, borderRadius: 10, background: C.ink, color: '#fff' }}>R</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.4px', color: C.ink }}>RERA HAIR FASHION</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Stock Manager</div>
              </div>
            </NavLink>
            <button style={S.hamburgerBtn} onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
          </div>
        </header>

        {children}
      </div>

      {/* ── Mobile drawer ────────────────────────────────── */}
      {menuOpen && (
        <div style={S.drawerOverlay} onClick={() => setMenuOpen(false)}>
          <nav className="mobile-drawer" style={S.drawer} onClick={(e) => e.stopPropagation()}>
            {/* Drawer header */}
            <div style={S.drawerHead}>
              <NavLink to="/" onClick={() => setMenuOpen(false)} style={S.sidebarBrand}>
                <div style={S.logoMark}>R</div>
                <div>
                  <div style={S.brandName}>RERA HAIR</div>
                  <div style={S.brandName2}>FASHION</div>
                </div>
              </NavLink>
              <button style={S.drawerClose} onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <div style={S.sidebarDivider} />

            {/* Nav links — close drawer on tap */}
            <div style={{ ...S.nav, padding: '0 12px' }}>
              {navItems(() => setMenuOpen(false))}
            </div>

            <div style={{ flex: 1 }} />

            {/* User + sign out */}
            <div style={S.sidebarFooter}>
              <div style={S.sidebarUser}>
                <div style={S.userAvatar}>{user?.email?.[0]?.toUpperCase() ?? 'U'}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={S.userEmail}>{user?.email}</div>
                  <div style={S.userRole}>{role === 'admin' ? 'Admin' : 'Staff'}</div>
                </div>
              </div>
              <button style={S.signOutBtn} onClick={handleSignOut} title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

function NavItem({ to, icon, label, onNav }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNav ?? undefined}
      style={({ isActive }) => ({
        ...S.navItem,
        ...(isActive ? S.navItemActive : {}),
      })}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
    </NavLink>
  );
}

const S = {
  sidebar: {
    width: 240,
    background: C.ink,
    color: '#fff',
    flexDirection: 'column',
    padding: 0,
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '28px 20px 20px',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  logoMark: {
    width: 42, height: 42, borderRadius: 12,
    background: '#fff', color: C.ink,
    display: 'grid', placeItems: 'center',
    fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px', flexShrink: 0,
  },
  brandName: { fontWeight: 800, fontSize: 13, letterSpacing: '0.8px', color: '#fff', lineHeight: 1.2 },
  brandName2: { fontWeight: 800, fontSize: 13, letterSpacing: '0.8px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.2 },
  sidebarDivider: { height: 1, background: 'rgba(255,255,255,0.1)', margin: '0 20px 16px' },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '11px 12px', borderRadius: 10,
    color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
    fontSize: 14, fontWeight: 600, transition: 'background .15s, color .15s',
  },
  navItemActive: { background: 'rgba(255,255,255,0.12)', color: '#fff' },
  sidebarFooter: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    padding: '16px',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  sidebarUser: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  userAvatar: {
    width: 32, height: 32, borderRadius: 9,
    background: 'rgba(255,255,255,0.15)', color: '#fff',
    display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0,
  },
  userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  signOutBtn: {
    border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)',
    borderRadius: 8, width: 32, height: 32, display: 'grid', placeItems: 'center',
    cursor: 'pointer', flexShrink: 0,
  },

  // Mobile header
  mobileHeader: { padding: '0 18px', background: C.bg },
  mobileHeaderInner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 0 12px',
  },
  mobileBrand: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' },
  hamburgerBtn: {
    border: '1px solid ' + C.line, background: C.card, color: C.ink2,
    borderRadius: 10, width: 38, height: 38,
    display: 'grid', placeItems: 'center', cursor: 'pointer',
  },

  // Mobile drawer
  drawerOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(19,21,28,0.55)',
    zIndex: 300,
    backdropFilter: 'blur(2px)',
  },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: 272,
    background: C.ink,
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto',
  },
  drawerHead: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingRight: 16,
  },
  drawerClose: {
    border: 'none', background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.6)', borderRadius: 8,
    width: 34, height: 34, display: 'grid', placeItems: 'center',
    cursor: 'pointer', flexShrink: 0, marginTop: 28,
  },
};
