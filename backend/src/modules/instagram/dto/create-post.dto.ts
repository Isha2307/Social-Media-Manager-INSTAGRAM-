import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  igUserId: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsNotEmpty()
  @IsUrl()
  mediaUrl: string;

  @IsEnum(MediaType)
  mediaType: MediaType;

  @IsOptional()
  @IsString()
  scheduledAt?: string; // ISO 8601 string
}
