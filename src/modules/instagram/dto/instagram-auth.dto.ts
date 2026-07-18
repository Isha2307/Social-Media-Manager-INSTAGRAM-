import { IsOptional, IsString } from 'class-validator';

export class OAuthCallbackDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  error_reason?: string;

  @IsOptional()
  @IsString()
  error_description?: string;
}
