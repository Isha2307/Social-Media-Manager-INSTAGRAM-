import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { CreatePostDto } from '../dto/create-post.dto';
import { PrismaService } from '../../../prisma.service';
export declare class InstagramPublishingService {
    private configService;
    private prisma;
    private readonly publishingQueue;
    private readonly logger;
    private readonly graphApiVersion;
    constructor(configService: ConfigService, prisma: PrismaService, publishingQueue: Queue);
    publish(dto: CreatePostDto, pageAccessToken?: string): Promise<string>;
    publishById(postId: string): Promise<string>;
    schedule(dto: CreatePostDto): Promise<any>;
    private createMediaContainer;
    private waitForVideoProcessing;
    private publishMediaContainer;
}
