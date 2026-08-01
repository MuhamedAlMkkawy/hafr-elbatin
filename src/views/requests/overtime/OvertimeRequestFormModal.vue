<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEdit ? t('overtimeRequests.modals.editTitle') : t('overtimeRequests.modals.addTitle')"
    width="xl"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <Select
        v-if="!authStore.isEmployee && scope !== 'own'"
        v-model="employee_id"
        :options="employeeOptions"
        :label="t('overtimeRequests.fields.employeeName')"
        :placeholder="t('overtimeRequests.placeholders.selectEmployee')"
        :required="true"
        :error="errors.employee_id"
        searchable
      />

      <Input
        v-model="date"
        type="date"
        :label="t('overtimeRequests.placeholders.date')"
        :required="true"
        :error="errors.date"
      >
      <template #suffix>
        <SvgIcon name="calendar" />
      </template>
      </Input>

      <Textarea
        v-model="notes"
        :label="t('overtimeRequests.fields.reason')"
        :placeholder="t('overtimeRequests.placeholders.reason')"
        :error="errors.notes"
        rows="4"
      />

      
    </form>
    <!-- Action buttons -->
      <template #footer>
        <div class="flex gap-3 pt-4 border-t border-gray-100 mt-6">
          <Button
            type="button"
            variant="ghost"
            @click="handleClose"
            :disabled="loading"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
            type="submit"
            variant="primary"
            :loading="loading"
            @click="onSubmit"
          >
            {{ t('common.sendRequest') }}
          </Button>
          
        </div>
      </template>
  </Modal>
</template>
<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { toTypedSchema } from '@vee-validate/yup'
import Modal from '@/components/ui/Modal.vue'
import Select from '@/components/ui/Select.vue'
import Input from '@/components/ui/Input.vue'
import Textarea from '@/components/ui/Textarea.vue'
import Button from '@/components/ui/Button.vue'
import { overtimeRequestsService } from '@/services/overtimeRequests'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  request: { type: Object, default: null },
  scope: { type: String, default: 'own' }
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t, locale } = useI18n()
const lang = computed(() => locale.value)
const authStore = useAuthStore()

const employees = ref([])
const employeesLoading = ref(false)

const schema = toTypedSchema(
  yup.object({
    employee_id: yup.string().test("is-required", t('overtimeRequests.fields.employeeName') + ' ' + t('common.required'), (val) => {
      if (authStore.isEmployee || props.scope === "own") return true;
      return !!val;
    }),
    date: yup.string().required(t('overtimeRequests.placeholders.date') + ' ' + t('common.required')),
    notes: yup.string().nullable().optional()
  })
)

const {
  handleSubmit: validateAndSubmit,
  errors,
  resetForm,
  setValues
} = useForm({
  validationSchema: schema,
  initialValues: {
    employee_id: '',
    date: '',
    notes: ''
  }
})

const { value: employee_id } = useField('employee_id')
const { value: date } = useField('date')
const { value: notes } = useField('notes')

const isEdit = computed(() => !!props.request?.id)

const loadEmployees = async () => {
  employeesLoading.value = true
  try {
    const response = await overtimeRequestsService.getEmployees()
    employees.value = response.data?.employees || []
  } catch (error) {
    console.error(error)
  } finally {
    employeesLoading.value = false
  }
}

const employeeOptions = computed(() => {
  return employees.value.map(emp => ({
    label: emp.name || (lang.value === 'ar' ? emp.name_ar : emp.name_en),
    value: emp.id
  }))
})

// Reset or populate form when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.request) {
      setValues({
        employee_id: props.request.employee?.id || props.request.employee_id || '',
        date: props.request.date || '',
        notes: props.request.notes || ''
      })
    } else {
      resetForm()
      if ((authStore.isEmployee || props.scope === 'own') && authStore.user?.id) {
        employee_id.value = authStore.user.id
      }
    }
    
    if (employees.value.length === 0) {
      loadEmployees()
    }
  }
})

const onSubmit = validateAndSubmit((values) => {
  emit('save', values)
})

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>