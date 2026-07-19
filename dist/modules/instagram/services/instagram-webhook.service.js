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
var InstagramWebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramWebhookService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
const crypto = require("crypto");
const prisma_service_1 = require("../../../prisma.service");
let InstagramWebhookService = InstagramWebhookService_1 = class InstagramWebhookService {
    constructor(configService, prisma, webhookQueue) {
        this.configService = configService;
        this.prisma = prisma;
        this.webhookQueue = webhookQueue;
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
        this.logger.log('Logging and enqueuing webhook event for background processing...');
        let eventType = 'UNKNOWN';
        if (payload.entry && payload.entry[0]?.changes && payload.entry[0].changes[0]?.field) {
            eventType = payload.entry[0].changes[0].field;
        }
        const event = await this.prisma.webhookEvent.create({
            data: {
                eventType,
                payload: JSON.stringify(payload),
                status: 'PENDING',
            },
        });
        await this.webhookQueue.add('process-webhook', { payload, dbEventId: event.id }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
        });
        this.logger.log(`Job added to Bull Queue for WebhookEvent ID: ${event.id}`);
    }
};
exports.InstagramWebhookService = InstagramWebhookService;
exports.InstagramWebhookService = InstagramWebhookService = InstagramWebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_1.InjectQueue)('instagram-webhook')),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService, Object])
], InstagramWebhookService);
//# sourceMappingURL=instagram-webhook.service.js.map