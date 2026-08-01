<template>
  <section class="space-y-5" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
    <!-- BREADCRUMB -->
    <Breadcrumb :items="breadcrumbItems" />

    <!-- ==================== PERSONAL INFO CARD ==================== -->
    <Card class="!mt-4 !p-0 overflow-hidden relative border-none">
      <template #header>
        <div class="flex items-center justify-between p-[15px] pb-[0px]">
          <!-- Title -->
          <div v-if="loading" class="skeleton h-[20px] w-[140px] rounded-md" />
          <h2 v-else class="text-[16px] font-[600] text-[#333333]">
            {{ t("profile.personalInfo.title") }}
          </h2>
          <!-- Action button -->
          <div
            v-if="loading"
            class="skeleton h-[30px] w-[36px] rounded-[4px]"
          />
          <div v-else class="flex gap-2 absolute end-[10px] top-[8px]">
            <button
              class="flex items-center justify-center bg-[#0E5F4A] p-1.5 rounded-[4px] hover:cursor-pointer transition-colors duration-200 hover:bg-[#0E5F4A]/80"
              @click="router.push('/scheduale')"
            >
              <SvgIcon name="table" class="invert" />
            </button>
          </div>
        </div>
      </template>

      <div
        class="flex flex-col md:flex-row gap-[20px] p-5 items-center md:items-start lg:items-center"
      >
        <!-- Avatar -->
        <div
          v-if="loading"
          class="skeleton w-[120px] h-[120px] md:w-[100px] md:h-[100px] lg:w-[150px] lg:h-[150px] flex-shrink-0 rounded-full"
        />
        <div
          v-else
          class="image w-[120px] h-[120px] md:w-[100px] md:h-[100px] lg:w-[150px] lg:h-[150px] flex-shrink-0 relative"
        >
          <img
            :src="selectedImage || profile?.image_url"
            alt="image"
            loading="lazy"
            class="w-full h-full object-cover rounded-full overflow-hidden cursor-pointer"
            @click="openViewer(selectedImage || profile?.image_url)"
          />
          <input
            type="file"
            name="image"
            id="image"
            hidden
            accept="image/*"
            @change="handleUploadFile"
          />
          <label
            for="image"
            class="absolute bottom-0 left-5 w-8 h-8 rounded-full flex justify-center items-center bg-[#135543] border border-[#E7EFED] hover:bg-[#333] hover:border-[#333] cursor-pointer"
          >
            <SvgIcon name="camera" classes="scale-[140%]" />
          </label>
        </div>

        <!-- Info block -->
        <div
          class="info flex flex-col flex-grow-1 w-full pb-[8px] text-center md:text-start items-center md:items-start"
        >
          <!-- Name + badge -->
          <div v-if="loading" class="flex items-center gap-3 mb-2">
            <div class="skeleton h-[28px] w-[200px] rounded-md" />
            <div class="skeleton h-[22px] w-[64px] rounded-full" />
          </div>
          <h5
            v-else
            class="text-[18px] font-[600] text-[#333333] flex flex-wrap justify-center md:justify-start items-center gap-3"
          >
            {{ profile?.name || "--" }}
            <span
              class="inline-flex items-center gap-1.5 text-[14px] font-[500] px-3 p-0.5 rounded-full flex-shrink-0"
              :class="{
                'bg-[#E7EFED] text-[#065F46]  py-[2px] px-3 border border-[#82ACA1]':
                  profile?.is_active,
                'bg-[#FEE2E2] text-[#B91C1C]': !profile?.is_active,
              }"
            >
              {{
                profile?.is_active
                  ? t("profile.personalInfo.status.active")
                  : t("profile.personalInfo.status.inactive")
              }}
            </span>
          </h5>

          <!-- Rank -->
          <div
            v-if="loading"
            class="skeleton h-[20px] w-[140px] rounded-md mt-2 mb-[17px]"
          />
          <h4 v-else class="text-[14px] color-[#6C737F] mt-[8px] font-[500]">
            {{ profile?.employee_type || "--" }}
          </h4>

          <!-- Info grid -->
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-2 mt-[17px] w-full text-start"
          >
            <!-- Skeleton items -->
            <template v-if="loading">
              <div
                v-for="i in 8"
                :key="i"
                class="flex gap-4 items-center py-[5px]"
              >
                <div
                  class="skeleton w-[20px] h-[20px] rounded-md flex-shrink-0"
                />
                <div class="skeleton h-[14px] rounded-md flex-grow" />
              </div>
            </template>
            <!-- Real items -->
            <template v-else>
              <div class="flex gap-4 items-center py-[5px]">
                <SvgIcon class="flex-shrink-0" name="location_personal_info" />
                <span class="text-[14px] font-[500] text-[#171A1F]">{{
                  profile?.address || "--"
                }}</span>
              </div>
              <div class="flex gap-4 items-center py-[5px]">
                <SvgIcon class="flex-shrink-0" name="building_info" />
                <span class="text-[14px] font-[500] text-[#171A1F]">
                  {{ profile?.branch?.[`name_${lang}`] || "--" }}
                </span>
              </div>
              <div class="flex gap-4 items-center py-[5px]">
                <SvgIcon class="flex-shrink-0" name="bag" />
                <span class="text-[14px] font-[500] text-[#171A1F]">
                  {{ profile?.department?.[`name_${lang}`] || "--" }}
                </span>
              </div>
              <div class="flex gap-4 items-center py-[5px]">
                <SvgIcon class="flex-shrink-0" name="bag" />
                <span class="text-[14px] font-[500] text-[#171A1F]">{{
                  profile?.employee_code || "--"
                }}</span>
              </div>
              <div class="flex gap-4 items-center py-[5px]">
                <SvgIcon class="flex-shrink-0" name="mail" />
                <span class="text-[14px] font-[500] text-[#171A1F]">
                  {{ profile?.email || "--" }}</span
                >
              </div>
              <div class="flex gap-4 items-center py-[5px]">
                <SvgIcon class="flex-shrink-0" name="phone" />
                <span class="text-[14px] font-[500] text-[#171A1F]">{{
                  profile?.phone || "--"
                }}</span>
              </div>
              <div class="flex gap-4 items-center py-[5px]">
                <SvgIcon class="flex-shrink-0" name="hash" />
                <span class="text-[14px] font-[500] text-[#171A1F]">{{
                  profile?.employee_number || "--"
                }}</span>
              </div>
              <div class="flex gap-4 items-center py-[5px]">
                <SvgIcon class="flex-shrink-0" name="card_info" />
                <span class="text-[14px] font-[500] text-[#171A1F]">{{
                  profile?.id_number || "--"
                }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Card>

    <!-- ==================== ATTENDANCE SUMMARY ==================== -->
    <Card class="relative no-print">
      <template #header>
        <div v-if="loading" class="skeleton h-[20px] w-[160px] rounded-md" />
        <h2 v-else class="text-[16px] font-[600] text-[#333333]">
          {{ t("profile.attendance.title") }}
        </h2>
      </template>

      <!-- Skeleton: 5 equal cards -->
      <div v-if="loading" class="flex gap-3 overflow-hidden">
        <div
          v-for="i in 5"
          :key="i"
          class="flex-1 skeleton h-[104px] rounded-xl"
        />
      </div>

      <!-- Real swiper -->
      <div v-else class="relative">
        <swiper
          :modules="[Autoplay]"
          :slides-per-view="1.2"
          :space-between="12"
          :loop="true"
          :autoplay="{
            delay: 2000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }"
          :breakpoints="{
            640: { slidesPerView: 2.2 },
            1024: { slidesPerView: 4 },
            1280: { slidesPerView: 5 },
          }"
          class="statistics-swiper w-full"
          :dir="lang === 'ar' ? 'rtl' : 'ltr'"
          :key="lang"
        >
          <SwiperSlide>
            <Card
              class="!p-4 !bg-[#F8FBFA] !border !border-[#F1F7F5] h-[104px]"
            >
              <div
                class="flex flex-col h-full justify-between items-start text-start"
              >
                <div class="flex items-center gap-2 mb-1">
                  <SvgIcon name="attendance_days" />
                  <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                    t("profile.attendance.presence_days")
                  }}</span>
                </div>
                <div class="flex items-center gap-1 mt-1">
                  <small class="text-[16px] text-[#6C737F] font-[400]"
                    >{{
                      attendanceSummary?.total_working_days_in_year || "--"
                    }}/</small
                  >
                  <span class="text-[#1F2A37] font-[600] text-[24px]">
                    {{ attendanceSummary?.working_days || "--" }}
                  </span>
                </div>
              </div>
            </Card>
          </SwiperSlide>
          <SwiperSlide>
            <Card
              class="!p-4 !bg-[#F8FBFA] !border !border-[#F1F7F5] h-[104px]"
            >
              <div
                class="flex flex-col h-full justify-between items-start text-start"
              >
                <div class="flex items-center gap-2 mb-1">
                  <SvgIcon name="absence" />
                  <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                    t("profile.attendance.absence_days")
                  }}</span>
                </div>
                <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                  attendanceSummary?.absence_days || "--"
                }}</span>
              </div>
            </Card>
          </SwiperSlide>
          <SwiperSlide>
            <Card
              class="!p-4 !bg-[#F8FBFA] !border !border-[#F1F7F5] h-[104px]"
            >
              <div
                class="flex flex-col h-full justify-between items-start text-start"
              >
                <div class="flex items-center gap-2 mb-1">
                  <SvgIcon name="holidays" />
                  <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                    t("profile.attendance.consumed_leaves")
                  }}</span>
                </div>
                <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                  attendanceSummary?.leave_days || "--"
                }}</span>
              </div>
            </Card>
          </SwiperSlide>
          <SwiperSlide>
            <Card
              class="!p-4 !bg-[#F8FBFA] !border !border-[#F1F7F5] h-[104px]"
            >
              <div
                class="flex flex-col h-full justify-between items-start text-start"
              >
                <div class="flex items-center gap-2 mb-1">
                  <SvgIcon name="profile_icon" />
                  <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                    t("profile.attendance.late_minutes")
                  }}</span>
                </div>
                <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                  attendanceSummary?.total_late_minutes || "--"
                }}</span>
              </div>
            </Card>
          </SwiperSlide>
          <SwiperSlide>
            <Card
              class="!p-4 !bg-[#F8FBFA] !border !border-[#F1F7F5] h-[104px]"
            >
              <div
                class="flex flex-col h-full justify-between items-start text-start"
              >
                <div class="flex items-center gap-2 mb-1">
                  <SvgIcon name="profile_icon" />
                  <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                    t("profile.attendance.positive_balance")
                  }}</span>
                </div>
                <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                  attendanceSummary?.total_positive_balance_hours || "--"
                }}</span>
              </div>
            </Card>
          </SwiperSlide>
        </swiper>
      </div>
    </Card>

    <!-- ==================== LEAVE BALANCE ==================== -->
    <Card>
      <template #header>
        <div v-if="loading" class="skeleton h-[20px] w-[140px] rounded-md" />
        <h2 v-else class="text-[16px] font-[600] text-[#333333]">
          {{ t("profile.leaveBalance.title") }}
        </h2>
      </template>

      <!-- Skeleton: 4 leave cards -->
      <div v-if="loading" class="flex gap-3 overflow-hidden">
        <div
          v-for="i in 4"
          :key="i"
          class="w-[340px] flex-shrink-0 skeleton rounded-xl h-[140px]"
        />
      </div>

      <!-- Real swiper -->
      <swiper
        v-else
        :modules="[Autoplay]"
        :slides-per-view="'auto'"
        :space-between="12"
        :loop="true"
        :autoplay="{
          delay: 2000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }"
        class="statistics-swiper w-full"
        :dir="lang === 'ar' ? 'rtl' : 'ltr'"
        :key="lang"
      >
        <SwiperSlide
          v-for="leave in leaveBalance"
          :key="leave.leave_balance_id"
          class="!w-[90%] sm:!w-[340px]"
        >
          <Card class="!p-5 !bg-[#F8FBFA] !border !border-[#F1F7F5] h-full">
            <div class="flex flex-col h-full justify-between">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <SvgIcon name="calendar" class="text-primary" />
                  <span class="text-[14px] font-[500] text-[#1F2A37]">{{
                    leave.leave_type_name
                  }}</span>
                </div>
              </div>
              <div class="space-y-3">
                <div class="text-[12px] text-[#6C737F]">
                  {{ t("profile.leaveBalance.usage") }}
                </div>
                <div
                  class="w-full h-1.5 rounded-full bg-[#CFDFDB] overflow-hidden"
                >
                  <div
                    class="h-full bg-[#0E5F4A] transition-all duration-500"
                    :style="{
                      width: `${leave.total_days ? Math.min((leave.used_days / leave.total_days) * 100, 100) : 0}%`,
                    }"
                  />
                </div>
                <div class="space-y-2">
                  <div class="flex items-center text-[12px]">
                    <div
                      class="w-[8px] h-[8px] bg-[#0E5F4A] rounded-full me-2"
                    />
                    <span class="text-[#6C737F] w-[110px]">{{
                      t("profile.leaveBalance.remaining")
                    }}</span>
                    <span class="font-[600] text-[#0E5F4A]"
                      >{{ leave.remaining_days }}
                      {{ t("profile.leaveBalance.day") }}</span
                    >
                  </div>
                  <div class="flex items-center text-[12px]">
                    <div
                      class="w-[8px] h-[8px] bg-[#CFDFDB] rounded-full me-2"
                    />
                    <span class="text-[#6C737F] w-[110px]">{{
                      t("profile.leaveBalance.consumed")
                    }}</span>
                    <span class="font-[600] text-[#384250]"
                      >{{ leave.used_days }}
                      {{ t("profile.leaveBalance.day") }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </SwiperSlide>
      </swiper>
    </Card>

    <!-- ==================== BOTTOM ROW ==================== -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- ── Activity Log ── -->
      <Card>
        <template #header>
          <div v-if="loading" class="skeleton h-[20px] w-[160px] rounded-md" />
          <div v-else class="flex justify-between items-center">
            <h2 class="text-[16px] font-[600] text-[#333333]">
              {{ t("profile.activityLog.title") }}
            </h2>
            <router-link
              to="activity-logs"
              class="text-[14px] font-[500] text-[#14573A] hover:underline transition-all duration-200"
            >
              {{ t("profile.activityLog.view_all") }}
            </router-link>
          </div>
        </template>

        <!-- Skeleton timeline -->
        <div v-if="loading" class="flex flex-col gap-[20px]">
          <div v-for="i in 4" :key="i" class="flex items-start gap-[12px]">
            <!-- dot + line -->
            <div
              class="flex flex-col items-center mt-[6px]"
              style="min-height: 56px"
            >
              <div class="skeleton w-3 h-3 rounded-full flex-shrink-0" />
              <div v-if="i !== 4" class="w-px bg-[#E5E7EB] flex-1 mt-1" />
            </div>
            <!-- content -->
            <div class="flex-1 space-y-[8px] pb-2">
              <div class="flex items-center justify-between gap-2">
                <div class="skeleton h-[13px] w-[55%] rounded-md" />
                <div class="skeleton h-[18px] w-[56px] rounded-full" />
              </div>
              <div class="skeleton h-[12px] w-[80%] rounded-md" />
              <div class="skeleton h-[11px] w-[40%] rounded-md" />
            </div>
          </div>
        </div>

        <!-- Real timeline -->
        <div v-else class="flex flex-col gap-[16px]">
          <div
            v-if="!activityLog?.length"
            class="text-center text-gray-400 py-4"
          >
            {{ t("profile.activityLog.empty") }}
          </div>
          <div v-else>
            <div
              v-for="(activity, index) in activityLog?.slice(0, 4)"
              :key="index"
              class="flex items-start gap-[12px] relative mb-[16px]"
            >
              <div class="flex flex-col items-center h-full mt-2 relative">
                <span
                  class="w-3 h-3 rounded-full bg-[#0E5F4A] flex-shrink-0 z-10"
                />
                <div
                  v-if="index != activityLog?.slice(0, 4).length - 1"
                  class="border-l border-dashed border-[#0E5F4A] absolute bottom-[-64px] h-[70px] w-px"
                />
              </div>
              <div class="flex-1">
                <div
                  class="flex flex-wrap items-center justify-between gap-2 mb-[8px]"
                >
                  <span class="text-[14px] font-[600] text-[#1F2A37]">{{
                    activity?.title
                  }}</span>
                  <span
                    class="inline-flex items-center gap-1 text-[11px] font-[500] px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#065F46]"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-[#065F46]" />
                    {{ activity?.status_label }}
                  </span>
                </div>
                <p class="text-[12px] font-[500] text-[#4D5761] mb-[8px]">
                  {{ activity?.description }}
                </p>
                <span
                  class="flex items-end gap-[5px] text-[11px] text-[#9CA3AF] block"
                >
                  <SvgIcon name="clock" class="scale-[0.8]" />
                  <div class="flex gap-2">
                    {{ activity.check_in_time }} || {{ activity?.date }}
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- ── Events ── -->
      <Card class="h-[fit-content]">
        <template #header>
          <div v-if="loading" class="skeleton h-[20px] w-[120px] rounded-md" />
          <h2 v-else class="text-[16px] font-[600] text-[#333333]">
            {{ t("profile.events.title") }}
          </h2>
        </template>

        <!-- Skeleton timeline -->
        <div v-if="loading" class="flex flex-col gap-[20px]">
          <div v-for="i in 4" :key="i" class="flex items-start gap-[12px]">
            <div
              class="flex flex-col items-center mt-[6px]"
              style="min-height: 56px"
            >
              <div class="skeleton w-3 h-3 rounded-full flex-shrink-0" />
              <div v-if="i !== 4" class="w-px bg-[#E5E7EB] flex-1 mt-1" />
            </div>
            <div class="flex-1 space-y-[8px] pb-2">
              <div class="flex items-center justify-between gap-2">
                <div class="skeleton h-[13px] w-[55%] rounded-md" />
                <div class="skeleton h-[18px] w-[56px] rounded-full" />
              </div>
              <div class="skeleton h-[12px] w-[80%] rounded-md" />
              <div class="skeleton h-[11px] w-[40%] rounded-md" />
            </div>
          </div>
        </div>

        <!-- Real timeline -->
        <div v-else class="flex flex-col gap-[20px]">
          <div v-if="!events?.length" class="text-center text-gray-400 py-4">
            {{ t("profile.events.empty") }}
          </div>
          <div v-else>
            <div
              v-for="(event, index) in events"
              :key="index"
              class="flex items-start relative"
            >
              <div
                class="flex flex-col items-center gap-[20px] h-full mt-2 relative"
              >
                <!-- <span
                  class="w-3 h-3 rounded-full bg-[#0E5F4A] flex-shrink-0 z-10"
                /> -->
                <!-- <div
                  v-if="index !== events.length - 1"
                  class="border-l border-dashed border-[#0E5F4A] absolute -bottom-[280%] !h-[45px] w-px"
                /> -->
              </div>
              <div
                :class="[
                  'flex-1',
                  index !== events.length - 1 ? 'mb-[20px]' : '',
                ]"
              >
                <div
                  class="flex flex-wrap items-center justify-between gap-2 mb-0.5"
                >
                  <span class="text-[13px] font-[600] text-[#1F2A37]">{{
                    event?.title
                  }}</span>
                  <!-- <span
                    class="inline-flex items-center gap-1 text-[11px] font-[500] px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#065F46]"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-[#065F46]" />
                    {{ t("profile.events.completed") }}
                  </span> -->
                </div>
                <p class="text-[12px] text-[#6C737F]">
                  {{ event.description }}
                </p>
                <span
                  class="flex items-end gap-[5px] text-[11px] text-[#9CA3AF] mt-0.5 block"
                >
                  <SvgIcon name="clock" class="scale-[0.8]" />
                  <div class="flex gap-2">
                    <!-- {{ event.check_in_time }} || -->
                    {{ event?.date }}
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Selfie Viewer -->
    <SelfieViewer
      v-model="showViewer"
      :image-url="viewerUrl"
      :title="profile?.name"
    />
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Card from "@/components/ui/Card.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import profileService from "@/services/profile";
import { useAppToast } from "@/composables/useAppToast";
import { useRouter } from "vue-router";
import SelfieViewer from "@/components/common/SelfieViewer.vue";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();
const router = useRouter();
// =========> State
const loading = ref(true);
const profile = ref(null);
const attendanceSummary = ref(null);
const leaveBalance = ref(null);
const activityLog = ref([]);
const events = ref([]);

// Viewer state
const showViewer = ref(false);
const viewerUrl = ref("");

const openViewer = (url) => {
  if (!url) return;
  viewerUrl.value = url;
  showViewer.value = true;
};

// =========> Breadcrumb
const breadcrumbItems = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  return [
    { label: t("sidebar.home"), to: `${prefix}/` },
    { label: t("profile.title") },
  ];
});

const selectedImage = ref();

// handle upload file
const handleUploadFile = async (event) => {
  const file = event.target.files[0];

  if (!file) {
    toast.error(t("profile.validation.image.required"));
    return;
  }

  if (!file.type.startsWith("image/")) {
    toast.error(t("profile.validation.image.invalid_type"));
    event.target.value = "";
    return;
  }

  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    toast.error(t("profile.validation.image.max_size"));
    event.target.value = "";
    return;
  }

  // If valid
  selectedImage.value = URL.createObjectURL(file);

  try {
    const formData = new FormData();
    formData.append("image", file);
    const response = await profileService.updateProfile(formData);

    if (response.success) {
      toast.success(response?.message);
    }
  } catch (error) {
    toast.error(error?.errors?.image[0]);
  }
};

// =========> Load
onMounted(async () => {
  try {
    const response = await profileService.getProfile();
    if (response) {
      const data = response?.data;
      profile.value = data?.personal_info;
      attendanceSummary.value = data?.attendance_summary;
      leaveBalance.value = data?.leave_balances;
      activityLog.value = data?.recent_activities;
      events.value = data?.events;
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.skeleton {
  background-color: #f3f4f6;
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    transform: skewX(-20deg) translateX(-150%);
  }
  50% {
    transform: skewX(-20deg) translateX(-60%);
  }
  100% {
    transform: skewX(-20deg) translateX(150%);
  }
}
</style>
