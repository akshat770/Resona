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

// Logout
router.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.redirect("https://resona-mauve.vercel.app/"); // back to login page
  });
});

module.exports = router;
