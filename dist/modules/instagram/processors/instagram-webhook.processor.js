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
var InstagramWebhookProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramWebhookProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const instagram_gateway_1 = require("../gateways/instagram.gateway");
const prisma_service_1 = require("../../../prisma.service");
let InstagramWebhookProcessor = InstagramWebhookProcessor_1 = class InstagramWebhookProcessor {
    constructor(gateway, prisma) {
        this.gateway = gateway;
        this.prisma = prisma;
        this.logger = new common_1.Logger(InstagramWebhookProcessor_1.name);
    }
    async handleWebhook(job) {
        this.logger.log(`Processing Webhook Job ${job.id}...`);
        const { payload, dbEventId } = job.data;
        try {
            if (payload.object === 'instagram' && payload.entry) {
                for (const entry of payload.entry) {
                    if (entry.changes) {
                        for (const change of entry.changes) {
                            if (change.field === 'comments') {
                                await this.handleCommentEvent(change.value);
                            }
                            else if (change.field === 'messages') {
                                await this.handleMessageEvent(change.value);
                            }
                        }
                    }
                    if (entry.messaging) {
                        for (const messagingItem of entry.messaging) {
                            await this.handleMessagingItem(messagingItem);
                        }
                    }
                }
            }
            await this.prisma.webhookEvent.update({
                where: { id: dbEventId },
                data: { status: 'PROCESSED' },
            });
            this.logger.log(`Job ${job.id} processed successfully.`);
        }
        catch (error) {
            this.logger.error(`Error processing job ${job.id}`, error.stack);
            await this.prisma.webhookEvent.update({
                where: { id: dbEventId },
                data: { status: 'FAILED', errorMessage: error.message },
            });
            throw error;
        }
    }
    async handleCommentEvent(value) {
        this.logger.log(`Received new comment event. Saving to DB: Comment ${value.id}`);
        const timestamp = value.created_time ? new Date(value.created_time * 1000) : new Date();
        await this.prisma.instagramComment.upsert({
            where: { platformCommentId: value.id },
            update: {
                text: value.text,
                username: value.from?.username || 'unknown',
                timestamp,
                parentCommentId: value.parent_id || null,
            },
            create: {
                platformCommentId: value.id,
                mediaId: value.media?.id || 'unknown',
                text: value.text || '',
                username: value.from?.username || 'unknown',
                timestamp,
                parentCommentId: value.parent_id || null,
            },
        });
        this.gateway.emitEvent('new_comment', value);
    }
    async handleMessageEvent(value) {
        this.logger.log(`Received new message change event. Saving to DB: Message ${value.id || value.message_id}`);
        const messageId = value.id || value.message_id || `msg_${Date.now()}`;
        const timestamp = value.timestamp ? new Date(value.timestamp * 1000) : new Date();
        await this.prisma.instagramMessage.upsert({
            where: { platformMessageId: messageId },
            update: {
                text: value.text || value.message?.text || '',
                timestamp,
            },
            create: {
                platformMessageId: messageId,
                senderId: value.sender?.id || value.from?.id || 'unknown',
                recipientId: value.recipient?.id || 'unknown',
                text: value.text || value.message?.text || '',
                timestamp,
            },
        });
        this.gateway.emitEvent('new_message', value);
    }
    async handleMessagingItem(item) {
        this.logger.log(`Received direct message messaging item. Saving to DB: Message ${item.message?.mid}`);
        const messageId = item.message?.mid || `msg_${Date.now()}`;
        const timestamp = item.timestamp ? new Date(item.timestamp) : new Date();
        await this.prisma.instagramMessage.upsert({
            where: { platformMessageId: messageId },
            update: {
                text: item.message?.text || '',
                timestamp,
            },
            create: {
                platformMessageId: messageId,
                senderId: item.sender?.id || 'unknown',
                recipientId: item.recipient?.id || 'unknown',
                text: item.message?.text || '',
                timestamp,
            },
        });
        this.gateway.emitEvent('new_message', item);
    }
};
exports.InstagramWebhookProcessor = InstagramWebhookProcessor;
__decorate([
    (0, bull_1.Process)('process-webhook'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstagramWebhookProcessor.prototype, "handleWebhook", null);
exports.InstagramWebhookProcessor = InstagramWebhookProcessor = InstagramWebhookProcessor_1 = __decorate([
    (0, bull_1.Processor)('instagram-webhook'),
    __metadata("design:paramtypes", [instagram_gateway_1.InstagramGateway,
        prisma_service_1.PrismaService])
], InstagramWebhookProcessor);
//# sourceMappingURL=instagram-webhook.processor.js.map