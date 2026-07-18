// import { Process, Processor } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
// import { Job } from 'bull';
import { InstagramGateway } from '../gateways/instagram.gateway';

// @Processor('instagram-webhook')
@Injectable() // Using Injectable for now until @nestjs/bull is installed
export class InstagramWebhookProcessor {
  private readonly logger = new Logger(InstagramWebhookProcessor.name);

  constructor(private readonly gateway: InstagramGateway) {}

  /**
   * Processes the webhook job from the BullMQ queue.
   */
  // @Process('process-webhook')
  async handleWebhook(job: any /* Job */) {
    this.logger.log(`Processing Webhook Job ${job.id}...`);
    const { payload, dbEventId } = job.data;

    try {
      // 1. Parse the payload
      // Meta webhooks for Instagram usually have the structure:
      // { object: 'instagram', entry: [ { id: 'ig_id', time: 123, changes: [ { field: 'comments', value: {...} } ] } ] }
      
      if (payload.object === 'instagram' && payload.entry) {
        for (const entry of payload.entry) {
          for (const change of entry.changes) {
            
            if (change.field === 'comments') {
              await this.handleCommentEvent(change.value);
            } else if (change.field === 'messages') {
              await this.handleMessageEvent(change.value);
            }
          }
        }
      }

      // 2. Update DB status to PROCESSED
      // await this.prisma.webhookEvent.update({ where: { id: dbEventId }, data: { status: 'PROCESSED' } });
      this.logger.log(`Job ${job.id} processed successfully.`);

    } catch (error) {
      this.logger.error(`Error processing job ${job.id}`, error.stack);
      // await this.prisma.webhookEvent.update({ where: { id: dbEventId }, data: { status: 'FAILED', errorMessage: error.message } });
      throw error; // Throwing error forces BullMQ to retry the job based on backoff settings
    }
  }

  private async handleCommentEvent(value: any) {
    this.logger.log('Received new comment event. Forwarding to Socket.IO...');
    // Save comment to Prisma DB here...

    // Forward to Socket.IO clients
    this.gateway.emitEvent('new_comment', value);
  }

  private async handleMessageEvent(value: any) {
    this.logger.log('Received new message event. Forwarding to Socket.IO...');
    // Save message to Prisma DB here...

    // Forward to Socket.IO clients
    this.gateway.emitEvent('new_message', value);
  }
}
