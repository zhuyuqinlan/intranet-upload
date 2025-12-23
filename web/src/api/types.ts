// 文件信息
export interface FileInfo {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  uploadTime: string;
  downloadCount?: number;
  hash?: string;
  children?: FileInfo[];
}

// 统计信息
export interface FileStats {
  totalFiles: number;
  totalSize: number;
  totalDownloads: number;
  todayUploads: number;
}

// 上传相关
export interface InitUploadRequest {
  filename: string;
  fileSize: number;
  fileHash: string;
  chunkSize: number;
  folderPath?: string;
  force?: boolean;
}

export interface InitUploadResponse {
  uploadId: string;
  chunks: number;
  existingChunks: number[];
}

export interface CompleteUploadRequest {
  uploadId: string;
  filename: string;
  fileHash: string;
}

export interface CompleteUploadResponse {
  fileId: string;
  filename: string;
  path: string;
  downloadUrl: string;
}

// 上传进度
export interface UploadProgress {
  percent: number;
  uploadedChunks: number;
  totalChunks: number;
  currentFile: string;
}

// API 响应
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
