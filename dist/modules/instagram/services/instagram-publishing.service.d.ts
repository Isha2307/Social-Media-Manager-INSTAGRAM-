import { ConfigService } from '@nestjs/config';
import { CreatePostDto } from '../dto/create-post.dto';
export declare class InstagramPublishingService {
    private configService;
    private readonly logger;
    private readonly graphApiVersion;
    constructor(configService: ConfigService);
    publish(dto: CreatePostDto, pageAccessToken: string): Promise<string>;
    private createMediaContainer;
    private waitForVideoProcessing;
    private publishMediaContainer;
}
