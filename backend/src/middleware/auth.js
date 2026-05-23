const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const auth = req.headers["authorization"];
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = requireAuth;
