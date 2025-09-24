const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Google OAuth login
router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.redirect(`${process.env.FRONTEND_URI}/app?token=${token}`);
  });

module.exports = router;
