require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const spotifyRoutes = require("./routes/spotify"); // <-- new

const app = express();

// --------------------
// ✅ DB Connection
// --------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// --------------------
// ✅ CORS Setup
// --------------------
const corsOptions = {
  origin: process.env.FRONTEND_URI || "https://resona-mauve.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// --------------------
// ✅ Middleware
// --------------------
app.use(express.json());

// --------------------
// ✅ Routes
// --------------------
app.use("/auth", authRoutes);
app.use("/auth", spotifyRoutes); // <-- Spotify OAuth

// Health check
app.get("/", (req, res) => res.send("Server running with Spotify Auth"));

// --------------------
// ✅ Server start
// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
