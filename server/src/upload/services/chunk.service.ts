import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ChunkService {
  private readonly logger = new Logger(ChunkService.name);
  private readonly tempDir: string;

  constructor(private readonly configService: ConfigService) {
    this.tempDir = this.configService.get<string>('tempDir');
  }

  async ensureTempDir(uploadId: string): Promise<string> {
    const dir = path.join(this.tempDir, uploadId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  async saveChunk(uploadId: string, chunkIndex: number, buffer: Buffer): Promise<void> {
    const tempDir = await this.ensureTempDir(uploadId);
    const chunkPath = path.join(tempDir, `chunk_${chunkIndex}`);
    await fs.writeFile(chunkPath, buffer);
    this.logger.debug(`Saved chunk ${chunkIndex} for upload ${uploadId}`);
  }

  async getExistingChunks(uploadId: string): Promise<number[]> {
    const tempDir = path.join(this.tempDir, uploadId);
    try {
      const files = await fs.readdir(tempDir);
      const chunks: number[] = [];
      for (const file of files) {
        const match = file.match(/^chunk_(\d+)$/);
        if (match) {
          chunks.push(parseInt(match[1], 10));
        }
      }
      return chunks.sort();
    } catch {
      return [];
    }
  }

  async getChunkPath(uploadId: string, chunkIndex: number): Promise<string> {
    return path.join(this.tempDir, uploadId, `chunk_${chunkIndex}`);
  }

  async chunkExists(uploadId: string, chunkIndex: number): Promise<boolean> {
    const chunkPath = await this.getChunkPath(uploadId, chunkIndex);
    try {
      await fs.access(chunkPath);
      return true;
    } catch {
      return false;
    }
  }

  async cleanupTempDir(uploadId: string): Promise<void> {
    const tempDir = path.join(this.tempDir, uploadId);
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      this.logger.log(`Cleaned up temp directory for upload ${uploadId}`);
    } catch (error) {
      this.logger.error(`Failed to cleanup temp directory: ${error.message}`);
    }
  }
}
