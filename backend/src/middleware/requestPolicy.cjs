function requestPolicy(origin) {
  return (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // The custom header requires a preflight; cross-origin access is not enabled.
      if (req.get('X-Requested-With') !== 'PapeleriaKaren' || (req.get('Origin') && req.get('Origin') !== origin)) {
        return res.status(403).json({ message: 'Origen de la solicitud no permitido.' });
      }
    }
    next();
  };
}
module.exports = { requestPolicy };
