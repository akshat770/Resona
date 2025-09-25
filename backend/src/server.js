require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const spotifyRoutes = require("./routes/spotify");
const cors = require("cors");

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
app.options("*", cors(corsOptions));

// --------------------
// ✅ Session Setup (optional, can keep for Passport)
// --------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000
    },
  })
);

// --------------------
// ✅ Passport
// --------------------
app.use(passport.initialize());
app.use(passport.session());

// --------------------
// ✅ Routes
// --------------------
app.use("/auth", authRoutes);
app.use("/spotify", spotifyRoutes);

// Health check
app.get("/", (req, res) => res.send("Server is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
