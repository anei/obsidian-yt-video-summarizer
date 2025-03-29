// Regex pattern for extracting video title from meta tag
export const TITLE_REGEX = /<meta\s+name="title"\s+content="([^"]*)">/;

// Regex pattern for extracting video ID from YouTube URL
export const VIDEO_ID_REGEX = /(?:v=|\/)([a-zA-Z0-9_-]{11})/;

// Regex pattern for extracting video author from meta tag
export const AUTHOR_REGEX = /<link itemprop="name" content="([^"]+)">/;

// Regex pattern for extracting channel ID from video page
export const CHANNEL_ID_REGEX = /"channelId":"([^"]+)"/;
