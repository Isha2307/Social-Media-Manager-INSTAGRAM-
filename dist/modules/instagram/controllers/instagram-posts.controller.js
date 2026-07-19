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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramPostsController = void 0;
const common_1 = require("@nestjs/common");
const instagram_publishing_service_1 = require("../services/instagram-publishing.service");
const create_post_dto_1 = require("../dto/create-post.dto");
const prisma_service_1 = require("../../../prisma.service");
let InstagramPostsController = class InstagramPostsController {
    constructor(instagramPublishingService, prisma) {
        this.instagramPublishingService = instagramPublishingService;
        this.prisma = prisma;
    }
    async publishPost(dto) {
        const platformPostId = await this.instagramPublishingService.publish(dto);
        return {
            success: true,
            message: 'Post successfully published to Instagram.',
            data: {
                platformPostId,
            },
        };
    }
    async schedulePost(dto) {
        if (!dto.scheduledAt) {
            throw new common_1.BadRequestException('scheduledAt parameter is required for scheduling a post.');
        }
        const post = await this.instagramPublishingService.schedule(dto);
        return {
            success: true,
            message: 'Post successfully scheduled.',
            data: post,
        };
    }
    async getPosts(igUserId) {
        if (!igUserId) {
            throw new common_1.BadRequestException('igUserId query parameter is required.');
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
};
exports.InstagramPostsController = InstagramPostsController;
__decorate([
    (0, common_1.Post)('publish'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_post_dto_1.CreatePostDto]),
    __metadata("design:returntype", Promise)
], InstagramPostsController.prototype, "publishPost", null);
__decorate([
    (0, common_1.Post)('schedule'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_post_dto_1.CreatePostDto]),
    __metadata("design:returntype", Promise)
], InstagramPostsController.prototype, "schedulePost", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('igUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InstagramPostsController.prototype, "getPosts", null);
exports.InstagramPostsController = InstagramPostsController = __decorate([
    (0, common_1.Controller)('api/v1/instagram/posts'),
    __metadata("design:paramtypes", [instagram_publishing_service_1.InstagramPublishingService,
        prisma_service_1.PrismaService])
], InstagramPostsController);
//# sourceMappingURL=instagram-posts.controller.js.map