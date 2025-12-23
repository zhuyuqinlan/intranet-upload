import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFolderDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  parentPath?: string;
}
