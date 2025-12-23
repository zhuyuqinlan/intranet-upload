import { IsString, IsNumber, IsPositive, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class InitUploadDto {
  @IsString()
  filename: string;

  @IsNumber()
  @IsPositive()
  fileSize: number;

  @IsString()
  fileHash: string;

  @IsNumber()
  @IsPositive()
  chunkSize: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  folderPath?: string;

  @IsBoolean()
  @IsOptional()
  force?: boolean;
}
