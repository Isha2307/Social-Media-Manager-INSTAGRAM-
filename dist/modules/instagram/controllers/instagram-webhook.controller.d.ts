import { Request, Response } from 'express';
import { InstagramWebhookService } from '../services/instagram-webhook.service';
import { WebhookVerificationDto } from '../dto/webhook-verification.dto';
export declare class InstagramWebhookController {
    private readonly webhookService;
    constructor(webhookService: InstagramWebhookService);
    verifySetup(query: WebhookVerificationDto, res: Response): Response<any, Record<string, any>>;
    receiveEvent(req: Request, res: Response, signature: string): Promise<Response<any, Record<string, any>>>;
}
