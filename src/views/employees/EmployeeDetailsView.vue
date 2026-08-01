<template>
  <div class="space-y-4">
    <!-- Browser Print Table (Repeats Header on every page) -->
    <table class="w-full border-collapse print-only">
      <thead>
        <tr>
          <td class="!p-0 !border-none">
            <PrintHeader v-if="employee" :title="t('employees.viewTitle')" />
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="!p-0 !border-none">
            <template v-if="employee">
              <!-- Re-use screen sections for print content inside table -->
              <!-- Identity Section -->
              <div
                class="bg-[#F3F9F6] py-2 px-4 rounded-lg flex items-center justify-between mb-4 mt-4"
              >
                <h3 class="font-[500] text-[#1F2A37] text-[16px]">
                  {{ t("employees.fields.identitySection") }}
                </h3>
              </div>

              <div class="grid grid-cols-1 gap-y-2">
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
                  :value="employee.id_number"
                />
                <DetailRow
                  :label="t('employees.fields.mobile')"
                  :value="employee.mobile || employee.phone"
                />
                <DetailRow
                  :label="t('employees.fields.email')"
                  :value="employee.email"
                />
                <DetailRow
                  :label="t('employees.fields.address')"
                  :value="employee.address"
                />
                <DetailRow
                  :label="t('employees.fields.gender')"
                  :value="genderLabel(employee.gender)"
                />
                <DetailRow
                  :label="t('employees.fields.createdAt')"
                  :value="formatDate(employee.created_at)"
                />
                <DetailRow
                  :label="t('employees.fields.updatedAt')"
                  :value="formatDate(employee.updated_at)"
                />
              </div>

              <!-- Employment Section -->
              <div
                class="bg-[#F3F9F6] py-2 px-4 rounded-lg flex items-center justify-between mb-4 mt-8"
              >
                <h3 class="font-[500] text-[#1F2A37] text-[16px]">
                  {{ t("employees.fields.employmentSection") }}
                </h3>
              </div>

              <div class="grid grid-cols-1 gap-y-2">
                <DetailRow
                  :label="t('employees.fields.entityCode')"
                  :value="employee.organizational_unit?.code"
                />
                <DetailRow
                  :label="t('employees.fields.entityName')"
                  :value="organizationalUnitName(employee)"
                />
                <DetailRow
                  :label="t('employees.fields.departmentSection')"
                  :value="departmentName(employee)"
                />
                <DetailRow
                  :label="t('employees.fields.positionName')"
                  :value="employee.employee_type"
                />

                <div class="flex items-center DetailRow-container">
                  <span
                    class="text-[13px] font-[500] text-[#6C737F] label-print w-[170px]"
                    >{{ t("employees.fields.status") }}</span
                  >
                  <span
                    class="text-[14px] font-[500] value-print"
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

                <div class="flex items-center DetailRow-container">
                  <span
                    class="text-[13px] font-[500] text-[#6C737F] label-print w-[170px]"
                    >{{ t("employees.fields.isGovernment") }}</span
                  >
                  <span class="text-[14px] font-[500] value-print">{{
                    employee.is_government
                      ? t("employees.yes")
                      : t("employees.no")
                  }}</span>
                </div>

                <DetailRow
                  :label="t('employees.fields.staffType')"
                  :value="employee.staff_type"
                />
                <DetailRow
                  :label="t('employees.fields.directManager')"
                  :value="employee.manager?.name"
                />
                <DetailRow
                  :label="t('employees.fields.workSystemType')"
                  :value="workSystemLabel(employee)"
                />
                <DetailRow
                  :label="t('employees.fields.role')"
                  :value="roleLabel(employee.roles)"
                />
                <DetailRow
                  :label="t('employees.fields.joinDate')"
                  :value="formatDate(employee.branch_join_date)"
                />
                <DetailRow
                  :label="t('employees.fields.joinDateHijri')"
                  :value="formatDateHijri(employee.branch_join_date)"
                />
                <DetailRow
                  :label="t('employees.fields.leaveDate')"
                  :value="formatDate(employee.branch_exit_date)"
                />
                <DetailRow
                  :label="t('employees.fields.leaveDateHijri')"
                  :value="formatDateHijri(employee.branch_exit_date)"
                />
                <DetailRow
                  :label="t('employees.fields.appointmentGovernment')"
                  :value="formatDate(employee.government_appointment_date)"
                />
                <DetailRow
                  :label="t('employees.fields.appointmentMinistry')"
                  :value="formatDate(employee.ministry_appointment_date)"
                />

                <div class="flex items-center DetailRow-container">
                  <span
                    class="text-[13px] font-[500] text-[#6C737F] label-print w-[170px]"
                    >{{ t("employees.fields.mobileAttendanceStatus") }}</span
                  >
                  <span class="text-[14px] font-[500] value-print">{{
                    employee.mobile_attendance_enabled
                      ? t("employees.mobileEnabled")
                      : t("employees.mobileDisabled")
                  }}</span>
                </div>
              </div>
            </template>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td class="!p-0 !border-none">
            <div class="h-[100px]"></div>
          </td>
        </tr>
      </tfoot>
    </table>
    <PrintFooter :totalPages="printTotalPages" />

    <div class="no-print space-y-4">
      <!-- Breadcrumb -->
      <Breadcrumb :items="breadcrumbItems" />

      <!-- Page Header Title -->
      <div v-if="employee" class="flex justify-between items-center mb-2">
        <h2 class="text-[20px] font-bold text-[#101828]">
          {{ t("employees.viewTitle") }}
        </h2>
        <div class="flex items-center gap-2 no-print">
          <Button
            @click="handlePrint"
            variant="primary"
            size="md"
            class="!px-2 !py-2"
          >
            <SvgIcon name="printer_white" />
          </Button>

          <Menu as="div" class="relative inline-block text-left">
            <MenuButton as="template">
              <Button variant="primary" size="md">
                <SvgIcon name="export" />
                <span class="ms-1 me-2">{{ t("employees.export") }}</span>
                <SvgIcon name="down" />
              </Button>
            </MenuButton>

            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <MenuItems
                class="absolute right-0 mt-2 w-30 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50 text-start"
              >
                <div class="px-1 py-1">
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="handleExport('pdf')"
                      :class="[
                        active ? 'bg-[#0E5F4A] text-white' : 'text-[#384250]',
                        'cursor-pointer mb-1 group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                      ]"
                    >
                      PDF
                    </button>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="handleExport('excel')"
                      :class="[
                        active ? 'bg-[#0E5F4A] text-white' : 'text-[#384250]',
                        'cursor-pointer group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                      ]"
                    >
                      Excel
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
        ></div>
      </div>

      <template v-else-if="employee">
        <!-- Identity Section -->
        <Card class="!mt-4 !p-0 overflow-hidden border-none">
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
                :value="employee.email"
              />
              <DetailRow
                :label="t('employees.fields.address')"
                :value="employee?.address || '--------'"
              />
              <DetailRow
                :label="t('employees.fields.gender')"
                :value="genderLabel(employee.gender) || '--------'"
              />
              <div
                class="flex items-center DetailRow-container sm:hidden print:flex"
              >
                <span
                  class="text-[13px] font-[500] text-[#6C737F] label-print w-[170px]"
                  >{{ t("employees.fields.createdAt") }}</span
                >
                <span
                  class="font-[600] text-[#384250] text-[16px] value-print"
                  >{{ formatDate(employee.created_at) || "--------" }}</span
                >
              </div>
              <div
                class="flex items-center DetailRow-container sm:hidden print:flex"
              >
                <span
                  class="text-[13px] font-[500] text-[#6C737F] label-print w-[170px]"
                  >{{ t("employees.fields.updatedAt") }}</span
                >
                <span
                  class="font-[600] text-[#384250] text-[16px] value-print"
                  >{{ formatDate(employee.updated_at) || "--------" }}</span
                >
              </div>
            </div>
          </div>
        </Card>

        <!-- Employment Section -->
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

              <div class="flex items-center DetailRow-container">
                <span
                  class="text-[13px] font-[500] text-[#6C737F] label-print w-[170px]"
                  >{{ t("employees.fields.status") }}</span
                >
                <div
                  class="flex items-center gap-1.5 px-3 py-1 rounded-full"
                  :class="!employee.is_active ? 'bg-[#E5E7EB]' : 'bg-[#ECFDF3]'"
                >
                  <span
                    class="w-[10px] h-[10px] rounded-full no-print"
                    :class="
                      !employee.is_active ? 'bg-[#4D5761]' : 'bg-[#085D3A]'
                    "
                  ></span>
                  <span
                    class="text-[14px] font-[500] value-print"
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

              <div class="flex items-center DetailRow-container">
                <span
                  class="text-[13px] font-[500] text-[#6C737F] label-print w-[170px]"
                  >{{ t("employees.fields.isGovernment") }}</span
                >
                <span
                  class="px-3 py-1 rounded-full bg-[#E5E7EB] text-[#14573A] text-[10px] font-semibold value-print"
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
                :value="
                  formatDateHijri(employee.branch_join_date) || '--------'
                "
              />
              <DetailRow
                :label="t('employees.fields.leaveDate')"
                :value="formatDate(employee.branch_exit_date) || '--------'"
              />
              <DetailRow
                :label="t('employees.fields.leaveDateHijri')"
                :value="
                  formatDateHijri(employee.branch_exit_date) || '--------'
                "
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

              <div class="flex items-center DetailRow-container">
                <span
                  class="text-[13px] font-[500] text-[#6C737F] label-print w-[170px]"
                  >{{ t("employees.fields.mobileAttendanceStatus") }}</span
                >
                <div
                  class="flex items-center gap-1.5 px-3 py-1 rounded-full"
                  :class="
                    employee.mobile_attendance_enabled
                      ? 'bg-[#ECFDF3]'
                      : 'bg-[#E5E7EB]'
                  "
                >
                  <span
                    class="w-[10px] h-[10px] rounded-full no-print"
                    :class="
                      employee.mobile_attendance_enabled
                        ? 'bg-[#085D3A]'
                        : 'bg-[#1F2A37]'
                    "
                  ></span>
                  <span
                    class="text-[14px] font-[500] value-print"
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

        <!-- Footer Buttons -->
        <div class="flex items-center gap-3 pt-6 justify-end no-print">
          <Button variant="secondary" @click="goBack">
            {{ t("common.back") }}
          </Button>
          <Button variant="primary" @click="goToEdit">
            <div class="flex items-center gap-2">
              <SvgIcon name="editWhite" classes="w-4 h-4" />
              <span>{{ t("common.edit") }}</span>
            </div>
          </Button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { useAuthStore } from "@/stores/auth";
import PrintHeader from "@/components/ui/PrintHeader.vue";
import PrintFooter from "@/components/ui/PrintFooter.vue";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";

import { employeeService } from "@/services/employees";
import { roleService } from "@/services/roles";

import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const authStore = useAuthStore();

const loading = ref(true);
const employee = ref(null);
const printTotalPages = ref(1);

const isEn = computed(() => route.path.startsWith("/en"));
const basePath = computed(() => (isEn.value ? "/en/employees" : "/employees"));

const breadcrumbItems = computed(() => [
  { label: t("employees.title"), to: basePath.value },
  { label: t("employees.viewTitle") },
]);

// Local component for detail rows to match WorkSystemDetailsView design
const DetailRow = (props) => {
  return h("div", { class: "flex items-center DetailRow-container" }, [
    h(
      "span",
      { class: "text-[13px] font-[500] text-[#6C737F] label-print w-[170px]" },
      props.label,
    ),
    h(
      "span",
      { class: "font-[600] text-[#384250] text-[16px] value-print" },
      props.value || "--------",
    ),
  ]);
};

const roleOptions = ref([]);

const loadRoles = async () => {
  try {
    const res = await roleService.list({ paginate: false });
    const list = res.data || [];
    roleOptions.value = list.map((r) => ({
      label: locale.value === "ar" ? r.name_ar || r.name : r.name || r.name_ar,
      value: String(r.name),
    }));
  } catch (e) {
    console.error(e);
  }
};

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
    employee.value = res.data?.employee ?? res.employee ?? null;
    if (!employee.value) {
      toast.error(t("common.error"));
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push(basePath.value);
};

const goToEdit = () => {
  router.push(`${basePath.value}/${route.params.id}/edit`);
};

const handleExport = (format = "excel") => {
  if (!employee.value) return;

  if (format === "excel") {
    exportToExcel(employee.value);
  } else if (format === "pdf") {
    exportToPDF(employee.value);
  }
};

const exportToExcel = (emp) => {
  const rows = [
    [t("employees.fields.employeeId"), emp.employee_number],
    [t("employees.fields.employeeName"), emp.name],
    [t("employees.fields.nationalId"), emp.id_number || "--------"],
    [t("employees.fields.mobile"), emp.mobile || emp.phone || "--------"],
    [t("employees.fields.email"), emp.email || "--------"],
    [t("employees.fields.address"), emp?.address || "--------"],
    [t("employees.fields.gender"), genderLabel(emp.gender) || "--------"],
    [
      t("employees.fields.entityCode"),
      emp.organizational_unit?.code || "--------",
    ],
    [
      t("employees.fields.entityName"),
      organizationalUnitName(emp) || "--------",
    ],
    [
      t("employees.fields.departmentSection"),
      departmentName(emp) || "--------",
    ],
    [t("employees.fields.positionName"), emp.employee_type || "--------"],
    [
      t("employees.fields.status"),
      !emp.is_active
        ? t("branches.status.inactive")
        : t("branches.status.active"),
    ],
    [
      t("employees.fields.isGovernment"),
      emp.is_government ? t("employees.yes") : t("employees.no"),
    ],
    [t("employees.fields.staffType"), emp.staff_type || "--------"],
    [t("employees.fields.directManager"), emp.manager?.name || "--------"],
    [t("employees.fields.workSystemType"), workSystemLabel(emp)],
    [t("employees.fields.role"), roleLabel(emp.roles) || "--------"],
    [
      t("employees.fields.joinDate"),
      formatDate(emp.branch_join_date) || "--------",
    ],
    [
      t("employees.fields.joinDateHijri"),
      formatDateHijri(emp.branch_join_date) || "--------",
    ],
    [
      t("employees.fields.leaveDate"),
      formatDate(emp.branch_exit_date) || "--------",
    ],
    [
      t("employees.fields.leaveDateHijri"),
      formatDateHijri(emp.branch_exit_date) || "--------",
    ],
    [
      t("employees.fields.appointmentGovernment"),
      formatDate(emp.government_appointment_date) || "--------",
    ],
    [
      t("employees.fields.appointmentMinistry"),
      formatDate(emp.ministry_appointment_date) || "--------",
    ],
    [
      t("employees.fields.mobileAttendanceStatus"),
      emp.mobile_attendance_enabled
        ? t("employees.mobileEnabled")
        : t("employees.mobileDisabled"),
    ],
    [t("employees.fields.createdAt"), formatDate(emp.created_at) || "--------"],
    [t("employees.fields.updatedAt"), formatDate(emp.updated_at) || "--------"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Optional: Set column widths for better readability
  ws["!cols"] = [{ wch: 30 }, { wch: 40 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employee Details");
  XLSX.writeFile(wb, `employee_${emp.id}_details.xlsx`);
};

const exportToPDF = async (emp) => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  try {
    // Load Regular Font
    const fontRes = await fetch(IBMPlexSansArabicRegular);
    const fontBuffer = await fontRes.arrayBuffer();
    const fontBase64 = arrayBufferToBase64(fontBuffer);
    doc.addFileToVFS("IBMPlexSansArabic-Regular.ttf", fontBase64);
    doc.addFont("IBMPlexSansArabic-Regular.ttf", "IBMPlexSansArabic", "normal");

    // Load Bold Font
    const fontBoldRes = await fetch(IBMPlexSansArabicBold);
    const fontBoldBuffer = await fontBoldRes.arrayBuffer();
    const fontBoldBase64 = arrayBufferToBase64(fontBoldBuffer);
    doc.addFileToVFS("IBMPlexSansArabic-Bold.ttf", fontBoldBase64);
    doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

    doc.setFont("IBMPlexSansArabic", "normal");

    const isArabic = locale.value === "ar";
    const title = t("employees.viewTitle");

    let rows = [
      [t("employees.fields.identitySection"), ""],
      [t("employees.fields.employeeId"), emp.employee_number],
      [t("employees.fields.employeeName"), emp.name],
      [t("employees.fields.nationalId"), emp.id_number || "--------"],
      [t("employees.fields.mobile"), emp.mobile || emp.phone || "--------"],
      [t("employees.fields.email"), emp.email || "--------"],
      [t("employees.fields.address"), emp?.address || "--------"],
      [t("employees.fields.gender"), genderLabel(emp.gender) || "--------"],

      [t("employees.fields.employmentSection"), ""],
      [
        t("employees.fields.entityCode"),
        emp.organizational_unit?.code || "--------",
      ],
      [
        t("employees.fields.entityName"),
        organizationalUnitName(emp) || "--------",
      ],
      [
        t("employees.fields.departmentSection"),
        departmentName(emp) || "--------",
      ],
      [t("employees.fields.positionName"), emp.employee_type || "--------"],
      [
        t("employees.fields.status"),
        !emp.is_active
          ? t("branches.status.inactive")
          : t("branches.status.active"),
      ],
      [
        t("employees.fields.isGovernment"),
        emp.is_government ? t("employees.yes") : t("employees.no"),
      ],
      [t("employees.fields.staffType"), emp.staff_type || "--------"],
      [t("employees.fields.directManager"), emp.manager?.name || "--------"],
      [t("employees.fields.workSystemType"), workSystemLabel(emp)],
      [t("employees.fields.role"), roleLabel(emp.roles) || "--------"],
      [
        t("employees.fields.joinDate"),
        formatDate(emp.branch_join_date) || "--------",
      ],
      [
        t("employees.fields.joinDateHijri"),
        formatDateHijri(emp.branch_join_date) || "--------",
      ],
      [
        t("employees.fields.leaveDate"),
        formatDate(emp.branch_exit_date) || "--------",
      ],
      [
        t("employees.fields.leaveDateHijri"),
        formatDateHijri(emp.branch_exit_date) || "--------",
      ],
      [
        t("employees.fields.appointmentGovernment"),
        formatDate(emp.government_appointment_date) || "--------",
      ],
      [
        t("employees.fields.appointmentMinistry"),
        formatDate(emp.ministry_appointment_date) || "--------",
      ],
      [
        t("employees.fields.mobileAttendanceStatus"),
        emp.mobile_attendance_enabled
          ? t("employees.mobileEnabled")
          : t("employees.mobileDisabled"),
      ],
    ];

    if (isArabic) {
      rows = rows.map((r) => [r[1], r[0]]);
    }

    autoTable(doc, {
      startY: 50, // After header
      body: rows,
      styles: {
        font: "IBMPlexSansArabic",
        fontStyle: "normal",
        halign: isArabic ? "right" : "left",
        fontSize: 10,
        cellPadding: 4,
        lineColor: [237, 237, 237],
        lineWidth: 0.1,
      },
      columnStyles: {
        [isArabic ? 1 : 0]: {
          fillColor: [243, 249, 246],
          fontStyle: "bold",
          width: 60,
          textColor: [14, 95, 74],
        },
      },
      didParseCell: function (data) {
        // Section titles styling
        if (data.row.index === 0 || data.row.index === 8) {
          data.cell.styles.fillColor = [14, 95, 74];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.halign = "center";
          data.cell.styles.fontSize = 11;
        }
      },
      margin: { top: 50, bottom: 30 },
    });

    // Draw Header and Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfHeader(doc, authStore, isArabic, title);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic);
    }
    doc.save(`employee_${emp.employee_number || emp.id}_details.pdf`);
  } catch (err) {
    console.error("PDF Export Error:", err);
    toast.error(
      err?.response?.data?.message || err?.message || "PDF generation failed.",
    );
  }
};

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

const handlePrint = async () => {
  await nextTick();
  // Estimate total pages for the footer counter
  const printArea = document.querySelector(".print-only tbody");
  if (printArea) {
    const height = printArea.offsetHeight;
    const pageHeight = 900; // Approx visible height in A4
    printTotalPages.value = Math.max(1, Math.ceil(height / pageHeight));
  }

  await nextTick();
  // Small delay to ensure the calculated printTotalPages is rendered in the DOM
  await new Promise((resolve) => setTimeout(resolve, 300));
  window.print();
};

onMounted(async () => {
  await loadRoles();
  loadData();
});
</script>

<style scoped>
/* RTL Adjustments */
[dir="rtl"] .transform.rotate-180 {
  transform: rotate(0deg);
}

@media print {
  .print-only {
    display: table !important;
  }
  .no-print {
    display: none !important;
  }

  thead {
    display: table-header-group !important;
  }
  tfoot {
    display: table-footer-group !important;
  }

  .footer-space {
    height: 30mm; /* Space for fixed footer */
  }

  table {
    width: 100% !important;
    border-collapse: collapse !important;
  }

  .text-print {
    color: #14573a !important;
    font-size: 14px !important;
    padding: 0 !important;
  }

  /* Reset layout for print content inside table */
  .grid {
    display: block !important;
  }

  .DetailRow-container {
    display: flex !important;
    border-bottom: 1px solid #d2d6db !important;
    padding: 10px 0 !important;
    page-break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .label-print {
    width: 200px !important;
    color: #6c737f !important;
    font-size: 13px !important;
  }

  .value-print {
    color: #384250 !important;
    font-weight: 600 !important;
    font-size: 14px !important;
  }

  .bg-\[\#F3F9F6\] {
    background-color: #f3f9f6 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    padding: 8px 12px !important;
    margin-top: 15px !important;
    border-radius: 6px !important;
  }

  /* Force visibility of dividers in common components */
  :deep(.header-divider) {
    display: block !important;
    height: 1.5px !important;
    background-color: #0e5f4a !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    opacity: 1 !important;
  }
}

/* Global resets for print - MUST be non-scoped */
@media print {
  html,
  body,
  #app,
  main {
    overflow: visible !important;
    height: auto !important;
  }

  body {
    counter-reset: page 0;
  }
}

.print-only {
  display: none;
}
</style>
