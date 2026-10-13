import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useShop, money, normalize } from '../store/ShopContext';
import Icon from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import ProductImage from '../components/products/ProductImage';


function StationeryIllustration() {
  return <svg className="hero-art" viewBox="0 0 460 340" fill="none" aria-hidden="true">
    <circle cx="253" cy="168" r="141" fill="#f0dec0"/><circle cx="374" cy="64" r="9" fill="#bd664b"/><path d="m53 72 13-9m-7-3 3 15M396 268l11-9m-9-1 5 14" stroke="#234f43" strokeWidth="3" strokeLinecap="round"/>
    <g transform="rotate(-12 180 190)"><rect x="83" y="57" width="175" height="233" rx="12" fill="#234f43"/><rect x="94" y="57" width="163" height="225" rx="10" fill="#3d6b58"/><path d="M112 57v225" stroke="#204839" strokeWidth="3"/><rect x="132" y="112" width="103" height="79" rx="4" fill="#fff9ed"/><path d="M151 137h65m-52 16h40m-42 16h43" stroke="#c0a886" strokeWidth="3" strokeLinecap="round"/><path d="M122 71h9m-9 19h9m-9 19h9m-9 19h9m-9 19h9m-9 19h9m-9 19h9m-9 19h9m-9 19h9m-9 19h9" stroke="#e4d6b8" strokeWidth="4" strokeLinecap="round"/></g>
    <g transform="rotate(19 295 205)"><rect x="238" y="111" width="139" height="174" rx="6" fill="#bd664b"/><rect x="247" y="111" width="130" height="168" rx="6" fill="#d98769"/><rect x="267" y="143" width="89" height="33" rx="3" fill="#fff2dd"/><path d="M286 160h52" stroke="#bd664b" strokeWidth="2"/><path d="M271 192h77m-77 15h77m-77 15h77m-77 15h77" stroke="#c27255" strokeWidth="2"/></g>
    <g transform="rotate(26 360 140)"><path d="M354 32h13v180l-6.5 22-6.5-22V32Z" fill="#e4b654"/><path d="M354 32h13v17h-13z" fill="#e5a28b"/><path d="M354 52h13v6h-13z" fill="#fff9ed"/><path d="m357 223 3.5 11 3.5-11" fill="#234f43"/></g>
    <g transform="rotate(-26 90 260)"><rect x="44" y="260" width="139" height="20" rx="4" fill="#e3ba70"/><path d="M57 260v9m13-9v6m13-6v9m13-9v6m13-6v9m13-9v6m13-6v9m13-9v6m13-6v9" stroke="#9b762f" strokeWidth="2"/></g>
  </svg>;
}

function ProductCard({ product, onDetails }) {
  const { favorites, toggleFavorite, addToCart, cart } = useShop();
  const favorite = favorites.includes(product.id);
  const quantity = cart.find(item => item.id === product.id)?.quantity || 0;
  const unavailable = product.stock === 0;
  const atLimit = quantity >= product.stock;

  return (
    <article className="product-card">
      <div className="product-visual">
        <ProductImage product={product} />
        <button
          className={`favorite-button ${favorite ? 'is-favorite' : ''}`}
          aria-label={`${favorite ? 'Quitar' : 'Guardar'} ${product.name} ${favorite ? 'de' : 'en'} favoritos`}
          aria-pressed={favorite} onClick={() => toggleFavorite(product.id)}
        >
          <Icon name="heart" />
        </button>
        {(unavailable || product.stock <= 5) && (
          <span className="product-badge">{unavailable ? 'Agotado' : 'Últimas piezas'}</span>
        )}
      </div>
      <div className="product-details">
        <span className="product-category">{product.category}</span>
        <h3 aria-label={product.name}>
          <button className="product-title-button" aria-label={`Ver detalles de ${product.name}`} onClick={() => onDetails(product.id)}>
            {product.name}<Icon name="arrow" size={16} />
          </button>
        </h3>
        <p className="product-description">{product.description}</p>
        <div className="product-bottom">
          <strong>{money(product.price)}</strong>
          <small>MXN · por pieza</small>
        </div>
        <span className="product-cart-quantity">{quantity ? `En tu carrito: ${quantity}` : unavailable ? 'Sin existencias' : 'Disponible en tienda'}</span>
        <button
          className="add-button" disabled={unavailable || atLimit}
          aria-label={`Agregar ${product.name} al carrito`} onClick={() => addToCart(product)}
        >
          <Icon name={quantity ? 'check' : 'plus'} size={18} />
          {unavailable ? 'Agotado' : atLimit ? 'Máximo agregado' : 'Agregar'}
        </button>
      </div>
    </article>
  );
}

function ProductDetails({ product, onClose, navigate }) {
  const { addToCart, cart } = useShop();
  const quantity = cart.find(item => item.id === product.id)?.quantity || 0;
  return (
    <Modal title={product.name} onClose={onClose} className="product-modal">
      <div className="product-detail-layout">
        <div className="product-detail-image"><ProductImage product={product} /></div>
        <div className="product-detail-copy">
          <span className="eyebrow">{product.category}</span>
          <p className="detail-price">{money(product.price)} <small>MXN · por pieza</small></p>
          <p>{product.description}</p>
          <p className={`detail-stock ${product.stock ? '' : 'danger-text'}`}>
            <Icon name="box" />{product.stock ? `${product.stock} unidades disponibles` : 'Actualmente agotado'}
          </p>
          <p className="muted small">Recoge y paga en tienda. Las existencias se confirman al registrar tu pedido.</p>
          <button className="button primary full" disabled={quantity >= product.stock} onClick={() => addToCart(product)}>
            <Icon name="plus" />{product.stock === 0 ? 'Agotado' : quantity >= product.stock ? 'Máximo agregado al carrito' : 'Agregar al carrito'}
          </button>
          {quantity > 0 && (
            <button className="button secondary full" onClick={() => { onClose(); navigate('cart'); }}>
              Ver carrito ({quantity} de este producto)<Icon name="arrow" size={18} />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function Catalog({ favoritesOnly = false, search, setSearch, navigate }) {
  const { products, loading, favorites } = useShop();
  const [category, setCategory] = useState('Todos');
  const [sort, setSort] = useState('featured');
  const [inStock, setInStock] = useState(false);
  const [limit, setLimit] = useState(8);
  const [selectedId, setSelectedId] = useState(null);
  const title = useRef(null);
  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  const selectedProduct = products.find(product => product.id === selectedId);
  const hasFilters = Boolean(search.trim() || category !== 'Todos' || inStock || sort !== 'featured');
  const Heading = favoritesOnly ? 'h1' : 'h2';

  useEffect(() => setLimit(8), [search, category, sort, inStock, favoritesOnly]);

  const filtered = useMemo(() => {
    const result = products.filter(p => (
      (!favoritesOnly || favorites.includes(p.id)) &&
      (category === 'Todos' || category === p.category) &&
      (!inStock || p.stock > 0) &&
      normalize(`${p.name} ${p.description} ${p.category}`).includes(normalize(search))
    ));
    if (sort === 'price-up') result.sort((a, b) => a.price - b.price);
    if (sort === 'price-down') result.sort((a, b) => b.price - a.price);
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return result;
  }, [products, favorites, favoritesOnly, category, inStock, search, sort]);

  const clear = () => { setSearch(''); setCategory('Todos'); setInStock(false); setSort('featured'); };
  const explore = event => {
    event.preventDefault();
    title.current?.focus({ preventScroll: true });
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'auto' });
  };

  return (
    <>
      {!favoritesOnly && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow"><span className="small-dot" /> Tu papelería de siempre, más cerca</span>
              <h1>Grandes ideas.<br />Pequeños <em>comienzos.</em></h1>
              <p>Todo para aprender, crear y hacer que tus ideas tomen forma. Encuentra tus favoritos en Papelería Karen.</p>
              <a className="button primary" href="#catalogo" onClick={explore}>Explorar el catálogo <Icon name="arrow" /></a>
              <span className="hero-note"><Icon name="pin" size={16} /> Prepara tu pedido y recoge en tienda</span>
            </div>
            <StationeryIllustration />
            <span className="hero-sticker">Un poquito<br />de inspiración <Icon name="spark" size={17} /></span>
          </section>
          <div className="benefits">
            <div><Icon name="box" /><span><strong>Para cada proyecto</strong><small>Escuela, oficina y creatividad</small></span></div>
            <div><Icon name="heart" /><span><strong>Hecho para ti</strong><small>Guarda lo que más te gusta</small></span></div>
            <div><Icon name="pin" /><span><strong>Cerca de tu día a día</strong><small>Recoge tu pedido en tienda</small></span></div>
          </div>
        </>
      )}
      <section id="catalogo" className="catalog-section" aria-labelledby="catalog-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{favoritesOnly ? 'Tu colección' : 'Encuentra tu próximo favorito'}</span>
            <Heading ref={title} tabIndex={-1} id="catalog-title">{favoritesOnly ? 'Mis favoritos' : 'Un mundo de posibilidades'}</Heading>
          </div>
          <p className="muted result-count" role="status" aria-atomic="true">
            {loading ? 'Cargando productos…' : `${filtered.length} ${filtered.length === 1 ? 'producto encontrado' : 'productos encontrados'}`}
          </p>
        </div>
        <div className="category-tabs" role="group" aria-label="Filtrar por categoría">
          {categories.map(cat => (
            <button key={cat} className={`category-chip ${category === cat ? 'selected' : ''}`} aria-pressed={category === cat} onClick={() => setCategory(cat)}>{cat}</button>
          ))}
        </div>
        <div className="catalog-toolbar">
          <div className="catalog-search">
            <label htmlFor="catalog-search">Buscar en el catálogo</label>
            <div className="search-field">
              <Icon name="search" />
              <input id="catalog-search" type="search" placeholder="Nombre o tipo de producto" value={search} onChange={event => setSearch(event.target.value)} />
              {search && <button className="icon-button" aria-label="Borrar búsqueda" onClick={() => setSearch('')}><Icon name="close" size={16} /></button>}
            </div>
          </div>
          <label className="checkbox"><input type="checkbox" checked={inStock} onChange={event => setInStock(event.target.checked)} /> Solo disponibles</label>
          <label className="sort-field">
            <span>Ordenar productos</span>
            <select value={sort} onChange={event => setSort(event.target.value)}>
              <option value="featured">Destacados</option>
              <option value="price-up">Menor precio</option>
              <option value="price-down">Mayor precio</option>
              <option value="name">Nombre A–Z</option>
            </select>
          </label>
        </div>
        {hasFilters && (
          <div className="active-filters" role="group" aria-label="Filtros activos">
            <span>Estás viendo:</span>
            {search.trim() && <button className="filter-tag" aria-label="Quitar filtro de búsqueda" onClick={() => setSearch('')}>Búsqueda: {search.trim()}<Icon name="close" size={14} /></button>}
            {category !== 'Todos' && <button className="filter-tag" aria-label={`Quitar filtro ${category}`} onClick={() => setCategory('Todos')}>{category}<Icon name="close" size={14} /></button>}
            {inStock && <button className="filter-tag" aria-label="Quitar filtro de disponibilidad" onClick={() => setInStock(false)}>Disponibles<Icon name="close" size={14} /></button>}
            {sort !== 'featured' && <button className="filter-tag" aria-label="Quitar orden seleccionado" onClick={() => setSort('featured')}>{sort === 'name' ? 'Nombre A–Z' : sort === 'price-up' ? 'Precio ascendente' : 'Precio descendente'}<Icon name="close" size={14} /></button>}
            <button className="text-button" onClick={clear}>Limpiar filtros</button>
          </div>
        )}
        {loading ? (
          <div className="product-grid" aria-label="Cargando productos" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => <div className="skeleton-card" key={i} />)}
          </div>
        ) : filtered.length ? (
          <div className="product-grid">
            {filtered.slice(0, limit).map(product => <ProductCard key={product.id} product={product} onDetails={setSelectedId} />)}
          </div>
        ) : (
          <div className="empty-state">
            <Icon name={favoritesOnly ? 'heart' : 'search'} size={42} />
            <h3>{favoritesOnly && !favorites.length ? 'Aquí empiezan tus favoritos' : 'No encontramos productos'}</h3>
            <p>{favoritesOnly && !favorites.length ? 'Toca el corazón de cualquier producto para guardarlo aquí.' : 'Prueba otra búsqueda o cambia los filtros.'}</p>
            <button className="button secondary" onClick={hasFilters ? clear : () => navigate('catalog')}>
              {hasFilters ? 'Mostrar todos los productos' : 'Explorar productos'}
            </button>
          </div>
        )}
        {!loading && limit < filtered.length && (
          <div className="load-more">
            <p className="muted">Mostrando {Math.min(limit, filtered.length)} de {filtered.length} productos</p>
            <button className="button secondary" onClick={() => setLimit(limit + 8)}>Ver más productos <Icon name="arrow" size={18} /></button>
          </div>
        )}
      </section>
      {selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedId(null)} navigate={navigate} />}
    </>
  );
}
