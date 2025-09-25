const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
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
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const frontend = process.env.FRONTEND_URI || 'https://resona-mauve.vercel.app';
    const url = new URL(`${frontend}/dashboard`);
    url.searchParams.set('token', token);
    res.redirect(url.toString());
  }
);

// Verify JWT
router.get("/verify", (req, res) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URI || "https://resona-mauve.vercel.app");

  const auth = req.headers["authorization"];
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  if (!token) return res.status(401).json({ ok: false });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ ok: true });
  } catch {
    return res.status(401).json({ ok: false });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.redirect(process.env.FRONTEND_URI || "https://resona-mauve.vercel.app");
  });
});

module.exports = router;
