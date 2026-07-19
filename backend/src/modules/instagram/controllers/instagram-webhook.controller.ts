import { Controller, Get, Post, Query, Req, Res, Headers, ForbiddenException } from '@nestjs/common';
import { Request, Response } from 'express';
import { InstagramWebhookService } from '../services/instagram-webhook.service';
import { WebhookVerificationDto } from '../dto/webhook-verification.dto';

@Controller('api/v1/instagram/webhook')
export class InstagramWebhookController {
  constructor(private readonly webhookService: InstagramWebhookService) {}

  /**
   * GET endpoint used by Meta to verify the webhook URL during setup in the App Dashboard.
   */
  @Get()
  verifySetup(@Query() query: WebhookVerificationDto, @Res() res: Response) {
    const challenge = this.webhookService.verifySetup(
      query['hub.mode'],
      query['hub.verify_token'],
      query['hub.challenge'],
    );
    // Meta requires plain text challenge response
    return res.status(200).send(challenge);
  }

  /**
   * POST endpoint used by Meta to send real-time event updates (Comments, Messages).
   */
  @Post()
  async receiveEvent(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    // 1. Verify the payload is authentically from Meta
    // Note: To do this correctly, NestJS needs access to the raw Buffer of the request body.
    // Ensure you configure `app.useBodyParser('json', { verify: (req, res, buf) => { req.rawBody = buf; } })` in main.ts
    const rawBody = (req as any).rawBody; 
    
    // Fallback if rawBody isn't configured for this mock
    const bufferToVerify = rawBody || Buffer.from(JSON.stringify(req.body));

    if (!this.webhookService.verifySignature(signature, bufferToVerify)) {
      throw new ForbiddenException('Invalid webhook signature');
    }

    // 2. Enqueue the event for background processing
    await this.webhookService.enqueueWebhookEvent(req.body);

    // 3. Immediately respond with 200 OK so Meta doesn't disable the webhook
    return res.status(200).send('EVENT_RECEIVED');
  }
}
