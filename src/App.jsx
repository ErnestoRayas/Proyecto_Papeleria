import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { ShopProvider, useShop } from './store/ShopContext';
import Catalog from './components/shop/Catalog';
import Icon from './components/shop/Icon';
import AuthModal from './components/shop/AuthModal';
import './App.css';

const Cart = lazy(() => import('./components/shop/Cart'));
const Orders = lazy(() => import('./components/shop/Orders'));
const Cards = lazy(() => import('./components/shop/Cards'));
const Contact = lazy(() => import('./components/shop/Contact'));
const Inventory = lazy(() => import('./components/shop/Admin').then(m => ({ default: m.Inventory })));
const Dashboard = lazy(() => import('./components/shop/Admin').then(m => ({ default: m.Dashboard })));
const Users = lazy(() => import('./components/shop/Admin').then(m => ({ default: m.Users })));

const labels = {
  catalog: 'Catálogo', favorites: 'Favoritos', cart: 'Carrito', orders: 'Pedidos',
  cards: 'Tarjetas', contact: 'Contacto', inventory: 'Inventario',
  dashboard: 'Panel', users: 'Usuarios'
};
const adminSections = ['inventory', 'dashboard', 'users'];
const initialSection = () => Object.hasOwn(labels, window.location.hash.slice(1))
  ? window.location.hash.slice(1) : 'catalog';

function NavigationLink({ section, navigate, children, ...props }) {
  return (
    <a href={`#${section}`} {...props} onClick={event => {
      event.preventDefault();
      navigate(section);
    }}>
      {children || labels[section]}
    </a>
  );
}

function Header({ section, navigate, search, setSearch }) {
  const { user, logout, cartCount, setAuthView } = useShop();
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef(null);
  const menuButton = useRef(null);
  const admin = user?.tipo === 'admin';
  const navItems = [
    'catalog', 'cards', 'contact', ...(user ? ['orders'] : []),
    ...(admin ? ['dashboard', 'inventory', 'users'] : [])
  ];
  const changeSection = destination => { setMenuOpen(false); navigate(destination); };

  useEffect(() => setMenuOpen(false), [section]);

  useEffect(() => {
    if (!menuOpen) return;
    const escape = event => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
    };
    const outside = event => { if (!header.current?.contains(event.target)) setMenuOpen(false); };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
    };
  }, [menuOpen]);

  const submitSearch = event => {
    event.preventDefault();
    navigate('catalog', { preserveSearch: true });
    requestAnimationFrame(() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'auto' }));
  };

  return (
    <header ref={header} className="site-header">
      <div className="header-top container">
        <NavigationLink section="catalog" navigate={changeSection} className="brand" aria-label="Papelería Karen, inicio">
          <span className="brand-mark">k<span>✦</span></span>
          <span>
            <strong>Karen<span className="brand-period">.</span></strong>
            <small>PAPELERÍA & CREATIVIDAD</small>
          </span>
        </NavigationLink>
        <form className="header-search search-field" role="search" onSubmit={submitSearch}>
          <Icon name="search" />
          <input
            type="search" placeholder="Busca tu próxima idea…" aria-label="Buscar productos"
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              if (!['catalog', 'favorites'].includes(section)) {
                navigate('catalog', { preserveSearch: true });
              }
            }}
          />
        </form>
        <div className="header-actions">
          <button
            className="account-button" aria-label={user ? `Cuenta de ${user.username}` : 'Mi cuenta'}
            onClick={() => user ? changeSection('orders') : setAuthView('login')}
          >
            <Icon name="user" /><span>{user ? user.username : 'Mi cuenta'}</span>
          </button>
          <button
            className={`icon-button ${section === 'favorites' ? 'active' : ''}`}
            onClick={() => changeSection('favorites')} aria-label="Mis favoritos"
          >
            <Icon name="heart" />
          </button>
          <button className="icon-button cart-button" onClick={() => changeSection('cart')} aria-label={`Ver carrito, ${cartCount} artículos`}>
            <Icon name="bag" /><span className="cart-count">{cartCount}</span>
          </button>
          <button
            ref={menuButton} className="icon-button mobile-menu-button" aria-expanded={menuOpen}
            aria-controls="main-navigation" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
      <nav id="main-navigation" className={`main-navigation ${menuOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
        <div className="container nav-inner">
          <div className="nav-links">
            {navItems.map(item => (
              <NavigationLink
                key={item} section={item} navigate={changeSection}
                className={section === item ? 'selected' : ''}
                aria-current={section === item ? 'page' : undefined}
              />
            ))}
          </div>
          <div className="nav-meta">
            {user ? (
              <>
                <span className="status-pill">{admin ? 'Administración' : 'Cliente'}</span>
                <button className="text-button" onClick={async () => { await logout(); setMenuOpen(false); }}>Cerrar sesión</button>
              </>
            ) : <span><Icon name="pin" size={15} /> Tu papelería en Tláhuac</span>}
          </div>
        </div>
      </nav>
    </header>
  );
}

function Footer({ navigate }) {
  return (
    <>
      <section className="creative-banner container">
        <span className="creative-icon"><Icon name="spark" size={34} /></span>
        <div>
          <h2>El siguiente gran proyecto empieza contigo.</h2>
          <p>Nosotros ponemos los materiales. Tú, la imaginación.</p>
        </div>
        <button className="button secondary" onClick={() => navigate('cards')}>Crea una tarjeta <Icon name="arrow" size={18} /></button>
      </section>
      <footer className="site-footer">
        <div className="container footer-top">
          <div>
            <span className="footer-brand">Papelería Karen<span>.</span></span>
            <p>Ideas que toman forma.<br />Materiales para cada día, inspiración para todos.</p>
          </div>
          <div>
            <h3>Explora</h3>
            <NavigationLink section="catalog" navigate={navigate} />
            <NavigationLink section="favorites" navigate={navigate}>Mis favoritos</NavigationLink>
            <NavigationLink section="cards" navigate={navigate}>Tarjetas personalizadas</NavigationLink>
          </div>
          <div>
            <h3>Estamos cerca</h3>
            <NavigationLink section="contact" navigate={navigate}>Visítanos en Tláhuac</NavigationLink>
            <a href="mailto:papeleriakaren@gmail.com">papeleriakaren@gmail.com</a>
            <span>Recoge y paga en tienda</span>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Papelería Karen</span>
          <span>Proyecto del TecNM · Campus Tláhuac</span>
          <span>Hecho con creatividad y cariño.</span>
        </div>
      </footer>
    </>
  );
}

function SectionContent({ section, navigate, search, setSearch }) {
  const { user, loading } = useShop();
  if (loading && section !== 'catalog') return <div className="loading-state" role="status">Cargando tienda…</div>;
  switch (section) {
    case 'catalog':
    case 'favorites':
      return <Catalog key={section} favoritesOnly={section === 'favorites'} search={search} setSearch={setSearch} navigate={navigate} />;
    case 'cart': return <Cart navigate={navigate} />;
    case 'orders': return <Orders key={user?.id || 'guest'} />;
    case 'cards': return <Cards />;
    case 'contact': return <Contact />;
    case 'inventory': return <Inventory />;
    case 'dashboard': return <Dashboard navigate={navigate} />;
    case 'users': return <Users />;
    default: return null;
  }
}

function Shop() {
  const { user, offline, refresh, authView, notice, setNotice, setNoticePaused, notify } = useShop();
  const [section, setSection] = useState(initialSection);
  const [search, setSearch] = useState('');
  const main = useRef(null);
  const firstRender = useRef(true);
  const focusAfterNavigation = useRef(true);
  const activeSection = adminSections.includes(section) && user?.tipo !== 'admin' ? 'catalog' : section;

  const navigate = (destination, { preserveSearch = false } = {}) => {
    focusAfterNavigation.current = !preserveSearch;
    window.location.hash = destination;
    setSection(destination);
    if (!preserveSearch) setSearch('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    const change = () => setSection(initialSection());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);

  useEffect(() => {
    document.title = `${labels[activeSection]} · Papelería Karen`;
    if (!firstRender.current && focusAfterNavigation.current) main.current?.focus({ preventScroll: true });
    firstRender.current = false;
    focusAfterNavigation.current = true;
  }, [activeSection]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={event => {
        event.preventDefault(); main.current?.focus(); main.current?.scrollIntoView();
      }}>Saltar al contenido</a>
      <div className="announcement"><span>Un espacio para tus ideas.</span> Escuela, oficina y mucho más.</div>
      <Header section={activeSection} navigate={navigate} search={search} setSearch={setSearch} />
      {offline && (
        <div className="offline-banner container" role="status">
          <span>Vista de muestra: la tienda no está conectada. Los precios y existencias necesitan confirmación.</span>
          <button className="text-button" onClick={() => refresh().catch(error => notify(error.message, 'error'))}>Reconectar</button>
        </div>
      )}
      <main ref={main} id="main-content" className="container main-content" tabIndex={-1}>
        <Suspense fallback={<div className="loading-state" role="status">Preparando tu espacio…</div>}>
          <SectionContent section={activeSection} navigate={navigate} search={search} setSearch={setSearch} />
        </Suspense>
      </main>
      <Footer navigate={navigate} />
      {authView && <AuthModal />}
      {notice && (
        <div
          className={`toast ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}
          onMouseEnter={() => setNoticePaused(true)}
          onMouseLeave={event => { if (!event.currentTarget.contains(document.activeElement)) setNoticePaused(false); }}
          onFocusCapture={() => setNoticePaused(true)}
          onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setNoticePaused(false); }}
        >
          <Icon name={notice.type === 'error' ? 'close' : 'check'} /><span>{notice.message}</span>
          {notice.action && <button className="toast-action" onClick={() => { navigate(notice.action.section); setNotice(null); }}>{notice.action.label}<Icon name="arrow" size={16} /></button>}
          <button className="icon-button" onClick={() => setNotice(null)} aria-label="Cerrar notificación"><Icon name="close" size={16} /></button>
        </div>
      )}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? (
      <div className="empty-state large">
        <h1>No pudimos abrir la tienda</h1>
        <p>Vuelve a cargar la página para intentarlo de nuevo.</p>
        <button className="button primary" onClick={() => window.location.reload()}>Recargar</button>
      </div>
    ) : this.props.children;
  }
}

export default function App() {
  return <ErrorBoundary><ShopProvider><Shop /></ShopProvider></ErrorBoundary>;
}
