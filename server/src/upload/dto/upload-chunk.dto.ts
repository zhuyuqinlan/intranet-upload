import { IsString, IsNumber, Min } from 'class-validator';

export class UploadChunkDto {
  @IsString()
  uploadId: string;

  @IsNumber()
  @Min(0)
  chunkIndex: number;
}
