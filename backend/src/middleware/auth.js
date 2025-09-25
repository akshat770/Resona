function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  const auth = req.headers["authorization"];
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  
  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // minimal JWT payload
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = requireAuth;
