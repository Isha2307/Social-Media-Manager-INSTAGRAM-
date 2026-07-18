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
var InstagramWebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramWebhookService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
let InstagramWebhookService = InstagramWebhookService_1 = class InstagramWebhookService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(InstagramWebhookService_1.name);
        this.appSecret = this.configService.get('META_APP_SECRET');
        this.verifyToken = this.configService.get('META_WEBHOOK_VERIFY_TOKEN') || 'my_secure_verify_token';
    }
    verifySetup(mode, token, challenge) {
        if (mode === 'subscribe' && token === this.verifyToken) {
            this.logger.log('Webhook verified successfully!');
            return challenge;
        }
        this.logger.warn('Failed webhook verification challenge.');
        throw new common_1.UnauthorizedException('Invalid verify token');
    }
    verifySignature(signature, rawBody) {
        if (!signature || !signature.startsWith('sha256='))
            return false;
        const expectedSignature = crypto
            .createHmac('sha256', this.appSecret)
            .update(rawBody)
            .digest('hex');
        const actualSignature = signature.replace('sha256=', '');
        try {
            return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(actualSignature));
        }
        catch (e) {
            return false;
        }
    }
    async enqueueWebhookEvent(payload) {
        this.logger.log('Enqueuing webhook event for background processing...');
        this.logger.log('Mock: Job added to BullMQ Queue');
    }
};
exports.InstagramWebhookService = InstagramWebhookService;
exports.InstagramWebhookService = InstagramWebhookService = InstagramWebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], InstagramWebhookService);
//# sourceMappingURL=instagram-webhook.service.js.map