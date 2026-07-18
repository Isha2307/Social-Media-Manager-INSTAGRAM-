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
exports.InstagramWebhookController = void 0;
const common_1 = require("@nestjs/common");
const instagram_webhook_service_1 = require("../services/instagram-webhook.service");
const webhook_verification_dto_1 = require("../dto/webhook-verification.dto");
let InstagramWebhookController = class InstagramWebhookController {
    constructor(webhookService) {
        this.webhookService = webhookService;
    }
    verifySetup(query, res) {
        const challenge = this.webhookService.verifySetup(query['hub.mode'], query['hub.verify_token'], query['hub.challenge']);
        return res.status(200).send(challenge);
    }
    async receiveEvent(req, res, signature) {
        const rawBody = req.rawBody;
        const bufferToVerify = rawBody || Buffer.from(JSON.stringify(req.body));
        if (!this.webhookService.verifySignature(signature, bufferToVerify)) {
            throw new common_1.ForbiddenException('Invalid webhook signature');
        }
        await this.webhookService.enqueueWebhookEvent(req.body);
        return res.status(200).send('EVENT_RECEIVED');
    }
};
exports.InstagramWebhookController = InstagramWebhookController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [webhook_verification_dto_1.WebhookVerificationDto, Object]),
    __metadata("design:returntype", void 0)
], InstagramWebhookController.prototype, "verifySetup", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Headers)('x-hub-signature-256')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InstagramWebhookController.prototype, "receiveEvent", null);
exports.InstagramWebhookController = InstagramWebhookController = __decorate([
    (0, common_1.Controller)('api/v1/instagram/webhook'),
    __metadata("design:paramtypes", [instagram_webhook_service_1.InstagramWebhookService])
], InstagramWebhookController);
//# sourceMappingURL=instagram-webhook.controller.js.map