import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  // State
  const searchQuery = ref('');
  const showCreateFolderDialog = ref(false);
  const showBatchDeleteButton = ref(false);

  // Toast notification
  const toast = ref({
    show: false,
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
  });

  // Actions
  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  function toggleCreateFolderDialog(show: boolean) {
    showCreateFolderDialog.value = show;
  }

  function showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    toast.value = { show: true, message, type };
    setTimeout(() => {
      toast.value.show = false;
    }, 3000);
  }

  function updateBatchDeleteButton(show: boolean) {
    showBatchDeleteButton.value = show;
  }

  return {
    // State
    searchQuery,
    showCreateFolderDialog,
    showBatchDeleteButton,
    toast,
    // Actions
    setSearchQuery,
    toggleCreateFolderDialog,
    showToast,
    updateBatchDeleteButton,
  };
});
