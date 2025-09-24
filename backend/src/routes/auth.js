const express = require('express');
const passport = require('passport');
const router = express.Router();

// Start Google OAuth
router.get('/google', passport.authenticate('google', { scope:['profile','email'] }));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req,res)=>{
    // Successful login → redirect to frontend
    res.redirect('http://localhost:3000');
  }
);

// Logout
router.get('/logout', (req,res)=>{
  req.logout(()=>{});
  res.redirect('/');
});

module.exports = router;
