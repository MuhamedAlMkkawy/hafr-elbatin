<template>
  <div class="space-y-6">
    <Card>
      <!-- Top Header: Title and Filter Toggle -->
      <template #header>
        <div class="flex items-center justify-between no-print">
          <h1 class="text-[16px] font-[600] text-[#333333]">
            {{ $t("dailyAttendance.statistics.title") }}
          </h1>
          <button
            @click="isFiltersVisible = !isFiltersVisible"
            class="p-2 bg-[#0E5F4A] text-white rounded-lg hover:bg-opacity-90 transition flex items-center gap-2 cursor-pointer"
          >
            <SvgIcon name="filter" />
          </button>
        </div>
      </template>

      <!-- Filters Section (Collapsible) -->
      <Card
        v-if="isFiltersVisible"
        class="transition-all duration-300 no-print"
      >
        <div v-if="!isManager" class="w-full">
          <Select
            v-model="filters.year"
            :options="yearOptions"
            :placeholder="$t('common.year')"
            :label="$t('common.year')"
            :clearable="false"
            class="w-full"
          >
            <template #suffix>
              <SvgIcon name="calendar" />
            </template>
          </Select>
        </div>

        <div v-else class="grid grid-cols-1 gap-6 w-full">
          <!-- <Select
              v-model="filters.department_id"
              :options="assignedDepartments.map(d => ({ label: d.name, value: d.id }))"
              :placeholder="$t('employees.placeholders.departmentOrSection')"
              :label="$t('employees.fields.departmentSection')"
            /> -->

          <Input
            type="date"
            v-model="filters.date"
            :label="t('common.date')"
            :placeholder="t('common.date')"
          >
            <template #suffix>
              <SvgIcon name="calendar" />
            </template>
          </Input>
        </div>
        <div class="mt-6 flex gap-3 justify-end">
          <Button
            variant="ghost"
            size="md"
            @click="resetFilters"
            class="min-w-[100px]"
          >
            {{ $t("roles.resetFilters") }}
          </Button>
          <Button
            variant="primary"
            size="md"
            @click="applyFilters"
            :loading="loading"
            class="min-w-[100px]"
          >
            {{ $t("common.search") }}
          </Button>
        </div>
      </Card>

      <!-- Summary Cards -->
      <div
        v-if="loading"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <div
          v-for="i in 5"
          :key="i"
          class="p-3 border border-[#F1F7F5] bg-[#F8FBFA] rounded-xl h-[100px] flex flex-col justify-between"
        >
          <div class="flex items-center gap-2 mb-2">
            <Skeleton width="w-8" height="h-8" radius="rounded-lg" />
            <Skeleton width="w-32" height="h-4" />
          </div>
          <Skeleton width="w-20" height="h-8" />
        </div>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <template v-if="isManager">
          <!-- Total Attendance -->
          <Card
            class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
          >
            <div class="flex items-center justify-start gap-2 mb-1">
              <div>
                <SvgIcon name="employees" />
              </div>
              <p class="text-[14px] font-[500] text-[#1F2A37]">
                {{ $t("dashboard.summary_total_attendance") }}
              </p>
            </div>
            <div class="flex items-baseline gap-1 mt-2">
              <span class="text-[24px] font-bold text-[#1F2A37]">{{
                summary.total_attendance || 0
              }}</span>
              <span class="text-[14px] text-[#6C737F]"
                >/{{ summary.total_employees || 0 }}</span
              >
            </div>
          </Card>

          <!-- Total Absent -->
          <Card
            class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
          >
            <div class="flex items-center justify-start gap-2 mb-1">
              <div>
                <SvgIcon name="absence" />
              </div>
              <p class="text-[14px] font-[500] text-[#1F2A37]">
                {{ $t("dashboard.summary_total_absent") }}
              </p>
            </div>
            <div class="mt-2 text-[24px] font-bold text-[#1F2A37]">
              {{ summary.total_absent || 0 }}
            </div>
          </Card>

          <!-- Total Late -->
          <Card
            class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
          >
            <div class="flex items-center justify-start gap-2 mb-1">
              <div>
                <SvgIcon name="clock_sm" />
              </div>
              <p class="text-[14px] font-[500] text-[#1F2A37]">
                {{ $t("dashboard.summary_total_late") }}
              </p>
            </div>
            <div class="mt-2 text-[24px] font-bold text-[#1F2A37]">
              {{ summary.total_late || 0 }}
            </div>
          </Card>

          <!-- Overtime Workers -->
          <Card
            class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
          >
            <div class="flex items-center justify-start gap-2 mb-1">
              <div>
                <SvgIcon name="overtime" />
              </div>
              <p class="text-[14px] font-[500] text-[#1F2A37]">
                {{ $t("dashboard.summary_total_overtime_workers") }}
              </p>
            </div>
            <div class="mt-2 text-[24px] font-bold text-[#1F2A37]">
              {{
                summary.total_overtime_workers ||
                summary.total_overtime_hours ||
                0
              }}
            </div>
          </Card>

          <!-- Pending Requests -->
          <Card
            class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
          >
            <div class="flex items-center justify-start gap-2 mb-1">
              <div>
                <SvgIcon name="pending" />
              </div>
              <p class="text-[14px] font-[500] text-[#1F2A37]">
                {{ $t("dashboard.summary_total_requests_pending") }}
              </p>
            </div>
            <div class="mt-2 text-[24px] font-bold text-[#1F2A37]">
              {{ summary.total_pending_requests || 0 }}
            </div>
          </Card>
        </template>

        <template v-else>
          <!-- Working Days -->
          <Card
            class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
          >
            <div class="flex items-center justify-start gap-2 mb-1">
              <div>
                <SvgIcon name="work_days" />
              </div>
              <p class="text-[14px] font-[500] text-[#1F2A37]">
                {{ $t("employeeDashboard.summary.working_days") }}
              </p>
            </div>
            <div class="flex items-baseline gap-1 mt-2">
              <span class="text-[14px] text-[#6C737F]">200/</span>
              <span class="text-[24px] font-bold text-[#1F2A37]">{{
                summary.working_days || 0
              }}</span>
            </div>
          </Card>

          <!-- Leave Days -->
          <Card
            class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
          >
            <div class="flex items-center justify-start gap-2 mb-1">
              <div>
                <SvgIcon name="holidays" />
              </div>
              <p class="text-[14px] font-[500] text-[#1F2A37]">
                {{ $t("employeeDashboard.summary.leave_days") }}
              </p>
            </div>
            <div class="mt-2">
              <span class="text-[24px] font-bold text-[#1F2A37]">{{
                summary.leave_days || 0
              }}</span>
            </div>
          </Card>

          <!-- Late Days -->
          <Card
            class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
          >
            <div class="flex items-center justify-start gap-2 mb-1">
              <div>
                <SvgIcon name="absence" />
              </div>
              <p class="text-[14px] font-[500] text-[#1F2A37]">
                {{ $t("employeeDashboard.summary.late_arrival_days") }}
              </p>
            </div>
            <div class="mt-2">
              <span class="text-[24px] font-bold text-[#1F2A37]">{{
                summary.late_arrival_days || 0
              }}</span>
            </div>
          </Card>

          <!-- Overtime Hours -->
          <Card
            class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
          >
            <div class="flex items-center justify-start gap-2 mb-1">
              <div>
                <SvgIcon name="overtime" />
              </div>
              <p class="text-[14px] font-[500] text-[#1F2A37]">
                {{ $t("employeeDashboard.summary.overtime_hours") }}
              </p>
            </div>
            <div class="mt-2">
              <span class="text-[24px] font-bold text-[#1F2A37]">{{
                summary.overtime_hours || "0:00"
              }}</span>
            </div>
          </Card>

          <!-- Pending Requests -->
          <Card
            class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
          >
            <div class="flex items-center justify-start gap-2 mb-1">
              <div>
                <SvgIcon name="pending" />
              </div>
              <p class="text-[14px] font-[500] text-[#1F2A37]">
                {{ $t("employeeDashboard.summary.pending_requests") }}
              </p>
            </div>
            <div class="mt-2">
              <span class="text-[24px] font-bold text-[#1F2A37]">{{
                summary.pending_requests || 0
              }}</span>
            </div>
          </Card>
        </template>
      </div>
    </Card>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Column: Weekly Trend & Latest Check-ins -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Weekly Trend (Area Chart) -->
        <Card v-if="loading">
          <template #header>
            <div class="flex items-center justify-between">
              <Skeleton width="w-40" height="h-5" />
              <Skeleton width="w-24" height="h-10" />
            </div>
          </template>
          <div class="p-6">
            <Skeleton width="w-full" height="h-[290px]" />
          </div>
        </Card>
        <Card v-else>
          <template #header>
            <div class="flex items-center justify-between no-print">
              <div>
                <h2 class="text-[16px] font-[600] text-[#333333]">
                  {{
                    isManager
                      ? t("dashboard.attendance_summary")
                      : isRtl
                        ? "ساعات العمل الأسبوعية"
                        : $t("employeeDashboard.charts.weekly_hours")
                  }}
                </h2>
              </div>
              <div class="flex items-center gap-3">
                <Menu as="div" class="relative inline-block text-left">
                  <MenuButton as="template">
                    <Button variant="primary" size="md">
                      <SvgIcon name="export" />
                      <span class="ms-1 me-2">{{
                        $t("employees.export")
                      }}</span>
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
                            @click="handleExport('pdf', 'trend')"
                            :class="[
                              active
                                ? 'bg-[#0E5F4A] text-white'
                                : 'text-[#384250]',
                              'cursor-pointer mb-1 group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                            ]"
                          >
                            {{ $t("common.export_pdf") }}
                          </button>
                        </MenuItem>
                        <MenuItem v-slot="{ active }">
                          <button
                            @click="handleExport('excel', 'trend')"
                            :class="[
                              active
                                ? 'bg-[#0E5F4A] text-white'
                                : 'text-[#384250]',
                              'cursor-pointer mb-1 group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                            ]"
                          >
                            {{ $t("common.export_excel") }}
                          </button>
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </transition>
                </Menu>
              </div>
            </div>
          </template>

          <div class="flex items-center justify-between">
            <p class="text-[14px] text-[#7F7F7F] font-[500]">
              {{
                isManager
                  ? isRtl
                    ? "تحليل الحضور الأسبوعي وعمليات التسجيل الأخيرة"
                    : "Weekly attendance analysis and recent check-ins"
                  : isRtl
                    ? "تحليل ساعات العمل الأسبوعية"
                    : "Weekly working hours analysis"
              }}
            </p>
            <!-- Middle Row: Legend (Under the header border) -->
            <div v-if="!loading" class="flex items-center justify-start mb-1">
              <!-- Custom Legend for Weekly Trend -->
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#0E5F4A]"></span>
                  <span class="text-[13px] font-[500] text-[#4D5761]">{{
                    t("dashboard.present")
                  }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#1B8354]"></span>
                  <span class="text-[13px] font-[500] text-[#4D5761]">{{
                    t("dashboard.absent")
                  }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#66BB6A]"></span>
                  <span class="text-[13px] font-[500] text-[#4D5761]">{{
                    t("dashboard.late")
                  }}</span>
                </div>
              </div>
            </div>
          </div>
          <div :class="isRtl ? 'rtl-chart' : 'ltr-chart'" class="py-4">
            <apexchart
              type="area"
              height="290"
              :options="trendOptions"
              :series="trendSeries"
            />
          </div>
        </Card>

        <!-- Latest Check-ins -->
        <Card>
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-[16px] font-[600] text-[#333333]">
                  {{
                    isManager
                      ? isRtl
                        ? "عمليات تسجيل الدخول الأخيرة"
                        : "Latest Checkins"
                      : $t("employeeDashboard.latest_checkins")
                  }}
                </h2>
              </div>
              <router-link
                v-if="isManager"
                to="/attendance/daily"
                class="text-[13px] text-[#0E5F4A] font-[500] hover:underline"
              >
                {{ isRtl ? "عرض السجل الكامل" : "View Full Record" }}
              </router-link>
            </div>
          </template>
          <Table
            :headers="checkinHeaders"
            :items="latestCheckins"
            :loading="loading"
          >
            <template #cell-employee_number="{ item }">
              <span class="text-[#384250] font-[500]">{{
                isManager
                  ? item.employee?.employee_number || "-"
                  : item.employee_number || item.id
              }}</span>
            </template>
            <!-- Custom Cell for Employee Name with Avatar -->
            <template #cell-employee_name="{ item }">
              <div class="flex items-center gap-2">
                <template v-if="!isManager">
                  <img
                    :src="
                      item.employee_image ||
                      item.employee?.image ||
                      `https://ui-avatars.com/api/?name=${item.employee_name || item.employee?.name}&background=random`
                    "
                    class="w-8 h-8 rounded-full border border-gray-100"
                    alt=""
                  />
                  <span class="font-[500] text-[#111827]">{{
                    item.employee_name || item.employee?.name
                  }}</span>
                </template>
                <template v-else>
                  <span class="font-[500] text-[#111827]">{{
                    item.employee?.name
                  }}</span>
                </template>
              </div>
            </template>
            <template #cell-day_name="{ item }">
              <span class="capitalize">{{ getDayName(item.date) }}</span>
            </template>
            <template #cell-date="{ item }">
              <span>{{ item.date }}</span>
            </template>
            <template #cell-check_in_time="{ item }">
              <div
                v-if="isManager"
                class="flex items-center gap-1.5 border border-[#E7EFED] bg-[#F8FBFA] p-0.5 rounded-full px-2 w-fit"
              >
                <button
                  v-if="item.check_in_location"
                  class="w-7 h-7 flex items-center justify-center bg-white border border-[#E7EFED] rounded-full hover:bg-gray-50 transition-colors"
                  v-tooltip="item.check_in_location"
                >
                  <SvgIcon name="location" />
                </button>
                <div
                  v-if="item.check_in_selfie"
                  class="w-7 h-7 rounded-full overflow-hidden border border-[#E7EFED]"
                >
                  <img
                    :src="item.check_in_selfie"
                    class="w-full h-full object-cover"
                  />
                </div>
                <span
                  class="text-[13px] text-[#111827] font-[600] whitespace-nowrap px-1"
                >
                  {{ formatTime(item.check_in_time) }}
                </span>
              </div>
              <div v-else class="flex items-center gap-1.5">
                <SvgIcon name="clock_sm" class="opacity-40" />
                <span>{{ formatTime(item.check_in_time) }}</span>
              </div>
            </template>
            <template #cell-check_out_time="{ item }">
              <div
                v-if="isManager"
                class="flex items-center gap-1.5 border border-[#E7EFED] bg-[#F8FBFA] p-0.5 rounded-full px-2 w-fit"
              >
                <button
                  v-if="item.check_out_location"
                  class="w-7 h-7 flex items-center justify-center bg-white border border-[#E7EFED] rounded-full hover:bg-gray-50 transition-colors"
                  v-tooltip="item.check_out_location"
                >
                  <SvgIcon name="location" />
                </button>
                <div
                  v-if="item.check_out_selfie"
                  class="w-7 h-7 rounded-full overflow-hidden border border-[#E7EFED]"
                >
                  <img
                    :src="item.check_out_selfie"
                    class="w-full h-full object-cover"
                  />
                </div>
                <span
                  class="text-[13px] text-[#111827] font-[600] whitespace-nowrap px-1"
                >
                  {{ formatTime(item.check_out_time) }}
                </span>
              </div>
              <div v-else class="flex items-center gap-1.5">
                <SvgIcon name="clock_sm" class="opacity-40" />
                <span>{{ formatTime(item.check_out_time) }}</span>
              </div>
            </template>
            <template #cell-status="{ item }">
              <div
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                :class="getAttendanceStatusClass(item)"
              >
                <span
                  class="w-2 h-2 rounded-full"
                  :class="getAttendanceStatusDotClass(item)"
                ></span>
                {{ item.status_label }}
              </div>
            </template>
          </Table>
        </Card>
      </div>

      <!-- Side Column: Attendance Breakdown & Latest Requests -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Attendance Breakdown (Donut Chart) -->
        <Card v-if="loading">
          <template #header>
            <Skeleton width="w-40" height="h-5" />
          </template>
          <div class="p-6 flex justify-center">
            <Skeleton width="w-48" height="h-48" radius="rounded-full" />
          </div>
          <div class="px-6 pb-6 space-y-2">
            <Skeleton width="w-full" height="h-4" />
            <Skeleton width="w-full" height="h-4" />
          </div>
        </Card>
        <Card v-else>
          <template #header>
            <div class="flex items-center gap-2">
              <h2 class="text-[16px] font-[600] text-[#333333]">
                {{
                  isManager
                    ? isRtl
                      ? "ملخص الحضور والانصراف اليومي"
                      : "Daily Attendance Summary"
                    : isRtl
                      ? "ملخص دوامي الشهري"
                      : $t("employeeDashboard.charts.attendance_breakdown")
                }}
              </h2>
              <div
                class="px-2 py-0.5 bg-[#E7EFED] text-[#0E5F4A] rounded-full text-[12px] font-[500] border border-[#0E5F4A]"
              >
                {{
                  isManager
                    ? formattedCurrentDateBadge
                    : formattedCurrentMonthBadge
                }}
              </div>
            </div>
          </template>
          <div v-if="isManager" class="text-start">
            <p class="text-[12px] text-[#6C737F] mb-1">
              {{ isRtl ? "إجمالي عدد الموظفين" : "Total Employees" }}
            </p>
            <p class="text-[18px] font-bold text-[#111827]">
              {{ summary.total_employees?.toLocaleString() || "0" }}
              {{ isRtl ? "موظف" : "Employee" }}
            </p>
          </div>
          <div :class="isRtl ? 'rtl-chart' : 'ltr-chart'" class="py-4">
            <apexchart
              v-if="hasBreakdownData"
              type="donut"
              height="304"
              :options="breakdownOptions"
              :series="breakdownSeries"
            />
            <div
              v-else
              class="h-[304px] flex flex-col items-center justify-center text-[#6C737F]"
            >
              <img
                src="@/assets/images/no_results.png"
                alt="no_results"
                class="mx-1 max-w-[201px] max-h-[163px] mb-3"
              />
            </div>
          </div>
        </Card>

        <!-- Latest Requests -->
        <Card v-if="loading" class="overflow-hidden">
          <template #header>
            <div class="flex items-center justify-between">
              <Skeleton width="w-32" height="h-5" />
              <Skeleton width="w-16" height="h-4" />
            </div>
          </template>
          <div class="p-4 space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <Skeleton width="w-full" height="h-16" radius="rounded-xl" />
              <Skeleton width="w-full" height="h-16" radius="rounded-xl" />
              <Skeleton width="w-full" height="h-16" radius="rounded-xl" />
            </div>
            <div v-for="i in 3" :key="i" class="space-y-2">
              <div class="flex justify-between">
                <Skeleton width="w-24" height="h-3" />
                <Skeleton width="w-20" height="h-6" radius="rounded-full" />
              </div>
              <Skeleton width="w-40" height="h-4" />
            </div>
          </div>
        </Card>
        <Card v-else class="overflow-hidden">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-[16px] font-[600] text-[#333333]">
                {{
                  isManager
                    ? isRtl
                      ? "طلبات الإجازات والأذونات الأخيرة"
                      : "Latest Requests"
                    : $t("employeeDashboard.latest_requests")
                }}
              </h2>
              <router-link
                to="/requests/leave"
                class="text-[13px] text-[#0E5F4A] font-[500] hover:underline"
              >
                {{
                  isManager
                    ? isRtl
                      ? "عرض جميع الطلبات"
                      : "View All"
                    : $t("employeeDashboard.view_all")
                }}
              </router-link>
            </div>
          </template>
          <div class="px-4 pb-4 pt-1" v-if="latestRequests.length">
            <div class="grid grid-cols-3 gap-3">
              <!-- Pending Requests -->
              <div
                class="bg-[#F8FBFA] border border-[#F1F7F5] rounded-xl p-3 text-center transition-all duration-300 hover:shadow-md group"
              >
                <p class="text-[11px] font-[500] text-[#4D5761] mb-1">
                  {{ t("dashboard.summary_total_pending") }}
                </p>
                <p class="text-[20px] font-bold text-[#0E5F4A] leading-tight">
                  {{ requestCounts.pending }}
                </p>
              </div>

              <!-- Approved Requests -->
              <div
                class="bg-[#F8FBFA] border border-[#F1F7F5] rounded-xl p-3 text-center transition-all duration-300 hover:shadow-md group"
              >
                <p class="text-[11px] font-[500] text-[#4D5761] mb-1">
                  {{ isRtl ? "تمت الموافقة" : t("requests.status.approved") }}
                </p>
                <p class="text-[20px] font-bold text-[#0E5F4A] leading-tight">
                  {{ requestCounts.approved }}
                </p>
              </div>

              <!-- Rejected Requests -->
              <div
                class="bg-[#F8FBFA] border border-[#F1F7F5] rounded-xl p-3 text-center transition-all duration-300 hover:shadow-md group"
              >
                <p class="text-[11px] font-[500] text-[#4D5761] mb-1">
                  {{ isRtl ? "تم الرفض" : t("requests.status.rejected") }}
                </p>
                <p class="text-[20px] font-bold text-[#0E5F4A] leading-tight">
                  {{ requestCounts.rejected }}
                </p>
              </div>
            </div>
          </div>
          <div
            class="divide-y divide-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar"
          >
            <div
              v-if="!latestRequests.length"
              class="p-8 text-center text-[#6C737F]"
            >
              <img
                src="@/assets/images/no_results.png"
                alt="no_results"
                class="mx-1 max-w-[201px] max-h-[163px] mb-3 mx-auto"
              />
            </div>
            <div
              v-for="request in latestRequests"
              :key="request.id"
              class="p-4 hover:bg-[#F8FBFA] transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <div
                  class="flex items-center gap-1.5 text-[11px] text-[#6C737F]"
                >
                  <SvgIcon name="clock_sm" size="14" />
                  <span
                    >{{ request.from_date || request.date || "-" }}
                    {{ isRtl ? "ص" : "AM" }}</span
                  >
                </div>

                <span
                  class="px-2 py-0.5 rounded-full text-[12px] font-[500] flex items-center gap-1.5"
                  :class="getStatusColor(request.status)"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {{
                    request.status_label ||
                    (request.type === "leave"
                      ? t("leaveRequests.status." + request.status)
                      : isRtl
                        ? request.status_label
                        : request.status)
                  }}
                </span>
              </div>
              <h3
                class="text-[14px] font-[600] text-[#111827] leading-tight flex items-center justify-between"
              >
                <span>{{
                  isManager ? request.employee?.name : request.type_label
                }}</span>
                <div v-if="isManager" class="flex gap-2">
                  <button
                    @click.stop="handleApprove(request.id)"
                    class="cursor-pointer"
                    v-tooltip="
                      t('common.actionTooltips.approve.title', { target: '' })
                    "
                  >
                    <SvgIcon name="accept" />
                  </button>
                  <button
                    @click.stop="handleReject(request.id)"
                    class="cursor-pointer"
                    v-tooltip="
                      t('common.actionTooltips.reject.title', { target: '' })
                    "
                  >
                    <SvgIcon name="reject" />
                  </button>
                </div>
              </h3>
              <p v-if="isManager" class="text-[12px] text-[#6C737F] mt-1">
                {{ request.type_label }}
                {{
                  request.duration
                    ? `(${request.duration}${typeof request.duration === "number" ? " " + t("common.day_singular") : ""})`
                    : ""
                }}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import Card from "@/components/ui/Card.vue";
import Select from "@/components/ui/Select.vue";
import Button from "@/components/ui/Button.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Table from "@/components/ui/Table.vue";
import Skeleton from "@/components/ui/Skeleton.vue";
import Input from "@/components/ui/Input.vue";
import employeeDashboardService from "@/services/employeeDashboard.js";
import managerDashboardService from "@/services/managerDashboard.js";
import { useAuthStore } from "@/stores/auth";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";
import { useToast } from "vue-toastification";

const { t, locale } = useI18n();
const isRtl = computed(() => locale.value === "ar");

const authStore = useAuthStore();
const toast = useToast();

const formattedCurrentDateBadge = computed(() => {
  const date = new Date();
  const dayName = date.toLocaleDateString(
    locale.value === "ar" ? "ar-EG" : "en-US",
    { weekday: "long" },
  );
  const day = date.getDate();
  const monthName = date.toLocaleDateString(
    locale.value === "ar" ? "ar-EG" : "en-US",
    { month: "long" },
  );
  return `${dayName} - ${day} ${monthName}`;
});

const formattedCurrentMonthBadge = computed(() => {
  const date = new Date();
  return date.toLocaleDateString(locale.value === "ar" ? "ar-EG" : "en-US", {
    month: "long",
  });
});

const loading = ref(true);
const isFiltersVisible = ref(false);
const summary = ref({});
const breakdown = ref([]);
const weeklyTrend = ref([]);
const weeklyHoursSummary = ref({});
const latestRequests = ref([]);
const latestCheckins = ref([]);
const pendingLeaveRequests = ref([]);
const assignedDepartments = ref([]);

const isManager = computed(() => {
  return authStore.user?.roles?.includes("manager") || false;
});

const filters = reactive({
  year: new Date().getFullYear(),
  department_id: null,
  date: new Date().toISOString().split("T")[0],
});

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 20; i--) {
    years.push({ label: i.toString(), value: i });
  }
  return years;
});

const checkinHeaders = computed(() => {
  if (isManager.value) {
    return [
      {
        key: "employee_number",
        label: isRtl.value ? "كود الموظف" : "Emp. Code",
      },
      { key: "employee_name", label: t("employees.fields.employeeName") },
      { key: "check_in_time", label: t("dailyAttendance.fields.checkIn") },
      { key: "check_out_time", label: t("dailyAttendance.fields.checkOut") },
      { key: "status", label: t("roles.fields.status") },
    ];
  }
  return [
    { key: "day_name", label: t("common.day") },
    { key: "date", label: t("common.date") },
    { key: "check_in_time", label: t("dailyAttendance.fields.checkIn") },
    { key: "check_out_time", label: t("dailyAttendance.fields.checkOut") },
    { key: "status", label: t("roles.fields.status") },
  ];
});

const requestCounts = computed(() => {
  return {
    pending: latestRequests.value.filter((r) => r.status === "pending").length,
    approved: latestRequests.value.filter((r) => r.status === "approved")
      .length,
    rejected: latestRequests.value.filter((r) => r.status === "rejected")
      .length,
  };
});

const formatValue = (val) =>
  val === null || val === undefined || val === "" ? "-" : val;

// Fetch Data
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      year: filters.year,
      department_id: filters.department_id,
      date: filters.date,
    };

    if (isManager.value) {
      const [
        mainRes,
        summaryRes,
        breakdownRes,
        trendRes,
        checkinsRes,
        requestsRes,
        deptsRes,
      ] = await Promise.all([
        managerDashboardService.getDashboard(params),
        managerDashboardService.getSummary(params),
        managerDashboardService.getBreakdown(params),
        managerDashboardService.getWeeklyTrend(params),
        managerDashboardService.getLatestCheckins(),
        managerDashboardService.getLeaveRequests(),
        managerDashboardService.getAssignedDepartments(),
      ]);

      const dashboardData = mainRes.data.data;
      summary.value = summaryRes.data.data || dashboardData.summary || {};

      const rawBreakdown =
        breakdownRes.data.data || dashboardData.attendance_breakdown || [];
      // Ensure the breakdown is an array
      breakdown.value = Array.isArray(rawBreakdown)
        ? rawBreakdown
        : rawBreakdown.data || [];

      weeklyTrend.value =
        trendRes.data.data || dashboardData.weekly_trend || [];
      latestCheckins.value =
        checkinsRes.data.data?.latest_checkins ||
        checkinsRes.data.data ||
        dashboardData.latest_checkins ||
        [];

      const allRequests =
        requestsRes.data.data || dashboardData.leave_requests || [];
      latestRequests.value = allRequests;

      assignedDepartments.value =
        deptsRes.data.data || dashboardData.assigned_departments || [];
    } else {
      // In parallel for better performance
      const [mainRes, summaryRes, breakdownRes, trendRes, hoursRes] =
        await Promise.all([
          employeeDashboardService.getDashboard(params),
          employeeDashboardService.getSummary(params),
          employeeDashboardService.getBreakdown(params),
          employeeDashboardService.getWeeklyTrend(params),
          employeeDashboardService.getWeeklyHours(params),
        ]);

      const dashboardData = mainRes.data.data;
      summary.value =
        summaryRes.data.data.summary || dashboardData.summary || {};
      breakdown.value =
        breakdownRes.data.data.attendance_breakdown ||
        dashboardData.attendance_breakdown ||
        [];
      weeklyTrend.value =
        trendRes.data.data.weekly_trend || dashboardData.weekly_trend || [];
      weeklyHoursSummary.value =
        hoursRes.data.data.weekly_hours || dashboardData.weekly_hours || {};

      latestRequests.value = dashboardData.latest_requests || [];
      latestCheckins.value = dashboardData.latest_checkins || [];
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  } finally {
    loading.value = false;
  }
};

const handleApprove = async (id) => {
  try {
    await managerDashboardService.approveLeaveRequest(id);
    toast.success(t("common.success"));
    fetchData();
  } catch (error) {
    toast.error(error?.response?.data?.message || t("common.error"));
  }
};

const handleReject = async (id) => {
  try {
    await managerDashboardService.rejectLeaveRequest(id);
    toast.success(t("common.success"));
    fetchData();
  } catch (error) {
    toast.error(error?.response?.data?.message || t("common.error"));
  }
};

const applyFilters = () => {
  fetchData();
};

const resetFilters = () => {
  filters.year = new Date().getFullYear();
  filters.department_id = null;
  filters.date = new Date().toISOString().split("T")[0];
  fetchData();
};

const formatTime = (timeStr) => {
  if (!timeStr || timeStr === "--:--") return "--:--";

  // Extract hours and minutes
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0]);
  const minutes = parts[1].substring(0, 2);

  if (isNaN(hours)) return timeStr;

  const isPm = hours >= 12;
  const amPmLabel = isRtl.value ? (isPm ? "م" : "ص") : isPm ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = hours < 10 ? `0${hours}` : hours;

  return `${formattedHours}:${minutes} ${amPmLabel}`;
};

const getDayName = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(
    locale.value === "ar" ? "ar-EG" : "en-US",
    { weekday: "long" },
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case "approved":
      return "text-[#085D3A] bg-[#ECFDF3]";
    case "pending":
      return "text-[#B54708] bg-[#FFFAEB]";
    case "rejected":
      return "text-[#B42318] bg-[#FEF3F2]";
    case "withdrawn":
    case "cancelled":
      return "text-[#4D5761] bg-[#E5E7EB]";
    default:
      return "text-[#4D5761] bg-[#E5E7EB]";
  }
};

const getStatusBorderClass = (status) => {
  switch (status) {
    case "approved":
      return "border-[#1B8354]/20";
    case "pending":
      return "border-[#B54708]/20";
    case "rejected":
      return "border-[#D32F2F]/20";
    default:
      return "border-gray-200";
  }
};

const getAttendanceStatusClass = (item) => {
  const status = item.status;
  switch (status) {
    case "present":
      return "bg-[#ECFDF3] text-[#085D3A]";
    case "absent":
      return "bg-[#FEF3F2] text-[#912018]";
    case "mission":
      return "bg-[#F3FCF6] text-[#54C08A]";
    case "leave":
      return "bg-[#EFF8FF] text-[#1849A9]";
    case "rest_day":
      return "bg-[#E5E7EB] text-[#1F2A37]";
    case "holiday":
      return "bg-[#FEF6EE] text-[#B93815]";
    case "half_day":
      return "bg-[#F9FAFB] text-[#374151]";
    default:
      return "bg-gray-50 text-gray-600";
  }
};

const getAttendanceStatusDotClass = (item) => {
  const status = item.status;
  switch (status) {
    case "present":
      return "bg-[#085D3A]";
    case "absent":
      return "bg-[#912018]";
    case "mission":
      return "bg-[#54C08A]";
    case "leave":
      return "bg-[#1849A9]";
    case "rest_day":
      return "bg-[#1F2A37]";
    case "holiday":
      return "bg-[#B93815]";
    case "half_day":
      return "bg-[#374151]";
    default:
      return "bg-gray-600";
  }
};

const handleExport = async (format, chartType) => {
  let data = [];
  let fileName = "";
  let headers = [];

  if (chartType === "breakdown") {
    fileName = "attendance_breakdown";
    headers = [t("common.status"), t("common.count")];
    const statuses = ["present", "late", "missions", "leave"];
    const labels = [
      t("dashboard.present"),
      t("dashboard.late"),
      t("dashboard.external_missions"),
      t("dashboard.absent"),
    ];
    data = statuses.map((s, idx) => {
      const item = breakdown.value.find((i) => i.status === s);
      return {
        [headers[0]]: labels[idx],
        [headers[1]]: formatValue(item ? item.count : 0),
      };
    });
  } else if (chartType === "trend") {
    fileName = "weekly_trend";
    headers = [
      t("common.day"),
      t("common.date"),
      t("employeeDashboard.status.present"),
      t("employeeDashboard.status.absent"),
      t("employeeDashboard.status.late"),
      // t("employeeDashboard.summary.working_hours"),
      // t("roles.fields.status"),
    ];
    data = weeklyTrend.value.map((item) => ({
      [headers[0]]: formatValue(isRtl.value ? item.day_ar : item.day),
      [headers[1]]: formatValue(item.date),
      [headers[2]]: formatValue(item.present),
      [headers[3]]: formatValue(item.absent),
      [headers[4]]: formatValue(item.late),
      // [headers[2]]: formatValue(item.working_hours),
      // [headers[3]]: formatValue(item.status_label || item.status),
    }));
  }

  if (format === "excel") {
    const XLSX = await import("xlsx");

    const isArabic = isRtl.value;

    let excelHeaders = [...headers];
    let rows = data.map((item) => Object.values(item));

    // Match PDF behavior (RTL support)
    if (isArabic) {
      excelHeaders = excelHeaders.reverse();
      rows = rows.map((r) => r.reverse());
    }

    // Combine headers + rows
    const sheetData = [excelHeaders, ...rows];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Optional: auto column width
    const colWidths = excelHeaders.map((h, i) => ({
      wch:
        Math.max(
          h.length,
          ...rows.map((r) => (r[i] ? String(r[i]).length : 0)),
        ) + 2,
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    XLSX.writeFile(wb, `${fileName}_${new Date().getTime()}.xlsx`);
  } else if (format === "pdf") {
    const doc = new jsPDF({
      orientation: chartType === "trend" ? "l" : "p",
      unit: "mm",
      format: "a4",
    });

    try {
      const regularFontRes = await fetch(IBMPlexSansArabicRegular);
      const regularFontBuffer = await regularFontRes.arrayBuffer();
      const boldFontRes = await fetch(IBMPlexSansArabicBold);
      const boldFontBuffer = await boldFontRes.arrayBuffer();

      doc.addFileToVFS(
        "IBMPlexSansArabic-Regular.ttf",
        arrayBufferToBase64(regularFontBuffer),
      );
      doc.addFont(
        "IBMPlexSansArabic-Regular.ttf",
        "IBMPlexSansArabic",
        "normal",
      );
      doc.addFileToVFS(
        "IBMPlexSansArabic-Bold.ttf",
        arrayBufferToBase64(boldFontBuffer),
      );
      doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

      doc.setFont("IBMPlexSansArabic", "normal");

      const isArabic = isRtl.value;
      let pdfHeaders = [...headers];
      let rows = data.map((item) => Object.values(item));

      if (isArabic) {
        pdfHeaders = pdfHeaders.reverse();
        rows = rows.map((r) => r.reverse());
      }

      // Draw Header with Title and Dates (if applicable)
      let pdfTitle = "";
      if (chartType === "breakdown") {
        pdfTitle = isManager.value
          ? isArabic
            ? "ملخص الحضور والانصراف اليومي"
            : "Daily Attendance Summary"
          : isArabic
            ? "ملخص دوامي الشهري"
            : t("employeeDashboard.charts.attendance_breakdown");
      } else {
        pdfTitle = isManager.value
          ? t("dashboard.attendance_summary")
          : isArabic
            ? "ساعات العمل الأسبوعية"
            : t("employeeDashboard.charts.weekly_hours");
      }

      drawPdfHeader(
        doc,
        authStore,
        isArabic,
        pdfTitle,
        isManager.value ? filters.date : "",
        "",
        "",
        isManager.value ? "" : filters.year,
      );

      autoTable(doc, {
        startY: pdfTitle ? 52 : 45,
        head: [pdfHeaders],
        body: rows,
        styles: {
          font: "IBMPlexSansArabic",
          fontStyle: "normal",
          halign: isArabic ? "right" : "left",
          fontSize: 9,
        },
        headStyles: {
          fillColor: [14, 95, 74],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        margin: { top: 45, bottom: 25 },
        didParseCell: (data) => {
          data.cell.styles.font = "IBMPlexSansArabic";
          if (data.section === "head") {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      // Draw Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawPdfFooter(doc, authStore, i, totalPages, isArabic);
      }

      doc.save(`${fileName}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error(t("common.error"));
    }
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

const hasBreakdownData = computed(() => {
  return breakdownSeries.value.some((count) => count > 0);
});

// Pie Chart Options
const breakdownSeries = computed(() => {
  const statuses = ["present", "late", "missions", "absent"];
  const counts = statuses.map((s) => {
    const item = breakdown.value.find((i) => i.status === s);
    return item ? item.count : 0;
  });
  return isRtl.value ? counts.reverse() : counts;
});
// const breakdownSeries = computed(() => {
//   const s = summary.value || {};

//   const counts = [
//     s.total_on_time || 0, // present
//     s.total_late || 0, // late
//     0, // missions (not in API)
//     s.total_absent || 0, // absent
//   ];

//   return isRtl.value ? counts.reverse() : counts;
// });

const breakdownOptions = computed(() => {
  let labels = [
    t("dashboard.present"),
    t("dashboard.late"),
    t("dashboard.external_missions"),
    t("dashboard.absent"),
  ];
  let colors = ["#074D31", "#54C08A", "#B8EACB", "#1B8354"];

  if (isRtl.value) {
    labels = [...labels].reverse();
    colors = [...colors].reverse();
  }

  return {
    chart: {
      type: "donut",
      fontFamily: "inherit",
      rtl: isRtl.value,
    },
    labels,
    colors,
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      markers: { radius: 12, shape: "circle" },
      onItemClick: { toggleDataSeries: false },
      onItemHover: { highlightDataSeries: false },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "60%",
          labels: {
            show: false,
          },
        },
      },
    },
    stroke: { show: false },
  };
});

// Trend Chart Options
const trendSeries = computed(() => {
  const data = weeklyTrend.value || [];
  return [
    {
      name: t("dashboard.present"),
      data: data.map(
        (item) =>
          item.present ?? (item.status === "present" ? item.working_hours : 0),
      ),
    },
    {
      name: t("dashboard.absent"),
      data: data.map(
        (item) => item.absent ?? (item.status === "absent" ? 1 : 0),
      ),
    },
    {
      name: t("dashboard.late"),
      data: data.map(
        (item) =>
          item.late ?? (item.status === "late" ? item.working_hours : 0),
      ),
    },
  ];
});

const trendOptions = computed(() => {
  const categories = weeklyTrend.value.map((item) =>
    isRtl.value ? item.day_ar || item.day_name : item.day || item.day_name_en,
  );

  return {
    chart: {
      type: "area",
      toolbar: { show: false },
      fontFamily: "inherit",
      zoom: { enabled: false },
      rtl: isRtl.value,
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [50, 100, 100],
      },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val) => val.toFixed(0),
      },
    },
    colors: ["#0E5F4A", "#1B8354", "#66BB6A"],
    grid: {
      borderColor: "#F1F5F9",
      strokeDashArray: 4,
    },
    tooltip: {
      theme: "light",
    },
    legend: {
      show: false,
      position: "top",
      horizontalAlign: isRtl.value ? "left" : "right",
      markers: { radius: 12, shape: "circle" },
    },
  };
});

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
:deep(.apexcharts-legend-text) {
  color: #384250 !important;
  font-size: 14px !important;
}
:deep(.apexcharts-xaxis-label),
:deep(.apexcharts-yaxis-label) {
  fill: #384250 !important;
  font-size: 14px !important;
}
:deep(.rtl-chart .apexcharts-legend-series) {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 8px;
}
:deep(.ltr-chart .apexcharts-legend-series) {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
:deep(.apexcharts-legend-marker) {
  cursor: auto !important;
}
:deep(.apexcharts-canvas),
:deep(.apexcharts-svg) {
  outline: none !important;
}
</style>
