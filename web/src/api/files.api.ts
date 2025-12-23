import request from './request';
import type { FileInfo, FileStats } from './types';

export const filesApi = {
  // 获取文件列表
  queryFiles(params?: { path?: string; search?: string }): Promise<FileInfo[]> {
    return request.get('/files', { params });
  },

  // 下载文件
  getDownloadUrl(fileId: string): string {
    return `/api/download/${fileId}`;
  },

  // 删除单个文件
  deleteFile(fileId: string): Promise<void> {
    return request.delete(`/files/${fileId}`);
  },

  // 批量删除文件
  batchDelete(fileIds: string[]): Promise<{ deleted: number; failed: number; errors: string[] }> {
    return request.delete('/files/batch', { data: { fileIds } });
  },

  // 创建文件夹
  createFolder(data: { name: string; parentPath?: string }): Promise<{ path: string }> {
    return request.post('/folders', data);
  },

  // 获取统计信息
  getStats(): Promise<FileStats> {
    return request.get('/stats');
  },
};
