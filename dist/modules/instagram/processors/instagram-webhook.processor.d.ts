import { InstagramGateway } from '../gateways/instagram.gateway';
export declare class InstagramWebhookProcessor {
    private readonly gateway;
    private readonly logger;
    constructor(gateway: InstagramGateway);
    handleWebhook(job: any): Promise<void>;
    private handleCommentEvent;
    private handleMessageEvent;
}
