require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
require('./config/passport.js');

const authRoutes = require('./routes/auth.js');
const spotifyRoutes = require('./routes/spotify.js');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URI, credentials: true }));
app.use(session({ secret: process.env.SESSION_KEY, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/auth', authRoutes);
app.use('/api', spotifyRoutes);

// Return the currently authenticated user (via session)
app.get('/user/me', (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  const { id, displayName, email } = req.user;
  res.json({ id, displayName, email });
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
