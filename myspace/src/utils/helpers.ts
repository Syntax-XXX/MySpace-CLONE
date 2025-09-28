export const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

export const truncateText = (text: string, length: number): string => {
    return text.length > length ? text.substring(0, length) + '...' : text;
};

export const generateProfileUrl = (username: string): string => {
    return `/profile/${username}`;
};

export const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export const convertSpotifyUrlToEmbed = (url: string): string => {
  if (!url) return '';

  // Remove query params
  let cleanUrl = url.split('?')[0];

  // Remove locale segments like /intl-de/
  cleanUrl = cleanUrl.replace(/\/intl-[a-z]{2}\//, '/');

  // Already an embed link
  if (cleanUrl.includes('open.spotify.com/embed/')) {
    return cleanUrl;
  }

  // Track
  const trackMatch = cleanUrl.match(/open\.spotify\.com\/track\/([a-zA-Z0-9_-]+)/);
  if (trackMatch) {
    return `https://open.spotify.com/embed/track/${trackMatch[1]}?utm_source=generator`;
  }

  // Album
  const albumMatch = cleanUrl.match(/open\.spotify\.com\/album\/([a-zA-Z0-9_-]+)/);
  if (albumMatch) {
    return `https://open.spotify.com/embed/album/${albumMatch[1]}?utm_source=generator`;
  }

  // Playlist
  const playlistMatch = cleanUrl.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9_-]+)/);
  if (playlistMatch) {
    return `https://open.spotify.com/embed/playlist/${playlistMatch[1]}?utm_source=generator`;
  }

  // Artist
  const artistMatch = cleanUrl.match(/open\.spotify\.com\/artist\/([a-zA-Z0-9_-]+)/);
  if (artistMatch) {
    return `https://open.spotify.com/embed/artist/${artistMatch[1]}?utm_source=generator`;
  }

  // Default: return original URL
  return cleanUrl;
};



export const isSpotifyUrl = (url: string): boolean => {
    return url.includes('open.spotify.com/') || url.includes('spotify.com/');
};