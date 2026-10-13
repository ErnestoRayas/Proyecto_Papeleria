const { hashToken } = require('../utils/security.cjs');

const authenticated = (req, res, next) => req.user ? next() : res.status(401).json({ message: 'Inicia sesión para continuar.' });
const admin = (req, res, next) => authenticated(req, res, () => req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Necesitas permisos de administración.' }));

function loadSession(sessions) {
  return (req, res, next) => {
    const token = (req.headers.cookie || '').split(';').map(c => c.trim()).find(c => c.startsWith('pk_session='))?.slice(11);
    if (token && /^[a-f0-9]{64}$/.test(token)) {
      req.tokenHash = hashToken(token);
      req.user = sessions.findUser(req.tokenHash, Date.now());
    }
    next();
  };
}
module.exports = { authenticated, admin, loadSession };
