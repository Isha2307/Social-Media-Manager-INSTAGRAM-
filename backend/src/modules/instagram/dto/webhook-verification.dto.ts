import { IsNotEmpty, IsString } from 'class-validator';

export class WebhookVerificationDto {
  @IsNotEmpty()
  @IsString()
  'hub.mode': string;

  @IsNotEmpty()
  @IsString()
  'hub.challenge': string;

  @IsNotEmpty()
  @IsString()
  'hub.verify_token': string;
}
