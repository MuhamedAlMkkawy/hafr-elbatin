<template>
  <div class="space-y-4">
    <!-- Breadcrumb -->
    <Breadcrumb :items="breadcrumbItems" />

    <!-- Page Header Title -->
    <div v-if="employee" class="mb-2">
      <h2 class="text-[20px] font-bold text-[#101828]">
        {{ t("employees.editTitle") }}
      </h2>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <template v-else-if="employee">
      <!-- Editable Section -->
      <Card
        class="!mt-4 !p-0 overflow-hidden border border-[#87AFA4] bg-[#F3F9F6]/30"
      >
        <div
          class="bg-[#F3F9F6] py-2 px-4 border-b border-gray-100 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <h3 class="font-[500] text-[#1F2A37] text-[16px] my-3">
              {{ t("employees.fields.editableSection") }}
            </h3>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              v-model="form.work_system_type"
              :options="workSystemTypeOptions"
              :label="t('employees.fields.workSystemType')"
              :placeholder="t('employees.fields.workSystemType')"
              :error="errors.work_system_type"
              required
              size="md"
            />
            <Select
              v-model="form.role"
              :options="roleOptions"
              :label="t('employees.fields.roleLabel')"
              :placeholder="t('employees.placeholders.role')"
              :error="errors.role"
              required
              size="md"
              multiple
              searchable
              :showSelectAll="false"
            />
          </div>

          <div class="flex items-center gap-3">
            <SvgIcon name="emp_info" />
            <p class="text-[14px] text-[#384250]">
              {{ t("employees.workSystemChangeNote") }}
            </p>
          </div>

          <div class="flex items-center gap-5 mt-4">
            <Toggle v-model="form.mobile_attendance_enabled" size="md" />
            <div class="space-y-1">
              <label class="font-[500] text-[#000000] text-[14px]">
                {{ t("employees.fields.enableMobileAttendance") }}
              </label>
              <p class="text-[14px] text-[#6C737F] mt-1">
                {{ t("employees.fields.mobileAttendanceHint") }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 justify-end">
            <Button variant="secondary" @click="cancel">
              {{ t("common.cancel") }}
            </Button>
            <Button variant="primary" :loading="saving" @click="save">
              {{ t("common.save") }}
            </Button>
          </div>
        </div>
      </Card>

      <!-- Identity Section (Read-only) -->
      <Card class="!mt-6 !p-0 overflow-hidden border-none">
        <div
          class="bg-[#F3F9F6] py-2 px-4 border-b border-gray-100 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <SvgIcon
              name="info"
              classes="w-12 h-12 transition-transform duration-200"
            />
            <h3 class="font-[500] text-[#1F2A37] text-[16px]">
              {{ t("employees.fields.identitySection") }}
            </h3>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <DetailRow
              :label="t('employees.fields.employeeId')"
              :value="employee.employee_number"
            />
            <DetailRow
              :label="t('employees.fields.employeeName')"
              :value="employee.name"
            />
            <DetailRow
              :label="t('employees.fields.nationalId')"
              :value="employee.id_number || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.mobile')"
              :value="employee.mobile || employee.phone || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.email')"
              :value="employee.email || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.address')"
              :value="employee?.address || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.gender')"
              :value="genderLabel(employee.gender) || '--------'"
            />
          </div>
        </div>
      </Card>

      <!-- Employment Section (Read-only) -->
      <Card class="!mt-6 !p-0 overflow-hidden border-none">
        <div
          class="bg-[#F3F9F6] py-2 px-4 border-b border-gray-100 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <SvgIcon
              name="job_data"
              classes="w-12 h-12 transition-transform duration-200"
            />
            <h3 class="font-[500] text-[#1F2A37] text-[16px]">
              {{ t("employees.fields.employmentSection") }}
            </h3>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <DetailRow
              :label="t('employees.fields.entityCode')"
              :value="employee.organizational_unit?.code || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.entityName')"
              :value="organizationalUnitName(employee) || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.departmentSection')"
              :value="departmentName(employee) || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.positionName')"
              :value="employee.employee_type || '--------'"
            />

            <div class="flex items-center">
              <span class="text-[13px] font-[500] text-[#6C737F] w-[170px]">{{
                t("employees.fields.status")
              }}</span>
              <div
                class="flex items-center gap-1.5 px-3 py-1 rounded-full"
                :class="!employee.is_active ? 'bg-[#E5E7EB]' : 'bg-[#ECFDF3]'"
              >
                <span
                  class="w-[10px] h-[10px] rounded-full"
                  :class="!employee.is_active ? 'bg-[#4D5761]' : 'bg-[#085D3A]'"
                ></span>
                <span
                  class="text-[14px] font-[500]"
                  :class="
                    !employee.is_active ? 'text-[#1F2A37]' : 'text-[#085D3A]'
                  "
                >
                  {{
                    !employee.is_active
                      ? t("branches.status.inactive")
                      : t("branches.status.active")
                  }}
                </span>
              </div>
            </div>

            <div class="flex items-center">
              <span class="text-[13px] font-[500] text-[#6C737F] w-[170px]">{{
                t("employees.fields.isGovernment")
              }}</span>
              <span
                class="px-3 py-1 rounded-full bg-[#E5E7EB] text-[#14573A] text-[10px] font-semibold"
              >
                {{
                  employee.is_government
                    ? t("employees.yes")
                    : t("employees.no") || "--------"
                }}
              </span>
            </div>

            <DetailRow
              :label="t('employees.fields.staffType')"
              :value="employee.staff_type || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.directManager')"
              :value="employee.manager?.name || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.workSystemType')"
              :value="workSystemLabel(employee)"
            />
            <DetailRow
              :label="t('employees.fields.role')"
              :value="roleLabel(employee.roles) || '--------'"
            />

            <DetailRow
              :label="t('employees.fields.joinDate')"
              :value="formatDate(employee.branch_join_date) || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.joinDateHijri')"
              :value="formatDateHijri(employee.branch_join_date) || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.leaveDate')"
              :value="formatDate(employee.branch_exit_date) || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.leaveDateHijri')"
              :value="formatDateHijri(employee.branch_exit_date) || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.updatedAt')"
              :value="formatDate(employee.updated_at) || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.createdAt')"
              :value="formatDate(employee.created_at) || '--------'"
            />
            <DetailRow
              :label="t('employees.fields.appointmentGovernment')"
              :value="
                formatDate(employee.government_appointment_date) || '--------'
              "
            />
            <DetailRow
              :label="t('employees.fields.appointmentMinistry')"
              :value="
                formatDate(employee.ministry_appointment_date) || '--------'
              "
            />

            <div class="flex items-center">
              <span class="text-[13px] font-[500] text-[#6C737F] w-[170px]">{{
                t("employees.fields.mobileAttendanceStatus")
              }}</span>
              <div
                class="flex items-center gap-1.5 px-3 py-1 rounded-full"
                :class="
                  employee.mobile_attendance_enabled
                    ? 'bg-[#ECFDF3]'
                    : 'bg-[#E5E7EB]'
                "
              >
                <span
                  class="w-[10px] h-[10px] rounded-full"
                  :class="
                    employee.mobile_attendance_enabled
                      ? 'bg-[#085D3A]'
                      : 'bg-[#1F2A37]'
                  "
                ></span>
                <span
                  class="text-[14px] font-[500]"
                  :class="
                    employee.mobile_attendance_enabled
                      ? 'text-[#085D3A]'
                      : 'text-[#1F2A37]'
                  "
                >
                  {{
                    employee.mobile_attendance_enabled
                      ? t("employees.mobileEnabled")
                      : t("employees.mobileDisabled")
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Footer Back Button -->
      <div class="flex items-center gap-3 pt-6 justify-end">
        <Button variant="secondary" @click="cancel">
          {{ t("common.back") }}
        </Button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Select from "@/components/ui/Select.vue";
import Toggle from "@/components/ui/Toggle.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";

import { employeeService } from "@/services/employees";
import { roleService } from "@/services/roles";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useAppToast();

const loading = ref(true);
const saving = ref(false);
const employee = ref(null);

const form = ref({
  role: [],
  work_system_type: "",
  mobile_attendance_enabled: true,
});

const errors = ref({
  role: "",
  work_system_type: "",
});

const isEn = computed(() => route.path.startsWith("/en"));
const basePath = computed(() => (isEn.value ? "/en/employees" : "/employees"));

const breadcrumbItems = computed(() => [
  { label: t("employees.title"), to: basePath.value },
  { label: t("employees.editTitle") },
]);

// Local component for detail rows
const DetailRow = (props) => {
  return h("div", { class: "flex items-center" }, [
    h(
      "span",
      { class: "text-[13px] font-[500] text-[#6C737F] w-[170px]" },
      props.label,
    ),
    h(
      "span",
      { class: "font-bold text-[#101828] text-[15px]" },
      props.value || "--------",
    ),
  ]);
};

const roleOptions = ref([]);

const loadRoles = async () => {
  try {
    const res = await roleService.list({ paginate: false });
    const list = res.data || [];
    roleOptions.value = list
      .filter((r) => r.name !== "All" && r.name !== "الكل")
      .map((r) => ({
        label:
          locale.value === "ar" ? r.name_ar || r.name : r.name || r.name_ar,
        value: String(r.name),
      }));
  } catch (e) {
    console.error(e);
  }
};

const workSystemTypeOptions = computed(() => [
  { label: t("employees.workSystemTypes.fixed"), value: "fixed" },
  { label: t("employees.workSystemTypes.shift"), value: "shift" },
]);

const roleLabel = (roles) => {
  if (!roles) return "--------";
  const roleArray = Array.isArray(roles) ? roles : [roles];
  if (roleArray.length === 0) return "--------";

  return roleArray
    .map((r) => {
      const option = roleOptions.value.find((opt) => opt.value === String(r));
      return option ? option.label : r;
    })
    .join(", ");
};

const workSystemLabel = (emp) => {
  // if (emp.work_system_type_label) return emp.work_system_type_label;
  if (emp.work_system_type === "fixed")
    return t("employees.workSystemTypes.fixed");
  if (emp.work_system_type === "shift")
    return t("employees.workSystemTypes.shift");
  return "--------";
};

const genderLabel = (gender) => {
  if (!gender) return null;
  return gender === "male" ? t("employees.male") : t("employees.female");
};

const formatDate = (date) => {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString(
      locale.value === "en" ? "en-US" : "ar-SA",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );
  } catch (e) {
    return date;
  }
};

const formatDateHijri = (date) => {
  if (!date) return null;

  try {
    const l =
      locale.value === "en" ? "en-US-u-ca-islamic" : "ar-SA-u-ca-islamic";
    return new Date(date).toLocaleDateString(l, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return date;
  }
};

const departmentName = (emp) => {
  const d = emp?.department;
  if (!d) return null;
  return locale.value === "ar" ? d.name_ar || d.name : d.name || d.name_ar;
};

const organizationalUnitName = (emp) => {
  const b = emp?.organizational_unit;
  if (!b) return null;
  return locale.value === "ar" ? b.name_ar || b.name : b.name || b.name_ar;
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await employeeService.getById(route.params.id);
    const emp = res.data?.employee ?? res.employee ?? null;
    employee.value = emp;
    if (emp) {
      if (Array.isArray(emp.roles)) {
        form.value.role = emp.roles.map((r) => String(r));
      } else if (emp.role) {
        form.value.role = [String(emp.role)];
      } else {
        form.value.role = [];
      }
      form.value.work_system_type = emp.work_system_type || "fixed";
      form.value.mobile_attendance_enabled = !!emp.mobile_attendance_enabled;
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const validate = () => {
  errors.value = { role: "", work_system_type: "" };
  let valid = true;
  if (
    !form.value.role ||
    (Array.isArray(form.value.role) && form.value.role.length === 0)
  ) {
    errors.value.role = t("employees.validation.roleRequired");
    valid = false;
  }
  if (!form.value.work_system_type) {
    errors.value.work_system_type = t(
      "employees.validation.workSystemTypeRequired",
    );
    valid = false;
  }
  return valid;
};

const save = async () => {
  if (!validate()) return;
  saving.value = true;
  try {
    await employeeService.update(route.params.id, {
      role: form.value.role,
      work_system_type: form.value.work_system_type,
      mobile_attendance_enabled: form.value.mobile_attendance_enabled,
    });
    toast.success(t("employees.messages.updated"));
    router.push(`${basePath.value}`);
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    saving.value = false;
  }
};

const cancel = () => {
  router.push(`${basePath.value}`);
};

onMounted(async () => {
  await loadRoles();
  loadData();
});
</script>

<style scoped>
/* RTL Adjustments */
[dir="rtl"] .transform-gpu {
  transform: scaleX(-1);
}
</style>
