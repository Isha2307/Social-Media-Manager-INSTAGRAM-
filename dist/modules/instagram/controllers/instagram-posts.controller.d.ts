import { InstagramPublishingService } from '../services/instagram-publishing.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { Request } from 'express';
export declare class InstagramPostsController {
    private readonly instagramPublishingService;
    constructor(instagramPublishingService: InstagramPublishingService);
    publishPost(dto: CreatePostDto, req: Request): Promise<{
        success: boolean;
        message: string;
        data: {
            platformPostId: string;
        };
    }>;
}
