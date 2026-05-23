const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  password: String,
  googleId: String,
  displayName: String,
  spotifyId: String,
  spotifyAccessToken: String,
  spotifyRefreshToken: String,
  spotifyExpiresAt: Number
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
