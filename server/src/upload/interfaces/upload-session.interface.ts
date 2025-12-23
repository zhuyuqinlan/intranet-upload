export interface UploadSession {
  uploadId: string;
  filename: string;
  fileHash: string;
  chunkSize: number;
  totalChunks: number;
  fileSize: number;
  folderPath: string;
  targetPath: string;
  uploadedChunks: Set<number>;
  createdAt: Date;
}
