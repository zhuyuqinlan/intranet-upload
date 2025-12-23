export interface AppConfig {
  port: number;
  uploadDir: string;
  tempDir: string;
  fileInfoPath: string;
  chunkSize: number;
  cors: {
    origin: string | boolean;
  };
}

export const appConfig = (): AppConfig => ({
  port: parseInt(process.env.PORT, 10) || 9000,
  uploadDir: process.env.UPLOAD_DIR || './data/uploads',
  tempDir: process.env.TEMP_DIR || './data/temp',
  fileInfoPath: process.env.FILE_INFO_PATH || './data/file-info.json',
  chunkSize: 10 * 1024 * 1024, // 10MB
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});
