import React, { useState } from 'react';
import { useShop, money, normalize } from '../../store/ShopContext';
import { api } from '../../services/api';
import { useRemote, RemoteState } from './Orders';
import Modal from './Modal';
import Icon from './Icon';

function ProductEditor({ product, onClose }) {
  const { refresh, notify } = useShop();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const save = async event => {
    event.preventDefault(); setError(''); setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.price = Number(values.price); values.stock = Number(values.stock);
    try {
      await api(product ? `/products/${product.id}` : '/products', { method: product ? 'PUT' : 'POST', body: values });
      await refresh(); notify('Producto guardado.'); onClose();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <Modal title={product ? 'Editar producto' : 'Nuevo producto'} onClose={() => { if (!busy) onClose(); }}><form className="stack-form" onSubmit={save}><label>Nombre<input name="name" required maxLength={100} defaultValue={product?.name} /></label><div className="form-columns"><label>Precio (MXN)<input name="price" type="number" min="0.01" max="1000000" step="0.01" required defaultValue={product?.price} /></label><label>Existencias<input name="stock" type="number" min="0" max="1000000" step="1" required defaultValue={product?.stock ?? 0} /></label></div><label>Categoría<input name="category" required maxLength={40} list="product-categories" defaultValue={product?.category || 'Escritura'} /><datalist id="product-categories">{['Escritura', 'Cuadernos', 'Arte', 'Papel', 'Adhesivos', 'Oficina', 'Temporada'].map(cat => <option key={cat} value={cat} />)}</datalist></label><label>Descripción<textarea name="description" required rows="3" maxLength={500} defaultValue={product?.description} /></label><label>Imagen: URL HTTPS o ruta local <span className="muted">(opcional)</span><input name="image" type="text" placeholder="/products/colores.webp o https://…" maxLength={2000} defaultValue={product?.image} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button primary full" disabled={busy}>{busy ? 'Guardando…' : 'Guardar producto'}</button></form></Modal>;
}

export function Inventory() {
  const { products, refresh, notify } = useShop();
  const [query, setQuery] = useState(''), [editor, setEditor] = useState(null), [remove, setRemove] = useState(null), [busy, setBusy] = useState(false), [deleteError, setDeleteError] = useState('');
  const filtered = products.filter(p => normalize(`${p.name} ${p.category}`).includes(normalize(query)));
  const deleteProduct = async () => {
    setBusy(true); setDeleteError('');
    try { await api(`/products/${remove.id}`, { method: 'DELETE' }); await refresh(); setRemove(null); notify('Producto retirado del catálogo.'); }
    catch (error) { setDeleteError(error.message); }
    finally { setBusy(false); }
  };
  return <section><div className="section-heading"><div><span className="eyebrow">Administración</span><h1>Inventario</h1></div><button className="button primary" onClick={() => setEditor({ product: null })}><Icon name="plus" /> Nuevo producto</button></div><div className="metrics"><div className="metric panel"><span>Productos en catálogo</span><strong>{products.length}</strong></div><div className="metric panel"><span>Unidades disponibles</span><strong>{products.reduce((sum, p) => sum + p.stock, 0)}</strong></div><div className="metric panel"><span>Valor del inventario</span><strong>{money(products.reduce((sum, p) => sum + p.price * p.stock, 0))}</strong></div></div><div className="panel inventory-panel"><div className="search-field"><Icon name="search" /><input type="search" aria-label="Buscar en el inventario" placeholder="Buscar por nombre o categoría" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="table-scroll"><table><caption className="sr-only">Productos y existencias</caption><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Existencias</th><th>Acciones</th></tr></thead><tbody>{filtered.map(product => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.category}</td><td>{money(product.price)}</td><td><span className={`status-pill ${product.stock <= 5 ? 'warning' : ''}`}>{product.stock} unidades</span></td><td><div className="table-actions"><button className="text-button" onClick={() => setEditor({ product })} aria-label={`Editar ${product.name}`}>Editar</button><button className="icon-button danger-text" onClick={() => { setRemove(product); setDeleteError(''); }} aria-label={`Retirar ${product.name}`}><Icon name="trash" size={18} /></button></div></td></tr>)}{!filtered.length && <tr><td colSpan="5">No se encontraron productos.</td></tr>}</tbody></table></div></div>{editor && <ProductEditor product={editor.product} onClose={() => setEditor(null)} />}{remove && <Modal title="Retirar producto" onClose={() => { if (!busy) setRemove(null); }}><p>¿Retirar <strong>{remove.name}</strong> del catálogo? Los pedidos anteriores conservarán su información.</p>{deleteError && <p role="alert" className="form-error">{deleteError}</p>}<div className="modal-actions"><button className="button secondary" disabled={busy} onClick={() => setRemove(null)}>Cancelar</button><button className="button danger" disabled={busy} onClick={deleteProduct}>{busy ? 'Retirando…' : 'Retirar producto'}</button></div></Modal>}</section>;
}

export function Dashboard({ navigate }) {
  const { products } = useShop();
  const { data: orders, error, loading, load } = useRemote('/orders');
  const lowStock = products.filter(p => p.stock <= 5);
  return <section><div className="section-heading"><div><span className="eyebrow">Una vista de tu negocio</span><h1>Panel de administración</h1></div><button className="button secondary" onClick={load} disabled={loading}>Actualizar pedidos</button></div><RemoteState error={error} loading={loading} retry={load} />{!error && !loading && <div className="metrics"><div className="metric panel"><span>Importe de pedidos registrados</span><strong>{money(orders.reduce((sum, order) => sum + order.total, 0))}</strong><small>Pago pendiente en tienda</small></div><div className="metric panel"><span>Pedidos registrados</span><strong>{orders.length}</strong><small>Historial completo</small></div><div className="metric panel"><span>Productos con pocas existencias</span><strong>{lowStock.length}</strong><small>5 unidades o menos</small></div></div>}<div className="admin-grid"><div className="panel"><h2>Atención al inventario</h2>{lowStock.length ? lowStock.map(p => <div className="summary-row" key={p.id}><span>{p.name}</span><span className="status-pill warning">{p.stock} disponibles</span></div>) : <p className="muted">Todos los productos tienen existencias suficientes.</p>}<button className="button secondary" onClick={() => navigate('inventory')}>Gestionar inventario <Icon name="arrow" size={18} /></button></div><div className="panel"><h2>Operación de la tienda</h2><p className="muted">Los pedidos se registran para recoger y pagar en tienda. El importe registrado representa pedidos, no cobros realizados.</p><button className="button primary" onClick={() => navigate('orders')}>Consultar pedidos <Icon name="arrow" size={18} /></button></div></div></section>;
}

export function Users() {
  const { data: users, error, loading, load } = useRemote('/users');
  return <section><div className="section-heading"><div><span className="eyebrow">Administración</span><h1>Usuarios</h1></div></div><RemoteState error={error} loading={loading} retry={load} />{!error && !loading && <div className="panel table-scroll"><table><caption className="sr-only">Cuentas registradas</caption><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><strong>{user.username}</strong></td><td>{user.email}</td><td><span className="status-pill">{user.tipo === 'admin' ? 'Administrador' : 'Cliente'}</span></td></tr>)}</tbody></table><p className="muted small">Las cuentas de administración se crean desde la herramienta del servidor.</p></div>}</section>;
}
