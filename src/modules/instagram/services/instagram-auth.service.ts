import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class InstagramAuthService {
  private readonly logger = new Logger(InstagramAuthService.name);
  private readonly graphApiVersion: string;
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;

  constructor(private configService: ConfigService) {
    this.graphApiVersion = this.configService.get<string>('META_GRAPH_API_VERSION') || 'v19.0';
    this.appId = this.configService.get<string>('META_APP_ID');
    this.appSecret = this.configService.get<string>('META_APP_SECRET');
    this.redirectUri = this.configService.get<string>('META_OAUTH_REDIRECT_URI');
  }

  /**
   * Constructs the URL to redirect the user to Meta for authentication.
   */
  getOAuthLoginUrl(): string {
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
    ].join(',');

    return `https://www.facebook.com/${this.graphApiVersion}/dialog/oauth?client_id=${this.appId}&redirect_uri=${this.redirectUri}&scope=${scopes}&response_type=code`;
  }

  /**
   * Exchanges the authorization code for a short-lived access token,
   * then exchanges it for a long-lived token, and fetches the Page token.
   * Finally, saves the token to the database.
   * 
   * @param code The authorization code from Meta's redirect
   * @param userId The ID of the authenticated user in our system
   */
  async exchangeCodeForToken(code: string, userId: string): Promise<any> {
    try {
      this.logger.log(`Exchanging code for short-lived token for user ${userId}...`);
      
      // 1. Get Short-Lived Token
      const shortLivedTokenResponse = await axios.get(`https://graph.facebook.com/${this.graphApiVersion}/oauth/access_token`, {
        params: {
          client_id: this.appId,
          redirect_uri: this.redirectUri,
          client_secret: this.appSecret,
          code: code,
        },
      });
      
      const shortLivedToken = shortLivedTokenResponse.data.access_token;

      // 2. Exchange for Long-Lived Token
      this.logger.log(`Exchanging short-lived token for long-lived token...`);
      const longLivedTokenResponse = await axios.get(`https://graph.facebook.com/${this.graphApiVersion}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });

      const longLivedToken = longLivedTokenResponse.data.access_token;
      
      // 3. Fetch User's Pages to get Page Access Token
      this.logger.log(`Fetching Facebook Pages to retrieve Page Access Token...`);
      const pagesResponse = await axios.get(`https://graph.facebook.com/${this.graphApiVersion}/me/accounts`, {
        params: {
          access_token: longLivedToken,
        },
      });

      // Note: In a real scenario, the user might have multiple pages. 
      // We are picking the first one for demonstration, or you'd prompt the user to select one.
      if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
        throw new Error('No Facebook Pages found for this user.');
      }
      
      const pageData = pagesResponse.data.data[0];
      const pageAccessToken = pageData.access_token;
      const facebookPageId = pageData.id;

      // 4. Fetch the linked Instagram Business Account ID
      const igAccountResponse = await axios.get(`https://graph.facebook.com/${this.graphApiVersion}/${facebookPageId}`, {
        params: {
          fields: 'instagram_business_account',
          access_token: pageAccessToken,
        },
      });

      const igUserId = igAccountResponse.data.instagram_business_account?.id;
      if (!igUserId) {
        throw new Error('No linked Instagram Business Account found for this Facebook Page.');
      }

      // 5. Calculate expiration if available (Page tokens usually do not expire, but long-lived do)
      // If we use Page Token, it is non-expiring until password change/revocation.
      // We will save it to the DB. (Using a mock DB call for now as Prisma isn't fully set up yet)
      
      this.logger.log(`Successfully retrieved IG User ID: ${igUserId}. Saving to DB...`);
      
      /*
      // Example Prisma Call:
      await this.prisma.instagramAccount.create({
        data: {
          userId: userId,
          igUserId: igUserId,
          username: 'fetched_username', // Would need another API call to fetch username
          facebookPageId: facebookPageId,
          tokens: {
            create: {
              accessToken: pageAccessToken, // Should encrypt this
              tokenType: 'PAGE',
              scopes: ['instagram_basic', 'pages_read_engagement', 'instagram_content_publish'],
              expiresAt: null, // Page tokens are non-expiring
            }
          }
        }
      });
      */

      return {
        success: true,
        message: 'Instagram account successfully linked.',
        igUserId,
        facebookPageId,
      };

    } catch (error) {
      this.logger.error('Failed to exchange code for token', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to link Instagram account.');
    }
  }
}
