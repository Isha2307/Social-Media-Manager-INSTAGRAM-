import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

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
import { InstagramPublishingProcessor } from './processors/instagram-publishing.processor';
import { InstagramGateway } from './gateways/instagram.gateway';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue(
      { name: 'instagram-webhook' },
      { name: 'instagram-publishing' },
    ),
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
    InstagramPublishingProcessor,
    InstagramGateway,
  ],
})
export class InstagramModule {}
