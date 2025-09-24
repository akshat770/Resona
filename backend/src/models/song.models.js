const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  album: String,
  genre: String,
  duration: Number,
  fileId: mongoose.Schema.Types.ObjectId, // GridFS file id
  coverUrl: String,
  playCount: { type: Number, default: 0 },
});

module.exports = mongoose.model('Song', songSchema);
