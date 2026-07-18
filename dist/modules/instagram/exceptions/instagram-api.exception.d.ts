import { HttpException } from '@nestjs/common';
export declare class InstagramApiException extends HttpException {
    constructor(rawMetaError: any);
}
