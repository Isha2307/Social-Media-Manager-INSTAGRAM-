import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class InstagramAuthService {
  private readonly logger = new Logger(InstagramAuthService.name);
  private readonly graphApiVersion: string;
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.graphApiVersion = this.configService.get<string>('META_GRAPH_API_VERSION') || 'v19.0';
    this.appId = this.configService.get<string>('META_APP_ID');
    this.appSecret = this.configService.get<string>('META_APP_SECRET');
    this.redirectUri = this.configService.get<string>('META_OAUTH_REDIRECT_URI');
  }

  /**
   * Constructs the URL to redirect the user to Meta for authentication.
   */
  getOAuthLoginUrl(): string {
    const configId = this.configService.get<string>('META_CONFIG_ID');

    if (configId) {
      // Facebook Login for Business flow (required for Business App type)
      this.logger.log(`Generating OAuth URL using Business config_id: ${configId}`);
      return `https://www.facebook.com/${this.graphApiVersion}/dialog/oauth?client_id=${this.appId}&redirect_uri=${this.redirectUri}&config_id=${configId}&response_type=code`;
    }

    // Standard Facebook Login flow (works for Consumer / Other app types)
    this.logger.log('Generating OAuth URL using standard scopes');
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

      // Fetch the username of the Instagram account
      this.logger.log(`Fetching Instagram username for IG User ID: ${igUserId}...`);
      const igProfileResponse = await axios.get(`https://graph.facebook.com/${this.graphApiVersion}/${igUserId}`, {
        params: {
          fields: 'username',
          access_token: pageAccessToken,
        },
      });
      const username = igProfileResponse.data.username || 'instagram_user';

      this.logger.log(`Successfully retrieved IG User ID: ${igUserId} (@${username}). Saving to DB...`);
      
      // Save or update account in Prisma DB
      await this.prisma.instagramAccount.upsert({
        where: { igUserId },
        update: {
          userId,
          username,
          facebookPageId,
          accessToken: pageAccessToken,
        },
        create: {
          userId,
          igUserId,
          username,
          facebookPageId,
          accessToken: pageAccessToken,
        },
      });

      return {
        success: true,
        message: 'Instagram account successfully linked.',
        igUserId,
        facebookPageId,
        username,
      };

    } catch (error) {
      this.logger.error('Failed to exchange code for token', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to link Instagram account.');
    }
  }

  /**
   * Developer Quick Connect.
   * Accepts a raw User Access Token (from Graph API Explorer) and uses it directly
   * to look up the linked Facebook Pages and Instagram Business account.
   * No app-secret token exchange is needed — works with any valid User Access Token
   * that has pages_show_list + instagram_content_publish permissions.
   */
  async connectWithAccessToken(userAccessToken: string, userId: string): Promise<any> {
    try {
      this.logger.log(`[Quick Connect] Using provided access token directly...`);

      // 1. Verify the token is valid by calling /me
      const meRes = await axios.get(`https://graph.facebook.com/${this.graphApiVersion}/me`, {
        params: { fields: 'id,name', access_token: userAccessToken },
      });
      this.logger.log(`[Quick Connect] Token valid for user: ${meRes.data.name} (${meRes.data.id})`);

      // 2. Fetch user's Facebook Pages using the token directly
      const pagesRes = await axios.get(`https://graph.facebook.com/${this.graphApiVersion}/me/accounts`, {
        params: { access_token: userAccessToken },
      });
      if (!pagesRes.data.data || pagesRes.data.data.length === 0) {
        throw new Error('No Facebook Pages found. Your account must manage a Facebook Page that is linked to an Instagram Business/Creator account.');
      }
      const pageData = pagesRes.data.data[0];
      const pageAccessToken = pageData.access_token;
      const facebookPageId = pageData.id;
      this.logger.log(`[Quick Connect] Found Facebook Page: ${pageData.name} (${facebookPageId})`);

      // 3. Fetch linked Instagram Business Account from the page
      const igRes = await axios.get(`https://graph.facebook.com/${this.graphApiVersion}/${facebookPageId}`, {
        params: { fields: 'instagram_business_account', access_token: pageAccessToken },
      });
      const igUserId = igRes.data.instagram_business_account?.id;
      if (!igUserId) {
        throw new Error('No Instagram Business/Creator account is linked to this Facebook Page. Go to Instagram Settings → Switch to Professional Account, then link it to your Facebook Page.');
      }

      // 4. Fetch Instagram username
      const profileRes = await axios.get(`https://graph.facebook.com/${this.graphApiVersion}/${igUserId}`, {
        params: { fields: 'username,name', access_token: pageAccessToken },
      });
      const username = profileRes.data.username || profileRes.data.name || 'instagram_user';
      this.logger.log(`[Quick Connect] Linked @${username} (IG ID: ${igUserId}). Saving to DB...`);

      // 5. Save to DB (use page access token for all future API calls)
      await this.prisma.instagramAccount.upsert({
        where: { igUserId },
        update: { userId, username, facebookPageId, accessToken: pageAccessToken },
        create: { userId, igUserId, username, facebookPageId, accessToken: pageAccessToken },
      });

      return { success: true, igUserId, username, facebookPageId };

    } catch (error) {
      this.logger.error('[Quick Connect] Failed', error.response?.data || error.message);
      throw new InternalServerErrorException(
        error.response?.data?.error?.message || error.message || 'Failed to connect with access token.',
      );
    }
  }
}
