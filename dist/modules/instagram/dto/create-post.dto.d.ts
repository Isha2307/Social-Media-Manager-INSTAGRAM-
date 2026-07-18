export declare enum MediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO"
}
export declare class CreatePostDto {
    igUserId: string;
    caption?: string;
    mediaUrl: string;
    mediaType: MediaType;
}
