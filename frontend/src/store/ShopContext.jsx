import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../services/api';
import sampleProducts from '../../../shared/data/products.json';
import { removePurchasedQuantities } from '../utils/checkoutAttempt';

const ShopContext = createContext(null);
export const money = value => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
export const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function readList(key, kind) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (!Array.isArray(value)) return [];
    return kind === 'cart'
      ? value.filter(item => item && typeof item.id === 'string' && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 999).filter((item, index, list) => list.findIndex(p => p.id === item.id) === index)
      : [...new Set(value.filter(item => typeof item === 'string'))];
  } catch { return []; }
}

function useStoredList(key, kind) {
  const [record, setRecord] = useState(() => ({ key, value: readList(key, kind) }));
  const value = record.key === key ? record.value : readList(key, kind);
  useEffect(() => {
    if (record.key === key) {
      try { localStorage.setItem(key, JSON.stringify(record.value)); } catch { /* Shopping still works without browser persistence. */ }
    }
  }, [key, record]);
  useEffect(() => {
    const sync = event => { if (event.key === key) setRecord({ key, value: readList(key, kind) }); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key, kind]);
  const update = (next, targetKey = key) => setRecord(previous => ({ key: targetKey, value: typeof next === 'function' ? next(previous.key === targetKey ? previous.value : readList(targetKey, kind)) : next }));
  return [value, update];
}

export function ShopProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [authView, setAuthView] = useState(null);
  const [notice, setNotice] = useState(null);
  const [noticePaused, setNoticePaused] = useState(false);
  const [cart, setCart] = useStoredList(`pk:v1:cart:${user?.id || 'guest'}`, 'cart');
  const [favorites, setFavorites] = useStoredList(`pk:v1:favorites:${user?.id || 'guest'}`, 'favorites');
  const activeCart = useRef(null);
  activeCart.current = { userId: user?.id, cart };
  const removePurchasedItems = (ownerId, items) => {
    const key = `pk:v1:cart:${ownerId}`;
    const current = activeCart.current.userId === ownerId ? activeCart.current.cart : readList(key, 'cart');
    const remaining = removePurchasedQuantities(current, items);
    // Persist before clearing the retry key so a reload cannot restore purchased items.
    try { localStorage.setItem(key, JSON.stringify(remaining)); }
    catch { throw new Error('El pedido se registró, pero no pudimos actualizar el carrito guardado. Reintenta el mismo pedido.'); }
    if (activeCart.current.userId === ownerId) setCart(remaining, key);
  };
  const notify = useCallback((message, type = 'success', action = null) => {
    setNoticePaused(false);
    setNotice({ message, type, action, id: Date.now() });
  }, []);
  const refresh = useCallback(async () => {
    const result = await api('/products');
    if (!Array.isArray(result)) throw new Error('No pudimos cargar el catálogo.');
    setProducts(result);
    setOffline(false);
    return result;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([api('/products', { signal: controller.signal }), api('/auth/me', { signal: controller.signal })])
      .then(([catalog, session]) => {
        if (!Array.isArray(catalog)) throw new Error('Catálogo inválido');
        setProducts(catalog); setUser(session.user); setOffline(false);
      })
      .catch(error => {
        if (error.name !== 'AbortError') { setProducts(sampleProducts); setOffline(true); }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!notice || noticePaused) return;
    const timer = setTimeout(() => setNotice(null), 6500);
    return () => clearTimeout(timer);
  }, [notice, noticePaused]);

  const login = async (path, body) => {
    const result = await api(`/auth/${path}`, { method: 'POST', body });
    if (user?.id === result.user.id) { setUser(result.user); setAuthView(null); notify(`¡Hola, ${result.user.username}!`); return; }
    // Keep the visitor's selection when creating or opening an account.
    const previousCart = readList(`pk:v1:cart:${result.user.id}`, 'cart');
    const combined = [...previousCart];
    for (const item of user ? [] : cart) {
      const existing = combined.find(p => p.id === item.id);
      const max = products.find(p => p.id === item.id)?.stock || 999;
      if (existing) existing.quantity = Math.min(max, existing.quantity + item.quantity);
      else combined.push(item);
    }
    const combinedFavorites = [...new Set([...readList(`pk:v1:favorites:${result.user.id}`, 'favorites'), ...(user ? [] : favorites)])];
    setCart(combined.filter(i => i.quantity > 0), `pk:v1:cart:${result.user.id}`);
    setFavorites(combinedFavorites, `pk:v1:favorites:${result.user.id}`);
    try { localStorage.removeItem('pk:v1:cart:guest'); localStorage.removeItem('pk:v1:favorites:guest'); } catch { /* Browser persistence is optional. */ }
    setUser(result.user); setAuthView(null);
    notify(`¡Hola, ${result.user.username}!`);
  };
  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); setUser(null); notify('Sesión cerrada.'); }
    catch (error) { notify(error.message, 'error'); }
  };
  const addToCart = product => {
    const quantity = cart.find(p => p.id === product.id)?.quantity || 0;
    if (quantity >= product.stock) { notify('Ya agregaste todas las unidades disponibles.', 'error'); return; }
    setCart(previous => previous.some(p => p.id === product.id) ? previous.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p) : [...previous, { id: product.id, quantity: 1 }]);
    notify(`${product.name} se agregó al carrito.`, 'success', { label: 'Ver carrito', section: 'cart' });
  };
  const toggleFavorite = id => setFavorites(previous => previous.includes(id) ? previous.filter(p => p !== id) : [...previous, id]);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return <ShopContext.Provider value={{ products, user, loading, offline, cart, setCart, removePurchasedItems, favorites, toggleFavorite, cartCount, addToCart, refresh, login, logout, authView, setAuthView, notice, setNotice, setNoticePaused, notify }}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
