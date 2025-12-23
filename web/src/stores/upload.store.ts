import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UploadProgress } from '@/api/types';

export const useUploadStore = defineStore('upload', () => {
  // State
  const uploading = ref(false);
  const progress = ref<UploadProgress>({
    percent: 0,
    uploadedChunks: 0,
    totalChunks: 0,
    currentFile: '',
  });
  const uploadQueue = ref<File[]>([]);
  const errors = ref<string[]>([]);

  // Actions
  function setProgress(value: UploadProgress) {
    progress.value = value;
  }

  function setUploading(value: boolean) {
    uploading.value = value;
  }

  function addError(error: string) {
    errors.value.push(error);
  }

  function clearErrors() {
    errors.value = [];
  }

  function addToQueue(files: File[]) {
    uploadQueue.value.push(...files);
  }

  function clearQueue() {
    uploadQueue.value = [];
  }

  function removeFromQueue(index: number) {
    uploadQueue.value.splice(index, 1);
  }

  return {
    // State
    uploading,
    progress,
    uploadQueue,
    errors,
    // Actions
    setProgress,
    setUploading,
    addError,
    clearErrors,
    addToQueue,
    clearQueue,
    removeFromQueue,
  };
});
