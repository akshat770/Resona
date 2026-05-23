export const QUICK_ACTIONS = (isPremium, setShowLikedSongsPopup, setShowAIPlaylistGenerator) => [
  {
    title: "Liked Songs",
    subtitle: isPremium ? "Your saved tracks" : "Preview your saves",
    gradient: "from-green-600 to-green-800",
    onClick: () => setShowLikedSongsPopup(true),
  },
  {
    title: "Recently Played",
    subtitle: "Jump back in",
    gradient: "from-emerald-600 to-green-800",
    onClick: () => {},
  },
  {
    title: "Discover",
    subtitle: "New releases",
    gradient: "from-teal-600 to-green-900",
    onClick: () => {},
  },
  {
    title: "AI Playlist",
    subtitle: "Smart curation",
    gradient: "from-lime-600 to-green-800",
    onClick: () => setShowAIPlaylistGenerator(true),
  },
];

export const MADE_FOR_YOU_ITEMS = [
  { title: "Discover Weekly", subtitle: "Your weekly mixtape of fresh music", gradient: "from-green-900 to-emerald-800" },
  { title: "Release Radar", subtitle: "Catch all the latest music", gradient: "from-emerald-900 to-green-800" },
  { title: "Daily Mix 1", subtitle: "Based on your recent listening", gradient: "from-gray-900 to-green-800" },
  { title: "On Repeat", subtitle: "Songs you can't stop playing", gradient: "from-green-800 to-teal-900" },
];
