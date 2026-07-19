import { Job } from 'bull';
import { InstagramGateway } from '../gateways/instagram.gateway';
import { PrismaService } from '../../../prisma.service';
export declare class InstagramWebhookProcessor {
    private readonly gateway;
    private readonly prisma;
    private readonly logger;
    constructor(gateway: InstagramGateway, prisma: PrismaService);
    handleWebhook(job: Job<{
        payload: any;
        dbEventId: string;
    }>): Promise<void>;
    private handleCommentEvent;
    private handleMessageEvent;
    private handleMessagingItem;
}
