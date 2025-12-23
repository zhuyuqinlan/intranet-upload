import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../services/upload.service';
import { InitUploadDto } from '../dto/init-upload.dto';
import { CompleteUploadDto } from '../dto/complete-upload.dto';

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('init')
  async initUpload(@Body() dto: InitUploadDto) {
    return this.uploadService.initUpload(dto);
  }

  @Post('chunk')
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('分片文件缺失');
    }

    // Manually extract form fields for multipart/form-data
    const uploadId = req.body?.uploadId;
    const chunkIndex = parseInt(req.body?.chunkIndex, 10);

    if (!uploadId || isNaN(chunkIndex) || chunkIndex < 0) {
      throw new BadRequestException('无效的上传参数');
    }

    return this.uploadService.uploadChunk(uploadId, chunkIndex, file);
  }

  @Post('complete')
  async completeUpload(@Body() dto: CompleteUploadDto) {
    return this.uploadService.completeUpload(dto);
  }
}
