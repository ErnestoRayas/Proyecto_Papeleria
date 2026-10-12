import React, { useEffect, useState, useCallback } from 'react';
import { useShop, money } from '../../store/ShopContext';
import { api } from '../../services/api';
import Icon from './Icon';

export function useRemote(path) {
  const [data, setData] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setError(''); setLoading(true);
    try { setData(await api(path)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, load };
}

export function RemoteState({ error, loading, retry }) {
  if (loading) return <div className="panel loading-state" role="status">Cargando información…</div>;
  if (error) return <div className="empty-state panel"><p role="alert">{error}</p><button className="button secondary" onClick={retry}>Reintentar</button></div>;
  return null;
}

export default function Orders() {
  const { user, setAuthView } = useShop();
  if (!user) return <section className="empty-state large"><Icon name="user" size={48} /><h1>Tus pedidos, en un solo lugar</h1><p>Inicia sesión para consultar tus pedidos.</p><button className="button primary" onClick={() => setAuthView('login')}>Iniciar sesión</button></section>;
  return <OrderList admin={user.tipo === 'admin'} />;
}

function OrderList({ admin }) {
  const { data: orders, error, loading, load } = useRemote('/orders');
  return <section><div className="section-heading"><div><span className="eyebrow">{admin ? 'Administración' : 'Tu historial'}</span><h1>{admin ? 'Pedidos y ventas' : 'Mis pedidos'}</h1></div><button className="button secondary" onClick={load} disabled={loading}>Actualizar</button></div><RemoteState error={error} loading={loading} retry={load} />{!error && !loading && (!orders.length ? <div className="empty-state panel"><Icon name="bag" size={40} /><h2>Aún no hay pedidos</h2><p>Los pedidos confirmados aparecerán aquí.</p></div> : <div className="order-list">{orders.map(order => <article className="panel order-card" key={order.id}><div className="order-heading"><div><h2>Pedido #{order.id.slice(0, 8).toUpperCase()}</h2><p className="muted">{new Date(order.createdAt).toLocaleString('es-MX')}</p></div><span className="status-pill">Registrado · pago en tienda</span></div>{admin && <p><strong>{order.customerName}</strong> · {order.customerEmail}</p>}<div className="order-items">{order.items.map(item => <div key={item.id}><span>{item.name} <small>× {item.quantity}</small></span><span>{money(item.price * item.quantity)}</span></div>)}</div><div className="summary-row summary-total"><span>Total del pedido</span><strong>{money(order.total)}</strong></div></article>)}</div>)}</section>;
}
