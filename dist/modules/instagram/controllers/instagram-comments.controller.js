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
exports.InstagramCommentsController = void 0;
const common_1 = require("@nestjs/common");
const instagram_comments_service_1 = require("../services/instagram-comments.service");
const fetch_comments_dto_1 = require("../dto/fetch-comments.dto");
const reply_comment_dto_1 = require("../dto/reply-comment.dto");
let InstagramCommentsController = class InstagramCommentsController {
    constructor(instagramCommentsService) {
        this.instagramCommentsService = instagramCommentsService;
    }
    getMockPageAccessToken() {
        const mockPageAccessToken = 'EAABabcd1234...';
        if (!mockPageAccessToken) {
            throw new common_1.UnauthorizedException('No valid Instagram/Facebook token found for this account.');
        }
        return mockPageAccessToken;
    }
    async getComments(mediaId, query, req) {
        const token = this.getMockPageAccessToken();
        const result = await this.instagramCommentsService.fetchComments(mediaId, query.limit, query.after, token);
        return {
            success: true,
            ...result,
        };
    }
    async replyToComment(commentId, body, req) {
        const token = this.getMockPageAccessToken();
        const replyId = await this.instagramCommentsService.replyToComment(commentId, body.message, token);
        return {
            success: true,
            message: 'Reply successfully posted.',
            data: {
                replyId,
            },
        };
    }
};
exports.InstagramCommentsController = InstagramCommentsController;
__decorate([
    (0, common_1.Get)('media/:mediaId/comments'),
    __param(0, (0, common_1.Param)('mediaId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, fetch_comments_dto_1.FetchCommentsDto, Object]),
    __metadata("design:returntype", Promise)
], InstagramCommentsController.prototype, "getComments", null);
__decorate([
    (0, common_1.Post)('comments/:commentId/reply'),
    __param(0, (0, common_1.Param)('commentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reply_comment_dto_1.ReplyCommentDto, Object]),
    __metadata("design:returntype", Promise)
], InstagramCommentsController.prototype, "replyToComment", null);
exports.InstagramCommentsController = InstagramCommentsController = __decorate([
    (0, common_1.Controller)('api/v1/instagram'),
    __metadata("design:paramtypes", [instagram_comments_service_1.InstagramCommentsService])
], InstagramCommentsController);
//# sourceMappingURL=instagram-comments.controller.js.map