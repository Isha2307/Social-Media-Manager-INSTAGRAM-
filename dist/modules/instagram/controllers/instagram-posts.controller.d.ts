import { InstagramPublishingService } from '../services/instagram-publishing.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { PrismaService } from '../../../prisma.service';
export declare class InstagramPostsController {
    private readonly instagramPublishingService;
    private readonly prisma;
    constructor(instagramPublishingService: InstagramPublishingService, prisma: PrismaService);
    publishPost(dto: CreatePostDto): Promise<{
        success: boolean;
        message: string;
        data: {
            platformPostId: string;
        };
    }>;
    schedulePost(dto: CreatePostDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getPosts(igUserId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            igUserId: string;
            createdAt: Date;
            updatedAt: Date;
            caption: string | null;
            mediaUrl: string;
            mediaType: string;
            scheduledAt: Date | null;
            status: string;
            platformPostId: string | null;
            errorMessage: string | null;
        }[];
    }>;
}
