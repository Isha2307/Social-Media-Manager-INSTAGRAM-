import { InstagramCommentsService } from '../services/instagram-comments.service';
import { FetchCommentsDto } from '../dto/fetch-comments.dto';
import { ReplyCommentDto } from '../dto/reply-comment.dto';
import { Request } from 'express';
export declare class InstagramCommentsController {
    private readonly instagramCommentsService;
    constructor(instagramCommentsService: InstagramCommentsService);
    private getMockPageAccessToken;
    getComments(mediaId: string, query: FetchCommentsDto, req: Request): Promise<any>;
    replyToComment(commentId: string, body: ReplyCommentDto, req: Request): Promise<{
        success: boolean;
        message: string;
        data: {
            replyId: string;
        };
    }>;
}
