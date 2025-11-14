import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export interface KlingGenerationRequest {
  imagePath: string;
  prompt?: string;
  duration?: number; // in seconds
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface KlingTaskResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  error?: string;
}

export class KlingService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.KLING_API_KEY || '';
    this.apiUrl = process.env.KLING_API_URL || 'https://api.kling.ai/v1';

    if (!this.apiKey) {
      console.warn('KLING_API_KEY is not set. KLING service will not work.');
    }
  }

  /**
   * Create a new image-to-video generation task
   */
  async createImageToVideoTask(request: KlingGenerationRequest): Promise<string> {
    try {
      const formData = new FormData();

      // Read the image file
      const imageStream = fs.createReadStream(request.imagePath);
      formData.append('image', imageStream);

      // Add parameters
      if (request.prompt) {
        formData.append('prompt', request.prompt);
      }

      formData.append('duration', (request.duration || 5).toString());
      formData.append('aspect_ratio', request.aspectRatio || '16:9');

      const response = await axios.post(
        `${this.apiUrl}/image-to-video`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 30000, // 30 seconds
        }
      );

      if (response.data && response.data.task_id) {
        return response.data.task_id;
      }

      throw new Error('Invalid response from KLING API: missing task_id');
    } catch (error: any) {
      console.error('Error creating KLING task:', error.response?.data || error.message);
      throw new Error(`Failed to create KLING task: ${error.message}`);
    }
  }

  /**
   * Check the status of a generation task
   */
  async getTaskStatus(taskId: string): Promise<KlingTaskResponse> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000, // 10 seconds
        }
      );

      return {
        task_id: taskId,
        status: response.data.status,
        video_url: response.data.video_url,
        error: response.data.error,
      };
    } catch (error: any) {
      console.error('Error getting KLING task status:', error.response?.data || error.message);
      throw new Error(`Failed to get task status: ${error.message}`);
    }
  }

  /**
   * Download the generated video
   */
  async downloadVideo(videoUrl: string, savePath: string): Promise<void> {
    try {
      const response = await axios.get(videoUrl, {
        responseType: 'stream',
        timeout: 60000, // 60 seconds
      });

      const writer = fs.createWriteStream(savePath);

      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error: any) {
      console.error('Error downloading video:', error.message);
      throw new Error(`Failed to download video: ${error.message}`);
    }
  }

  /**
   * Poll task until completion or failure
   */
  async waitForCompletion(taskId: string, maxAttempts: number = 60, intervalMs: number = 5000): Promise<KlingTaskResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getTaskStatus(taskId);

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Task timeout: max polling attempts reached');
  }
}

export const klingService = new KlingService();
