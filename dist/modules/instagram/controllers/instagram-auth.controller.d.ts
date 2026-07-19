import { InstagramAuthService } from '../services/instagram-auth.service';
import { OAuthCallbackDto } from '../dto/instagram-auth.dto';
import { Request, Response } from 'express';
import { PrismaService } from '../../../prisma.service';
export declare class InstagramAuthController {
    private readonly instagramAuthService;
    private readonly prisma;
    constructor(instagramAuthService: InstagramAuthService, prisma: PrismaService);
    login(): {
        url: string;
    };
    callback(query: OAuthCallbackDto, req: Request, res: Response): Promise<void>;
    connectWithToken(body: {
        accessToken: string;
    }): Promise<{
        success: boolean;
        message: string;
        igUserId: any;
        username: any;
    }>;
    getAccounts(): Promise<{
        accounts: {
            username: string;
            igUserId: string;
            facebookPageId: string;
            createdAt: Date;
        }[];
    }>;
}
