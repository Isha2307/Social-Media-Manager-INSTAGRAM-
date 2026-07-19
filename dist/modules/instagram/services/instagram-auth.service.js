"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InstagramAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const prisma_service_1 = require("../../../prisma.service");
let InstagramAuthService = InstagramAuthService_1 = class InstagramAuthService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(InstagramAuthService_1.name);
        this.graphApiVersion = this.configService.get('META_GRAPH_API_VERSION') || 'v19.0';
        this.appId = this.configService.get('META_APP_ID');
        this.appSecret = this.configService.get('META_APP_SECRET');
        this.redirectUri = this.configService.get('META_OAUTH_REDIRECT_URI');
    }
    getOAuthLoginUrl() {
        const configId = this.configService.get('META_CONFIG_ID');
        if (configId) {
            this.logger.log(`Generating OAuth URL using Business config_id: ${configId}`);
            return `https://www.facebook.com/${this.graphApiVersion}/dialog/oauth?client_id=${this.appId}&redirect_uri=${this.redirectUri}&config_id=${configId}&response_type=code`;
        }
        this.logger.log('Generating OAuth URL using standard scopes');
        const scopes = [
            'instagram_basic',
            'instagram_content_publish',
            'pages_show_list',
            'pages_read_engagement',
        ].join(',');
        return `https://www.facebook.com/${this.graphApiVersion}/dialog/oauth?client_id=${this.appId}&redirect_uri=${this.redirectUri}&scope=${scopes}&response_type=code`;
    }
    async exchangeCodeForToken(code, userId) {
        try {
            this.logger.log(`Exchanging code for short-lived token for user ${userId}...`);
            const shortLivedTokenResponse = await axios_1.default.get(`https://graph.facebook.com/${this.graphApiVersion}/oauth/access_token`, {
                params: {
                    client_id: this.appId,
                    redirect_uri: this.redirectUri,
                    client_secret: this.appSecret,
                    code: code,
                },
            });
            const shortLivedToken = shortLivedTokenResponse.data.access_token;
            this.logger.log(`Exchanging short-lived token for long-lived token...`);
            const longLivedTokenResponse = await axios_1.default.get(`https://graph.facebook.com/${this.graphApiVersion}/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: this.appId,
                    client_secret: this.appSecret,
                    fb_exchange_token: shortLivedToken,
                },
            });
            const longLivedToken = longLivedTokenResponse.data.access_token;
            this.logger.log(`Fetching Facebook Pages to retrieve Page Access Token...`);
            const pagesResponse = await axios_1.default.get(`https://graph.facebook.com/${this.graphApiVersion}/me/accounts`, {
                params: {
                    access_token: longLivedToken,
                },
            });
            if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
                throw new Error('No Facebook Pages found for this user.');
            }
            const pageData = pagesResponse.data.data[0];
            const pageAccessToken = pageData.access_token;
            const facebookPageId = pageData.id;
            const igAccountResponse = await axios_1.default.get(`https://graph.facebook.com/${this.graphApiVersion}/${facebookPageId}`, {
                params: {
                    fields: 'instagram_business_account',
                    access_token: pageAccessToken,
                },
            });
            const igUserId = igAccountResponse.data.instagram_business_account?.id;
            if (!igUserId) {
                throw new Error('No linked Instagram Business Account found for this Facebook Page.');
            }
            this.logger.log(`Fetching Instagram username for IG User ID: ${igUserId}...`);
            const igProfileResponse = await axios_1.default.get(`https://graph.facebook.com/${this.graphApiVersion}/${igUserId}`, {
                params: {
                    fields: 'username',
                    access_token: pageAccessToken,
                },
            });
            const username = igProfileResponse.data.username || 'instagram_user';
            this.logger.log(`Successfully retrieved IG User ID: ${igUserId} (@${username}). Saving to DB...`);
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
        }
        catch (error) {
            this.logger.error('Failed to exchange code for token', error.response?.data || error.message);
            throw new common_1.InternalServerErrorException('Failed to link Instagram account.');
        }
    }
    async connectWithAccessToken(userAccessToken, userId) {
        try {
            this.logger.log(`[Quick Connect] Using provided access token directly...`);
            const meRes = await axios_1.default.get(`https://graph.facebook.com/${this.graphApiVersion}/me`, {
                params: { fields: 'id,name', access_token: userAccessToken },
            });
            this.logger.log(`[Quick Connect] Token valid for user: ${meRes.data.name} (${meRes.data.id})`);
            const pagesRes = await axios_1.default.get(`https://graph.facebook.com/${this.graphApiVersion}/me/accounts`, {
                params: { access_token: userAccessToken },
            });
            if (!pagesRes.data.data || pagesRes.data.data.length === 0) {
                throw new Error('No Facebook Pages found. Your account must manage a Facebook Page that is linked to an Instagram Business/Creator account.');
            }
            const pageData = pagesRes.data.data[0];
            const pageAccessToken = pageData.access_token;
            const facebookPageId = pageData.id;
            this.logger.log(`[Quick Connect] Found Facebook Page: ${pageData.name} (${facebookPageId})`);
            const igRes = await axios_1.default.get(`https://graph.facebook.com/${this.graphApiVersion}/${facebookPageId}`, {
                params: { fields: 'instagram_business_account', access_token: pageAccessToken },
            });
            const igUserId = igRes.data.instagram_business_account?.id;
            if (!igUserId) {
                throw new Error('No Instagram Business/Creator account is linked to this Facebook Page. Go to Instagram Settings → Switch to Professional Account, then link it to your Facebook Page.');
            }
            const profileRes = await axios_1.default.get(`https://graph.facebook.com/${this.graphApiVersion}/${igUserId}`, {
                params: { fields: 'username,name', access_token: pageAccessToken },
            });
            const username = profileRes.data.username || profileRes.data.name || 'instagram_user';
            this.logger.log(`[Quick Connect] Linked @${username} (IG ID: ${igUserId}). Saving to DB...`);
            await this.prisma.instagramAccount.upsert({
                where: { igUserId },
                update: { userId, username, facebookPageId, accessToken: pageAccessToken },
                create: { userId, igUserId, username, facebookPageId, accessToken: pageAccessToken },
            });
            return { success: true, igUserId, username, facebookPageId };
        }
        catch (error) {
            this.logger.error('[Quick Connect] Failed', error.response?.data || error.message);
            throw new common_1.InternalServerErrorException(error.response?.data?.error?.message || error.message || 'Failed to connect with access token.');
        }
    }
};
exports.InstagramAuthService = InstagramAuthService;
exports.InstagramAuthService = InstagramAuthService = InstagramAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], InstagramAuthService);
//# sourceMappingURL=instagram-auth.service.js.map