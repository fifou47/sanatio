import { IsArray, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttachmentDto {
  @IsString() url: string;
  @IsString() name: string;
  @IsNumber() size: number;
  @IsString() mime: string;
}

export class SendMessageDto {
  @IsMongoId() consultationId: string;
  @IsString() senderId: string;
  @IsOptional()
  @IsString()
  content?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
