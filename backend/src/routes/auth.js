const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();

const FRONTEND = process.env.FRONTEND_URI || "http://localhost:5173";

// start google oauth
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// callback (session:false). On success issue JWT and redirect to frontend
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: FRONTEND, session: false }),
  (req, res) => {
    try {
      const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      const url = new URL(`${FRONTEND}/dashboard`);
      url.searchParams.set("token", token);
      return res.redirect(url.toString());
    } catch (e) {
      console.error("Error creating JWT:", e);
      return res.redirect(FRONTEND);
    }
  }
);

// Verify token endpoint (used by ProtectedRoute)
router.get("/verify", (req, res) => {
  const auth = req.headers["authorization"];
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  if (!token) return res.status(401).json({ ok: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ ok: true, id: decoded.id });
  } catch (e) {
    return res.status(401).json({ ok: false });
  }
});

module.exports = router;
