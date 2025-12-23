import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { QueryFilesDto } from '../dto/query-files.dto';
import { CreateFolderDto } from '../dto/create-folder.dto';
import { FileTreeItem, BatchDeleteResult } from '../interfaces/file-info.interface';
import { FileStorageService } from './file-storage.service';
import { MetadataService } from './metadata.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly fileStorageService: FileStorageService,
    private readonly metadataService: MetadataService,
  ) {}

  async queryFiles(dto: QueryFilesDto): Promise<FileTreeItem[]> {
    const scanPath = dto.path || '';
    let fileTree = await this.fileStorageService.scanDirectory(scanPath);

    // Apply search filter if provided
    if (dto.search) {
      fileTree = this.filterItems(fileTree, dto.search);
    }

    return fileTree;
  }

  private filterItems(items: FileTreeItem[], search: string): FileTreeItem[] {
    const searchLower = search.toLowerCase();
    return items
      .filter((item) => {
        if (item.type === 'directory') {
          item.children = this.filterItems(item.children || [], search);
          return (
            item.children.length > 0 ||
            item.name.toLowerCase().includes(searchLower)
          );
        }
        return item.name.toLowerCase().includes(searchLower);
      })
      .filter((item) => item !== undefined);
  }

  async getFileDownloadUrl(fileId: string): Promise<string> {
    const fileInfo = this.metadataService.findById(fileId);
    if (!fileInfo || !this.fileStorageService.fileExists(fileInfo.path)) {
      throw new NotFoundException('文件不存在');
    }

    // Increment download count
    this.metadataService.incrementDownloadCount(fileId);

    return fileInfo.path;
  }

  async deleteFile(fileId: string): Promise<void> {
    const fileInfo = this.metadataService.findById(fileId);
    if (!fileInfo) {
      throw new NotFoundException('文件不存在');
    }

    const success = await this.fileStorageService.deleteFileOrDir(
      fileInfo.path,
    );

    if (!success) {
      throw new Error('删除失败');
    }

    this.logger.log(`Deleted file: ${fileInfo.originalName}`);
  }

  async batchDelete(fileIds: string[]): Promise<BatchDeleteResult> {
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const fileId of fileIds) {
      const fileInfo = this.metadataService.findById(fileId);
      if (fileInfo) {
        const success = await this.fileStorageService.deleteFileOrDir(
          fileInfo.path,
        );
        if (success) {
          successCount++;
        } else {
          failCount++;
          errors.push(`删除失败: ${fileInfo.originalName}`);
        }
      } else {
        failCount++;
        errors.push(`文件不存在: ${fileId}`);
      }
    }

    this.logger.log(
      `Batch delete: ${successCount} succeeded, ${failCount} failed`,
    );

    return {
      deleted: successCount,
      failed: failCount,
      errors,
    };
  }

  async createFolder(dto: CreateFolderDto): Promise<{ path: string }> {
    const folderPath = await this.fileStorageService.createFolder(
      dto.name,
      dto.parentPath || '',
    );

    this.logger.log(`Created folder: ${dto.name} at ${dto.parentPath || 'root'}`);

    return { path: folderPath };
  }

  getStats() {
    return this.metadataService.getStats();
  }
}
