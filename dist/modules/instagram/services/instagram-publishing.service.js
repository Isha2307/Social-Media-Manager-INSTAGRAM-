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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var InstagramPublishingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramPublishingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
const axios_1 = require("axios");
const create_post_dto_1 = require("../dto/create-post.dto");
const instagram_api_exception_1 = require("../exceptions/instagram-api.exception");
const prisma_service_1 = require("../../../prisma.service");
let InstagramPublishingService = InstagramPublishingService_1 = class InstagramPublishingService {
    constructor(configService, prisma, publishingQueue) {
        this.configService = configService;
        this.prisma = prisma;
        this.publishingQueue = publishingQueue;
        this.logger = new common_1.Logger(InstagramPublishingService_1.name);
        this.graphApiVersion = this.configService.get('META_GRAPH_API_VERSION') || 'v19.0';
    }
    async publish(dto, pageAccessToken) {
        let token = pageAccessToken;
        if (!token) {
            const account = await this.prisma.instagramAccount.findUnique({
                where: { igUserId: dto.igUserId },
            });
            if (!account) {
                throw new common_1.NotFoundException(`Instagram account ${dto.igUserId} not linked.`);
            }
            token = account.accessToken;
        }
        const post = await this.prisma.instagramPost.create({
            data: {
                igUserId: dto.igUserId,
                caption: dto.caption || null,
                mediaUrl: dto.mediaUrl,
                mediaType: dto.mediaType,
                status: 'PUBLISHING',
            },
        });
        try {
            this.logger.log(`Starting publish process for IG Account: ${dto.igUserId}, Post ID: ${post.id}`);
            const creationId = await this.createMediaContainer(dto, token);
            if (dto.mediaType === create_post_dto_1.MediaType.VIDEO) {
                await this.waitForVideoProcessing(creationId, token);
            }
            const platformPostId = await this.publishMediaContainer(dto.igUserId, creationId, token);
            await this.prisma.instagramPost.update({
                where: { id: post.id },
                data: {
                    status: 'PUBLISHED',
                    platformPostId,
                },
            });
            this.logger.log(`Successfully published post to Instagram. Platform ID: ${platformPostId}`);
            return platformPostId;
        }
        catch (error) {
            let errorMsg = error.message;
            if (error.response?.data?.error) {
                errorMsg = JSON.stringify(error.response.data.error);
            }
            await this.prisma.instagramPost.update({
                where: { id: post.id },
                data: {
                    status: 'FAILED',
                    errorMessage: errorMsg,
                },
            });
            if (error.response?.data?.error) {
                throw new instagram_api_exception_1.InstagramApiException(error.response.data);
            }
            this.logger.error('Failed to publish post', error.message);
            throw new common_1.InternalServerErrorException('Failed to publish post to Instagram');
        }
    }
    async publishById(postId) {
        const post = await this.prisma.instagramPost.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new common_1.NotFoundException(`Post ${postId} not found.`);
        }
        if (post.status === 'PUBLISHED') {
            return post.platformPostId;
        }
        const account = await this.prisma.instagramAccount.findUnique({
            where: { igUserId: post.igUserId },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Instagram account ${post.igUserId} not linked.`);
        }
        await this.prisma.instagramPost.update({
            where: { id: postId },
            data: { status: 'PUBLISHING' },
        });
        try {
            const dto = {
                igUserId: post.igUserId,
                caption: post.caption,
                mediaUrl: post.mediaUrl,
                mediaType: post.mediaType,
            };
            this.logger.log(`Publishing scheduled post ${postId}...`);
            const creationId = await this.createMediaContainer(dto, account.accessToken);
            if (dto.mediaType === create_post_dto_1.MediaType.VIDEO) {
                await this.waitForVideoProcessing(creationId, account.accessToken);
            }
            const platformPostId = await this.publishMediaContainer(dto.igUserId, creationId, account.accessToken);
            await this.prisma.instagramPost.update({
                where: { id: postId },
                data: {
                    status: 'PUBLISHED',
                    platformPostId,
                },
            });
            this.logger.log(`Successfully published scheduled post to Instagram. Platform ID: ${platformPostId}`);
            return platformPostId;
        }
        catch (error) {
            let errorMsg = error.message;
            if (error.response?.data?.error) {
                errorMsg = JSON.stringify(error.response.data.error);
            }
            await this.prisma.instagramPost.update({
                where: { id: postId },
                data: {
                    status: 'FAILED',
                    errorMessage: errorMsg,
                },
            });
            this.logger.error(`Failed to publish scheduled post ${postId}`, error.message);
            throw error;
        }
    }
    async schedule(dto) {
        if (!dto.scheduledAt) {
            throw new common_1.InternalServerErrorException('scheduledAt is required to schedule a post.');
        }
        const scheduledDate = new Date(dto.scheduledAt);
        const delay = scheduledDate.getTime() - Date.now();
        const post = await this.prisma.instagramPost.create({
            data: {
                igUserId: dto.igUserId,
                caption: dto.caption || null,
                mediaUrl: dto.mediaUrl,
                mediaType: dto.mediaType,
                status: 'SCHEDULED',
                scheduledAt: scheduledDate,
            },
        });
        await this.publishingQueue.add('publish-post', { postId: post.id }, {
            delay: Math.max(0, delay),
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
        this.logger.log(`Post ${post.id} scheduled for ${scheduledDate.toISOString()} with delay ${delay}ms`);
        return post;
    }
    async createMediaContainer(dto, accessToken) {
        const url = `https://graph.facebook.com/${this.graphApiVersion}/${dto.igUserId}/media`;
        const params = {
            access_token: accessToken,
            caption: dto.caption || '',
        };
        if (dto.mediaType === create_post_dto_1.MediaType.IMAGE) {
            params.image_url = dto.mediaUrl;
        }
        else if (dto.mediaType === create_post_dto_1.MediaType.VIDEO) {
            params.media_type = 'VIDEO';
            params.video_url = dto.mediaUrl;
        }
        this.logger.log(`Creating media container (Type: ${dto.mediaType})...`);
        const response = await axios_1.default.post(url, null, { params });
        return response.data.id;
    }
    async waitForVideoProcessing(creationId, accessToken) {
        this.logger.log(`Waiting for video container ${creationId} to finish processing...`);
        const url = `https://graph.facebook.com/${this.graphApiVersion}/${creationId}`;
        let isFinished = false;
        let attempts = 0;
        const maxAttempts = 20;
        while (!isFinished && attempts < maxAttempts) {
            const response = await axios_1.default.get(url, {
                params: {
                    fields: 'status_statusCode',
                    access_token: accessToken,
                },
            });
            const status = response.data.status_statusCode;
            if (status === 'FINISHED') {
                isFinished = true;
                this.logger.log(`Video container ${creationId} processing FINISHED.`);
            }
            else if (status === 'ERROR') {
                throw new Error('Meta failed to process the video container.');
            }
            else {
                attempts++;
                this.logger.log(`Video processing status: ${status}. Waiting 15 seconds...`);
                await new Promise((resolve) => setTimeout(resolve, 15000));
            }
        }
        if (!isFinished) {
            throw new Error('Timeout while waiting for video processing to finish.');
        }
    }
    async publishMediaContainer(igUserId, creationId, accessToken) {
        const url = `https://graph.facebook.com/${this.graphApiVersion}/${igUserId}/media_publish`;
        this.logger.log(`Publishing container ${creationId}...`);
        const response = await axios_1.default.post(url, null, {
            params: {
                creation_id: creationId,
                access_token: accessToken,
            },
        });
        return response.data.id;
    }
};
exports.InstagramPublishingService = InstagramPublishingService;
exports.InstagramPublishingService = InstagramPublishingService = InstagramPublishingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_1.InjectQueue)('instagram-publishing')),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService, Object])
], InstagramPublishingService);
//# sourceMappingURL=instagram-publishing.service.js.map