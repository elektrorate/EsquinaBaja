export type Platform = 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'unknown';

export interface CarouselEntry {
  url: string;
  title: string;
  thumbnail: string;
  isVideo: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface VideoMediaInfo {
  id: string;
  platform: 'tiktok' | 'instagram' | 'facebook' | 'twitter';
  originalUrl: string;
  title: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
  };
  thumbnail: string;
  duration?: number; // seconds
  downloadOptions: {
    videoNoWatermark?: string;
    videoHd?: string;
    audio?: string;
    thumbnail?: string;
  };
  carousel?: CarouselEntry[];
  stats?: {
    likes?: number;
    views?: number;
    shares?: number;
    comments?: number;
  };
  createdAt?: string;
}

export interface ExtractResponse {
  success: boolean;
  data?: VideoMediaInfo;
  error?: string;
  message?: string;
  isFallback?: boolean;
}

export interface DownloadHistoryItem {
  id: string;
  platform: 'tiktok' | 'instagram' | 'facebook' | 'twitter';
  title: string;
  thumbnail: string;
  author: string;
  downloadDate: number;
  downloadUrl: string;
  mediaType: 'video' | 'audio' | 'image';
}
