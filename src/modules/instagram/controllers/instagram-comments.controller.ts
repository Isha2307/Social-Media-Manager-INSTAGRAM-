import { Body, Controller, Get, Param, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import { InstagramCommentsService } from '../services/instagram-comments.service';
import { FetchCommentsDto } from '../dto/fetch-comments.dto';
import { ReplyCommentDto } from '../dto/reply-comment.dto';
import { Request } from 'express';

@Controller('api/v1/instagram')
export class InstagramCommentsController {
  constructor(private readonly instagramCommentsService: InstagramCommentsService) {}

  /**
   * Helper to mock getting the Page Access Token.
   * In reality, you look this up in the DB using req.user.
   */
  private getMockPageAccessToken(): string {
    const mockPageAccessToken = 'EAABabcd1234...'; 
    if (!mockPageAccessToken) {
      throw new UnauthorizedException('No valid Instagram/Facebook token found for this account.');
    }
    return mockPageAccessToken;
  }

  /**
   * Fetches comments for a given media post.
   */
  @Get('media/:mediaId/comments')
  async getComments(
    @Param('mediaId') mediaId: string,
    @Query() query: FetchCommentsDto,
    @Req() req: Request,
  ) {
    const token = this.getMockPageAccessToken();
    const result = await this.instagramCommentsService.fetchComments(
      mediaId,
      query.limit,
      query.after,
      token,
    );

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Replies to a specific comment.
   */
  @Post('comments/:commentId/reply')
  async replyToComment(
    @Param('commentId') commentId: string,
    @Body() body: ReplyCommentDto,
    @Req() req: Request,
  ) {
    const token = this.getMockPageAccessToken();
    const replyId = await this.instagramCommentsService.replyToComment(
      commentId,
      body.message,
      token,
    );

    return {
      success: true,
      message: 'Reply successfully posted.',
      data: {
        replyId,
      },
    };
  }
}
