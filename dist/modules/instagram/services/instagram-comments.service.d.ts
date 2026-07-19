import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma.service';
export declare class InstagramCommentsService {
    private configService;
    private prisma;
    private readonly logger;
    private readonly graphApiVersion;
    constructor(configService: ConfigService, prisma: PrismaService);
    private checkRateLimit;
    fetchComments(mediaId: string, limit: number, after: string, pageAccessToken: string): Promise<any>;
    replyToComment(commentId: string, message: string, pageAccessToken: string): Promise<string>;
}
