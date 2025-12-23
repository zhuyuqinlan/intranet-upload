<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <div class="app-container">
      <!-- 背景装饰 -->
      <div class="bg-decoration"></div>
      <div class="bg-decoration"></div>
      <div class="bg-decoration"></div>

      <!-- 主内容 -->
      <n-message-provider>
        <n-dialog-provider>
          <Home />
        </n-dialog-provider>
      </n-message-provider>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import Home from './views/Home.vue';

const themeOverrides = reactive({
  common: {
    primaryColor: '#ff6b9d',
    primaryColorHover: '#ff8db5',
    primaryColorPressed: '#e55a8a',
    borderRadius: '12px',
  },
});
</script>

<style>
.app-container {
  min-height: 100vh;
  position: relative;
}
</style>
