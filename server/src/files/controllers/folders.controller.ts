import { Controller, Post, Body } from '@nestjs/common';
import { FilesService } from '../services/files.service';
import { CreateFolderDto } from '../dto/create-folder.dto';

@Controller('api/folders')
export class FoldersController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  async createFolder(@Body() dto: CreateFolderDto) {
    return this.filesService.createFolder(dto);
  }
}
