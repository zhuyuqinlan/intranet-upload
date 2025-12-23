import { Module } from '@nestjs/common';
import { FilesController, DownloadController, StatsController } from './controllers/files.controller';
import { FoldersController } from './controllers/folders.controller';
import { FilesService } from './services/files.service';
import { FileStorageService } from './services/file-storage.service';
import { MetadataService } from './services/metadata.service';

@Module({
  controllers: [
    FilesController,
    DownloadController,
    StatsController,
    FoldersController,
  ],
  providers: [
    FilesService,
    FileStorageService,
    MetadataService,
  ],
  exports: [
    FilesService,
    FileStorageService,
    MetadataService,
  ],
})
export class FilesModule {}
