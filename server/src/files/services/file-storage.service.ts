import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { FileTreeItem } from '../interfaces/file-info.interface';
import { MetadataService } from './metadata.service';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly configService: ConfigService,
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

  getFullPath(relativePath: string): string {
    return path.normalize(path.join(this.uploadDir, relativePath));
  }

  getRelativePath(fullPath: string): string {
    return path.relative(this.uploadDir, fullPath).replace(/\\/g, '/');
  }

  async scanDirectory(
    dirPath: string,
    relativePath: string = '',
  ): Promise<FileTreeItem[]> {
    const items: FileTreeItem[] = [];

    try {
      const fullPath = this.getFullPath(relativePath || dirPath);
      const files = fs.readdirSync(fullPath);

      for (const file of files) {
        const filePath = path.join(fullPath, file);
        const relativeFilePath = relativePath
          ? path.join(relativePath, file)
          : file;
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          const children = await this.scanDirectory(
            dirPath,
            relativeFilePath,
          );
          items.push({
            id: `dir-${relativeFilePath}`,
            name: file,
            path: relativeFilePath,
            type: 'directory',
            size: children.reduce((sum, item) => sum + (item.size || 0), 0),
            uploadTime: stats.birthtime.toISOString(),
            children,
          });
        } else {
          let fileInfo = this.metadataService.findByPath(filePath);

          if (!fileInfo) {
            fileInfo = await this.metadataService.addOrUpdateFile(
              filePath,
              file,
              stats.size,
              '',
            );
          }

          items.push({
            id: fileInfo.id,
            name: file,
            path: fileInfo.relativePath,
            type: 'file',
            size: fileInfo.size,
            uploadTime: fileInfo.uploadTime,
            downloadCount: fileInfo.downloadCount,
            hash: fileInfo.hash,
          });
        }
      }
    } catch (err) {
      this.logger.error(`Failed to scan directory ${dirPath}:`, err);
    }

    return items;
  }

  async deleteFileOrDir(filePath: string): Promise<boolean> {
    try {
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        this.metadataService.deleteByPathPrefix(filePath);
      } else {
        fs.unlinkSync(filePath);
        this.metadataService.deleteByPath(filePath);
      }
      return true;
    } catch (err) {
      this.logger.error('Delete failed:', err);
      return false;
    }
  }

  async createFolder(name: string, parentPath: string = ''): Promise<string> {
    const folderPath = parentPath ? path.join(parentPath, name) : name;
    const fullPath = this.getFullPath(folderPath);

    if (fs.existsSync(fullPath)) {
      throw new Error('文件夹已存在');
    }

    fs.mkdirSync(fullPath, { recursive: true });
    return folderPath;
  }

  fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }
}
