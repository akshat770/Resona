import { useState, useRef } from "react";
import api from "../api/axios";

export default function SearchBar({ onResults, autoFocus }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const debounceTimeout = useRef();

  const performSearch = async (q) => {
    if (!q) {
      onResults(null);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("jwt");
      const res = await api.get("/spotify/search", {
        headers: { Authorization: `Bearer ${token}` },
        params: { q, type: "track,artist,album,playlist" },
      });
      onResults(res.data);
    } catch {
      onResults(null);
    }
    setLoading(false);
  };

  const onChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => performSearch(val), 350);
  };

  return (
    <div className="relative w-full">
      <input
        type="search"
        value={query}
        onChange={onChange}
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder="Search for songs, artists, albums..."
        className="bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white focus:outline-none w-full"
      />
      {loading && (
        <span className="absolute right-3 top-2.5 animate-spin w-4 h-4 border-b-2 border-green-400 rounded-full"></span>
      )}
    </div>
  );
}
