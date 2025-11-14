import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Telegram init data to all requests
apiClient.interceptors.request.use((config) => {
  const initData = (window as any).Telegram?.WebApp?.initData;
  if (initData) {
    config.headers['x-telegram-init-data'] = initData;
  }
  return config;
});

export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  credits: number;
  created_at: string;
}

export interface Generation {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  keywords?: string;
  created_at: string;
  completed_at?: string;
  credits_spent: number;
  error_message?: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  description?: string;
}

export const api = {
  // User endpoints
  async getUserProfile(): Promise<User> {
    const { data } = await apiClient.get('/user/profile');
    return data;
  },

  async getCredits(): Promise<number> {
    const { data } = await apiClient.get('/user/credits');
    return data.credits;
  },

  async getCreditHistory(limit?: number) {
    const { data } = await apiClient.get('/user/credits/history', {
      params: { limit },
    });
    return data.history;
  },

  // Generation endpoints
  async createGeneration(image: File, keywords?: string): Promise<{ generation_id: number; status: string }> {
    const formData = new FormData();
    formData.append('image', image);
    if (keywords) {
      formData.append('keywords', keywords);
    }

    const { data } = await apiClient.post('/generation/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async getGeneration(id: number): Promise<Generation> {
    const { data } = await apiClient.get(`/generation/${id}`);
    return data;
  },

  async getGenerations(limit?: number): Promise<Generation[]> {
    const { data } = await apiClient.get('/generation', {
      params: { limit },
    });
    return data.generations;
  },

  // Gallery endpoints
  async getGalleryItems(): Promise<GalleryItem[]> {
    const { data } = await apiClient.get('/gallery');
    return data.items;
  },
};
