import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { UploadService } from './upload/services/upload.service';

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function logBanner(port: number, isDev: boolean) {
  const lines = [
    '',
    `${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════════════╗${colors.reset}`,
    `${colors.bright}${colors.magenta}║${colors.reset}  ${colors.bright}${colors.cyan}🌸 局域网文件中心${colors.white} - 后端服务${colors.reset} ${colors.bright}${colors.magenta}║${colors.reset}`,
    `${colors.bright}${colors.magenta}╠════════════════════════════════════════════════════════════════╣${colors.reset}`,
    `${colors.bright}${colors.magenta}║${colors.reset}  ${colors.green}✓${colors.reset} 后端已启动${colors.white} ${colors.bright}${colors.magenta}║${colors.reset}`,
    `${colors.bright}${colors.magenta}║${colors.reset}  ${colors.cyan}→${colors.reset} API 地址: ${colors.yellow}http://localhost:${port}${colors.reset} ${colors.bright}${colors.magenta}║${colors.reset}`,
    `${colors.bright}${colors.magenta}║${colors.reset}  ${colors.cyan}→${colors.reset} 环境: ${colors.yellow}${isDev ? '开发 (DEV)' : '生产 (PROD)'}${colors.reset} ${colors.bright}${colors.magenta}║${colors.reset}`,
    `${colors.bright}${colors.magenta}╚════════════════════════════════════════════════════════════════╝${colors.reset}`,
    '',
  ];

  lines.forEach(line => console.log(line));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const uploadService = app.get(UploadService);

  // Enable CORS
  const corsOrigin = configService.get<string>('cors.origin', '*');
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // Cleanup temp directories on startup
  await uploadService.cleanupAllTempDirs();

  const port = configService.get<number>('port', 9000);
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDev = nodeEnv === 'development';

  await app.listen(port);

  // 醒目的启动日志
  logBanner(port, isDev);
}

bootstrap();
