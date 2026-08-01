<template>
  <div class="no-print space-y-6">
    <Breadcrumb :items="breadcrumbItems" />
    <header class="flex flex-wrap gap-2 items-center justify-between">
      <div class="flex items-center">
        <button
          v-for="tab in allowedTabs"
          :key="tab.id"
          @click="setTab(tab.id)"
          class="py-3 px-6 relative transition-all cursor-pointer"
          :class="currentTab === tab.id ? 'text-[#161616]' : 'text-[#384250]'"
        >
          <span class="font-medium">{{
            t(`dailyAttendance.tabs.${tab.id}`)
          }}</span>

          <!-- Bottom Indicator -->
          <div
            v-if="currentTab === tab.id"
            class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-full"
          >
            <div
              class="h-full w-[81px] bg-[#1B8354] rounded-full mx-auto"
            ></div>
          </div>
          <div
            v-else
            class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-full m-auto"
          ></div>
        </button>
      </div>
      <div class="flex items-center gap-2">
        <Button
          @click="handlePrint"
          class="bg-[#E7EFED] !px-2 !py-2 hover:!bg-[#DDE6E4] transition-colors duration-300"
          :class="
            currentTab === 'instantAttendance' ? '' : 'border border-[#0E5F4A]'
          "
        >
          <SvgIcon name="printer" />
        </Button>

        <Menu as="div" class="relative inline-block text-left">
          <MenuButton as="template">
            <Button
              :variant="currentTab === 'instantAttendance' ? '' : 'primary'"
              :class="
                currentTab === 'instantAttendance'
                  ? 'bg-[#E7EFED] border border-[#0E5F4A] !px-2 !py-2 hover:!bg-[#DDE6E4] transition-colors duration-300 text-[#0E5F4A]'
                  : ''
              "
              size="md"
            >
              <SvgIcon
                name="export"
                :class="
                  currentTab === 'instantAttendance'
                    ? 'text-[#0E5F4A]'
                    : 'text-white'
                "
              />
              <span class="ms-1 me-2">{{ t("employees.export") }}</span>
              <SvgIcon
                name="down"
                :class="
                  currentTab === 'instantAttendance'
                    ? 'text-[#0E5F4A]'
                    : 'text-white'
                "
              />
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

        <Button
          v-if="
            currentTab === 'instantAttendance' &&
            authStore.hasPermission('instant_attendance.send')
          "
          variant="primary"
          size="md"
          @click="instantAttendanceHistoryRef?.openConfirmModal"
          :loading="instantAttendanceHistoryRef?.requesting"
        >
          {{ t("dailyAttendance.instantAttendance.requestButton") }}
        </Button>
      </div>
    </header>

    <div v-if="currentTab === 'dailyAttendance'">
      <!-- Filters -->
      <Card class="my-6">
        <template #header>
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("notifications.searchTitle") }}
          </h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            v-model="filters.date"
            type="date"
            :label="t('common.date')"
            size="md"
          >
            <template #suffix>
              <SvgIcon name="calendar" />
            </template>
          </Input>
          <Select
            v-model="filters.organizational_unit_id"
            :options="organizationalUnitOptions"
            :placeholder="t('employees.placeholders.branch')"
            :label="t('employees.placeholders.branch')"
            size="md"
          />
          <Select
            v-model="filters.department_id"
            :options="departmentOptions"
            :placeholder="t('employees.placeholders.departmentOrSection')"
            :label="t('employees.placeholders.departmentOrSection')"
            size="md"
          />
          <Select
            v-model="filters.shift_id"
            :options="shiftOptions"
            :placeholder="t('dailyAttendance.fields.shift')"
            :label="t('dailyAttendance.fields.shift')"
            size="md"
          />
          <Select
            v-if="!authStore.isEmployee"
            v-model="filters.employee_id"
            :options="employeeOptions"
            :placeholder="t('employees.fields.employeeName')"
            :label="t('employees.fields.employeeName')"
            size="md"
            searchable
          />
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="ghost" @click="resetFilters" class="md:w-26">{{
            t("roles.resetFilters")
          }}</Button>
          <Button variant="primary" @click="applyFilters" class="md:w-26">{{
            t("common.search")
          }}</Button>
        </div>
      </Card>
      <!-- Table -->
      <Card>
        <template #header>
          <div class="flex gap-2 items-center justidy-center">
            <h2 class="text-[16px] font-[500] text-[#0E5F4A]">
              {{ t("dailyAttendance.listTitle") }}
            </h2>
            <span
              class="bg-[#E7EFED] text-[#0E5F4A] px-3 py-1 rounded-full text-[16px] font-[500] border border-[#82ACA1]"
            >
              {{ t("common.daily") }}
            </span>
          </div>
        </template>
        <!-- Summary Tabs -->
        <div class="mt-3 mb-7 flex flex-wrap">
          <button
            v-if="allowedCategories.includes('all')"
            @click="setCategory('all')"
            class="py-3 px-4 relative transition-all cursor-pointer"
            :class="
              activeCategory === 'all' ? 'text-[#161616]' : 'text-[#384250]'
            "
          >
            <div
              v-if="activeCategory === 'all'"
              class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-s-full"
            >
              <div
                class="h-full w-[81px] bg-[#1B8354] rounded-full mx-auto"
              ></div>
            </div>
            <div
              v-else
              class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-s-full m-auto"
            ></div>
            <span
              class="absolute -top-1 -end-[3px] bg-[#1B8354] text-white text-[9px] w-5.5 h-5.5 rounded-full flex items-center justify-center pt-[2px]"
            >
              {{ summary.total_employees }}
            </span>
            <span class="font-medium">{{
              t("dailyAttendance.summary.totalEmployees")
            }}</span>
          </button>

          <button
            v-if="allowedCategories.includes('present')"
            @click="setCategory('present')"
            class="py-3 px-4 relative transition-all cursor-pointer"
            :class="
              activeCategory === 'present' ? 'text-[#0E5F4A]' : 'text-[#384250]'
            "
          >
            <span
              class="absolute -top-1 -end-[3px] bg-[#1B8354] text-white text-[9px] w-5.5 h-5.5 rounded-full flex items-center justify-center pt-[2px]"
            >
              {{ summary.total_present }}
            </span>
            <span class="font-medium">{{
              t("dailyAttendance.summary.totalPresent")
            }}</span>
            <div
              v-if="activeCategory === 'present'"
              class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-full"
            >
              <div
                class="h-full w-[81px] bg-[#1B8354] rounded-full mx-auto"
              ></div>
            </div>
            <div
              v-else
              class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] m-auto"
            ></div>
          </button>

          <button
            v-if="allowedCategories.includes('absent')"
            @click="setCategory('absent')"
            class="py-3 px-5 relative transition-all cursor-pointer"
            :class="
              activeCategory === 'absent' ? 'text-[#0E5F4A]' : 'text-[#384250]'
            "
          >
            <span
              class="absolute -top-1 -end-[3px] bg-[#1B8354] text-white text-[9px] w-5.5 h-5.5 rounded-full flex items-center justify-center pt-[2px]"
            >
              {{ summary.total_absent }}
            </span>
            <span class="font-medium">{{
              t("dailyAttendance.summary.totalAbsent")
            }}</span>
            <div
              v-if="activeCategory === 'absent'"
              class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-full"
            >
              <div
                class="h-full w-[81px] bg-[#1B8354] rounded-full mx-auto"
              ></div>
            </div>
            <div
              v-else
              class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] mx-auto mt-1"
            ></div>
          </button>

          <button
            v-if="allowedCategories.includes('overtime')"
            @click="setCategory('overtime')"
            class="py-3 px-4 relative transition-all cursor-pointer"
            :class="
              activeCategory === 'overtime'
                ? 'text-[#0E5F4A]'
                : 'text-[#384250]'
            "
          >
            <span
              class="absolute -top-1 -end-[3px] bg-[#1B8354] text-white text-[9px] w-5.5 h-5.5 rounded-full flex items-center justify-center pt-[2px]"
            >
              {{ summary.total_overtime }}
            </span>
            <span class="font-medium">{{
              t("dailyAttendance.summary.totalOvertime")
            }}</span>
            <div
              v-if="activeCategory === 'overtime'"
              class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-full"
            >
              <div
                class="h-full w-[81px] bg-[#1B8354] rounded-full mx-auto"
              ></div>
            </div>
            <div
              v-else
              class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-e-full m-auto"
            ></div>
          </button>
        </div>
        <Table
          :items="attendanceData"
          :headers="tableHeaders"
          :loading="loading"
          :page="page"
          :total-pages="totalPages"
          @change-page="changePage"
        >
          <template
            v-for="header in tableHeaders.filter((h) => h.sortable)"
            :key="header.key"
            #[`header-${header.key}`]
          >
            <div
              class="flex items-center gap-2 select-none justify-between group"
            >
              <span>{{ header.label }}</span>
              <SvgIcon
                name="sort"
                classes="w-5 h-5 transition-colors cursor-pointer"
                :class="
                  filters.sort_by === header.key
                    ? 'text-[#0E5F4A]'
                    : 'text-gray-300 group-hover:text-gray-400'
                "
                @click="handleSort(header.key)"
              />
            </div>
          </template>

          <template #[`cell-employee.employee_number`]="{ item }">
            {{ item.employee?.employee_number || item.employee?.id || "--" }}
          </template>

          <template #cell-employee_name="{ item }">
            <span>{{ item.employee?.name }}</span>
          </template>

          <template #cell-status="{ item }">
            <div
              class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              :class="{
                'bg-[#ECFDF3] text-[#085D3A]':
                  item.status === 'present' || item.status_label === 'Executed',
                'bg-[#FEF3F2] text-[#912018]': item.status === 'absent',
                'bg-[#FFFAEB] text-[#B54708]': item.status === 'late',
                'bg-[#EFF8FF] text-[#1849A9]': item.status === 'leave',
                'bg-[#F3FCF6] text-[#54C08A]': item.status === 'mission',
                'bg-[#FEF6EE] text-[#B93815]': item.status === 'holiday',
                'bg-[#F9FAFB] text-[#374151]': item.status === 'half_day',
                'bg-[#E5E7EB] text-[#1F2A37]':
                  item.status === 'rest_day' ||
                  item.status_label === 'Not Executed',
              }"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-[#085D3A]':
                    item.status === 'present' ||
                    item.status_label === 'Executed',
                  'bg-[#912018]': item.status === 'absent',
                  'bg-[#B54708]': item.status === 'late',
                  'bg-[#1849A9]': item.status === 'leave',
                  'bg-[#54C08A]': item.status === 'mission',
                  'bg-[#B93815]': item.status === 'holiday',
                  'bg-[#374151]': item.status === 'half_day',
                  'bg-[#1F2A37]':
                    item.status === 'rest_day' ||
                    item.status_label === 'Not Executed',
                }"
              ></span>
              {{
                item.status || item.status_label
                  ? t(
                      `dailyAttendance.status.${item.status != "pending" ? item.status : item.status_label}`,
                    )
                  : "--"
              }}
            </div>
          </template>

          <template #cell-check_in="{ item }">
            <div class="flex items-center justift-center gap-2">
              <span>{{ formatTime12(item.check_in_time) || "--:--" }}</span>
              <div
                class="flex items-center justift-center gap-1.5"
                v-if="item.check_in_time"
              >
                <div
                  v-if="item.check_in_selfie || item.employee?.image"
                  class="flex-shrink-0"
                >
                  <img
                    v-if="item.check_in_selfie"
                    :alt="item.employee?.name"
                    v-tooltip="item.employee?.name"
                    :src="item.check_in_selfie"
                    class="rounded-full w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity"
                    @click.stop="openSelfieModal(item.check_in_selfie)"
                  />
                </div>
                <div
                  v-if="item?.check_in_location"
                  class="w-6 h-6"
                  v-tooltip="{
                    title: t('attendanceSettings.tabs.fingerprintLocation'),
                    content:
                      lang === 'ar'
                        ? item?.check_in_location?.name_ar ||
                          item?.check_in_location?.name
                        : item?.check_in_location?.name ||
                          item?.check_in_location?.name_ar,
                  }"
                >
                  <SvgIcon name="location" />
                </div>
              </div>
            </div>
          </template>

          <template #cell-check_out="{ item }">
            <div class="flex items-center justift-center gap-2">
              <span>{{ formatTime12(item.check_out_time) || "--:--" }}</span>
              <div
                class="flex items-center justift-center gap-1.5"
                v-if="item.check_out_time"
              >
                <div
                  v-if="item.check_out_selfie || item.employee?.image"
                  class="flex-shrink-0"
                >
                  <img
                    v-if="item.check_out_selfie"
                    :alt="item.employee?.name"
                    v-tooltip="item.employee?.name"
                    :src="item.check_out_selfie"
                    class="rounded-full w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity"
                    @click.stop="openSelfieModal(item.check_out_selfie)"
                  />
                </div>
                <div
                  v-if="item?.check_out_location"
                  class="w-6 h-6"
                  v-tooltip="{
                    title: t('attendanceSettings.tabs.fingerprintLocation'),
                    content:
                      lang === 'ar'
                        ? item?.check_out_location?.name_ar ||
                          item?.check_out_location?.name
                        : item?.check_out_location?.name ||
                          item?.check_out_location?.name_ar,
                  }"
                >
                  <SvgIcon name="location" />
                </div>
              </div>
            </div>
          </template>

          <!-- Overtime specific cells -->
          <template #cell-overtime_check_in="{ item }">
            <div class="flex items-center justify-start gap-2">
              <span>
                {{ formatTime12(item.overtime_check_in_time) || "--:--" }}
              </span>

              <div
                class="flex items-center justify-center gap-1.5"
                v-if="item.overtime_check_in_time"
              >
                <div v-if="item.employee?.image" class="flex-shrink-0">
                  <img
                    v-if="item.overtime_check_in_selfie"
                    :alt="item.employee?.name"
                    v-tooltip="item.employee?.name"
                    :src="item.overtime_check_in_selfie"
                    class="rounded-full w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity"
                    @click.stop="openSelfieModal(item.overtime_check_in_selfie)"
                  />
                </div>

                <div
                  v-if="item?.overtime_check_in_location"
                  class="w-6 h-6"
                  v-tooltip="{
                    title: t('attendanceSettings.tabs.fingerprintLocation'),
                    content:
                      lang === 'ar'
                        ? item?.overtime_check_in_location?.name_ar ||
                          item?.overtime_check_in_location?.name
                        : item?.overtime_check_in_location?.name ||
                          item?.overtime_check_in_location?.name_ar,
                  }"
                >
                  <SvgIcon name="location" />
                </div>
              </div>
            </div>
          </template>
          <template #cell-overtime_minutes="{ item }">
            {{ formatMinutesToHHMM(item.overtime_minutes) }}
          </template>

          <template #cell-shift_start="{ item }">
            {{ formatTime12(item.check_in_time) || "--:--" }}
          </template>

          <template #cell-shift_end="{ item }">
            {{ formatTime12(item.check_out_time) || "--:--" }}
          </template>

          <template #cell-lateness="{ item }">
            {{ formatMinutesToHHMM(item.lateness_minutes) }}
          </template>

          <template #cell-early_leave="{ item }">
            {{ formatMinutesToHHMM(item.early_leave_minutes) }}
          </template>

          <template #cell-actual_hours="{ item }">
            {{ formatMinutesToHHMM(item.actual_working_minutes) }}
          </template>

          <template #cell-expand="{ isExpanded, toggleExpand }">
            <div class="flex items-center justify-center h-full">
              <button
                @click="toggleExpand"
                class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <SvgIcon
                  name="table_arrow"
                  classes="w-5 h-5 m-auto cursor-pointer transition-transform duration-200"
                  :class="
                    locale === 'ar'
                      ? isExpanded
                        ? '!rotate-270'
                        : 'rotate-0'
                      : isExpanded
                        ? '!rotate-270'
                        : '!rotate-180'
                  "
                />
              </button>
            </div>
          </template>

          <!-- Expandable details -->
          <template #expand="{ item }">
            <div class="bg-white">
              <!-- Header Row -->
              <div class="grid grid-cols-6 border-b-2 border-[#D2D6DB]">
                <div
                  class="p-3 text-[12px] text-[#384250] font-[500]"
                  :class="{ 'bg-[#F3F4F6]': true }"
                >
                  {{ t("dailyAttendance.fields.shiftStart") }}
                </div>
                <div
                  class="p-3 text-[12px] text-[#384250] font-[500]"
                  :class="{ 'bg-[#FFFFFF]': true }"
                >
                  {{ t("dailyAttendance.fields.shiftEnd") }}
                </div>
                <div
                  class="p-3 text-[12px] text-[#384250] font-[500]"
                  :class="{ 'bg-[#F3F4F6]': true }"
                >
                  {{ t("dailyAttendance.fields.lateness") }}
                </div>
                <div
                  class="p-3 text-[12px] text-[#384250] font-[500]"
                  :class="{ 'bg-[#FFFFFF]': true }"
                >
                  {{
                    item.positive_balance_minutes === 0 &&
                    item.positive_balance_used > 0
                      ? t("dailyAttendance.fields.positiveBalanceUsed")
                      : t("dailyAttendance.fields.positiveBalance")
                  }}
                </div>
                <div
                  class="p-3 text-[12px] text-[#384250] font-[500]"
                  :class="{ 'bg-[#F3F4F6]': true }"
                >
                  {{ t("dailyAttendance.fields.earlyLeave") }}
                </div>
                <div
                  class="p-3 text-[12px] text-[#384250] font-[500]"
                  :class="{ 'bg-[#FFFFFF]': true }"
                >
                  {{ t("dailyAttendance.fields.workingHoursDetails") }}
                </div>
              </div>
              <!-- Value Row -->
              <div class="grid grid-cols-6">
                <div
                  class="p-3 text-[14px] text-[#161616]"
                  :class="{ 'bg-[#F3F4F6]': true }"
                >
                  {{ formatTime12(item.scheduled_start_time) || "--:--" }}
                </div>
                <div
                  class="p-3 text-[14px] text-[#161616]"
                  :class="{ 'bg-[#FFFFFF]': true }"
                >
                  {{ formatTime12(item.scheduled_end_time) || "--:--" }}
                </div>
                <div
                  class="p-3 text-[14px] text-[#161616]"
                  :class="{ 'bg-[#F3F4F6]': true }"
                >
                  <div class="flex flex-row items-center gap-2">
                    <span>{{
                      formatMinutesToHHMM(item.lateness_minutes) || "--:--"
                    }}</span>
                  </div>
                </div>
                <div
                  class="p-3 text-[14px] text-[#161616]"
                  :class="{ 'bg-[#FFFFFF]': true }"
                >
                  {{
                    formatMinutesToHHMM(
                      item.positive_balance_minutes > 0
                        ? item.positive_balance_minutes
                        : item.positive_balance_used,
                    )
                  }}
                </div>
                <div
                  class="p-3 text-[14px] text-[#161616]"
                  :class="{ 'bg-[#F3F4F6]': true }"
                >
                  {{ formatMinutesToHHMM(item.early_leave_minutes) }}
                </div>
                <div
                  class="p-3 text-[14px] text-[#161616]"
                  :class="{ 'bg-[#FFFFFF]': true }"
                >
                  {{
                    formatMinutesToHHMM(item.scheduled_working_hours) || "--:--"
                  }}
                </div>
              </div>
            </div>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex items-center justify-center h-full">
              <button
                v-tooltip="item?.check_in_time ? t('common.edit') : ''"
                class="transition-opacity text-[#6C737F]"
                :class="
                  !item?.check_in_time
                    ? 'opacity-30 !cursor-not-allowed'
                    : 'hover:opacity-75 cursor-pointer'
                "
                @click="item?.check_in_time && openEditModal(item)"
              >
                <SvgIcon name="edit" classes="w-8 h-8" />
              </button>
            </div>
          </template>
        </Table>
      </Card>
    </div>
  </div>

  <AttendanceHistory
    ref="attendanceHistoryRef"
    v-if="currentTab === 'attendanceLog'"
  />

  <InstantAttendanceHistory
    ref="instantAttendanceHistoryRef"
    v-if="currentTab === 'instantAttendance'"
  />

  <!-- Edit Time Modal -->
  <Modal
    v-model="isEditModalOpen"
    :title="t('dailyAttendance.editTimeModal.title')"
    width="xl"
  >
    <div class="space-y-6 pt-4">
      <div class="grid grid-cols-1 gap-4">
        <Input
          v-model="editForm.check_in_time"
          type="time"
          :label="t('dailyAttendance.editTimeModal.checkIn')"
          :disabled="!editingItem?.check_in_time"
          required
        />
        <Input
          v-model="editForm.check_out_time"
          type="time"
          :label="t('dailyAttendance.editTimeModal.checkOut')"
          :disabled="!editingItem?.check_out_time"
          :min="editForm.check_in_time"
          required
        />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3 pt-4">
        <Button variant="secondary" @click="isEditModalOpen = false">
          {{ t("dailyAttendance.editTimeModal.cancel") }}
        </Button>
        <Button variant="primary" @click="saveAttendanceTimes">
          {{ t("dailyAttendance.editTimeModal.save") }}
        </Button>
      </div>
    </template>
  </Modal>

  <!-- Selfie Viewer -->
  <SelfieViewer
    v-model="isSelfieModalOpen"
    :image-url="selfieUrl"
    :title="t('dailyAttendance.fields.selfie')"
  />

  <div
    v-if="currentTab === 'dailyAttendance'"
    class="print-only"
    :dir="lang === 'ar' ? 'rtl' : 'ltr'"
  >
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th
            :colspan="
              tableHeaders.filter(
                (h) => h.key !== 'actions' && h.key !== 'expand',
              ).length
            "
            class="!bg-transparent !border-none !p-0"
          >
            <PrintHeader :title="printTitle" :fromDate="filters.date" />
          </th>
        </tr>
        <tr class="bg-[#0E5F4A] text-white">
          <th
            v-for="header in tableHeaders.filter(
              (h) => h.key !== 'actions' && h.key !== 'expand',
            )"
            :key="header.key"
            class="border border-[#D2D6DB] px-4 py-3 text-center text-[10px] font-bold uppercase"
          >
            {{ header.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in printAttendanceData"
          :key="item.id"
          class="border-b border-[#D2D6DB]"
        >
          <td class="border border-[#D2D6DB] px-4 py-3 text-[9px] text-center">
            {{ item.employee?.employee_number || item.employee?.id }}
          </td>
          <td class="border border-[#D2D6DB] px-4 py-3 text-[9px] text-center">
            {{ item.employee?.name }}
          </td>
          <template v-if="activeCategory === 'overtime'">
            <td
              class="border border-[#D2D6DB] px-4 py-3 text-[9px] text-center"
            >
              {{ formatTime12(item.overtime_check_in_time) || "--:--" }}
            </td>
            <td
              class="border border-[#D2D6DB] px-4 py-3 text-[9px] text-center"
            >
              {{ formatMinutesToHHMM(item.overtime_minutes) }}
            </td>
          </template>
          <template v-else>
            <td
              class="border border-[#D2D6DB] px-4 py-3 text-[9px] text-center"
            >
              {{ formatTime12(item.check_in_time) || "--:--" }}
            </td>
            <td
              class="border border-[#D2D6DB] px-4 py-3 text-[9px] text-center"
            >
              {{ formatTime12(item.check_out_time) || "--:--" }}
            </td>
            <td
              class="border border-[#D2D6DB] px-4 py-3 text-[9px] text-center"
            >
              {{ formatMinutesToHHMM(item.lateness_minutes) }}
            </td>
            <td
              class="border border-[#D2D6DB] px-4 py-3 text-[9px] text-center"
            >
              {{ formatMinutesToHHMM(item.early_leave_minutes) }}
            </td>

            <td
              class="border border-[#D2D6DB] px-4 py-3 text-[9px] text-center"
            >
              {{ formatMinutesToHHMM(item.actual_working_minutes) }}
            </td>
          </template>
          <td
            class="border border-[#D2D6DB] px-4 py-3 text-[9px] text-center font-medium"
          >
            <span
              class="status-badge"
              :class="{
                'status-present':
                  item.status === 'present' || item.status_label === 'Executed',
                'status-absent': item.status === 'absent',
                'status-late': item.status === 'late',
                'status-leave': item.status === 'leave',
                'status-mission': item.status === 'mission',
                'status-holiday': item.status === 'holiday',
              }"
            >
              {{
                item.status || item.status_label
                  ? t(
                      `dailyAttendance.status.${item.status != "pending" ? item.status : item.status_label}`,
                    )
                  : "--"
              }}
            </span>
          </td>
        </tr>
      </tbody>
      <tfoot class="print-tfoot">
        <tr>
          <td
            :colspan="
              tableHeaders.filter(
                (h) => h.key !== 'actions' && h.key !== 'expand',
              ).length
            "
            class="!border-none !p-0"
          >
            <div class="h-[80px]"></div>
          </td>
        </tr>
      </tfoot>
    </table>
    <div class="footer-spacer h-10"></div>
    <PrintFooter :totalPages="printTotalPages" />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #0e5f4a;
  border-radius: 10px;
}
</style>

<style>
@media print {
  html,
  body,
  #app,
  main {
    overflow: visible !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }
  html,
  body {
    counter-reset: page 0;
  }
}
</style>
<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAppToast } from "@/composables/useAppToast";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Modal from "@/components/ui/Modal.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import SelfieViewer from "@/components/common/SelfieViewer.vue";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

import InstantAttendanceHistory from "./components/InstantAttendanceHistory.vue";
import AttendanceHistory from "./components/AttendanceHistory.vue";
import { dailyAttendanceService } from "@/services/dailyAttendance";
import { attendanceLocationService } from "@/services/attendanceLocations";
import { shiftService } from "@/services/shifts";
import { employeeService } from "@/services/employees";
import { useAuthStore } from "@/stores/auth";

import PrintHeader from "@/components/ui/PrintHeader.vue";
import PrintFooter from "@/components/ui/PrintFooter.vue";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";

import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

// Tabs Config
const tabsConfig = [
  { id: "dailyAttendance", permission: "daily_attendance.view" },
  {
    id: "attendanceLog",
    permission: [
      "attendance_report.view",
      "attendance_history.view",
      "attendance.history",
    ],
  },
  { id: "instantAttendance", permission: "instant_attendance.view" },
];

/**
 * Returns current date in YYYY-MM-DD format based on local time
 */
const getTodayDate = () => {
  return new Date().toLocaleDateString("en-CA");
};

const allowedTabs = computed(() => {
  return tabsConfig.filter((t) => authStore.hasPermission(t.permission));
});

const allowedCategories = computed(() => {
  const cats = [];
  if (authStore.hasPermission("daily_attendance.view")) {
    cats.push("all", "present", "absent");
  }
  if (authStore.hasPermission("attendance.overtime")) {
    cats.push("overtime");
  }
  return cats;
});

// State
const currentTab = ref(allowedTabs.value[0]?.id || "dailyAttendance");
const loading = ref(false);
const summary = ref({
  total_employees: 0,
  total_present: 0,
  total_absent: 0,
  total_overtime: 0,
});
const attendanceData = ref([]);
const activeCategory = ref(allowedCategories.value[0] || "all");
const page = ref(1);
const totalPages = ref(1);
const perPage = ref(10);
const printAttendanceData = ref([]);
const printTotalPages = ref(1);
const isPrinting = ref(false);

const isSelfieModalOpen = ref(false);
const selfieUrl = ref("");

const openSelfieModal = (url) => {
  selfieUrl.value = url;
  isSelfieModalOpen.value = true;
};

const filters = ref({
  date: getTodayDate(),
  organizational_unit_id: "",
  department_id: "",
  shift_id: "",
  employee_id: "",
  sort_by: "",
  sort_direction: "",
});

const employeeOptions = ref([]);

const organizationalUnitOptions = ref([]);
const departmentOptions = ref([]);
const shiftOptions = ref([]);

// Modals
const isEditModalOpen = ref(false);
const editingItem = ref(null);
const editForm = ref({
  check_in_time: "",
  check_out_time: "",
});

const attendanceHistoryRef = ref(null);
const instantAttendanceHistoryRef = ref(null);

const breadcrumbItems = computed(() => [
  { label: t("sidebar.attendance"), to: "/attendance" },
  { label: t(`dailyAttendance.tabs.${currentTab.value}`) },
]);

// Load Options
const loadOrganizationalUnits = async () => {
  if (!authStore.hasPermission("attendance_location.view")) return;
  try {
    const res = await attendanceLocationService.listOrganizationalUnits();
    organizationalUnitOptions.value = (
      res?.data?.organizational_units || []
    ).map((s) => ({
      label:
        lang.value === "ar" ? s.name_ar || s.name_en : s.name_en || s.name_ar,
      value: String(s.id),
    }));
  } catch (e) {
    console.error(e);
  }
};

const loadShifts = async () => {
  if (!authStore.hasPermission("shift.view")) return;
  try {
    const res = await shiftService.list({ paginated: false });
    shiftOptions.value = (res.data || []).map((s) => ({
      label: lang.value === "ar" ? s.name_ar || s.name : s.name || s.name_ar,
      value: String(s.id),
    }));
  } catch (e) {
    console.error(e);
  }
};

const loadDepartments = async () => {
  try {
    const list = [
      { id: 1, name: "Human Resources", name_ar: "الموارد البشرية" },
      { id: 2, name: "Information Technology", name_ar: "تكنولوجيا المعلومات" },
      { id: 3, name: "Finance", name_ar: "المالية" },
    ];
    departmentOptions.value = list.map((d) => ({
      label: lang.value === "ar" ? d.name_ar || d.name : d.name || d.name_ar,
      value: String(d.id),
    }));
  } catch (e) {
    console.error(e);
  }
};

const loadEmployees = async () => {
  if (!authStore.hasPermission("employee.view")) return;
  try {
    const res = await employeeService.list({ paginated: false });
    employeeOptions.value = (res.data || []).map((e) => ({
      label: e.employee_number ? `${e.name}` : e.name,
      value: String(e.id),
    }));
  } catch (e) {
    console.error(e);
  }
};

// Data Fetching
const fetchAttendance = async () => {
  if (currentTab.value !== "dailyAttendance") return;
  if (
    !authStore.hasPermission("daily_attendance.view") &&
    !authStore.hasPermission("attendance.overtime")
  )
    return;

  loading.value = true;
  try {
    const sortMapping = {
      "employee.employee_number": "employee_number",
      employee_name: "name",
      check_in: "check_in_time",
      check_out: "check_out_time",
      overtime_check_in: "check_in_time",
      overtime_minutes: "actual_working_minutes",
      lateness: "lateness_minutes",
      actual_hours: "actual_working_minutes",
      status: "status",
    };

    const params = {
      ...filters.value,
      sort_by: sortMapping[filters.value.sort_by] || filters.value.sort_by,
      page: page.value,
      per_page: perPage.value,
    };

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    if (!params.sort_by) {
      delete params.sort_by;
      delete params.sort_direction;
    }

    const res = await dailyAttendanceService.getDailyAttendance(params);
    const data = res.data || {};

    summary.value = data.summary || {
      total_employees: 0,
      total_present: 0,
      total_absent: 0,
      total_overtime: 0,
    };

    if (activeCategory.value === "all") {
      attendanceData.value = (data.all || []).map((i) => ({
        ...i,
        status: i.status || "",
      }));
    } else if (activeCategory.value === "present") {
      attendanceData.value = (data.present || []).map((i) => ({
        ...i,
        status: i.status || "",
      }));
    } else if (activeCategory.value === "absent") {
      attendanceData.value = (data.absent || []).map((i) => ({
        ...i,
        status: i.status || "",
      }));
    } else if (activeCategory.value === "overtime") {
      attendanceData.value = (data.overtime || []).map((i) => ({
        ...i,
        status: i.status || "",
      }));
    }

    const pagination = data.pagination || {};
    if (activeCategory.value === "present") {
      totalPages.value = pagination.total_present_pages || 1;
    } else if (activeCategory.value === "absent") {
      totalPages.value = pagination.total_absent_pages || 1;
    } else if (activeCategory.value === "overtime") {
      totalPages.value = pagination.total_overtime_pages || 1;
    } else {
      totalPages.value = pagination.total_all_pages || 1;
    }
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.message || t("common.error"));
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  router.push({
    query: cleanQuery({
      ...filters.value,
      category: activeCategory.value,
      tab: currentTab.value,
      page: 1,
    }),
  });
};

const resetFilters = () => {
  router.push({
    query: cleanQuery({
      date: getTodayDate(),
      organizational_unit_id: "",
      department_id: "",
      shift_id: "",
      employee_id: "",
      category: "all",
      page: 1,
    }),
  });
};

const setCategory = (category) => {
  router.push({
    query: cleanQuery({
      ...route.query,
      category,
      page: 1,
    }),
  });
};

const setTab = (tab) => {
  router.push({
    query: cleanQuery({
      ...route.query,
      tab,
      page: 1,
    }),
  });
};

const changePage = (newPage) => {
  router.push({
    query: cleanQuery({
      ...route.query,
      page: newPage,
    }),
  });
};

const handleSort = (key) => {
  let direction = "asc";
  if (filters.value.sort_by === key && filters.value.sort_direction === "asc") {
    direction = "desc";
  }

  router.push({
    query: cleanQuery({
      ...route.query,
      sort_by: key,
      sort_direction: direction,
      page: 1,
    }),
  });
};

const cleanQuery = (queryObj) => {
  return Object.fromEntries(
    Object.entries(queryObj).filter(([_, v]) => v !== "" && v != null),
  );
};

// Actions
const openEditModal = (item) => {
  editingItem.value = item;
  editForm.value = {
    check_in_time: item.check_in_time || "",
    check_out_time: item.check_out_time || "",
  };
  isEditModalOpen.value = true;
};

const saveAttendanceTimes = async () => {
  if (!editingItem.value) return;

  const checkIn = editForm.value.check_in_time;
  const checkOut = editForm.value.check_out_time;

  if (checkIn && checkOut && checkOut < checkIn) {
    toast.error(
      t("dailyAttendance.editTimeModal.errorCheckOutBeforeCheckIn") ||
        "Check-out cannot be before check-in",
    );
    return;
  }

  try {
    const id = editingItem.value.attendance_id || editingItem.value.id;
    if (!id) throw new Error("No ID found for attendance record");

    await dailyAttendanceService.updateAttendance(id, editForm.value);
    toast.success(t("common.success"));
    isEditModalOpen.value = false;
    fetchAttendance();
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.message || t("common.error"));
  }
};

const handleExport = async (format = "excel") => {
  if (currentTab.value === "attendanceLog") {
    attendanceHistoryRef.value?.handleExport(format);
    return;
  }
  if (currentTab.value === "instantAttendance") {
    instantAttendanceHistoryRef.value?.handleExport(format);
    return;
  }
  try {
    const sortMapping = {
      "employee.employee_number": "employee_number",
      employee_name: "name",
      check_in: "check_in_time",
      check_out: "check_out_time",
      overtime_check_in: "check_in_time",
      overtime_minutes: "actual_working_minutes",
      lateness: "lateness_minutes",
      actual_hours: "actual_working_minutes",
      status: "status",
    };

    const params = {
      ...filters.value,
      sort_by: sortMapping[filters.value.sort_by] || filters.value.sort_by,
      paginate: false,
    };

    if (!params.sort_by) {
      delete params.sort_by;
      delete params.sort_direction;
    }

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const res = await dailyAttendanceService.getDailyAttendance(params);
    const data = res.data || {};

    let exportData = [];
    if (activeCategory.value === "all") {
      exportData = (data.all || [])?.map((i) => ({
        ...i,
        status: i.status || "",
      }));
    } else if (activeCategory.value === "present") {
      exportData = (data.present || []).map((i) => ({
        ...i,
        status: i.status || "",
      }));
    } else if (activeCategory.value === "absent") {
      exportData = (data.absent || []).map((i) => ({
        ...i,
        status: i.status || "",
      }));
    } else if (activeCategory.value === "overtime") {
      exportData = (data.overtime || []).map((i) => ({
        ...i,
        status: i.status || "",
      }));
    }

    if (!exportData.length) {
      toast.warning(t("common.noDataToExport") || "No data to export");
      return;
    }

    if (format === "excel") {
      exportToExcel(exportData);
    } else if (format === "pdf") {
      await exportToPDF(exportData);
    }
  } catch (e) {
    console.error(e);
    toast.error(
      e?.response?.data?.message ||
        e?.message ||
        t("common.errors.exportFailed"),
    );
  }
};

const exportToExcel = (data) => {
  const flattened = data.map((item, index) => {
    const row = {
      "#": index + 1,
      [t("employees.fields.employeeId")]:
        item.employee?.employee_number || item.employee?.id || "--",
      [t("employees.fields.employeeName")]: item.employee?.name || "--",
    };

    if (activeCategory.value === "overtime") {
      row[t("dailyAttendance.fields.overtimeCheckIn")] =
        item.overtime_check_in_time || "--:--";
      row[t("dailyAttendance.fields.overtimeHours")] = formatMinutesToHHMM(
        item.overtime_minutes,
      );
    } else {
      row[t("dailyAttendance.fields.checkIn")] = item.check_in_time || "--:--";
      row[t("dailyAttendance.fields.checkOut")] =
        item.check_out_time || "--:--";

      row[t("dailyAttendance.fields.lateness")] = formatMinutesToHHMM(
        item.lateness_minutes,
      );

      row[t("dailyAttendance.fields.earlyLeave")] = formatMinutesToHHMM(
        item.early_leave_minutes,
      );

      row[t("dailyAttendance.fields.actualHours")] = formatMinutesToHHMM(
        item.actual_working_minutes,
      );
    }

    row[t("dailyAttendance.fields.status")] = t(
      `dailyAttendance.status.${item.status != "pending" ? item.status : item.status_label}`,
    );

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `attendance_export_${new Date().getTime()}.xlsx`);
};

const buildAttendancePDF = async (data) => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const fontRes = await fetch(IBMPlexSansArabicRegular);
  const fontBuffer = await fontRes.arrayBuffer();
  doc.addFileToVFS(
    "IBMPlexSansArabic-Regular.ttf",
    arrayBufferToBase64(fontBuffer),
  );
  doc.addFont("IBMPlexSansArabic-Regular.ttf", "IBMPlexSansArabic", "normal");

  const fontBoldRes = await fetch(IBMPlexSansArabicBold);
  const fontBoldBuffer = await fontBoldRes.arrayBuffer();
  doc.addFileToVFS(
    "IBMPlexSansArabic-Bold.ttf",
    arrayBufferToBase64(fontBoldBuffer),
  );
  doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

  doc.setFont("IBMPlexSansArabic", "normal");

  const isArabic = lang.value === "ar";

  let headers = tableHeaders.value
    .filter((h) => h.key !== "actions" && h.key !== "expand")
    .map((h) => h.label);

  let rows = data.map((item) => {
    const row = [item.employee?.employee_number, item.employee?.name];

    if (activeCategory.value === "overtime") {
      row.push(item.overtime_check_in_time || "--:--");
      row.push(formatMinutesToHHMM(item.overtime_minutes));
    } else {
      row.push(item.check_in_time || "--:--");
      row.push(item.check_out_time || "--:--");
      row.push(formatMinutesToHHMM(item.lateness_minutes));
      row.push(formatMinutesToHHMM(item.early_leave_minutes));
      row.push(formatMinutesToHHMM(item.actual_working_minutes));
    }

    row.push(
      t(
        `dailyAttendance.status.${item.status != "pending" ? item.status : item.status_label}`,
      ),
    );

    return row;
  });

  if (isArabic) {
    headers = headers.reverse();
    rows = rows.map((r) => r.reverse());
  }
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 52,

    tableWidth: "auto", // or 'wrap' if you want tighter layout

    styles: {
      font: "IBMPlexSansArabic",
      halign: isArabic ? "right" : "left",
      fontSize: 9,
      cellPadding: 1,
      overflow: "linebreak",
    },

    headStyles: {
      fillColor: [14, 95, 74],
      textColor: [255, 255, 255],
      font: "IBMPlexSansArabic",
      fontStyle: "bold",
      halign: "center",
    },

    // columnStyles: {
    0: { cellWidth: 30 }, // employee number
    1: { cellWidth: 50 }, // name

    //   // dynamic remaining columns
    2: { cellWidth: 25 },
    3: { cellWidth: 25 },
    4: { cellWidth: 25 },
    5: { cellWidth: 25 },
    6: { cellWidth: 25 },
    7: { cellWidth: 25 },
    // },

    didDrawPage: () => {
      drawPdfHeader(
        doc,
        authStore,
        isArabic,
        printTitle.value,
        filters.value.date,
      );
    },

    margin: { top: 50, bottom: 30 },
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPdfFooter(doc, authStore, i, totalPages, isArabic);
  }

  return doc;
};

const exportToPDF = async (data) => {
  const doc = await buildAttendancePDF(data);
  doc.save(`attendance_export_${new Date().getTime()}.pdf`);
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
  if (currentTab.value === "attendanceLog") {
    attendanceHistoryRef.value?.handlePrint();
    return;
  }

  if (currentTab.value === "instantAttendance") {
    instantAttendanceHistoryRef.value?.handlePrint();
    return;
  }

  try {
    const sortMapping = {
      "employee.employee_number": "employee_number",
      employee_name: "name",
      check_in: "check_in_time",
      check_out: "check_out_time",
      overtime_check_in: "check_in_time",
      overtime_minutes: "actual_working_minutes",
      lateness: "lateness_minutes",
      actual_hours: "actual_working_minutes",
      status: "status",
    };

    const params = {
      ...filters.value,
      sort_by: sortMapping[filters.value.sort_by] || filters.value.sort_by,
      paginate: false,
    };

    if (!params.sort_by) {
      delete params.sort_by;
      delete params.sort_direction;
    }

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const res = await dailyAttendanceService.getDailyAttendance(params);
    const data = res.data || {};

    let printData = [];

    if (activeCategory.value === "all") {
      printData = data.all || [];
    } else if (activeCategory.value === "present") {
      printData = data.present || [];
    } else if (activeCategory.value === "absent") {
      printData = data.absent || [];
    } else if (activeCategory.value === "overtime") {
      printData = data.overtime || [];
    }

    if (!printData.length) {
      toast.warning(t("common.noDataToPrint") || "No data to print");
      return;
    }

    // build PDF
    const doc = await buildAttendancePDF(printData);

    // convert to blob
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    // print using iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = url;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 300);
    };
  } catch (e) {
    console.error(e);
    toast.error(
      e?.response?.data?.message ||
        e?.message ||
        t("common.errors.printFailed"),
    );
  }
};

// const handlePrint = async () => {
//   if (currentTab.value === "attendanceLog") {
//     attendanceHistoryRef.value?.handlePrint();
//     return;
//   }
//   if (currentTab.value === "instantAttendance") {
//     instantAttendanceHistoryRef.value?.handlePrint();
//     return;
//   }
//   try {
//     const sortMapping = {
//       "employee.employee_number": "employee_number",
//       employee_name: "name",
//       check_in: "check_in_time",
//       check_out: "check_out_time",
//       overtime_check_in: "check_in_time",
//       overtime_minutes: "actual_working_minutes",
//       lateness: "lateness_minutes",
//       actual_hours: "actual_working_minutes",
//       status: "status",
//     };

//     const params = {
//       ...filters.value,
//       sort_by: sortMapping[filters.value.sort_by] || filters.value.sort_by,
//       paginate: false,
//     };

//     if (!params.sort_by) {
//       delete params.sort_by;
//       delete params.sort_direction;
//     }

//     if (!filters.value.employee_id) {
//       delete params.employee_id;
//     }

//     const res = await dailyAttendanceService.getDailyAttendance(params);
//     const data = res.data || {};

//     let printData = [];
//     if (activeCategory.value === "all") {
//       printData = (data.all || []).map((i) => ({
//         ...i,
//         status: i.status || "",
//       }));
//     } else if (activeCategory.value === "present") {
//       printData = (data.present || []).map((i) => ({
//         ...i,
//         status: i.status || "",
//       }));
//     } else if (activeCategory.value === "absent") {
//       printData = (data.absent || []).map((i) => ({
//         ...i,
//         status: i.status || "",
//       }));
//     } else if (activeCategory.value === "overtime") {
//       printData = (data.overtime || []).map((i) => ({
//         ...i,
//         status: i.status || "",
//       }));
//     }

//     if (!printData.length) {
//       toast.warning(t("common.noDataToPrint") || "No data to print");
//       return;
//     }

//     printAttendanceData.value = printData;

//     await nextTick();

//     // Calculate total pages
//     const tableBody = document.querySelector(".print-only tbody");
//     if (tableBody) {
//       const rows = tableBody.querySelectorAll("tr");
//       const firstRowHeight = rows[0]?.offsetHeight || 35;
//       const availableHeight = 903;
//       const rowsPerPage = Math.floor(availableHeight / firstRowHeight);
//       const totalRows = rows.length;
//       printTotalPages.value = Math.max(1, Math.ceil(totalRows / rowsPerPage));
//     }

//     await nextTick();
//     await new Promise((resolve) => setTimeout(resolve, 300));
//     window.print();
//   } catch (e) {
//     console.error(e);
//     toast.error(
//       e?.response?.data?.message ||
//         e?.message ||
//         t("common.errors.printFailed"),
//     );
//   }
// };

const tableHeaders = computed(() => {
  const common = [
    {
      key: "employee.employee_number",
      label: t("employees.fields.employeeId"),
      sortable: true,
    },
    {
      key: "employee_name",
      label: t("employees.fields.employeeName"),
      sortable: true,
    },
  ];

  const showActions =
    activeCategory.value === "all" || activeCategory.value === "present";

  if (activeCategory.value === "overtime") {
    return [
      { key: "expand", label: "", cellClass: "bg-[#F9FAFB] !p-0 w-10" },
      ...common,
      {
        key: "overtime_check_in",
        label: t("dailyAttendance.fields.overtimeCheckIn"),
        sortable: true,
      },
      {
        key: "overtime_minutes",
        label: t("dailyAttendance.fields.overtimeHours"),
        sortable: true,
      },
      {
        key: "status",
        label: t("dailyAttendance.fields.status"),
        sortable: true,
      },
      ...(showActions
        ? [
            {
              key: "actions",
              label: t("workSystems.fields.actions"),
              cellClass: "w-24",
            },
          ]
        : []),
    ];
  }

  return [
    { key: "expand", label: "", cellClass: "bg-[#F9FAFB] !p-0 w-10" },
    ...common,
    {
      key: "check_in",
      label: t("dailyAttendance.fields.checkIn"),
      sortable: true,
    },
    {
      key: "check_out",
      label: t("dailyAttendance.fields.checkOut"),
      sortable: true,
    },
    {
      key: "lateness",
      label: t("dailyAttendance.fields.lateness"),
      sortable: true,
    },
    {
      key: "early_leave",
      label: t("dailyAttendance.fields.earlyLeave"),
      sortable: true,
    },
    {
      key: "actual_hours",
      label: t("dailyAttendance.fields.actualHours"),
      sortable: true,
    },
    {
      key: "status",
      label: t("dailyAttendance.fields.status"),
      sortable: true,
    },
    ...(showActions
      ? [
          {
            key: "actions",
            label: t("workSystems.fields.actions"),
            cellClass: "w-24",
          },
        ]
      : []),
  ];
});

const printTitle = computed(() => {
  const categoryMap = {
    all: t("dailyAttendance.summary.totalEmployees"),
    present: t("dailyAttendance.summary.totalPresent"),
    absent: t("dailyAttendance.summary.totalAbsent"),
    overtime: t("dailyAttendance.summary.totalOvertime"),
  };

  const date = filters.value.date ? filters.value.date : getTodayDate();

  return `${categoryMap[activeCategory.value]}`;
});

const formatMinutesToHHMM = (minutes) => {
  if (!minutes && minutes !== 0) return "--:--";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const formatTime12 = (time) => {
  if (!time || time === "--:--") return "--:--";

  const [hourStr, minute] = time.split(":");
  let hour = parseInt(hourStr, 10);

  const ampm =
    hour >= 12
      ? lang.value == "ar"
        ? "م"
        : "PM"
      : lang.value == "ar"
        ? "ص"
        : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;

  return `${hour.toString().padStart(2, "0")}:${minute} ${ampm}`;
};

const maxCheckOut = computed(() => {
  if (!editForm.value.check_in_time) return null;
  return editForm.value.check_in_time;
});

onMounted(() => {
  loadOrganizationalUnits();
  loadShifts();
  loadDepartments();
  loadEmployees();

  // Initialize from URL
  const { query } = route;
  if (query.date) filters.value.date = query.date;
  if (query.organizational_unit_id)
    filters.value.organizational_unit_id = query.organizational_unit_id;
  if (query.department_id) filters.value.department_id = query.department_id;
  if (query.shift_id) filters.value.shift_id = query.shift_id;
  if (query.employee_id) filters.value.employee_id = query.employee_id;
  if (query.sort_by) filters.value.sort_by = query.sort_by;
  if (query.sort_direction) filters.value.sort_direction = query.sort_direction;
  if (query.category && allowedCategories.value.includes(query.category)) {
    activeCategory.value = query.category;
  } else {
    activeCategory.value = allowedCategories.value[0] || "all";
  }
  if (query.tab && allowedTabs.value.some((t) => t.id === query.tab)) {
    currentTab.value = query.tab;
  } else {
    currentTab.value = allowedTabs.value[0]?.id || "dailyAttendance";
  }
  if (query.page) page.value = parseInt(query.page);

  fetchAttendance();
});

watch(
  () => route.query,
  () => {
    filters.value.date = route.query.date || getTodayDate();
    filters.value.organizational_unit_id =
      route.query.organizational_unit_id || "";
    filters.value.department_id = route.query.department_id || "";
    filters.value.shift_id = route.query.shift_id || "";
    filters.value.employee_id = route.query.employee_id || "";
    filters.value.sort_by = route.query.sort_by || "";
    filters.value.sort_direction = route.query.sort_direction || "";

    if (
      route.query.category &&
      allowedCategories.value.includes(route.query.category)
    ) {
      activeCategory.value = route.query.category;
    } else {
      activeCategory.value = allowedCategories.value[0] || "all";
    }
    const requestedTab =
      route.query.tab || allowedTabs.value[0]?.id || "dailyAttendance";
    if (allowedTabs.value.some((t) => t.id === requestedTab)) {
      currentTab.value = requestedTab;
    } else {
      currentTab.value = allowedTabs.value[0]?.id || "dailyAttendance";
    }

    page.value = parseInt(route.query.page) || 1;

    fetchAttendance();
  },
  { immediate: true },
);

watch(activeCategory, () => {
  page.value = 1;
});
</script>

<style scoped>
@media print {
  /* Consolidated Print Styles */
  .print-only {
    display: block !important;
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

  .print-tfoot td {
    border: none !important;
    background: transparent !important;
  }

  tr,
  td,
  th {
    page-break-inside: avoid !important;
  }

  table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin-top: 0 !important;
    page-break-inside: auto !important;
    table-layout: auto !important;
    overflow: visible !important;
  }

  th {
    background-color: #0e5f4a !important;
    color: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    padding: 12px 8px !important;
    font-size: 10px !important;
    border: 1px solid #d2d6db !important;
    text-align: center !important;
  }

  td {
    padding: 10px 8px !important;
    font-size: 10px !important;
    border: 1px solid #d2d6db !important;
    text-align: center !important;
    color: #333 !important;
    background-color: transparent !important;
  }

  tbody tr:nth-child(even) {
    background-color: #f8fafb !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .status-badge {
    padding: 0 !important;
    font-weight: 500 !important;
    display: inline-block !important;
    white-space: nowrap !important;
    font-size: 10px !important;
    color: #000 !important;
    background: transparent !important;
  }
}

.print-only {
  display: none;
}
</style>
