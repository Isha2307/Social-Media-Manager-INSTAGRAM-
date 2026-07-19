import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InstagramPublishingService } from '../services/instagram-publishing.service';

@Processor('instagram-publishing')
export class InstagramPublishingProcessor {
  private readonly logger = new Logger(InstagramPublishingProcessor.name);

  constructor(private readonly publishingService: InstagramPublishingService) {}

  @Process('publish-post')
  async handlePublishJob(job: Job<{ postId: string }>) {
    this.logger.log(`Processing scheduled post job ${job.id} for post ${job.data.postId}...`);
    try {
      await this.publishingService.publishById(job.data.postId);
      this.logger.log(`Scheduled post job ${job.id} finished successfully.`);
    } catch (err) {
      this.logger.error(`Error processing scheduled post job ${job.id}: ${err.message}`);
      throw err; // Trigger retry in Bull
    }
  }
}
