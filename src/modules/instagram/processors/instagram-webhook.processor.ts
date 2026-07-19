import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InstagramGateway } from '../gateways/instagram.gateway';
import { PrismaService } from '../../../prisma.service';

@Processor('instagram-webhook')
export class InstagramWebhookProcessor {
  private readonly logger = new Logger(InstagramWebhookProcessor.name);

  constructor(
    private readonly gateway: InstagramGateway,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Processes the webhook job from the BullMQ queue.
   */
  @Process('process-webhook')
  async handleWebhook(job: Job<{ payload: any; dbEventId: string }>) {
    this.logger.log(`Processing Webhook Job ${job.id}...`);
    const { payload, dbEventId } = job.data;

    try {
      // 1. Parse the payload
      // Meta webhooks for Instagram usually have the structure:
      // { object: 'instagram', entry: [ { id: 'ig_id', time: 123, changes: [ { field: 'comments', value: {...} } ] } ] }
      
      if (payload.object === 'instagram' && payload.entry) {
        for (const entry of payload.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'comments') {
                await this.handleCommentEvent(change.value);
              } else if (change.field === 'messages') {
                await this.handleMessageEvent(change.value);
              }
            }
          }
          // Direct Messages sometimes come under entry.messaging instead of entry.changes
          if (entry.messaging) {
            for (const messagingItem of entry.messaging) {
              await this.handleMessagingItem(messagingItem);
            }
          }
        }
      }

      // 2. Update DB status to PROCESSED
      await this.prisma.webhookEvent.update({
        where: { id: dbEventId },
        data: { status: 'PROCESSED' },
      });
      this.logger.log(`Job ${job.id} processed successfully.`);

    } catch (error) {
      this.logger.error(`Error processing job ${job.id}`, error.stack);
      await this.prisma.webhookEvent.update({
        where: { id: dbEventId },
        data: { status: 'FAILED', errorMessage: error.message },
      });
      throw error; // Throwing error forces BullMQ to retry the job based on backoff settings
    }
  }

  private async handleCommentEvent(value: any) {
    this.logger.log(`Received new comment event. Saving to DB: Comment ${value.id}`);
    
    const timestamp = value.created_time ? new Date(value.created_time * 1000) : new Date();

    // Save comment to Prisma DB
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

    // Forward to Socket.IO clients
    this.gateway.emitEvent('new_comment', value);
  }

  private async handleMessageEvent(value: any) {
    this.logger.log(`Received new message change event. Saving to DB: Message ${value.id || value.message_id}`);
    
    const messageId = value.id || value.message_id || `msg_${Date.now()}`;
    const timestamp = value.timestamp ? new Date(value.timestamp * 1000) : new Date();

    // Save message to Prisma DB
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

    // Forward to Socket.IO clients
    this.gateway.emitEvent('new_message', value);
  }

  private async handleMessagingItem(item: any) {
    this.logger.log(`Received direct message messaging item. Saving to DB: Message ${item.message?.mid}`);
    
    const messageId = item.message?.mid || `msg_${Date.now()}`;
    const timestamp = item.timestamp ? new Date(item.timestamp) : new Date();

    // Save message to Prisma DB
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

    // Forward to Socket.IO clients
    this.gateway.emitEvent('new_message', item);
  }
}
