const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Song = require('../models/Song');
const { getGfs } = require('../utils/gridfs');
const ensureAuth = require('../utils/authMiddleware');

const router = express.Router();

const storage = new GridFsStorage({ 
  url: process.env.MONGO_URI, 
  file: (req,file)=>({ bucketName:'uploads', filename: Date.now()+'_'+file.originalname }) 
});
const upload = multer({ storage });

// Upload song (protected)
router.post('/upload', ensureAuth, upload.single('audio'), async (req,res)=>{
  const song = new Song({
    title: req.body.title,
    artist: req.body.artist,
    fileId: req.file.id,
    uploadedBy: req.user.id
  });
  await song.save();
  res.json(song);
});

// Stream song
router.get('/stream/:id', async (req,res)=>{
  const gfs = getGfs();
  const fileId = new mongoose.Types.ObjectId(req.params.id);
  gfs.files.findOne({_id:fileId}, (err,file)=>{
    if(!file) return res.status(404).send('Not found');
    const readstream = gfs.createReadStream({_id:fileId});
    res.set('Content-Type', file.contentType || 'audio/mpeg');
    readstream.pipe(res);
  });
});

// List songs
router.get('/', async (req,res)=>{
  const songs = await Song.find();
  res.json(songs);
});

module.exports = router;
