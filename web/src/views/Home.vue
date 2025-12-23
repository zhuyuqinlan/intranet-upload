<template>
  <div class="main-container">
    <!-- 头部 -->
    <header class="header animate-slide-down">
      <h1>🌸 萌萌文件中心</h1>
      <p class="subtitle">局域网文件共享 ~ (｡♥‿♥｡)</p>
    </header>

    <!-- 内容区域 -->
    <div class="content-wrapper">
      <!-- 左侧：上传区域 -->
      <div class="left-panel">
        <UploadArea />
        <StatsCard />
      </div>

      <!-- 右侧：文件列表 -->
      <div class="right-panel card">
        <FileList />
      </div>
    </div>

    <!-- 全局提示 -->
    <n-global-message-provider />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useFileStore } from '@/stores/file.store';
import UploadArea from './components/UploadArea/UploadArea.vue';
import FileList from './components/FileList/FileList.vue';
import StatsCard from './components/StatsCard/StatsCard.vue';

const fileStore = useFileStore();

onMounted(() => {
  fileStore.loadFiles('');
});
</script>

<style scoped>
.content-wrapper {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 30px;
}

@media (max-width: 968px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  min-height: 500px;
}
</style>
