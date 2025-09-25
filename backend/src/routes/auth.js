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