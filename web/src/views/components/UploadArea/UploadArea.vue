<template>
  <div class="upload-area card">
    <h3 class="card-title">📤 上传文件</h3>

    <!-- 拖拽上传区域 -->
    <div
      class="drop-zone"
      :class="{ 'dragover': isDragover, 'uploading': uploading }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="selectFiles"
    >
      <input
        ref="fileInputRef"
        type="file"
        multiple
        style="display: none"
        @change="handleFileSelect"
      />
      <div class="drop-content">
        <div class="drop-icon">📁</div>
        <p class="drop-text">
          {{ uploading ? '上传中...' : '点击或拖拽文件到这里' }}
        </p>
        <p class="drop-subtitle">支持大文件分片上传</p>
      </div>
    </div>

    <!-- 文件夹选择 -->
    <div class="folder-selector">
      <label class="label">目标文件夹:</label>
      <n-select
        v-model:value="selectedFolder"
        :options="folderOptions"
        placeholder="根目录"
        clearable
      />
    </div>

    <!-- 上传进度 -->
    <div v-if="uploading || progress.percent > 0" class="progress-section">
      <div class="progress-info">
        <span class="progress-file">{{ progress.currentFile }}</span>
        <span class="progress-percent">{{ progress.percent }}%</span>
      </div>
      <n-progress
        type="line"
        :percentage="progress.percent"
        :color="progressColor"
        :height="12"
        :border-radius="6"
      />
    </div>

    <!-- 上传队列 -->
    <div v-if="uploadQueue.length > 0" class="upload-queue">
      <h4>上传队列 ({{ uploadQueue.length }})</h4>
      <div class="queue-list">
        <div v-for="(file, index) in uploadQueue" :key="index" class="queue-item">
          <span class="queue-file-name">{{ file.name }}</span>
          <span class="queue-file-size">{{ formatSize(file.size) }}</span>
        </div>
      </div>
      <button class="btn-primary start-btn" @click="startUpload" :disabled="uploading">
        {{ uploading ? '上传中...' : '开始上传' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUploadStore } from '@/stores/upload.store';
import { useFileStore } from '@/stores/file.store';
import { useChunkUpload } from '@/composables/useChunkUpload';
import { filesApi } from '@/api/files.api';

const uploadStore = useUploadStore();
const fileStore = useFileStore();
const { uploading, progress, uploadQueue } = storeToRefs(uploadStore);
const { files } = storeToRefs(fileStore);

const { uploadFiles } = useChunkUpload();

const isDragover = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFolder = ref('');

// 文件夹选项（只包含文件夹）
const folderOptions = computed(() => {
  const folders = files.value
    .filter((f) => f.type === 'directory')
    .map((f) => ({
      label: f.name,
      value: f.path,
    }));
  return folders;
});

// 进度条颜色
const progressColor = computed(() => {
  if (progress.value.percent < 30) return '#ff6b9d';
  if (progress.value.percent < 70) return '#c66efc';
  return '#66d9ef';
});

// 拖拽处理
function handleDragOver() {
  isDragover.value = true;
}

function handleDragLeave() {
  isDragover.value = false;
}

function handleDrop(e: DragEvent) {
  isDragover.value = false;
  const droppedFiles = Array.from(e.dataTransfer?.files || []);
  if (droppedFiles.length > 0) {
    uploadStore.addToQueue(droppedFiles);
  }
}

// 选择文件
function selectFiles() {
  fileInputRef.value?.click();
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const selectedFiles = Array.from(target.files || []);
  if (selectedFiles.length > 0) {
    uploadStore.addToQueue(selectedFiles);
  }
  target.value = '';
}

// 开始上传
async function startUpload() {
  if (uploadQueue.value.length === 0) return;

  const filesToUpload = [...uploadQueue.value];
  uploadStore.clearQueue();

  try {
    await uploadFiles(filesToUpload, selectedFolder.value || '');
    await fileStore.loadFiles(selectedFolder.value || '');
  } catch (error) {
    console.error('Upload error:', error);
  }
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.upload-area {
  .card-title {
    font-size: 1.2rem;
    color: $primary-color;
    margin-bottom: 16px;
    text-align: center;
  }
}

.drop-zone {
  border: 3px dashed $border-color;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all $animation-duration;

  &:hover, &.dragover {
    border-color: $primary-color;
    background: rgba(255, 107, 157, 0.05);
  }

  &.uploading {
    pointer-events: none;
    opacity: 0.6;
  }

  .drop-icon {
    font-size: 3rem;
    margin-bottom: 12px;
  }

  .drop-text {
    font-size: 1rem;
    color: $text-primary;
    margin-bottom: 4px;
  }

  .drop-subtitle {
    font-size: 0.85rem;
    color: $text-secondary;
  }
}

.folder-selector {
  margin-top: 20px;

  .label {
    display: block;
    font-size: 0.9rem;
    color: $text-secondary;
    margin-bottom: 8px;
  }
}

.progress-section {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 107, 157, 0.05);
  border-radius: 12px;

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }

  .progress-file {
    color: $text-primary;
    font-weight: 500;
  }

  .progress-percent {
    color: $primary-color;
    font-weight: 600;
  }
}

.upload-queue {
  margin-top: 20px;

  h4 {
    font-size: 1rem;
    color: $text-primary;
    margin-bottom: 12px;
  }

  .queue-list {
    max-height: 150px;
    overflow-y: auto;
    margin-bottom: 12px;
  }

  .queue-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    margin-bottom: 8px;

    .queue-file-name {
      font-size: 0.9rem;
      color: $text-primary;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
    }

    .queue-file-size {
      font-size: 0.85rem;
      color: $text-secondary;
    }
  }

  .start-btn {
    width: 100%;
    margin-top: 8px;
  }
}
</style>
