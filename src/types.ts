export type Platform = 'tiktok' | 'instagram' | 'unknown';

export interface VideoMediaInfo {
  id: string;
  platform: 'tiktok' | 'instagram';
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
  platform: 'tiktok' | 'instagram';
  title: string;
  thumbnail: string;
  author: string;
  downloadDate: number;
  downloadUrl: string;
  mediaType: 'video' | 'audio' | 'image';
}
