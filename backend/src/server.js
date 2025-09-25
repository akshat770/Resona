require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const spotifyRoutes = require("./routes/spotify");
const jwt = require("jsonwebtoken");

const app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.use(cors({
  origin: process.env.FRONTEND_URI || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/spotify", spotifyRoutes);

// protected route example
app.get("/dashboard", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ ok: true, userId: payload.id });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
