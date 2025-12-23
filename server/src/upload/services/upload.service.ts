import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { InitUploadDto } from '../dto/init-upload.dto';
import { CompleteUploadDto } from '../dto/complete-upload.dto';
import { UploadSession } from '../interfaces/upload-session.interface';
import { SessionService } from './session.service';
import { ChunkService } from './chunk.service';
import { MetadataService } from '../../files/services/metadata.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly chunkService: ChunkService,
    private readonly metadataService: MetadataService,
  ) {
    this.uploadDir = this.configService.get<string>('uploadDir');
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private getFullPath(relativePath: string): string {
    return path.normalize(path.join(this.uploadDir, relativePath));
  }

  async initUpload(dto: InitUploadDto): Promise<{
    uploadId: string;
    chunks: number;
    existingChunks: number[];
  }> {
    const targetPath = this.getFullPath(
      dto.folderPath ? path.join(dto.folderPath, dto.filename) : dto.filename,
    );

    // Check if file exists
    if (!dto.force && fs.existsSync(targetPath)) {
      throw new ConflictException('文件已存在，是否覆盖？');
    }

    const chunks = Math.ceil(dto.fileSize / dto.chunkSize);

    // Get existing chunks for resume support (use fileHash as storage identifier)
    const existingChunks = await this.chunkService.getExistingChunks(dto.fileHash);

    // Create session (SessionService generates uploadId internally)
    const session = this.sessionService.create({
      filename: dto.filename,
      fileHash: dto.fileHash,
      chunkSize: dto.chunkSize,
      totalChunks: chunks,
      fileSize: dto.fileSize,
      folderPath: dto.folderPath || '',
      targetPath,
      existingChunks,
    });

    this.logger.log(
      `Init upload: ${dto.filename} (${dto.fileSize} bytes, ${chunks} chunks)`,
    );

    return { uploadId: session.uploadId, chunks, existingChunks };
  }

  async initUploadWithForce(dto: InitUploadDto): Promise<{
    uploadId: string;
    chunks: number;
    existingChunks: number[];
  }> {
    return this.initUpload({ ...dto, force: true });
  }

  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    file: Express.Multer.File,
  ): Promise<{ uploaded: number; total: number }> {
    const session = this.sessionService.get(uploadId);
    if (!session) {
      throw new NotFoundException('上传会话不存在');
    }

    // Use fileHash as storage identifier for resume support
    await this.chunkService.saveChunk(session.fileHash, chunkIndex, file.buffer);
    this.sessionService.addChunk(uploadId, chunkIndex);

    const uploaded = this.sessionService.getUploadedChunks(uploadId).length;

    return { uploaded, total: session.totalChunks };
  }

  async mergeChunks(tempDir: string, targetPath: string, chunkCount: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(targetPath);
      let currentChunk = 0;

      const writeNextChunk = () => {
        if (currentChunk >= chunkCount) {
          writeStream.end();
          return;
        }

        const chunkPath = path.join(tempDir, `chunk_${currentChunk}`);

        if (!fs.existsSync(chunkPath)) {
          writeStream.destroy();
          return reject(new Error(`分片 ${currentChunk} 不存在`));
        }

        const readStream = fs.createReadStream(chunkPath);

        readStream.on('end', () => {
          currentChunk++;
          writeNextChunk();
        });

        readStream.on('error', (err) => {
          reject(err);
        });

        readStream.pipe(writeStream, { end: false });
      };

      writeStream.on('finish', () => {
        this.logger.log(`Merged ${chunkCount} chunks to ${targetPath}`);
        resolve();
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

      writeNextChunk();
    });
  }

  async completeUpload(dto: CompleteUploadDto): Promise<{
    fileId: string;
    filename: string;
    path: string;
    downloadUrl: string;
  }> {
    const session = this.sessionService.get(dto.uploadId);
    if (!session) {
      throw new NotFoundException('上传会话不存在');
    }

    // Ensure target directory exists
    const targetDir = path.dirname(session.targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Merge chunks (use fileHash as storage identifier)
    const tempDir = path.join(this.configService.get('tempDir'), session.fileHash);
    await this.mergeChunks(tempDir, session.targetPath, session.totalChunks);

    // Save file metadata
    const fileInfo = await this.metadataService.addOrUpdateFile(
      session.targetPath,
      dto.filename,
      session.fileSize,
      dto.fileHash,
    );

    // Cleanup
    await this.chunkService.cleanupTempDir(session.fileHash);
    this.sessionService.delete(dto.uploadId);

    this.logger.log(`Completed upload: ${dto.filename} -> ${fileInfo.id}`);

    return {
      fileId: fileInfo.id,
      filename: dto.filename,
      path: fileInfo.relativePath,
      downloadUrl: `/api/download/${fileInfo.id}`,
    };
  }

  async cleanupAllTempDirs(): Promise<void> {
    const tempDir = this.configService.get<string>('tempDir');
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          }
        }
        this.logger.log('Cleaned up all temporary directories');
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup temp directories: ${error.message}`);
    }
  }
}
