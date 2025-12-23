import { IsString } from 'class-validator';

export class CompleteUploadDto {
  @IsString()
  uploadId: string;

  @IsString()
  filename: string;

  @IsString()
  fileHash: string;
}
