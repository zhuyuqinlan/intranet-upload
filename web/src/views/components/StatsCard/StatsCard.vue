<template>
  <div class="stats-card card">
    <h3 class="card-title">📊 统计信息</h3>
    <div class="stats-list">
      <div class="stat-item">
        <span class="stat-label">文件总数</span>
        <span class="stat-value">{{ stats.totalFiles }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总大小</span>
        <span class="stat-value">{{ formatSize(stats.totalSize) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">下载次数</span>
        <span class="stat-value">{{ stats.totalDownloads }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">今日上传</span>
        <span class="stat-value">{{ stats.todayUploads }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useFileStore } from '@/stores/file.store';

const fileStore = useFileStore();
const { stats } = storeToRefs(fileStore);

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

.stats-card {
  .card-title {
    font-size: 1.2rem;
    color: $primary-color;
    margin-bottom: 16px;
    text-align: center;
  }
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;

  .stat-label {
    font-size: 0.9rem;
    color: $text-secondary;
  }

  .stat-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: $primary-color;
  }
}
</style>
