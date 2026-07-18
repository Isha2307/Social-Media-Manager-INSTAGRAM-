import { ConfigService } from '@nestjs/config';
export declare class InstagramAuthService {
    private configService;
    private readonly logger;
    private readonly graphApiVersion;
    private readonly appId;
    private readonly appSecret;
    private readonly redirectUri;
    constructor(configService: ConfigService);
    getOAuthLoginUrl(): string;
    exchangeCodeForToken(code: string, userId: string): Promise<any>;
}
