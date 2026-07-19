import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReplyCommentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000) // Instagram limits comment length
  message: string;
}
