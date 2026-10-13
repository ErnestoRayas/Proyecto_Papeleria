function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    message: status >= 500 ? 'No pudimos completar la operación. Inténtalo de nuevo.' : error.type === 'entity.parse.failed' ? 'El formato de la solicitud no es válido.' : error.message,
    ...(status < 500 ? error.details : {})
  });
}
module.exports = { errorHandler };
