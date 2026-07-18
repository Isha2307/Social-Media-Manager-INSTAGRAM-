import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { InstagramAuthController } from './controllers/instagram-auth.controller';
import { InstagramPostsController } from './controllers/instagram-posts.controller';
import { InstagramCommentsController } from './controllers/instagram-comments.controller';
import { InstagramWebhookController } from './controllers/instagram-webhook.controller';

// Services
import { InstagramAuthService } from './services/instagram-auth.service';
import { InstagramPublishingService } from './services/instagram-publishing.service';
import { InstagramCommentsService } from './services/instagram-comments.service';
import { InstagramWebhookService } from './services/instagram-webhook.service';

// Processors & Gateways
import { InstagramWebhookProcessor } from './processors/instagram-webhook.processor';
import { InstagramGateway } from './gateways/instagram.gateway';

@Module({
  imports: [
    ConfigModule,
    // BullModule.registerQueue({ name: 'instagram-webhook' }) // Uncomment when Bull is installed
  ],
  controllers: [
    InstagramAuthController,
    InstagramPostsController,
    InstagramCommentsController,
    InstagramWebhookController,
  ],
  providers: [
    InstagramAuthService,
    InstagramPublishingService,
    InstagramCommentsService,
    InstagramWebhookService,
    InstagramWebhookProcessor,
    InstagramGateway,
  ],
})
export class InstagramModule {}
