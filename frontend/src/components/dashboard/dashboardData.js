export const QUICK_ACTIONS = (isPremium, setShowLikedSongsPopup, setShowAIPlaylistGenerator) => [
  {
    title: "Liked Songs",
    subtitle: isPremium ? "Your saved tracks" : "Preview your saves",
    gradient: "from-purple-600 to-blue-600",
    onClick: () => setShowLikedSongsPopup(true),
  },
  {
    title: "Recently Played",
    subtitle: "Jump back in",
    gradient: "from-green-600 to-teal-600",
    onClick: () => {},
  },
  {
    title: "Discover",
    subtitle: "New releases",
    gradient: "from-orange-600 to-red-600",
    onClick: () => {},
  },
  {
    title: "AI Playlist",
    subtitle: "Smart curation",
    gradient: "from-pink-600 to-purple-600",
    onClick: () => setShowAIPlaylistGenerator(true),
  },
];

export const MADE_FOR_YOU_ITEMS = [
  { title: "Discover Weekly", subtitle: "Your weekly mixtape of fresh music", gradient: "from-blue-900 to-blue-700" },
  { title: "Release Radar", subtitle: "Catch all the latest music", gradient: "from-green-900 to-green-700" },
  { title: "Daily Mix 1", subtitle: "Based on your recent listening", gradient: "from-purple-900 to-purple-700" },
  { title: "On Repeat", subtitle: "Songs you can't stop playing", gradient: "from-red-900 to-red-700" },
];
