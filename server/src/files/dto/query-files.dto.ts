import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryFilesDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  path?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  search?: string;
}
