import { defineStore } from 'pinia';
import notificationService from '@/services/notifications';

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    unreadCount: 0,
    lastUpdate: null,
    loading: false,
    refreshListTrigger: 0
  }),
  actions: {
    async fetchUnreadCount() {
      this.loading = true;
      try {
        const response = await notificationService.getUnreadCount();
        if (response.data?.success) {
          this.unreadCount = response.data.data.unread_count || 0;
          this.lastUpdate = new Date();
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      } finally {
        this.loading = false;
      }
    },
    incrementUnreadCount() {
      this.unreadCount++;
    },
    triggerListRefresh() {
      this.refreshListTrigger++;
    },
    decrementUnreadCount() {
      if (this.unreadCount > 0) {
        this.unreadCount--;
      }
    },
    resetUnreadCount() {
      this.unreadCount = 0;
    }
  }
});
