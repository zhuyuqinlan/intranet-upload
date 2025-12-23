import { ref } from 'vue';
import SparkMD5 from 'spark-md5';
import { uploadApi } from '@/api/upload.api';
import { useUploadStore } from '@/stores/upload.store';
import { useFileStore } from '@/stores/file.store';
import { useUiStore } from '@/stores/ui.store';
import type { UploadProgress } from '@/api/types';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CONCURRENT_UPLOADS = 3;
const HASH_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB for hash calculation

export function useChunkUpload() {
  const uploadStore = useUploadStore();
  const fileStore = useFileStore();
  const uiStore = useUiStore();

  // 计算文件哈希
  async function calculateHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer();
      const reader = new FileReader();
      const chunks = Math.ceil(file.size / HASH_CHUNK_SIZE);
      let currentChunk = 0;

      const loadNext = () => {
        const start = currentChunk * HASH_CHUNK_SIZE;
        const end = Math.min(start + HASH_CHUNK_SIZE, file.size);

        reader.onload = (e) => {
          spark.append(e.target?.result as ArrayBuffer);
          currentChunk++;

          if (currentChunk < chunks) {
            loadNext();
          } else {
            resolve(spark.end());
          }
        };

        reader.onerror = () => {
          reject(new Error('文件哈希计算失败'));
        };

        reader.readAsArrayBuffer(file.slice(start, end));
      };

      loadNext();
    });
  }

  // 上传单个分片
  async function uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunk: Blob
  ): Promise<void> {
    return uploadApi.uploadChunk(uploadId, chunkIndex, chunk);
  }

  // 上传文件的所有分片（并发控制）
  async function uploadChunks(
    uploadId: string,
    file: File,
    totalChunks: number,
    existingChunks: number[]
  ): Promise<void> {
    const uploadedSet = new Set(existingChunks);
    const chunksToUpload: number[] = [];

    for (let i = 0; i < totalChunks; i++) {
      if (!uploadedSet.has(i)) {
        chunksToUpload.push(i);
      }
    }

    let completed = 0;
    const uploadPromises: Promise<void>[] = [];

    for (const chunkIndex of chunksToUpload) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const promise = uploadChunk(uploadId, chunkIndex, chunk)
        .then(() => {
          completed++;
          uploadStore.setProgress({
            percent: Math.round(((uploadedSet.size + completed) / totalChunks) * 100),
            uploadedChunks: uploadedSet.size + completed,
            totalChunks,
            currentFile: file.name,
          });
        })
        .catch((err) => {
          throw new Error(`分片 ${chunkIndex} 上传失败: ${err.message}`);
        });

      uploadPromises.push(promise);

      // 并发控制
      if (uploadPromises.length >= MAX_CONCURRENT_UPLOADS) {
        await Promise.race(uploadPromises);
        // 移除已完成的 promise
        const settled = await Promise.allSettled(uploadPromises);
        for (let i = uploadPromises.length - 1; i >= 0; i--) {
          if (settled[i].status === 'fulfilled') {
            uploadPromises.splice(i, 1);
          }
        }
      }
    }

    await Promise.all(uploadPromises);
  }

  // 上传单个文件
  async function uploadFile(file: File, folderPath: string, force = false): Promise<void> {
    try {
      uploadStore.setUploading(true);
      uiStore.showToast(`开始上传: ${file.name}`, 'info');

      // 1. 计算哈希
      const fileHash = await calculateHash(file);
      uiStore.showToast('哈希计算完成', 'info');

      // 2. 初始化上传
      const { uploadId, chunks, existingChunks } = await uploadApi.initUpload({
        filename: file.name,
        fileSize: file.size,
        fileHash,
        chunkSize: CHUNK_SIZE,
        folderPath,
        force,
      });

      // 3. 上传分片
      await uploadChunks(uploadId, file, chunks, existingChunks);

      // 4. 完成上传
      const result = await uploadApi.completeUpload({
        uploadId,
        filename: file.name,
        fileHash,
      });

      uiStore.showToast(`${file.name} 上传成功！`, 'success');

      // 刷新文件列表
      await fileStore.loadFiles(folderPath);
    } catch (error: any) {
      const message = error.message || '上传失败';
      uploadStore.addError(message);
      uiStore.showToast(message, 'error');
      throw error;
    } finally {
      uploadStore.setUploading(false);
    }
  }

  // 上传多个文件
  async function uploadFiles(files: File[], folderPath: string): Promise<void> {
    for (const file of files) {
      await uploadFile(file, folderPath);
    }
  }

  return {
    uploading: uploadStore.uploading,
    progress: uploadStore.progress,
    uploadFile,
    uploadFiles,
    calculateHash,
  };
}
