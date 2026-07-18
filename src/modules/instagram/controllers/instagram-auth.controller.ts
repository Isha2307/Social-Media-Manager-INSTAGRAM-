import { Controller, Get, Query, Redirect, Req, Res, BadRequestException } from '@nestjs/common';
import { InstagramAuthService } from '../services/instagram-auth.service';
import { OAuthCallbackDto } from '../dto/instagram-auth.dto';
import { Request, Response } from 'express';

@Controller('api/v1/instagram/auth')
export class InstagramAuthController {
  constructor(private readonly instagramAuthService: InstagramAuthService) {}

  /**
   * Redirects the user to the Meta OAuth login page.
   */
  @Get('login')
  @Redirect()
  login() {
    const url = this.instagramAuthService.getOAuthLoginUrl();
    return { url };
  }

  /**
   * Handles the callback from Meta after the user authenticates.
   */
  @Get('callback')
  async callback(@Query() query: OAuthCallbackDto, @Req() req: Request, @Res() res: Response) {
    if (query.error) {
      // User denied the request or something went wrong on Meta's end
      throw new BadRequestException(`OAuth Error: ${query.error_description || query.error_reason || query.error}`);
    }

    if (!query.code) {
      throw new BadRequestException('Authorization code is missing.');
    }

    // In a real application, you would extract the logged-in user's ID from the request (e.g., via a JWT Auth Guard).
    // For demonstration, we'll use a placeholder UUID.
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000'; 

    // Exchange the code for the access token and save it
    await this.instagramAuthService.exchangeCodeForToken(query.code, mockUserId);

    // Redirect the user back to the frontend dashboard on success
    // Using a placeholder URL for the frontend
    const frontendSuccessUrl = 'http://localhost:3000/dashboard?instagram_connected=true';
    return res.redirect(frontendSuccessUrl);
  }
}
