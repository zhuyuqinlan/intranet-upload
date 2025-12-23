import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';
import { UploadController } from './controllers/upload.controller';
import { UploadService } from './services/upload.service';
import { SessionService } from './services/session.service';
import { ChunkService } from './services/chunk.service';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    FilesModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize: configService.get<number>('chunkSize') || 10 * 1024 * 1024, // 默认10MB
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, SessionService, ChunkService],
  exports: [SessionService, ChunkService],
})
export class UploadModule {}
