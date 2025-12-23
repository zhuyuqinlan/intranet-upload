import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { appConfig } from './config/app.config';
import { CommonModule } from './common/common.module';
import { UploadModule } from './upload/upload.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          rootPath: path.join(__dirname, '..', '..', 'web', 'dist'),
          exclude: ['/api*'],
          serveRoot: '/',
        },
        {
          rootPath: configService.get<string>('uploadDir', './uploads'),
          serveRoot: '/uploads',
        },
      ],
    }),
    CommonModule,
    UploadModule,
    FilesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
