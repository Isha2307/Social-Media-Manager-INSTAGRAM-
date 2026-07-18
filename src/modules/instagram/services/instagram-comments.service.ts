import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { InstagramApiException } from '../exceptions/instagram-api.exception';
import { RateLimitException } from '../exceptions/rate-limit.exception';

@Injectable()
export class InstagramCommentsService {
  private readonly logger = new Logger(InstagramCommentsService.name);
  private readonly graphApiVersion: string;

  constructor(private configService: ConfigService) {
    this.graphApiVersion = this.configService.get<string>('META_GRAPH_API_VERSION') || 'v19.0';
  }

  /**
   * Reads Meta's rate limit header and throws an exception if we are approaching the limit.
   */
  private checkRateLimit(response: AxiosResponse) {
    const usageHeader = response.headers['x-business-use-case-usage'];
    if (usageHeader) {
      try {
        const usageData = JSON.parse(usageHeader);
        // Extract the maximum usage percentage from the header
        for (const key in usageData) {
          const limits = usageData[key];
          for (const limit of limits) {
            const maxUsage = Math.max(limit.call_count || 0, limit.total_time || 0, limit.total_cputime || 0);
            this.logger.debug(`Current Instagram API Usage: ${maxUsage}%`);
            
            // If usage is >= 90%, proactively stop requests
            if (maxUsage >= 90) {
              this.logger.warn(`Rate limit warning! Usage is at ${maxUsage}%`);
              throw new RateLimitException(maxUsage);
            }
          }
        }
      } catch (e) {
        if (e instanceof RateLimitException) throw e;
        this.logger.error('Failed to parse rate limit header', e.message);
      }
    }
  }

  /**
   * Fetches comments for a specific media object with pagination.
   */
  async fetchComments(mediaId: string, limit: number, after: string, pageAccessToken: string): Promise<any> {
    try {
      this.logger.log(`Fetching comments for media: ${mediaId}`);
      
      const url = `https://graph.facebook.com/${this.graphApiVersion}/${mediaId}/comments`;
      
      const params: any = {
        access_token: pageAccessToken,
        fields: 'id,text,timestamp,username,replies', // Request standard fields + threaded replies
        limit: limit,
      };

      if (after) {
        params.after = after;
      }

      const response = await axios.get(url, { params });
      this.checkRateLimit(response);

      return {
        data: response.data.data,
        paging: response.data.paging,
      };
    } catch (error) {
      if (error instanceof RateLimitException) throw error;
      if (error.response?.data?.error) {
        throw new InstagramApiException(error.response.data);
      }
      this.logger.error('Failed to fetch comments', error.message);
      throw new InternalServerErrorException('Failed to fetch comments from Instagram');
    }
  }

  /**
   * Replies to a specific comment.
   */
  async replyToComment(commentId: string, message: string, pageAccessToken: string): Promise<string> {
    try {
      this.logger.log(`Replying to comment: ${commentId}`);
      
      const url = `https://graph.facebook.com/${this.graphApiVersion}/${commentId}/replies`;
      
      const params = {
        access_token: pageAccessToken,
        message: message,
      };

      const response = await axios.post(url, null, { params });
      this.checkRateLimit(response);

      return response.data.id; // Returns the ID of the new reply comment
    } catch (error) {
      if (error instanceof RateLimitException) throw error;
      if (error.response?.data?.error) {
        throw new InstagramApiException(error.response.data);
      }
      this.logger.error('Failed to reply to comment', error.message);
      throw new InternalServerErrorException('Failed to post reply to Instagram');
    }
  }
}
