require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const cookieSession = require('cookie-session');
require('./passport-setup');

const app = express();
app.use(express.json());
app.use(cookieSession({
  name:'session',
  keys:[process.env.SESSION_KEY],
  maxAge:24*60*60*1000
}));
app.use(passport.initialize());
app.use(passport.session());

// Connect Mongo
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true });

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/songs', require('./routes/songs'));

app.listen(process.env.PORT||5000, ()=> console.log('Server running'));
