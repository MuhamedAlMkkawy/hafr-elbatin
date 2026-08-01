<template>
  <div class="p-0">
    <SuperAdminDashboard v-if="isAdmin" />
    <HrDashboard v-else-if="isHrEmployee" />
    <EmployeeDashboard v-else-if="isEmployee" />
    
    <div v-else class="flex items-center justify-center min-h-[400px]">
        <p class="text-gray-500">{{ $t('dashboard.welcome', { name: auth.user?.name }) }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard.vue'
import HrDashboard from '@/components/dashboard/HrDashboard.vue'
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard.vue'

const auth = useAuthStore()

const isAdmin = computed(() => {
    return auth.user?.roles?.some(role => {
        const r = role.toLowerCase();
        return r === 'super-admin' || r === 'super admin';
    });
})

const isHrEmployee = computed(() => {
    return auth.user?.roles?.some(role => role.toLowerCase() === 'hr-employee');
})

const isEmployee = computed(() => {
    return auth.user?.roles?.some(role => role.toLowerCase() === 'employee');
})
</script>