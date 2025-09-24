const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  password: String,            // optional: hashed password for email login
  googleId: String,
  displayName: String,
  spotifyId: String,
  spotifyAccessToken: String,
  spotifyRefreshToken: String,
  spotifyExpiresAt: Number
});

// optional: compare hashed password
userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
}

module.exports = mongoose.model('User', userSchema);
