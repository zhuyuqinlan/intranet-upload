<template>
  <div class="folder-card" @click="$emit('click')">
    <div class="folder-preview">
      <div class="folder-icon">📁</div>
    </div>
    <div class="folder-info">
      <div class="folder-name" :title="folder.name">{{ folder.name }}</div>
      <div class="folder-meta">{{ folder.children?.length || 0 }} 项</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FileInfo } from '@/api/types';

defineProps<{
  folder: FileInfo;
}>();

defineEmits<{
  (e: 'click'): void;
}>();
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.folder-card {
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  text-align: center;
  transition: all $animation-duration;

  &:hover {
    background: rgba(255, 255, 255, 1);
    border-color: $secondary-color;
    box-shadow: 0 4px 12px rgba(198, 110, 252, 0.2);
    transform: translateY(-2px);
  }
}

.folder-preview {
  margin-bottom: 12px;
}

.folder-icon {
  font-size: 3rem;
}

.folder-name {
  font-size: 0.9rem;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.folder-meta {
  font-size: 0.75rem;
  color: $text-secondary;
}
</style>
