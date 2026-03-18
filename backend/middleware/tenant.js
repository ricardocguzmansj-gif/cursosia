export const tenantMiddleware = (req, res, next) => {
  const host = req.headers.host;
  req.tenant = host.split(".")[0];
  next();
};
