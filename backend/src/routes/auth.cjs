const { Router } = require('express');
const { publicUser } = require('../utils/security.cjs');

function authRoutes(auth, production) {
  const router = Router();
  const cookieOptions = { httpOnly: true, secure: production, sameSite: 'strict', path: '/' };
  const respondWithSession = (res, user) => {
    res.cookie('pk_session', auth.createSession(user.id), { ...cookieOptions, maxAge: 7 * 86400000 });
    res.json({ user: publicUser(user) });
  };
  router.get('/me', (req, res) => res.json({ user: req.user ? publicUser(req.user) : null }));
  router.post('/register', async (req, res) => respondWithSession(res.status(201), await auth.register(req.body)));
  router.post('/login', async (req, res) => respondWithSession(res, await auth.login(req.body)));
  router.post('/logout', (req, res) => {
    auth.logout(req.tokenHash);
    res.clearCookie('pk_session', cookieOptions);
    res.json({ ok: true });
  });
  router.post('/reset-password', async (req, res) => { await auth.resetPassword(req.body); res.json({ ok: true }); });
  return router;
}
module.exports = { authRoutes };
