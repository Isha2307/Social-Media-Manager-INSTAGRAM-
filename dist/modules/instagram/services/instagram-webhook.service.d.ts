import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { PrismaService } from '../../../prisma.service';
export declare class InstagramWebhookService {
    private configService;
    private prisma;
    private readonly webhookQueue;
    private readonly logger;
    private readonly appSecret;
    private readonly verifyToken;
    constructor(configService: ConfigService, prisma: PrismaService, webhookQueue: Queue);
    verifySetup(mode: string, token: string, challenge: string): string;
    verifySignature(signature: string, rawBody: Buffer): boolean;
    enqueueWebhookEvent(payload: any): Promise<void>;
}
