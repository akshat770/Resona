const express = require("express");
const passport = require("passport");
const jwt = require('jsonwebtoken');

const router = express.Router();

// Google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    try {
      const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const frontend = process.env.FRONTEND_URI || 'http://localhost:5173';
      const url = new URL(`${frontend}/dashboard`);
      url.searchParams.set('token', token);
      res.redirect(url.toString());
    } catch (e) {
      const frontend = process.env.FRONTEND_URI || 'http://localhost:5173';
      res.redirect(`${frontend}/dashboard`);
    }
  }
);

// Verify session - returns 200 if authenticated, else 401
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

// Logout
router.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.redirect("https://resona-mauve.vercel.app/"); // back to login page
  });
});

module.exports = router;
