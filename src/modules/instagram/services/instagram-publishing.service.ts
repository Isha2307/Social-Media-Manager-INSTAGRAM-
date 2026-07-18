import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreatePostDto, MediaType } from '../dto/create-post.dto';
import { InstagramApiException } from '../exceptions/instagram-api.exception';

@Injectable()
export class InstagramPublishingService {
  private readonly logger = new Logger(InstagramPublishingService.name);
  private readonly graphApiVersion: string;

  constructor(private configService: ConfigService) {
    this.graphApiVersion = this.configService.get<string>('META_GRAPH_API_VERSION') || 'v19.0';
  }

  /**
   * Main method to handle the 2-step publishing flow.
   * @param dto The post payload
   * @param pageAccessToken The specific Page Access Token for this user's IG Account
   */
  async publish(dto: CreatePostDto, pageAccessToken: string): Promise<string> {
    try {
      this.logger.log(`Starting publish process for IG Account: ${dto.igUserId}`);
      
      // Step 1: Create Media Container
      const creationId = await this.createMediaContainer(dto, pageAccessToken);
      
      // If it's a video, we must wait for Meta to finish processing the container
      if (dto.mediaType === MediaType.VIDEO) {
        await this.waitForVideoProcessing(creationId, pageAccessToken);
      }

      // Step 2: Publish the Container
      const platformPostId = await this.publishMediaContainer(dto.igUserId, creationId, pageAccessToken);
      
      this.logger.log(`Successfully published post to Instagram. Platform ID: ${platformPostId}`);
      return platformPostId;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new InstagramApiException(error.response.data);
      }
      this.logger.error('Failed to publish post', error.message);
      throw new InternalServerErrorException('Failed to publish post to Instagram');
    }
  }

  private async createMediaContainer(dto: CreatePostDto, accessToken: string): Promise<string> {
    const url = `https://graph.facebook.com/${this.graphApiVersion}/${dto.igUserId}/media`;
    
    const params: any = {
      access_token: accessToken,
      caption: dto.caption || '',
    };

    if (dto.mediaType === MediaType.IMAGE) {
      params.image_url = dto.mediaUrl;
    } else if (dto.mediaType === MediaType.VIDEO) {
      params.media_type = 'VIDEO';
      params.video_url = dto.mediaUrl;
    }

    this.logger.log(`Creating media container (Type: ${dto.mediaType})...`);
    const response = await axios.post(url, null, { params });
    
    return response.data.id; // This is the creation_id
  }

  private async waitForVideoProcessing(creationId: string, accessToken: string): Promise<void> {
    this.logger.log(`Waiting for video container ${creationId} to finish processing...`);
    
    const url = `https://graph.facebook.com/${this.graphApiVersion}/${creationId}`;
    let isFinished = false;
    let attempts = 0;
    const maxAttempts = 20; // Try for approx 5 minutes (15s * 20)

    while (!isFinished && attempts < maxAttempts) {
      const response = await axios.get(url, {
        params: {
          fields: 'status_statusCode',
          access_token: accessToken,
        },
      });

      const status = response.data.status_statusCode;
      if (status === 'FINISHED') {
        isFinished = true;
        this.logger.log(`Video container ${creationId} processing FINISHED.`);
      } else if (status === 'ERROR') {
        throw new Error('Meta failed to process the video container.');
      } else {
        // IN_PROGRESS or PUBLISHED
        attempts++;
        this.logger.log(`Video processing status: ${status}. Waiting 15 seconds...`);
        // Wait 15 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 15000));
      }
    }

    if (!isFinished) {
      throw new Error('Timeout while waiting for video processing to finish.');
    }
  }

  private async publishMediaContainer(igUserId: string, creationId: string, accessToken: string): Promise<string> {
    const url = `https://graph.facebook.com/${this.graphApiVersion}/${igUserId}/media_publish`;
    
    this.logger.log(`Publishing container ${creationId}...`);
    const response = await axios.post(url, null, {
      params: {
        creation_id: creationId,
        access_token: accessToken,
      },
    });

    return response.data.id; // This is the final Instagram Media ID
  }
}
