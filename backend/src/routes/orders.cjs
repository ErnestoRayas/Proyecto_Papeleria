const { Router } = require('express');
const { authenticated } = require('../middleware/auth.cjs');

function orderRoutes(orders) {
  const router = Router();
  router.use(authenticated);
  router.get('/', (req, res) => res.json(orders.list(req.user)));
  router.post('/', (req, res) => {
    const { order, created } = orders.create(req.user, req.body);
    res.status(created ? 201 : 200).json(order);
  });
  return router;
}
module.exports = { orderRoutes };
