const express = require("express");
const passport = require("passport");

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
    res.redirect("https://resona-mauve.vercel.app/dashboard"); // frontend URL
  }
);

// Verify session - returns 200 if authenticated, else 401
router.get('/verify', (req, res) => {
  if (req.user) return res.json({ ok: true });
  return res.status(401).json({ ok: false });
});

// Logout
router.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.redirect("https://resona-mauve.vercel.app/"); // back to login page
  });
});

module.exports = router;
