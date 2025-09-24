const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Google OAuth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful login, redirect somewhere
    res.redirect('/dashboard'); 
  }
);

module.exports = router;
