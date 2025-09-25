const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Issue JWT and redirect to frontend with token
    try {
      const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const url = new URL(`${process.env.FRONTEND_URI}/app`);
      url.searchParams.set('token', token);
      res.redirect(url.toString());
    } catch (e) {
      // fallback to session-only redirect
      res.redirect(`${process.env.FRONTEND_URI}/app`);
    }
  }
);

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(process.env.FRONTEND_URI);
  });
});

module.exports = router;
// Verify endpoint: accepts either session or JWT
router.get('/verify', (req, res) => {
  if (req.user) return res.json({ ok: true, method: 'session' });
  const auth = req.headers['authorization'];
  const token = auth?.startsWith('Bearer ') ? auth.split(' ')[1] : null;
  if (!token) return res.status(401).json({ ok: false });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ ok: true, method: 'jwt' });
  } catch (e) {
    return res.status(401).json({ ok: false });
  }
});