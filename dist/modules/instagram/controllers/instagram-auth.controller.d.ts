import { InstagramAuthService } from '../services/instagram-auth.service';
import { OAuthCallbackDto } from '../dto/instagram-auth.dto';
import { Request, Response } from 'express';
export declare class InstagramAuthController {
    private readonly instagramAuthService;
    constructor(instagramAuthService: InstagramAuthService);
    login(): {
        url: string;
    };
    callback(query: OAuthCallbackDto, req: Request, res: Response): Promise<void>;
}
