import { ConfigService } from '@nestjs/config';
export declare class InstagramCommentsService {
    private configService;
    private readonly logger;
    private readonly graphApiVersion;
    constructor(configService: ConfigService);
    private checkRateLimit;
    fetchComments(mediaId: string, limit: number, after: string, pageAccessToken: string): Promise<any>;
    replyToComment(commentId: string, message: string, pageAccessToken: string): Promise<string>;
}
