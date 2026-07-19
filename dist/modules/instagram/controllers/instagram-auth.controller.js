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
exports.InstagramAuthController = void 0;
const common_1 = require("@nestjs/common");
const instagram_auth_service_1 = require("../services/instagram-auth.service");
const instagram_auth_dto_1 = require("../dto/instagram-auth.dto");
const prisma_service_1 = require("../../../prisma.service");
let InstagramAuthController = class InstagramAuthController {
    constructor(instagramAuthService, prisma) {
        this.instagramAuthService = instagramAuthService;
        this.prisma = prisma;
    }
    login() {
        const url = this.instagramAuthService.getOAuthLoginUrl();
        return { url };
    }
    async callback(query, req, res) {
        if (query.error) {
            throw new common_1.BadRequestException(`OAuth Error: ${query.error_description || query.error_reason || query.error}`);
        }
        if (!query.code) {
            throw new common_1.BadRequestException('Authorization code is missing.');
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
    async connectWithToken(body) {
        if (!body?.accessToken) {
            throw new common_1.BadRequestException('accessToken is required.');
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
    async getAccounts() {
        const accounts = await this.prisma.instagramAccount.findMany({
            select: { igUserId: true, username: true, facebookPageId: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        return { accounts };
    }
};
exports.InstagramAuthController = InstagramAuthController;
__decorate([
    (0, common_1.Get)('login'),
    (0, common_1.Redirect)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InstagramAuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [instagram_auth_dto_1.OAuthCallbackDto, Object, Object]),
    __metadata("design:returntype", Promise)
], InstagramAuthController.prototype, "callback", null);
__decorate([
    (0, common_1.Post)('connect-token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstagramAuthController.prototype, "connectWithToken", null);
__decorate([
    (0, common_1.Get)('accounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstagramAuthController.prototype, "getAccounts", null);
exports.InstagramAuthController = InstagramAuthController = __decorate([
    (0, common_1.Controller)('api/v1/instagram/auth'),
    __metadata("design:paramtypes", [instagram_auth_service_1.InstagramAuthService,
        prisma_service_1.PrismaService])
], InstagramAuthController);
//# sourceMappingURL=instagram-auth.controller.js.map