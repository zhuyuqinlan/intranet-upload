<template>
  <div class="breadcrumb">
    <span class="breadcrumb-item" @click="navigateTo('')">
      🏠 根目录
    </span>
    <template v-for="(part, index) in pathParts" :key="index">
      <span class="breadcrumb-separator">›</span>
      <span
        v-if="index === pathParts.length - 1"
        class="breadcrumb-current"
      >
        {{ part }}
      </span>
      <span
        v-else
        class="breadcrumb-item"
        @click="navigateTo(getPathUpTo(index))"
      >
        {{ part }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useFileStore } from '@/stores/file.store';

const fileStore = useFileStore();
const { currentPath } = storeToRefs(fileStore);

const pathParts = computed(() => {
  return currentPath.value.split('/').filter(p => p);
});

function getPathUpTo(index: number): string {
  return pathParts.value.slice(0, index + 1).join('/');
}

function navigateTo(path: string) {
  fileStore.loadFiles(path);
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  gap: 4px;
}

.breadcrumb-item {
  color: $primary-color;
  cursor: pointer;
  transition: color $animation-duration;
  font-size: 0.9rem;

  &:hover {
    color: $secondary-color;
    text-decoration: underline;
  }
}

.breadcrumb-current {
  color: $text-primary;
  font-weight: 500;
  font-size: 0.9rem;
}

.breadcrumb-separator {
  color: $text-secondary;
  margin: 0 4px;
}
</style>
