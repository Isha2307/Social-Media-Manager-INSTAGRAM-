"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const instagram_auth_controller_1 = require("./controllers/instagram-auth.controller");
const instagram_posts_controller_1 = require("./controllers/instagram-posts.controller");
const instagram_comments_controller_1 = require("./controllers/instagram-comments.controller");
const instagram_webhook_controller_1 = require("./controllers/instagram-webhook.controller");
const instagram_auth_service_1 = require("./services/instagram-auth.service");
const instagram_publishing_service_1 = require("./services/instagram-publishing.service");
const instagram_comments_service_1 = require("./services/instagram-comments.service");
const instagram_webhook_service_1 = require("./services/instagram-webhook.service");
const instagram_webhook_processor_1 = require("./processors/instagram-webhook.processor");
const instagram_gateway_1 = require("./gateways/instagram.gateway");
let InstagramModule = class InstagramModule {
};
exports.InstagramModule = InstagramModule;
exports.InstagramModule = InstagramModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
        ],
        controllers: [
            instagram_auth_controller_1.InstagramAuthController,
            instagram_posts_controller_1.InstagramPostsController,
            instagram_comments_controller_1.InstagramCommentsController,
            instagram_webhook_controller_1.InstagramWebhookController,
        ],
        providers: [
            instagram_auth_service_1.InstagramAuthService,
            instagram_publishing_service_1.InstagramPublishingService,
            instagram_comments_service_1.InstagramCommentsService,
            instagram_webhook_service_1.InstagramWebhookService,
            instagram_webhook_processor_1.InstagramWebhookProcessor,
            instagram_gateway_1.InstagramGateway,
        ],
    })
], InstagramModule);
//# sourceMappingURL=instagram.module.js.map