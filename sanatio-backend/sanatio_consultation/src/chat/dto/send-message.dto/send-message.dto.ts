import { IsMongoId, IsString } from 'class-validator';

export class SendMessageDto {
  @IsMongoId() consultationId: string;
  @IsString() senderId: string;
  @IsString() content: string;
}
