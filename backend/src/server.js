require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const spotifyRoutes = require("./routes/spotify");
const cors = require("cors");

const app = express();

// ---------- MONGODB ----------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ---------- CORS ----------
const FRONTEND = process.env.FRONTEND_URI || "http://localhost:5173";
app.use(cors({
  origin: FRONTEND,
  credentials: false // no cookie/session usage in JWT flow
}));

// ---------- Body parser ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Passport (used only for Google OAuth handshake) ----------
app.use(passport.initialize());

// ---------- Routes ----------
app.use("/auth", authRoutes);
app.use("/spotify", spotifyRoutes);

// Health check
app.get("/", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
