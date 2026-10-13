const { Router } = require('express');
const { admin } = require('../middleware/auth.cjs');

function productRoutes(products) {
  const router = Router();
  router.get('/', (req, res) => res.json(products.list()));
  router.post('/', admin, (req, res) => res.status(201).json(products.create(req.body)));
  router.put('/:id', admin, (req, res) => res.json(products.update(req.params.id, req.body)));
  router.delete('/:id', admin, (req, res) => { products.retire(req.params.id); res.json({ ok: true }); });
  return router;
}
module.exports = { productRoutes };
