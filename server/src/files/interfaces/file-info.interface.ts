export interface FileInfo {
  id: string;
  path: string;
  relativePath: string;
  originalName: string;
  size: number;
  hash: string;
  uploadTime: string;
  downloadCount: number;
}

export interface FileTreeItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  uploadTime: string;
  downloadCount?: number;
  hash?: string;
  children?: FileTreeItem[];
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  totalDownloads: number;
  todayUploads: number;
}

export interface BatchDeleteResult {
  deleted: number;
  failed: number;
  errors: string[];
}
