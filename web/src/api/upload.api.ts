import request from './request';
import type {
  InitUploadRequest,
  InitUploadResponse,
  CompleteUploadRequest,
  CompleteUploadResponse,
} from './types';

export const uploadApi = {
  // 初始化上传
  initUpload(data: InitUploadRequest): Promise<InitUploadResponse> {
    return request.post('/upload/init', data);
  },

  // 上传分片
  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunk: Blob
  ): Promise<{ uploaded: number; total: number }> {
    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('chunk', chunk);

    // 让 Axios 自动处理 FormData 的 Content-Type（自动添加 boundary）
    return request.post('/upload/chunk', formData);
  },

  // 完成上传
  completeUpload(data: CompleteUploadRequest): Promise<CompleteUploadResponse> {
    return request.post('/upload/complete', data);
  },
};
