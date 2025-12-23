import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { filesApi } from '@/api/files.api';
import type { FileInfo, FileStats } from '@/api/types';

export const useFileStore = defineStore('file', () => {
  // State
  const files = ref<FileInfo[]>([]);
  const currentPath = ref('');
  const selectedIds = ref<Set<string>>(new Set());
  const loading = ref(false);

  // Computed
  const folders = computed(() =>
    files.value.filter((f) => f.type === 'directory')
  );

  const fileItems = computed(() =>
    files.value.filter((f) => f.type === 'file')
  );

  const stats = computed<FileStats>(() => {
    const flatten = (items: FileInfo[]): FileInfo[] => {
      const result: FileInfo[] = [];
      for (const item of items) {
        if (item.type === 'file') {
          result.push(item);
        } else if (item.children) {
          result.push(...flatten(item.children));
        }
      }
      return result;
    };

    const allFiles = flatten(files.value);
    return {
      totalFiles: allFiles.length,
      totalSize: allFiles.reduce((sum, f) => sum + f.size, 0),
      totalDownloads: allFiles.reduce((sum, f) => sum + (f.downloadCount || 0), 0),
      todayUploads: allFiles.filter(f => {
        const uploadDate = new Date(f.uploadTime).toDateString();
        const today = new Date().toDateString();
        return uploadDate === today;
      }).length,
    };
  });

  // Actions
  async function loadFiles(path?: string, search?: string) {
    loading.value = true;
    try {
      const data = await filesApi.queryFiles({ path, search });
      files.value = data;
      if (path !== undefined) {
        currentPath.value = path;
      }
    } finally {
      loading.value = false;
    }
  }

  function toggleSelection(id: string) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id);
    } else {
      selectedIds.value.add(id);
    }
  }

  function clearSelection() {
    selectedIds.value.clear();
  }

  function isSelected(id: string): boolean {
    return selectedIds.value.has(id);
  }

  async function deleteFiles(ids: string[]) {
    await filesApi.batchDelete(ids);
    await loadFiles(currentPath.value);
    clearSelection();
  }

  async function createFolder(name: string, parentPath?: string) {
    await filesApi.createFolder({ name, parentPath });
    await loadFiles(currentPath.value);
  }

  return {
    // State
    files,
    currentPath,
    selectedIds,
    loading,
    // Computed
    folders,
    fileItems,
    stats,
    // Actions
    loadFiles,
    toggleSelection,
    clearSelection,
    isSelected,
    deleteFiles,
    createFolder,
  };
});
