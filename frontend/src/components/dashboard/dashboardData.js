export const QUICK_ACTIONS = (isPremium, setShowLikedSongsPopup, setShowAIPlaylistGenerator) => [
  {
    title: "Liked Songs",
    subtitle: isPremium ? "Your saved tracks" : "Preview your saves",
    gradient: "from-slate-500 to-slate-700",
    onClick: () => setShowLikedSongsPopup(true),
  },
  {
    title: "Recently Played",
    subtitle: "Jump back in",
    gradient: "from-slate-400 to-slate-600",
    onClick: () => {},
  },
  {
    title: "Discover",
    subtitle: "New releases",
    gradient: "from-zinc-500 to-slate-700",
    onClick: () => {},
  },
  {
    title: "AI Playlist",
    subtitle: "Smart curation",
    gradient: "from-slate-300 to-slate-600",
    onClick: () => setShowAIPlaylistGenerator(true),
  },
];

export const MADE_FOR_YOU_ITEMS = [
  { title: "Discover Weekly", subtitle: "Your weekly mixtape of fresh music", gradient: "from-slate-900 to-slate-700" },
  { title: "Release Radar", subtitle: "Catch all the latest music", gradient: "from-zinc-900 to-slate-700" },
  { title: "Daily Mix 1", subtitle: "Based on your recent listening", gradient: "from-gray-900 to-slate-700" },
  { title: "On Repeat", subtitle: "Songs you can't stop playing", gradient: "from-slate-800 to-zinc-700" },
];
