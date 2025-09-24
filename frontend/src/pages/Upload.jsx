import React, { useState } from 'react';
import axios from 'axios';

export default function Upload() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('audio', file);

    await axios.post('http://localhost:5000/api/songs/upload', formData, { withCredentials: true });
    alert('Uploaded successfully!');
  };

  return (
    <div className="mx-auto w-[min(800px,96%)] px-2 mt-10">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Upload Song</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          />
          <input
            type="text"
            placeholder="Artist"
            value={artist}
            onChange={e => setArtist(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/50"
          />
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 col-span-full file:mr-4 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-white hover:file:bg-cyan-400"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUpload}
            className="relative overflow-hidden rounded-lg px-4 py-2 font-medium text-white bg-[linear-gradient(90deg,#00ffe0,#7c3aed,#00d4ff)] bg-[length:200%_200%] animate-[shimmer_4s_linear_infinite]"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
