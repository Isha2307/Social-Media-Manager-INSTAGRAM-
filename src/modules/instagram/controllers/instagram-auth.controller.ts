import { Controller, Get, Post, Body, Query, Redirect, Req, Res, BadRequestException } from '@nestjs/common';
import { InstagramAuthService } from '../services/instagram-auth.service';
import { OAuthCallbackDto } from '../dto/instagram-auth.dto';
import { Request, Response } from 'express';
import { PrismaService } from '../../../prisma.service';

@Controller('api/v1/instagram/auth')
export class InstagramAuthController {
  constructor(
    private readonly instagramAuthService: InstagramAuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('login')
  @Redirect()
  login() {
    const url = this.instagramAuthService.getOAuthLoginUrl();
    return { url };
  }

  @Get('callback')
  async callback(@Query() query: OAuthCallbackDto, @Req() req: Request, @Res() res: Response) {
    if (query.error) {
      throw new BadRequestException(`OAuth Error: ${query.error_description || query.error_reason || query.error}`);
    }
    if (!query.code) {
      throw new BadRequestException('Authorization code is missing.');
    }
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const result = await this.instagramAuthService.exchangeCodeForToken(query.code, mockUserId);
    const params = new URLSearchParams({
      connected: 'true',
      username: result.username,
      igUserId: result.igUserId,
    });
    return res.redirect(`http://localhost:3000/?${params.toString()}`);
  }

  /**
   * Developer Quick Connect — paste a User Access Token from Graph API Explorer.
   * No browser login needed. Token is exchanged for long-lived + IG account saved.
   * POST /api/v1/instagram/auth/connect-token
   * Body: { "accessToken": "EAAxxxxx..." }
   */
  @Post('connect-token')
  async connectWithToken(@Body() body: { accessToken: string }) {
    if (!body?.accessToken) {
      throw new BadRequestException('accessToken is required.');
    }
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const result = await this.instagramAuthService.connectWithAccessToken(body.accessToken, mockUserId);
    return {
      success: true,
      message: `Instagram account @${result.username} linked successfully.`,
      igUserId: result.igUserId,
      username: result.username,
    };
  }

  @Get('accounts')
  async getAccounts() {
    const accounts = await this.prisma.instagramAccount.findMany({
      select: { igUserId: true, username: true, facebookPageId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return { accounts };
  }
}
