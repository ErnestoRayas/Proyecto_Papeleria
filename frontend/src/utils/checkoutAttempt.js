const keyFor = userId => `pk:v1:checkout:${userId}`;

export function loadCheckoutAttempt(userId) {
  if (!userId) return null;
  try {
    const attempt = JSON.parse(sessionStorage.getItem(keyFor(userId)));
    const payload = attempt?.payload;
    if (attempt?.schemaVersion !== 1 || attempt.userId !== userId || !/^[a-zA-Z0-9-]{16,80}$/.test(attempt.requestKey)) return null;
    if (!payload || !['customerName', 'customerEmail', 'phone'].every(field => typeof payload[field] === 'string')) return null;
    if (!Array.isArray(payload.items) || !payload.items.length || payload.items.length > 100) return null;
    const ids = new Set();
    for (const item of payload.items) {
      if (!item || typeof item.id !== 'string' || ids.has(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999 || !Number.isFinite(item.price) || item.price <= 0) return null;
      ids.add(item.id);
    }
    return attempt;
  } catch { return null; }
}

export function saveCheckoutAttempt(userId, payload, products) {
  const attempt = {
    schemaVersion: 1, userId, requestKey: crypto.randomUUID(), payload,
    labels: Object.fromEntries(payload.items.map(item => [item.id, products.find(p => p.id === item.id)?.name || item.id]))
  };
  try { sessionStorage.setItem(keyFor(userId), JSON.stringify(attempt)); }
  catch { throw new Error('No pudimos guardar el intento de compra en esta pestaña. Comprueba el almacenamiento del navegador antes de confirmar.'); }
  return attempt;
}

export function clearCheckoutAttempt(userId, requestKey) {
  // A late response must never clear a newer attempt for the same account.
  if (loadCheckoutAttempt(userId)?.requestKey !== requestKey) return false;
  try { sessionStorage.removeItem(keyFor(userId)); }
  catch { throw new Error('No pudimos actualizar el intento guardado. Reintenta el mismo pedido para comprobar su resultado.'); }
  return true;
}

export function removePurchasedQuantities(cart, items) {
  const purchased = new Map(items.map(item => [item.id, item.quantity]));
  return cart.map(item => ({ ...item, quantity: Math.max(0, item.quantity - (purchased.get(item.id) || 0)) })).filter(item => item.quantity > 0);
}
