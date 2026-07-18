import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { InjectQueue } from '@nestjs/bull';
// import { Queue } from 'bull';
import * as crypto from 'crypto';

@Injectable()
export class InstagramWebhookService {
  private readonly logger = new Logger(InstagramWebhookService.name);
  private readonly appSecret: string;
  private readonly verifyToken: string;

  constructor(
    private configService: ConfigService,
    // @InjectQueue('instagram-webhook') private readonly webhookQueue: Queue,
  ) {
    this.appSecret = this.configService.get<string>('META_APP_SECRET');
    // You should define this token in your .env and input it in the Meta App Dashboard
    this.verifyToken = this.configService.get<string>('META_WEBHOOK_VERIFY_TOKEN') || 'my_secure_verify_token';
  }

  /**
   * Verifies the initial webhook setup challenge from Meta.
   */
  verifySetup(mode: string, token: string, challenge: string): string {
    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('Webhook verified successfully!');
      return challenge;
    }
    this.logger.warn('Failed webhook verification challenge.');
    throw new UnauthorizedException('Invalid verify token');
  }

  /**
   * Validates the X-Hub-Signature-256 header sent by Meta to ensure the payload is authentic.
   */
  verifySignature(signature: string, rawBody: Buffer): boolean {
    if (!signature || !signature.startsWith('sha256=')) return false;

    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(rawBody)
      .digest('hex');

    const actualSignature = signature.replace('sha256=', '');

    // Prevent timing attacks
    try {
      return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(actualSignature));
    } catch (e) {
      return false;
    }
  }

  /**
   * Enqueues the webhook payload to BullMQ for background processing.
   */
  async enqueueWebhookEvent(payload: any) {
    this.logger.log('Enqueuing webhook event for background processing...');
    
    // In a real app, save to Prisma first:
    // const event = await this.prisma.webhookEvent.create({
    //   data: { eventType: 'UNKNOWN', payload: payload, status: 'PENDING' }
    // });

    // Add to BullMQ queue (uncomment when BullMQ is installed)
    // await this.webhookQueue.add('process-webhook', { payload, dbEventId: event.id }, {
    //   attempts: 3,
    //   backoff: { type: 'exponential', delay: 2000 }
    // });
    
    this.logger.log('Mock: Job added to BullMQ Queue');
  }
}
