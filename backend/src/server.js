require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const spotifyRoutes = require("./routes/spotify");
const requireAuth = require("./middleware/auth");
const cors = require("cors");

const app = express();

// --------------------
// ✅ DB Connection
// --------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// --------------------
// ✅ Middleware
// --------------------
app.use(cors({
  origin: process.env.FRONTEND_URI || "http://localhost:5173" || "https://resona-mauve.vercel.app",
  credentials: true,
}));

// ✅ Session setup with MongoDB store
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: True,
      sameSite: "none",
    },
  })
);

// ✅ Passport initialization
app.use(passport.initialize());
app.use(passport.session());


app.use("/auth", authRoutes);
app.use("/spotify", spotifyRoutes);

// ✅ Protected dashboard
app.get("/dashboard", requireAuth, (req, res) => {
  res.json({ user: req.user });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
