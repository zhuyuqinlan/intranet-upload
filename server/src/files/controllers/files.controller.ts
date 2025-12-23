import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  Body,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { FilesService } from '../services/files.service';
import { QueryFilesDto } from '../dto/query-files.dto';
import { DeleteFilesDto } from '../dto/delete-files.dto';

@Controller('api/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  async queryFiles(@Query() query: QueryFilesDto) {
    return this.filesService.queryFiles(query);
  }

  @Delete('batch')
  async batchDelete(@Body() body: DeleteFilesDto) {
    return this.filesService.batchDelete(body.fileIds);
  }

  @Delete(':fileId')
  async deleteFile(@Param('fileId') fileId: string) {
    await this.filesService.deleteFile(fileId);
    return { success: true };
  }
}

@Controller('api/download')
export class DownloadController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':fileId')
  async download(@Param('fileId') fileId: string, @Res() res: Response) {
    const filePath = await this.filesService.getFileDownloadUrl(fileId);
    return res.download(filePath);
  }
}

@Controller('api/stats')
export class StatsController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  async getStats() {
    return this.filesService.getStats();
  }
}
