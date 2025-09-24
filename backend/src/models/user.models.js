const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Playlist" }],
  likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
});
module.exports = mongoose.model("User", userSchema);
