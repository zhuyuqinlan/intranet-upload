<template>
  <div
    class="file-card"
    :class="{ 'selected': selected }"
    @click="$emit('select', file.id)"
  >
    <!-- 复选框 -->
    <div class="file-checkbox" @click.stop>
      <n-checkbox :checked="selected" @update:checked="$emit('select', file.id)" />
    </div>

    <!-- 文件图标 -->
    <div class="file-preview">
      <div class="file-icon">{{ getFileIcon(file.name) }}</div>
    </div>

    <!-- 文件信息 -->
    <div class="file-info">
      <div class="file-name" :title="file.name">{{ file.name }}</div>
      <div class="file-meta">
        <span>{{ formatSize(file.size) }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="file-actions">
      <n-button text @click.stop="$emit('download', file.id)">
        <template #icon>
          <span>⬇️</span>
        </template>
      </n-button>
      <n-button text @click.stop="$emit('delete', file.id, file.name)">
        <template #icon>
          <span>🗑️</span>
        </template>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FileInfo } from '@/api/types';

defineProps<{
  file: FileInfo;
  selected: boolean;
}>();

defineEmits<{
  (e: 'select', id: string): void;
  (e: 'download', id: string): void;
  (e: 'delete', id: string, name: string): void;
}>();

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📽️',
    pptx: '📽️',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    webp: '🖼️',
    svg: '🎨',
    mp4: '🎬',
    mkv: '🎬',
    mp3: '🎵',
    wav: '🎵',
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    txt: '📃',
    md: '📃',
    js: '📜',
    ts: '📜',
    json: '📋',
    html: '🌐',
    css: '🎨',
  };
  return iconMap[ext || ''] || '📄';
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.file-card {
  position: relative;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all $animation-duration;

  &:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 12px rgba(255, 107, 157, 0.2);
    transform: translateY(-2px);

    .file-checkbox,
    .file-actions {
      opacity: 1;
    }
  }

  &.selected {
    border-color: $primary-color;
    background: rgba(255, 107, 157, 0.1);
  }
}

.file-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  opacity: 0;
  transition: opacity $animation-duration;
}

.file-preview {
  text-align: center;
  margin-bottom: 12px;
}

.file-icon {
  font-size: 3rem;
}

.file-info {
  text-align: center;
}

.file-name {
  font-size: 0.9rem;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.file-meta {
  font-size: 0.75rem;
  color: $text-secondary;
}

.file-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity $animation-duration;

  :deep(.n-button) {
    font-size: 1rem;
  }
}
</style>
