import { Body, Controller, Post, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InstagramPublishingService } from '../services/instagram-publishing.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { Request } from 'express';

@Controller('api/v1/instagram/posts')
export class InstagramPostsController {
  constructor(private readonly instagramPublishingService: InstagramPublishingService) {}

  /**
   * Endpoint to instantly publish a post to Instagram.
   */
  @Post('publish')
  async publishPost(@Body() dto: CreatePostDto, @Req() req: Request) {
    // In a real application, you would:
    // 1. Get the logged-in user from `req.user`
    // 2. Query your database (Prisma) to ensure the user owns `dto.igUserId`
    // 3. Retrieve the `pageAccessToken` from the database for that account.
    
    // For demonstration, we simulate the database retrieval.
    const mockPageAccessToken = 'EAABabcd1234...'; 

    if (!mockPageAccessToken) {
      throw new UnauthorizedException('No valid Instagram/Facebook token found for this account. Please reconnect.');
    }

    // Pass the DTO and the secure token to the service
    const platformPostId = await this.instagramPublishingService.publish(dto, mockPageAccessToken);

    return {
      success: true,
      message: 'Post successfully published to Instagram.',
      data: {
        platformPostId,
      },
    };
  }
}
