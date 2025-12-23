import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { FileInfo } from '../interfaces/file-info.interface';

interface FileInfoDB {
  files: FileInfo[];
}

@Injectable()
export class MetadataService implements OnModuleInit {
  private readonly logger = new Logger(MetadataService.name);
  private readonly filePath: string;
  private db: FileInfoDB;

  constructor(private readonly configService: ConfigService) {
    this.filePath = this.configService.get<string>('fileInfoPath');
    this.db = { files: [] };
  }

  onModuleInit() {
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        this.db = JSON.parse(data);
        this.logger.log(`Loaded ${this.db.files.length} file records`);
      } else {
        this.logger.log('File info database does not exist, creating new one');
        this.save();
      }
    } catch (err) {
      this.logger.error('Failed to load file info:', err);
      this.db = { files: [] };
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.db, null, 2));
    } catch (err) {
      this.logger.error('Failed to save file info:', err);
    }
  }

  async addOrUpdateFile(
    filePath: string,
    originalName: string,
    size: number,
    hash: string,
  ): Promise<FileInfo> {
    const relativePath = path.relative(
      this.configService.get('uploadDir'),
      filePath,
    );
    const existingIndex = this.db.files.findIndex((f) => f.path === filePath);

    const fileInfo: FileInfo = {
      id: existingIndex >= 0 ? this.db.files[existingIndex].id : uuidv4(),
      path: filePath,
      relativePath: relativePath.replace(/\\/g, '/'),
      originalName,
      size,
      hash,
      uploadTime: new Date().toISOString(),
      downloadCount:
        existingIndex >= 0 ? this.db.files[existingIndex].downloadCount : 0,
    };

    if (existingIndex >= 0) {
      this.db.files[existingIndex] = fileInfo;
    } else {
      this.db.files.push(fileInfo);
    }

    this.save();
    return fileInfo;
  }

  findById(id: string): FileInfo | undefined {
    return this.db.files.find((f) => f.id === id);
  }

  findByPath(filePath: string): FileInfo | undefined {
    return this.db.files.find((f) => f.path === filePath);
  }

  deleteByPath(filePath: string): void {
    this.db.files = this.db.files.filter((f) => f.path !== filePath);
    this.save();
  }

  deleteByPathPrefix(prefix: string): void {
    this.db.files = this.db.files.filter((f) => !f.path.startsWith(prefix));
    this.save();
  }

  incrementDownloadCount(id: string): void {
    const fileInfo = this.findById(id);
    if (fileInfo) {
      fileInfo.downloadCount++;
      this.save();
    }
  }

  getAll(): FileInfo[] {
    return this.db.files;
  }

  getStats(): { totalFiles: number; totalSize: number; totalDownloads: number } {
    return {
      totalFiles: this.db.files.length,
      totalSize: this.db.files.reduce((sum, f) => sum + f.size, 0),
      totalDownloads: this.db.files.reduce((sum, f) => sum + f.downloadCount, 0),
    };
  }
}
