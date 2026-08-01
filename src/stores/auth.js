import { defineStore } from 'pinia'
import api from '@/services/api'
import { requestPermission } from '@/services/fcm'
import profileService from '@/services/profile'

const STORAGE_KEY = 'attendance.auth'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = safeParse(raw)
    return {
      token: parsed?.token ?? null,
      user: parsed?.user ?? null,
      branchId: parsed?.branchId ?? null,
      managerPermissions: parsed?.managerPermissions ?? null,
      previewBranchId: parsed?.previewBranchId ?? null,
      previewBranchName: parsed?.previewBranchName ?? null
    }
  },
  getters: {
    isAuthenticated: (s) => Boolean(s.token),
    roles: (s) => s.user?.roles || [],
    permissions: (s) => {
      if (s.managerPermissions) return s.managerPermissions.map(p => p.name);
      return s.user?.permissions?.map(p => p.name) || [];
    },
    isAdmin: (s) => s.user?.roles?.includes('super-admin'),
    isManager: (s) => s.user?.roles?.includes('manager'),
    isHr: (s) => s.user?.roles?.includes('hr-employee'),
    isPreviewMode: (s) => Boolean(s.managerPermissions),
    isEmployee: (s) => {
      const roles = s.user?.roles || [];
      return !roles.includes('super-admin') && !roles.includes('hr-employee') && !roles.includes('manager');
    },
    hasPermission: (s) => (permission) => {
      if (!s.managerPermissions && s.user?.roles?.includes('super-admin')) return true;
      if (!permission) return true;
      
      const userPerms = s.managerPermissions 
        ? s.managerPermissions.map(p => p.name) 
        : (s.user?.permissions?.map(p => p.name) || []);

      if (Array.isArray(permission)) {
        return permission.some(p => userPerms.includes(p));
      }
      return userPerms.includes(permission);
    }
  },
  actions: {
    restore() {
      // idempotent: if already loaded, skip
      if (this.token) return
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = safeParse(raw)
      if (!parsed || typeof parsed !== 'object') return
      this.token = parsed.token ?? null
      this.user = parsed.user ?? null
      this.branchId = parsed.branchId ?? null
      this.managerPermissions = parsed.managerPermissions ?? null
      this.previewBranchId = parsed.previewBranchId ?? null
      this.previewBranchName = parsed.previewBranchName ?? null
    },
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: this.token,
          user: this.user,
          branchId: this.branchId,
          managerPermissions: this.managerPermissions,
          previewBranchId: this.previewBranchId,
          previewBranchName: this.previewBranchName
        })
      )
    },
    async login({ email, password, device_name }) {
      if (!email || !password) throw new Error('Missing credentials')

      try {
        const { data: responseData } = await api.post('/login', { email, password, device_name })
        const data = responseData?.data || responseData

        const is2faRequired = data?.requires_2fa || responseData?.requires_2fa;
        const isSetupRequired = data?.user?.two_factor_enabled && !data?.user?.two_factor_confirmed_at;

        if (is2faRequired || isSetupRequired) {
          // Set in memory only, do not persist yet
          this.token = data?.token || responseData?.token || data?.two_factor_token;
          this.user = data?.user || responseData?.user;
          
          return {
            requires_2fa: true,
            two_factor_token: data.two_factor_token || this.token,
            two_factor_enabled: data.user?.two_factor_enabled ?? data?.two_factor_enabled,
            two_factor_confirmed_at: data.user?.two_factor_confirmed_at ?? data?.two_factor_confirmed_at
          }
        }

        const token = data?.token || responseData?.token
        const user = data?.user || responseData?.user

        if (!token) throw new Error('Invalid login response: missing token')

        this.token = token
        this.user = user || { name: email, email: email }
        
        // Extract default branch ID if available
        if (this.user?.branches?.length) {
          const defaultBranch = this.user.branches.find(b => b.is_default) || this.user.branches[0]
          this.branchId = defaultBranch.id
        }

        this.persist()
        
        // Request FCM permission and update token after successful login
        requestPermission().catch(console.error)
        return { success: true }
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Unable to sign in right now.'
        throw new Error(message)
      }
    },
    async verify2fa({ code, two_factor_token, device_name }) {
      try {
        const { data: responseData } = await api.post('/2fa/verify', { code, two_factor_token, device_name })
        const data = responseData?.data || responseData
        
        const token = data?.token || responseData?.token
        const user = data?.user || responseData?.user

        if (!token) throw new Error('Invalid verification response: missing token')

        this.token = token
        this.user = user || { name: user?.email || 'User', email: user?.email }
        
        // Extract default branch ID if available
        if (this.user?.branches?.length) {
          const defaultBranch = this.user.branches.find(b => b.is_default) || this.user.branches[0]
          this.branchId = defaultBranch.id
        }

        this.persist()
        requestPermission().catch(console.error)
        return data
      } catch (err) {
        throw err?.response?.data || err
      }
    },
    async setup2fa() {
      try {
        const { data } = await api.post('/2fa/setup')
        return data
      } catch (err) {
        throw err?.response?.data || err
      }
    },
    async regenerate2faCodes(two_factor_token) {
      try {
        const { data } = await api.post('/2fa/recovery-codes/regenerate', {}, {
          headers: {
            Authorization: `Bearer ${two_factor_token}`
          }
        })
        return data
      } catch (err) {
        throw err?.response?.data || err
      }
    },
    async confirm2fa({ code }) {
      try {
        const { data } = await api.post('/2fa/confirm', { code })
        // After successful confirmation, we can persist the token that was set during login
        this.persist()
        return data
      } catch (err) {
        throw err?.response?.data || err
      }
    },
    async get2faStatus() {
      try {
        const { data } = await api.get('/2fa/status')
        return data
      } catch (err) {
        throw err?.response?.data || err
      }
    },
    logout() {
      this.token = null
      this.user = null
      this.branchId = null
      this.managerPermissions = null
      this.previewBranchId = null
      this.previewBranchName = null
      localStorage.removeItem(STORAGE_KEY)
      // Return true to indicate successful logout
      return true
    },
    setBranch(id) {
      this.branchId = id
      this.persist()
    },
    startPreview(branchId, branchName, permissions) {
      this.previewBranchId = branchId;
      this.previewBranchName = branchName;
      this.managerPermissions = permissions;
      this.persist();
    },
    stopPreview() {
      this.previewBranchId = null;
      this.previewBranchName = null;
      this.managerPermissions = null;
      this.persist();
    }
  }
})


