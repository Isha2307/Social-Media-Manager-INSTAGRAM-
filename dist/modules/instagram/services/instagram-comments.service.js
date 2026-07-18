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
var InstagramCommentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramCommentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const instagram_api_exception_1 = require("../exceptions/instagram-api.exception");
const rate_limit_exception_1 = require("../exceptions/rate-limit.exception");
let InstagramCommentsService = InstagramCommentsService_1 = class InstagramCommentsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(InstagramCommentsService_1.name);
        this.graphApiVersion = this.configService.get('META_GRAPH_API_VERSION') || 'v19.0';
    }
    checkRateLimit(response) {
        const usageHeader = response.headers['x-business-use-case-usage'];
        if (usageHeader) {
            try {
                const usageData = JSON.parse(usageHeader);
                for (const key in usageData) {
                    const limits = usageData[key];
                    for (const limit of limits) {
                        const maxUsage = Math.max(limit.call_count || 0, limit.total_time || 0, limit.total_cputime || 0);
                        this.logger.debug(`Current Instagram API Usage: ${maxUsage}%`);
                        if (maxUsage >= 90) {
                            this.logger.warn(`Rate limit warning! Usage is at ${maxUsage}%`);
                            throw new rate_limit_exception_1.RateLimitException(maxUsage);
                        }
                    }
                }
            }
            catch (e) {
                if (e instanceof rate_limit_exception_1.RateLimitException)
                    throw e;
                this.logger.error('Failed to parse rate limit header', e.message);
            }
        }
    }
    async fetchComments(mediaId, limit, after, pageAccessToken) {
        try {
            this.logger.log(`Fetching comments for media: ${mediaId}`);
            const url = `https://graph.facebook.com/${this.graphApiVersion}/${mediaId}/comments`;
            const params = {
                access_token: pageAccessToken,
                fields: 'id,text,timestamp,username,replies',
                limit: limit,
            };
            if (after) {
                params.after = after;
            }
            const response = await axios_1.default.get(url, { params });
            this.checkRateLimit(response);
            return {
                data: response.data.data,
                paging: response.data.paging,
            };
        }
        catch (error) {
            if (error instanceof rate_limit_exception_1.RateLimitException)
                throw error;
            if (error.response?.data?.error) {
                throw new instagram_api_exception_1.InstagramApiException(error.response.data);
            }
            this.logger.error('Failed to fetch comments', error.message);
            throw new common_1.InternalServerErrorException('Failed to fetch comments from Instagram');
        }
    }
    async replyToComment(commentId, message, pageAccessToken) {
        try {
            this.logger.log(`Replying to comment: ${commentId}`);
            const url = `https://graph.facebook.com/${this.graphApiVersion}/${commentId}/replies`;
            const params = {
                access_token: pageAccessToken,
                message: message,
            };
            const response = await axios_1.default.post(url, null, { params });
            this.checkRateLimit(response);
            return response.data.id;
        }
        catch (error) {
            if (error instanceof rate_limit_exception_1.RateLimitException)
                throw error;
            if (error.response?.data?.error) {
                throw new instagram_api_exception_1.InstagramApiException(error.response.data);
            }
            this.logger.error('Failed to reply to comment', error.message);
            throw new common_1.InternalServerErrorException('Failed to post reply to Instagram');
        }
    }
};
exports.InstagramCommentsService = InstagramCommentsService;
exports.InstagramCommentsService = InstagramCommentsService = InstagramCommentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], InstagramCommentsService);
//# sourceMappingURL=instagram-comments.service.js.map