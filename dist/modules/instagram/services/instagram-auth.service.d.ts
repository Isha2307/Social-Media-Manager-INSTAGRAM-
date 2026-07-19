import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma.service';
export declare class InstagramAuthService {
    private configService;
    private prisma;
    private readonly logger;
    private readonly graphApiVersion;
    private readonly appId;
    private readonly appSecret;
    private readonly redirectUri;
    constructor(configService: ConfigService, prisma: PrismaService);
    getOAuthLoginUrl(): string;
    exchangeCodeForToken(code: string, userId: string): Promise<any>;
    connectWithAccessToken(userAccessToken: string, userId: string): Promise<any>;
}
