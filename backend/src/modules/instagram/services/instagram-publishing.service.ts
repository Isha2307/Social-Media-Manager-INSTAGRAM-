import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import axios from 'axios';
import { CreatePostDto, MediaType } from '../dto/create-post.dto';
import { InstagramApiException } from '../exceptions/instagram-api.exception';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class InstagramPublishingService {
  private readonly logger = new Logger(InstagramPublishingService.name);
  private readonly graphApiVersion: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @InjectQueue('instagram-publishing') private readonly publishingQueue: Queue,
  ) {
    this.graphApiVersion = this.configService.get<string>('META_GRAPH_API_VERSION') || 'v19.0';
  }

  /**
   * Main method to handle the 2-step publishing flow.
   * @param dto The post payload
   * @param pageAccessToken Optional page access token. If not provided, retrieved from DB.
   */
  async publish(dto: CreatePostDto, pageAccessToken?: string): Promise<string> {
    // 1. Resolve Access Token
    let token = pageAccessToken;
    if (!token) {
      const account = await this.prisma.instagramAccount.findUnique({
        where: { igUserId: dto.igUserId },
      });
      if (!account) {
        throw new NotFoundException(`Instagram account ${dto.igUserId} not linked.`);
      }
      token = account.accessToken;
    }

    // 2. Create local DB post log
    const post = await this.prisma.instagramPost.create({
      data: {
        igUserId: dto.igUserId,
        caption: dto.caption || null,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        status: 'PUBLISHING',
      },
    });

    try {
      this.logger.log(`Starting publish process for IG Account: ${dto.igUserId}, Post ID: ${post.id}`);
      
      // Step 1: Create Media Container
      const creationId = await this.createMediaContainer(dto, token);
      
      // If it's a video, we must wait for Meta to finish processing the container
      if (dto.mediaType === MediaType.VIDEO) {
        await this.waitForVideoProcessing(creationId, token);
      }

      // Step 2: Publish the Container
      const platformPostId = await this.publishMediaContainer(dto.igUserId, creationId, token);
      
      // Update DB status to PUBLISHED
      await this.prisma.instagramPost.update({
        where: { id: post.id },
        data: {
          status: 'PUBLISHED',
          platformPostId,
        },
      });

      this.logger.log(`Successfully published post to Instagram. Platform ID: ${platformPostId}`);
      return platformPostId;
    } catch (error) {
      let errorMsg = error.message;
      if (error.response?.data?.error) {
        errorMsg = JSON.stringify(error.response.data.error);
      }

      // Update DB status to FAILED
      await this.prisma.instagramPost.update({
        where: { id: post.id },
        data: {
          status: 'FAILED',
          errorMessage: errorMsg,
        },
      });

      if (error.response?.data?.error) {
        throw new InstagramApiException(error.response.data);
      }
      this.logger.error('Failed to publish post', error.message);
      throw new InternalServerErrorException('Failed to publish post to Instagram');
    }
  }

  /**
   * Publishes a scheduled post from the database.
   */
  async publishById(postId: string): Promise<string> {
    const post = await this.prisma.instagramPost.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException(`Post ${postId} not found.`);
    }

    if (post.status === 'PUBLISHED') {
      return post.platformPostId;
    }

    const account = await this.prisma.instagramAccount.findUnique({
      where: { igUserId: post.igUserId },
    });
    if (!account) {
      throw new NotFoundException(`Instagram account ${post.igUserId} not linked.`);
    }

    // Set post status to PUBLISHING
    await this.prisma.instagramPost.update({
      where: { id: postId },
      data: { status: 'PUBLISHING' },
    });

    try {
      const dto: CreatePostDto = {
        igUserId: post.igUserId,
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType as MediaType,
      };

      this.logger.log(`Publishing scheduled post ${postId}...`);
      
      // Step 1: Create Media Container
      const creationId = await this.createMediaContainer(dto, account.accessToken);
      
      // If it's a video, we must wait for Meta to finish processing the container
      if (dto.mediaType === MediaType.VIDEO) {
        await this.waitForVideoProcessing(creationId, account.accessToken);
      }

      // Step 2: Publish the Container
      const platformPostId = await this.publishMediaContainer(dto.igUserId, creationId, account.accessToken);
      
      // Update DB status to PUBLISHED
      await this.prisma.instagramPost.update({
        where: { id: postId },
        data: {
          status: 'PUBLISHED',
          platformPostId,
        },
      });

      this.logger.log(`Successfully published scheduled post to Instagram. Platform ID: ${platformPostId}`);
      return platformPostId;
    } catch (error) {
      let errorMsg = error.message;
      if (error.response?.data?.error) {
        errorMsg = JSON.stringify(error.response.data.error);
      }

      // Update DB status to FAILED
      await this.prisma.instagramPost.update({
        where: { id: postId },
        data: {
          status: 'FAILED',
          errorMessage: errorMsg,
        },
      });

      this.logger.error(`Failed to publish scheduled post ${postId}`, error.message);
      throw error;
    }
  }

  /**
   * Schedules a post to be published at a future time.
   */
  async schedule(dto: CreatePostDto): Promise<any> {
    if (!dto.scheduledAt) {
      throw new InternalServerErrorException('scheduledAt is required to schedule a post.');
    }

    const scheduledDate = new Date(dto.scheduledAt);
    const delay = scheduledDate.getTime() - Date.now();

    // Create DB entry
    const post = await this.prisma.instagramPost.create({
      data: {
        igUserId: dto.igUserId,
        caption: dto.caption || null,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        status: 'SCHEDULED',
        scheduledAt: scheduledDate,
      },
    });

    // Enqueue job with delay
    await this.publishingQueue.add(
      'publish-post',
      { postId: post.id },
      {
        delay: Math.max(0, delay),
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    this.logger.log(`Post ${post.id} scheduled for ${scheduledDate.toISOString()} with delay ${delay}ms`);
    return post;
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
