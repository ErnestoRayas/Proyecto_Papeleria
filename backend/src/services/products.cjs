const { randomUUID } = require('node:crypto');
const { ApiError, fail } = require('../utils/errors.cjs');
const { text } = require('../utils/validation.cjs');
const productView = p => ({ id: p.id, name: p.name, price: p.price_cents / 100, stock: p.stock, category: p.category, description: p.description, image: p.image, version: p.version });

function productInput(body) {
  const name = text(body.name), category = text(body.category, 40), description = text(body.description, 500), image = text(body.image, 2000);
  fail(!name || !category || !description, 'Completa nombre, categoría y descripción.');
  fail(typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0.01 || body.price > 1000000, 'El precio debe estar entre $0.01 y $1,000,000.');
  fail(!Number.isInteger(body.stock) || body.stock < 0 || body.stock > 1000000, 'Las existencias deben ser un número entero positivo o cero.');
  fail(image && !/^https:\/\//i.test(image) && !/^\/products\/[a-z0-9-]+\.(webp|png|jpg|svg)$/i.test(image), 'Usa una imagen HTTPS o una ruta local /products/archivo.webp.');
  return [name, Math.round(body.price * 100), body.stock, category, description, image];
}

function createProductService(products) {
  return {
    list: () => products.list().map(productView),
    create(body) {
      const values = productInput(body), id = randomUUID();
      products.insert(id, values);
      return productView(products.find(id));
    },
    update(id, body) {
      const values = productInput(body);
      fail(!Number.isSafeInteger(body.version) || body.version < 1, 'Incluye la versión actual del producto para editarlo.');
      const update = products.update(id, body.version, values);
      if (!update.changes) {
        const current = products.find(id);
        fail(!current, 'Producto no encontrado.', 404);
        throw new ApiError(409, 'El producto cambió desde que abriste el editor. Carga los datos actuales y revisa tus cambios.', {
          code: 'PRODUCT_VERSION_CONFLICT', currentProduct: productView(current)
        });
      }
      return productView(products.find(id));
    },
    retire(id) { fail(!products.retire(id).changes, 'Producto no encontrado.', 404); }
  };
}
module.exports = { createProductService };
