import { ConfigService } from '@nestjs/config';
export declare class InstagramWebhookService {
    private configService;
    private readonly logger;
    private readonly appSecret;
    private readonly verifyToken;
    constructor(configService: ConfigService);
    verifySetup(mode: string, token: string, challenge: string): string;
    verifySignature(signature: string, rawBody: Buffer): boolean;
    enqueueWebhookEvent(payload: any): Promise<void>;
}
