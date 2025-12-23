<template>
  <div class="file-list-container">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <!-- 搜索和操作栏 -->
    <div class="toolbar">
      <n-input
        v-model:value="searchQuery"
        placeholder="搜索文件..."
        clearable
        class="search-input"
      >
        <template #prefix>
          <span class="search-icon">🔍</span>
        </template>
      </n-input>
      <div class="toolbar-actions">
        <n-button quaternary @click="showCreateFolderModal">
          <template #icon>
            <span>📁+</span>
          </template>
          新建文件夹
        </n-button>
        <n-button
          v-if="selectedCount > 0"
          type="error"
          quaternary
          @click="handleBatchDelete"
        >
          <template #icon>
            <span>🗑️</span>
          </template>
          删除 ({{ selectedCount }})
        </n-button>
      </div>
    </div>

    <!-- 文件网格 -->
    <div v-if="loading" class="loading-state">
      <n-spin size="large" />
    </div>

    <div v-else-if="displayFiles.length === 0" class="empty-state">
      <n-empty description="文件夹是空的~" />
    </div>

    <div v-else class="files-grid">
      <!-- 文件夹 -->
      <FolderCard
        v-for="folder in folders"
        :key="folder.id"
        :folder="folder"
        @click="navigateToPath(folder.path)"
      />

      <!-- 文件 -->
      <FileCard
        v-for="file in fileItems"
        :key="file.id"
        :file="file"
        :selected="isSelected(file.id)"
        @select="toggleSelection(file.id)"
        @download="downloadFile(file.id)"
        @delete="deleteFile(file.id, file.name)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useDialog, useMessage } from 'naive-ui';
import { useFileStore } from '@/stores/file.store';
import { useUiStore } from '@/stores/ui.store';
import Breadcrumb from './Breadcrumb.vue';
import FileCard from './FileCard.vue';
import FolderCard from './FolderCard.vue';

const fileStore = useFileStore();
const uiStore = useUiStore();
const dialog = useDialog();
const message = useMessage();

const { files, loading, currentPath } = storeToRefs(fileStore);

const searchQuery = ref('');
const selectedIds = ref<Set<string>>(new Set());

// 过滤后的文件列表
const displayFiles = computed(() => {
  if (!searchQuery.value) return files.value;
  const query = searchQuery.value.toLowerCase();
  return files.value.filter((f) => f.name.toLowerCase().includes(query));
});

const folders = computed(() => displayFiles.value.filter((f) => f.type === 'directory'));
const fileItems = computed(() => displayFiles.value.filter((f) => f.type === 'file'));
const selectedCount = computed(() => selectedIds.value.size);

// 监听搜索输入
watch(searchQuery, () => {
  fileStore.loadFiles(currentPath.value, searchQuery.value);
});

// 选择/取消选择
function toggleSelection(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
}

function isSelected(id: string): boolean {
  return selectedIds.value.has(id);
}

// 导航到路径
function navigateToPath(path: string) {
  selectedIds.value.clear();
  fileStore.loadFiles(path);
}

// 下载文件
function downloadFile(fileId: string) {
  window.open(`/api/download/${fileId}`, '_blank');
}

// 删除单个文件
function deleteFile(fileId: string, fileName: string) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除 "${fileName}" 吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await fileStore.deleteFiles([fileId]);
        message.success('删除成功');
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
}

// 批量删除
function handleBatchDelete() {
  const ids = Array.from(selectedIds.value);
  if (ids.length === 0) return;

  dialog.warning({
    title: '确认删除',
    content: `确定要删除选中的 ${ids.length} 个文件吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await fileStore.deleteFiles(ids);
        message.success(`成功删除 ${ids.length} 个文件`);
        selectedIds.value.clear();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
}

// 创建文件夹
function showCreateFolderModal() {
  dialog.create({
    title: '新建文件夹',
    content: () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = '文件夹名称';
      input.className = 'n-input';
      input.style.cssText = 'width: 100%; padding: 8px 12px; border: 1px solid #e1e8ed; border-radius: 8px;';
      return input;
    },
    positiveText: '创建',
    negativeText: '取消',
    onPositiveClick: async () => {
      const input = document.querySelector('.n-input') as HTMLInputElement;
      const name = input?.value?.trim();
      if (name) {
        try {
          await fileStore.createFolder(name, currentPath.value);
          message.success('文件夹创建成功');
        } catch (error: any) {
          message.error(error.message || '创建失败');
        }
      }
    },
  });
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.file-list-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;

  .search-input {
    flex: 1;
    max-width: 300px;

    .search-icon {
      font-size: 1rem;
    }
  }

  .toolbar-actions {
    display: flex;
    gap: 8px;
  }
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
</style>
