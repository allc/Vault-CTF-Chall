function isAuthenticated(req, res, next) {
  if (req.session.username) {
    next();
  } else {
    const redirect = req.originalUrl;
    res.redirect('/login?redirect=' + encodeURIComponent(redirect));
  }
};

export default isAuthenticated;
