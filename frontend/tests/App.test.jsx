import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../src/App';
import products from '../../shared/data/products.json';
import { readList } from '../src/store/ShopContext';

function mockApi(user = null) {
  const fetch = vi.fn(async (url, options) => {
    const data = url.endsWith('/products') ? products : url.endsWith('/auth/me') ? { user } : url.endsWith('/auth/login') ? { user: { id: 'test-user', username: 'Ernesto', email: 'test@example.com', tipo: 'comprador' } } : { ok: true };
    return { ok: true, status: 200, json: async () => data };
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

test('el visitante explora, filtra sin acentos y carga el resto del catálogo', async () => {
  mockApi();
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Cuadernos' })).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(8);
  fireEvent.click(screen.getByRole('button', { name: /Ver más productos/ }));
  expect(screen.getAllByRole('article')).toHaveLength(16);
  fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar en el catálogo' }), { target: { value: 'lapiz' } });
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Lápiz adhesivo' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Borrar búsqueda' }));
  fireEvent.click(screen.getByRole('button', { name: 'Escritura' }));
  expect(screen.getAllByRole('article')).toHaveLength(2);
});

test('agregar al carrito conserva las existencias y admite cantidades y eliminación', async () => {
  const fetch = mockApi();
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Agregar Colores al carrito' }));
  fireEvent.click(screen.getByRole('button', { name: 'Agregar Colores al carrito' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ver carrito, 2 artículos' }));
  expect(await screen.findByRole('spinbutton', { name: 'Cantidad de Colores' })).toHaveValue(2);
  expect(screen.getByText(/20 disponibles/)).toBeInTheDocument();
  expect(fetch.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Disminuir cantidad de Colores' }));
  expect(screen.getByRole('spinbutton', { name: 'Cantidad de Colores' })).toHaveValue(1);
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar Colores del carrito' }));
  expect(await screen.findByRole('heading', { name: 'Una bolsa llena de posibilidades' })).toBeInTheDocument();
});

test('los favoritos son persistentes y el formulario de acceso mantiene el carrito del visitante', async () => {
  mockApi();
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Guardar Cuadernos en favoritos' }));
  fireEvent.click(screen.getByRole('button', { name: 'Agregar Cuadernos al carrito' }));
  fireEvent.click(screen.getByRole('button', { name: 'Mi cuenta' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Usuario'), { target: { value: 'Ernesto' } });
  fireEvent.change(within(dialog).getByLabelText('Contraseña'), { target: { value: 'un-password-largo' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Iniciar sesión' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Ver carrito, 1 artículos' })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('pk:v1:cart:test-user'))).toEqual([{ id: 'cuadernos', quantity: 1 }]);
  expect(localStorage.getItem('pk:v1:cart:guest')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Mis favoritos' }));
  expect(await screen.findByRole('heading', { name: 'Mis favoritos' })).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(1);
});

test('un error de acceso se muestra en el formulario y no crea una sesión local', async () => {
  const fetch = mockApi();
  fetch.mockImplementation(async url => ({ ok: !url.endsWith('/auth/login'), status: url.endsWith('/auth/login') ? 401 : 200, json: async () => url.endsWith('/products') ? products : url.endsWith('/auth/me') ? { user: null } : { message: 'Usuario o contraseña incorrectos.' } }));
  render(<App />);
  await screen.findByRole('heading', { name: 'Cuadernos' });
  fireEvent.click(screen.getByRole('button', { name: 'Mi cuenta' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Usuario'), { target: { value: 'Ernesto' } });
  fireEvent.change(within(dialog).getByLabelText('Contraseña'), { target: { value: 'incorrecta' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Iniciar sesión' }));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos.');
  expect(within(dialog).getByRole('alert')).toHaveFocus();
  expect(localStorage.getItem('usuarioActual')).toBeNull();
});

test('si la API falla, muestra un catálogo de muestra y bloquea pedidos', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')));
  render(<App />);
  expect(await screen.findByText(/Vista de muestra/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Agregar Colores al carrito' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ver carrito, 1 artículos' }));
  expect(await screen.findByRole('button', { name: 'Iniciar sesión para confirmar' })).toBeDisabled();
});

test('el checkout registra el pedido una sola vez y muestra un comprobante sin cargo en línea', async () => {
  const fetch = mockApi({ id: 'customer', username: 'Cliente', email: 'cliente@example.com', tipo: 'comprador' });
  const original = fetch.getMockImplementation();
  fetch.mockImplementation(async (url, options) => {
    if (url.endsWith('/orders') && options.method === 'POST') return { ok: true, status: 201, json: async () => ({ id: 'order-123456789', total: 95, items: [{ id: 'colores', name: 'Colores', quantity: 1, price: 95 }] }) };
    return original(url, options);
  });
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Agregar Colores al carrito' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ver carrito, 1 artículos' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar pedido' }));
  expect(await screen.findByRole('heading', { name: '¡Tu pedido está listo para preparar!' })).toBeInTheDocument();
  expect(screen.getByText(/No se ha realizado ningún cargo en línea/)).toBeInTheDocument();
  expect(fetch.mock.calls.filter(([url, options]) => url.endsWith('/orders') && options.method === 'POST')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Ver carrito, 0 artículos' })).toBeInTheDocument();
});

test('un cliente no accede al inventario con una URL manipulada', async () => {
  mockApi({ id: 'customer', username: 'Cliente', tipo: 'comprador' });
  window.location.hash = 'inventory';
  render(<App />);
  await screen.findByRole('heading', { name: 'Cuadernos' });
  expect(screen.queryByRole('heading', { name: 'Inventario' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
});

test('el carrito tolera JSON corrupto y elimina cantidades inválidas del almacenamiento', () => {
  localStorage.setItem('cart', '{malformed');
  expect(readList('cart', 'cart')).toEqual([]);
  localStorage.setItem('cart', JSON.stringify([{ id: 'a', quantity: -2 }, { id: 'b', quantity: 2 }, { id: 'b', quantity: 2 }, { id: 'c', quantity: 1.5 }, null]));
  expect(readList('cart', 'cart')).toEqual([{ id: 'b', quantity: 2 }]);
});

test('la ficha del producto permite revisar existencias y añadir al carrito sin perder el contexto', async () => {
  mockApi();
  render(<App />);
  const details = await screen.findByRole('button', { name: 'Ver detalles de Colores' });
  details.focus();
  fireEvent.click(details);
  const dialog = screen.getByRole('dialog', { name: 'Colores' });
  expect(within(dialog).getByText('20 unidades disponibles')).toBeInTheDocument();
  expect(within(dialog).getByText(products[0].description)).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Agregar al carrito' }));
  expect(within(dialog).getByRole('button', { name: 'Ver carrito (1 de este producto)' })).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar ventana' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(details).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Ver carrito, 1 artículos' })).toBeInTheDocument();
});

test('los filtros activos se pueden quitar individualmente o limpiar en conjunto', async () => {
  mockApi();
  render(<App />);
  await screen.findByRole('heading', { name: 'Colores' });
  fireEvent.click(screen.getByRole('button', { name: 'Arte' }));
  fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar en el catálogo' }), { target: { value: 'no existe' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Ordenar productos' }), { target: { value: 'price-up' } });
  expect(screen.getByRole('heading', { name: 'No encontramos productos' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Quitar filtro de búsqueda' }));
  expect(screen.getAllByRole('article')).toHaveLength(3);
  expect(screen.getByRole('button', { name: 'Arte', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('combobox', { name: 'Ordenar productos' })).toHaveValue('price-up');
  fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
  expect(screen.queryByRole('group', { name: 'Filtros activos' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(8);
});

test('buscar desde otra sección conserva el foco y el usuario puede seguir escribiendo', async () => {
  mockApi();
  render(<App />);
  await screen.findByRole('heading', { name: 'Colores' });
  fireEvent.click(screen.getByRole('link', { name: 'Tarjetas', exact: true }));
  await screen.findByRole('heading', { name: 'Tarjetas con tu toque' });
  const search = screen.getByRole('searchbox', { name: 'Buscar productos' });
  search.focus();
  fireEvent.change(search, { target: { value: 'c' } });
  await screen.findByRole('heading', { name: 'Un mundo de posibilidades' });
  expect(search).toHaveFocus();
  fireEvent.change(search, { target: { value: 'cuadernos' } });
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Cuadernos' })).toBeInTheDocument();
});

test('la compra rápida respeta el límite de stock y ofrece un acceso directo al carrito', async () => {
  const fetch = mockApi();
  const original = fetch.getMockImplementation();
  fetch.mockImplementation((url, options) => url.endsWith('/products')
    ? Promise.resolve({ ok: true, status: 200, json: async () => [{ ...products[0], stock: 1 }] })
    : original(url, options));
  render(<App />);
  const add = await screen.findByRole('button', { name: 'Agregar Colores al carrito' });
  fireEvent.click(add);
  expect(add).toBeDisabled();
  expect(screen.getByText('En tu carrito: 1')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ver carrito', exact: true }));
  expect(await screen.findByRole('spinbutton', { name: 'Cantidad de Colores' })).toHaveValue(1);
});

test.each([
  ['otro producto', [{ id: 'cuadernos', quantity: 1 }]],
  ['un carrito vacío', []]
])('el checkout recupera el intento original aunque después haya %s', async (label, changedCart) => {
  const user = { id: 'customer', username: 'Cliente', email: 'cliente@example.com', tipo: 'comprador' };
  const fetch = mockApi(user);
  const original = fetch.getMockImplementation();
  const submissions = [];
  fetch.mockImplementation(async (url, options) => {
    if (url.endsWith('/orders') && options.method === 'POST') {
      submissions.push(JSON.parse(options.body));
      if (submissions.length === 1) throw new Error('Respuesta perdida');
      return { ok: true, status: 200, json: async () => ({ id: 'recovered-order', total: 95, items: [{ id: 'colores', name: 'Colores', quantity: 1, price: 95 }] }) };
    }
    if (url.endsWith('/products') && submissions.length) return { ok: true, status: 200, json: async () => products.map(p => p.id === 'colores' ? { ...p, stock: 0 } : p) };
    return original(url, options);
  });
  const firstPage = render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Agregar Colores al carrito' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ver carrito, 1 artículos' }));
  fireEvent.change(await screen.findByLabelText('Nombre de quien recoge'), { target: { value: 'Persona que recoge' } });
  fireEvent.change(screen.getByRole('textbox', { name: /Teléfono/ }), { target: { value: '5512345678' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }));
  await screen.findByRole('alert');
  expect(sessionStorage.getItem('pk:v1:checkout:customer')).not.toBeNull();
  firstPage.unmount();
  // A changed or empty cart must not erase the already-submitted attempt.
  localStorage.setItem('pk:v1:cart:customer', JSON.stringify(changedCart));
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Reintentar el mismo pedido' }));
  expect(await screen.findByRole('heading', { name: '¡Tu pedido está listo para preparar!' })).toBeInTheDocument();
  expect(submissions).toHaveLength(2);
  expect(submissions[1]).toEqual(submissions[0]);
  expect(submissions[1].customerName).toBe('Persona que recoge');
  expect(submissions[1].phone).toBe('5512345678');
  expect(sessionStorage.getItem('pk:v1:checkout:customer')).toBeNull();
  expect(screen.getByRole('button', { name: `Ver carrito, ${changedCart.length} artículos` })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('pk:v1:cart:customer'))).toEqual(changedCart);
});

test('no se envía un pedido si el navegador no puede guardar la clave de reintento', async () => {
  const fetch = mockApi({ id: 'customer', username: 'Cliente', email: 'cliente@example.com', tipo: 'comprador' });
  const original = Storage.prototype.setItem;
  const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
    if (key.startsWith('pk:v1:checkout:')) throw new Error('Storage unavailable');
    return original.call(this, key, value);
  });
  try {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Agregar Colores al carrito' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver carrito, 1 artículos' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar pedido' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos guardar el intento');
    expect(fetch.mock.calls.some(([url, options]) => url.endsWith('/orders') && options.method === 'POST')).toBe(false);
  } finally { storage.mockRestore(); }
});

test('un rechazo definitivo de precio permite corregir y crear un nuevo intento', async () => {
  const fetch = mockApi({ id: 'customer', username: 'Cliente', email: 'cliente@example.com', tipo: 'comprador' });
  const original = fetch.getMockImplementation();
  const submissions = [];
  fetch.mockImplementation(async (url, options) => {
    if (url.endsWith('/orders') && options.method === 'POST') {
      submissions.push(JSON.parse(options.body));
      if (submissions.length === 1) return { ok: false, status: 409, json: async () => ({ message: 'El precio cambió.' }) };
      return { ok: true, status: 201, json: async () => ({ id: 'updated-order', total: 110, items: [{ id: 'colores', name: 'Colores', quantity: 1, price: 110 }] }) };
    }
    if (url.endsWith('/products') && submissions.length) return { ok: true, status: 200, json: async () => products.map(p => p.id === 'colores' ? { ...p, price: 110 } : p) };
    return original(url, options);
  });
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Agregar Colores al carrito' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ver carrito, 1 artículos' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar pedido' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('El precio cambió.');
  expect(sessionStorage.getItem('pk:v1:checkout:customer')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }));
  await screen.findByRole('heading', { name: '¡Tu pedido está listo para preparar!' });
  expect(submissions[0].requestKey).not.toBe(submissions[1].requestKey);
  expect(submissions[1].items[0].price).toBe(110);
});

test('una edición en conflicto exige cargar la versión actual antes de guardar', async () => {
  const user = { id: 'operator', username: 'Administrador', email: 'admin@example.com', tipo: 'admin' };
  const fetch = mockApi(user);
  const original = fetch.getMockImplementation();
  let current = { ...products[0], version: 1 };
  const saves = [];
  fetch.mockImplementation(async (url, options) => {
    if (url.endsWith('/products/colores') && options.method === 'PUT') {
      const body = JSON.parse(options.body);
      saves.push(body);
      if (saves.length === 1) {
        current = { ...current, stock: 19, version: 2 };
        return { ok: false, status: 409, json: async () => ({ message: 'El producto cambió. Carga los datos actuales.', code: 'PRODUCT_VERSION_CONFLICT', currentProduct: current }) };
      }
      current = { ...body, id: 'colores', version: 3 };
      return { ok: true, status: 200, json: async () => current };
    }
    if (url.endsWith('/products')) return { ok: true, status: 200, json: async () => products.map(p => p.id === 'colores' ? current : { ...p, version: 1 }) };
    return original(url, options);
  });
  render(<App />);
  await screen.findByRole('heading', { name: 'Colores' });
  fireEvent.click(screen.getByRole('link', { name: 'Inventario', exact: true }));
  fireEvent.click(await screen.findByRole('button', { name: 'Editar Colores' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Precio (MXN)'), { target: { value: '99' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar producto' }));
  await within(dialog).findByRole('alert');
  expect(within(dialog).getByRole('button', { name: 'Guardar producto' })).toBeDisabled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cargar datos actuales' }));
  expect(within(dialog).getByLabelText('Existencias')).toHaveValue(19);
  fireEvent.change(within(dialog).getByLabelText('Precio (MXN)'), { target: { value: '99' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar producto' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(saves[0].version).toBe(1);
  expect(saves[1].version).toBe(2);
  expect(saves[1].stock).toBe(19);
});
