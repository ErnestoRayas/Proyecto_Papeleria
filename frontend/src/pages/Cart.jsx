import React, { useRef, useState } from 'react';
import { useShop, money } from '../store/ShopContext';
import { api } from '../services/api';
import { loadCheckoutAttempt, saveCheckoutAttempt, clearCheckoutAttempt } from '../utils/checkoutAttempt';
import ProductImage from '../components/products/ProductImage';
import Icon from '../components/ui/Icon';

export default function Cart({ navigate }) {
  const { user } = useShop();
  // A session change restores only that account's pending operation.
  return <Checkout key={user?.id || 'guest'} navigate={navigate} />;
}

function Checkout({ navigate }) {
  const { cart, setCart, removePurchasedItems, products, user, setAuthView, refresh, offline, notify } = useShop();
  const [pending, setPending] = useState(() => loadCheckoutAttempt(user?.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [draft, setDraft] = useState(() => ({
    customerName: pending?.payload.customerName || user?.username || '',
    customerEmail: pending?.payload.customerEmail || user?.email || '',
    phone: pending?.payload.phone || ''
  }));
  const processing = useRef(false);
  const lines = cart.map(item => ({ ...item, product: products.find(p => p.id === item.id) }));
  const total = lines.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const invalid = lines.some(item => !item.product || item.quantity > item.product.stock);

  const changeQuantity = (id, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 1 || busy || pending) return;
    setCart(previous => previous.map(item => item.id === id ? { ...item, quantity } : item));
    setError('');
  };

  const sendAttempt = async attempt => {
    if (processing.current) return;
    processing.current = true;
    setBusy(true); setError('');
    try {
      const order = await api('/orders', { method: 'POST', body: { ...attempt.payload, requestKey: attempt.requestKey } });
      if (typeof order.id !== 'string' || !Array.isArray(order.items) || !Number.isFinite(order.total)) {
        throw new Error('La respuesta del pedido está incompleta. Reintenta el mismo pedido para comprobarlo.');
      }
      if (loadCheckoutAttempt(attempt.userId)?.requestKey === attempt.requestKey) {
        removePurchasedItems(attempt.userId, attempt.payload.items);
        clearCheckoutAttempt(attempt.userId, attempt.requestKey);
      }
      setPending(null); setReceipt(order);
      notify('Tu pedido está registrado. El pago se realiza en tienda.');
      refresh().catch(() => notify('Pedido registrado. No pudimos actualizar el catálogo; vuelve a intentarlo.', 'error'));
    } catch (err) {
      // A network error, 5xx, expired session or rate limit leaves the outcome
      // unresolved. Reuse the saved payload/key until a definitive response.
      if (err.status === 400 || err.status === 409) {
        try {
          clearCheckoutAttempt(attempt.userId, attempt.requestKey);
          setPending(null);
        } catch (storageError) { setError(storageError.message); return; }
        if (err.status === 409) await refresh().catch(() => {});
      }
      setError(err.message);
      if (err.status === 401) setAuthView('login');
    } finally {
      processing.current = false;
      setBusy(false);
    }
  };

  const submit = async event => {
    event.preventDefault();
    if (processing.current) return;
    if (!user) { setAuthView('login'); return; }
    if (pending) { await sendAttempt(pending); return; }
    const payload = {
      ...draft,
      items: lines.map(item => ({ id: item.id, quantity: item.quantity, price: item.product?.price }))
    };
    let attempt;
    try { attempt = saveCheckoutAttempt(user.id, payload, products); }
    catch (err) { setError(err.message); return; }
    setPending(attempt);
    await sendAttempt(attempt);
  };

  if (receipt) {
    return (
      <section className="receipt panel">
        <span className="success-circle"><Icon name="check" size={32} /></span>
        <span className="eyebrow">Gracias por elegirnos</span>
        <h1>¡Tu pedido está listo para preparar!</h1>
        <p>Referencia <strong>#{receipt.id.slice(0, 8).toUpperCase()}</strong></p>
        <p>Recoge y paga en Papelería Karen. No se ha realizado ningún cargo en línea.</p>
        <div className="receipt-lines">
          {receipt.items.map(item => <div key={item.id}><span>{item.name} × {item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></div>)}
          <div className="receipt-total"><strong>Total</strong><strong>{money(receipt.total)}</strong></div>
        </div>
        <button className="button primary" onClick={() => navigate('orders')}>Ver mis pedidos <Icon name="arrow" /></button>
      </section>
    );
  }

  if (pending) {
    const pendingTotal = pending.payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return (
      <section className="receipt panel" aria-busy={busy}>
        <span className="eyebrow">Recuperación de tu pedido</span>
        <h1>Hay un pedido pendiente de confirmar</h1>
        <p>Conservamos los datos del intento anterior. Reintenta el mismo pedido para obtener su resultado sin registrarlo dos veces.</p>
        <p><strong>{pending.payload.customerName}</strong><br />{pending.payload.customerEmail}{pending.payload.phone && <><br />{pending.payload.phone}</>}</p>
        <div className="receipt-lines">
          {pending.payload.items.map(item => <div key={item.id}><span>{pending.labels?.[item.id] || item.id} × {item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></div>)}
          <div className="receipt-total"><strong>Importe del intento</strong><strong>{money(pendingTotal)}</strong></div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {offline && <p className="form-error">Conecta con la tienda para recuperar el resultado del pedido.</p>}
        <button className="button primary full" disabled={busy || offline} onClick={() => sendAttempt(pending)}>
          {busy ? 'Comprobando pedido…' : 'Reintentar el mismo pedido'}<Icon name="arrow" size={18} />
        </button>
      </section>
    );
  }

  if (!cart.length) {
    return (
      <section className="empty-state large">
        <Icon name="bag" size={52} /><h1>Una bolsa llena de posibilidades</h1>
        <p>Tu carrito está vacío. Encuentra algo para tu próxima idea.</p>
        <button className="button primary" onClick={() => navigate('catalog')}>Explorar productos <Icon name="arrow" /></button>
      </section>
    );
  }

  return (
    <section>
      <div className="section-heading">
        <div><span className="eyebrow">Un paso más cerca de tu próxima idea</span><h1>Tu carrito</h1></div>
        <button className="text-button" disabled={busy} onClick={() => navigate('catalog')}>Seguir explorando</button>
      </div>
      <div className="checkout-layout">
        <div className="cart-lines panel">
          {lines.map(item => (
            <article className="cart-line" key={item.id}>
              {item.product ? <ProductImage product={item.product} /> : <Icon name="box" size={45} />}
              <div className="cart-line-info">
                <h3>{item.product?.name || 'Producto no disponible'}</h3>
                <p className="muted">{item.product ? `${money(item.product.price)} por pieza · ${item.product.stock} disponibles` : 'Retira este producto para continuar.'}</p>
                <div className="quantity-control">
                  <button aria-label={`Disminuir cantidad de ${item.product?.name || item.id}`} disabled={busy || item.quantity <= 1} onClick={() => changeQuantity(item.id, item.quantity - 1)}>−</button>
                  <input type="number" aria-label={`Cantidad de ${item.product?.name || item.id}`} min="1" max={Math.max(1, item.product?.stock || 1)} value={item.quantity} disabled={busy} onChange={event => changeQuantity(item.id, Number(event.target.value))} />
                  <button aria-label={`Aumentar cantidad de ${item.product?.name || item.id}`} disabled={busy || !item.product || item.quantity >= item.product.stock} onClick={() => changeQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                {item.product && item.quantity > item.product.stock && <p className="form-error">Ajusta la cantidad: solo quedan {item.product.stock}.</p>}
              </div>
              <div className="cart-line-end">
                <strong>{money((item.product?.price || 0) * item.quantity)}</strong>
                <button className="icon-button danger-text" aria-label={`Eliminar ${item.product?.name || item.id} del carrito`} disabled={busy} onClick={() => setCart(previous => previous.filter(p => p.id !== item.id))}><Icon name="trash" /></button>
              </div>
            </article>
          ))}
          <p className="cart-note"><Icon name="box" size={18} /> Las existencias se confirman al registrar el pedido.</p>
        </div>
        <aside className="checkout-summary panel">
          <h2>Resumen de tu pedido</h2>
          <div className="summary-row"><span>Productos ({cart.reduce((sum, i) => sum + i.quantity, 0)})</span><strong>{money(total)}</strong></div>
          <div className="summary-row"><span>Entrega</span><span>Recoger en tienda</span></div>
          <div className="summary-row summary-total"><strong>Total estimado</strong><strong>{money(total)}</strong></div>
          <p className="muted small">Precios en MXN. Pago en tienda, sin cargo en línea.</p>
          <form className="stack-form" onSubmit={submit}>
            <label>Nombre de quien recoge<input name="customerName" autoComplete="name" required maxLength={100} value={draft.customerName} onChange={event => setDraft({ ...draft, customerName: event.target.value })} disabled={busy} /></label>
            <label>Correo electrónico<input name="customerEmail" type="email" autoComplete="email" required maxLength={254} value={draft.customerEmail} onChange={event => setDraft({ ...draft, customerEmail: event.target.value })} disabled={busy} /></label>
            <label>Teléfono <span className="muted">(opcional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={30} value={draft.phone} onChange={event => setDraft({ ...draft, phone: event.target.value })} disabled={busy} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {offline && <p className="form-error">Conecta con la tienda para confirmar precios y existencias.</p>}
            <button className="button primary full" disabled={busy || invalid || offline}>
              {busy ? 'Registrando pedido…' : user ? 'Confirmar pedido' : 'Iniciar sesión para confirmar'}<Icon name="arrow" size={18} />
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}
