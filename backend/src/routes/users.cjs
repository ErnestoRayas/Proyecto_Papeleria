const { Router } = require('express');
const { admin } = require('../middleware/auth.cjs');
const { publicUser } = require('../utils/security.cjs');

function userRoutes(users) {
  const router = Router();
  router.get('/', admin, (req, res) => res.json(users.list().map(publicUser)));
  return router;
}
module.exports = { userRoutes };
