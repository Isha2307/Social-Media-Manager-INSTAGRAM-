import { Body, Controller, Post, Get, Query, Req, BadRequestException } from '@nestjs/common';
import { InstagramPublishingService } from '../services/instagram-publishing.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { PrismaService } from '../../../prisma.service';

@Controller('api/v1/instagram/posts')
export class InstagramPostsController {
  constructor(
    private readonly instagramPublishingService: InstagramPublishingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Endpoint to instantly publish a post to Instagram.
   */
  @Post('publish')
  async publishPost(@Body() dto: CreatePostDto) {
    const platformPostId = await this.instagramPublishingService.publish(dto);

    return {
      success: true,
      message: 'Post successfully published to Instagram.',
      data: {
        platformPostId,
      },
    };
  }

  /**
   * Endpoint to schedule a post for future publication.
   */
  @Post('schedule')
  async schedulePost(@Body() dto: CreatePostDto) {
    if (!dto.scheduledAt) {
      throw new BadRequestException('scheduledAt parameter is required for scheduling a post.');
    }

    const post = await this.instagramPublishingService.schedule(dto);

    return {
      success: true,
      message: 'Post successfully scheduled.',
      data: post,
    };
  }

  /**
   * Retrieves posts for a given Instagram Business Account to populate content calendar / post logs.
   */
  @Get()
  async getPosts(@Query('igUserId') igUserId: string) {
    if (!igUserId) {
      throw new BadRequestException('igUserId query parameter is required.');
    }

    const posts = await this.prisma.instagramPost.findMany({
      where: { igUserId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: posts,
    };
  }
}
