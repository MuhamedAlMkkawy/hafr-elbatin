<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-[18px] font-[600] text-[#000000]">
        {{
          isEdit
            ? type === "fixed"
              ? t("workSystems.modals.editFixedTitle")
              : t("workSystems.modals.editShiftTitle")
            : type === "fixed"
              ? t("workSystems.modals.addFixedTitle")
              : t("workSystems.modals.addShiftTitle")
        }}
      </h2>
    </div>
    <Card>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Info Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            v-model="name_ar"
            :label="t('workSystems.fields.nameAr')"
            :placeholder="t('workSystems.fields.nameAr')"
            :error="showError('name_ar')"
            required
          />
          <Input
            v-model="name"
            :label="t('workSystems.fields.nameEn')"
            :placeholder="t('workSystems.fields.nameEn')"
            :error="showError('name')"
            required
          />
        </div>

        <!-- Fixed System Fields -->
        <div v-if="type === 'fixed'" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              v-model="working_days"
              :options="dayOptions"
              :label="t('workSystems.fields.workingDays')"
              multiple
              :error="showError('working_days')"
              required
            />
            <!-- <Select
              v-model="max_daily_permission_minutes"
              :options="permissionOptions"
              :label="t('workSystems.fields.maxDailyPermission')"
              :error="showError('max_daily_permission_minutes')"
              required
            /> -->
            <Input
              v-model="check_in_start"
              type="time"
              :label="t('workSystems.fields.checkInStart')"
              :placeholder="t('workSystems.fields.checkInStart')"
              :error="showError('check_in_start')"
              required
            >
              <template #suffix>
                <SvgIcon
                  name="clock"
                  classes="w-5 h-5 text-gray-400 cursor-pointer"
                  @click="triggerPicker"
                />
              </template>
            </Input>
            <Select
              v-model="positive_balance_duration"
              :options="posBalOptions"
              :label="t('workSystems.fields.positiveBalance')"
              :error="showError('positive_balance_duration')"
              required
            />
            <div class="space-y-1">
              <Input
                v-model="positive_balance_factor"
                type="number"
                :label="t('workSystems.fields.positiveBalanceFactor')"
                :error="showError('positive_balance_factor')"
                required
              >
                <template #suffix>
                  <SvgIcon name="percent" classes="w-5 h-5 text-gray-400" />
                </template>
              </Input>
            </div>
            <DurationPicker
              v-model="flexible_grace_period"
              :label="t('workSystems.fields.flexibleGracePeriod')"
              :error="showError('flexible_grace_period')"
              required
            />
            <DurationPicker
              v-model="daily_working_hours"
              :label="t('workSystems.fields.dailyWorkingHours')"
              :error="showError('daily_working_hours')"
              required
            />
            <Input
              v-model="end_of_work_time"
              type="time"
              :label="t('workSystems.fields.endOfWorkTime')"
              :placeholder="t('workSystems.fields.endOfWorkTime')"
              :error="showError('end_of_work_time')"
              disabled
            >
              <template #suffix>
                <SvgIcon name="clock" classes="w-5 h-5 text-gray-400" />
              </template>
            </Input>
            <Input
              v-model="last_checkout_time"
              type="time"
              :label="t('workSystems.fields.lastCheckoutTime')"
              :placeholder="t('workSystems.fields.lastCheckoutTime')"
              :error="showError('last_checkout_time')"
              class="md:col-span-1"
              required
            >
              <template #suffix>
                <SvgIcon
                  name="clock"
                  classes="w-5 h-5 text-gray-400 cursor-pointer"
                  @click="triggerPicker"
                />
              </template>
            </Input>
          </div>
        </div>

        <!-- Shift System Fields (Morning, Evening, Night) -->
        <div v-else class="space-y-6">
          <div
            v-for="(shift, index) in shifts"
            :key="shift.key"
            class="border border-[#E7EFED] rounded-[8px]"
          >
            <!-- Shift Header/Toggle -->
            <button
              type="button"
              @click="toggleShift(index)"
              class="cursor-pointer w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors rounded-t-[7px]"
            >
              <h3 class="font-bold text-[#161616] flex items-center gap-2">
                {{ getShiftLabel(shift.value.period) }}
              </h3>
              <Icon
                name="chevron-down"
                size="sm"
                class="transition-transform duration-200 text-[#0E5F4A]"
                :class="{ 'rotate-180': expandedShifts[index] }"
              />
            </button>

            <!-- Shift Content -->
            <div v-show="expandedShifts[index]" class="p-6 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  v-model="shift.value.check_in_start"
                  type="time"
                  :label="t('workSystems.fields.checkInStart')"
                  :placeholder="t('workSystems.fields.checkInStart')"
                  :error="showShiftError(index, 'check_in_start')"
                  required
                >
                  <template #suffix>
                    <SvgIcon
                      name="clock"
                      classes="w-5 h-5 text-gray-400 cursor-pointer"
                      @click="triggerPicker"
                    />
                  </template>
                </Input>
                <Select
                  v-model="shift.value.positive_balance_duration"
                  :options="posBalOptions"
                  :label="t('workSystems.fields.positiveBalance')"
                  :error="showShiftError(index, 'positive_balance_duration')"
                  required
                />
                <div class="space-y-1">
                  <Input
                    v-model="shift.value.positive_balance_factor"
                    type="number"
                    :label="t('workSystems.fields.positiveBalanceFactor')"
                    :error="showShiftError(index, 'positive_balance_factor')"
                    required
                  >
                    <template #suffix>
                      <SvgIcon name="percent" classes="w-5 h-5 text-gray-400" />
                    </template>
                  </Input>
                </div>
                <DurationPicker
                  v-model="shift.value.flexible_grace_period"
                  :label="t('workSystems.fields.flexibleGracePeriod')"
                  :error="showShiftError(index, 'flexible_grace_period')"
                  required
                />
                <DurationPicker
                  v-model="shift.value.daily_working_hours"
                  :label="t('workSystems.fields.dailyWorkingHours')"
                  :error="showShiftError(index, 'daily_working_hours')"
                  required
                />
                <Input
                  v-model="shift.value.end_of_work_time"
                  type="time"
                  :label="t('workSystems.fields.endOfWorkTime')"
                  :placeholder="t('workSystems.fields.endOfWorkTime')"
                  :error="showShiftError(index, 'end_of_work_time')"
                  disabled
                >
                  <template #suffix>
                    <SvgIcon name="clock" classes="w-5 h-5 text-gray-400" />
                  </template>
                </Input>
                <Input
                  v-model="shift.value.last_checkout_time"
                  type="time"
                  :label="t('workSystems.fields.lastCheckoutTime')"
                  :placeholder="t('workSystems.fields.lastCheckoutTime')"
                  :error="showShiftError(index, 'last_checkout_time')"
                  required
                >
                  <template #suffix>
                    <SvgIcon
                      name="clock"
                      classes="w-5 h-5 text-gray-400 cursor-pointer"
                      @click="triggerPicker"
                    />
                  </template>
                </Input>
                <!-- <Select
                  v-model="shift.value.max_daily_permission_minutes"
                  :options="permissionOptions"
                  :label="t('workSystems.fields.maxDailyPermission')"
                  :error="
                    showError(`shifts[${index}].max_daily_permission_minutes`)
                  "
                  required
                /> -->
              </div>
            </div>
          </div>
          <div v-if="errors.shifts" class="text-xs text-red-500 text-center">
            {{ errors.shifts }}
          </div>
        </div>
        <!-- Footer Actions -->
        <div class="flex gap-3 justify-end">
          <Button
            @click="$router.back()"
            type="button"
            class="w-32 bg-[#E5E7EB] !text-[#161616] hover:bg-gray-300"
          >
            {{ t("common.cancel") }}
          </Button>
          <Button
            variant="primary"
            :loading="submitting"
            type="submit"
            class="w-32"
          >
            {{ t("common.save") }}
          </Button>
        </div>
      </form>
    </Card>

    <!-- Save & Activate Conflict Modal -->
    <Modal
      v-model="showConflictModal"
      width="md"
      icon="warning"
      border-color="#e6964d"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("workSystems.modals.confirmToggleTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("workSystems.modals.confirmToggleMessage") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button variant="primary" class="w-full" @click="submitFinal(true)">
            {{ t("workSystems.modals.saveAndActivate") }}
          </Button>
          <Button
            variant="secondary"
            class="w-full"
            @click="submitFinal(false)"
          >
            {{ t("workSystems.modals.saveOnly") }}
          </Button>
          <Button
            variant="ghost"
            class="w-full"
            @click="showConflictModal = false"
          >
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAppToast } from "@/composables/useAppToast";
import { useForm, useField, useFieldArray } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Modal from "@/components/ui/Modal.vue";
import DurationPicker from "@/components/ui/DurationPicker.vue";
import Icon from "@/components/ui/Icon.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { workSystemService } from "@/services/workSystems";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useAppToast();

const isEdit = computed(() => !!route.params.id);
const type = ref(route.query.type || "fixed");
const submitting = ref(false);
const showConflictModal = ref(false);
const expandedShifts = ref([true, false, false]);

// Regex for letters, numbers, and spaces
const nameRegex = /^[\p{L}\p{N}\s]+$/u;

// Helper to add minutes to a "HH:mm" time string
const addTime = (timeStr, minutesToAdd) => {
  if (!timeStr) return "";
  const [hours, mins] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
};
// Convert "HH:mm" string to total minutes
const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [hours, mins] = timeStr.split(":").map(Number);
  return hours * 60 + mins;
};
// Convert total minutes (number) to "HH:mm" string
const minutesToTimeString = (mins) => {
  if (mins === null || mins === undefined) return "";
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}`;
};
const calculateEndTime = (start, posBal, flexGrace, workHours) => {
  if (!start) return "";
  const totalMins =
  (posBal || 0) +
  timeToMinutes(flexGrace) +
  timeToMinutes(workHours);
  return addTime(start, totalMins);
};

// Options
const dayOptions = computed(() => [
  { label: `${t("common.days.saturday")}`, value: "saturday" },
  { label: `${t("common.days.sunday")}`, value: "sunday" },
  { label: `${t("common.days.monday")}`, value: "monday" },
  { label: `${t("common.days.tuesday")}`, value: "tuesday" },
  { label: `${t("common.days.wednesday")}`, value: "wednesday" },
  { label: `${t("common.days.thursday")}`, value: "thursday" },
  { label: `${t("common.days.friday")}`, value: "friday" },
]);

// Helper to generate options with locale
const getStatusOptions = (enLabels, arLabels, values) => {
  return values.map((val, i) => ({
    label: locale.value === "ar" ? arLabels[i] : enLabels[i],
    value: val,
  }));
};

const posBalOptions = computed(() =>
  getStatusOptions(
    ["15 minutes", "30 minutes", "45 minutes", "60 minutes"],
    ["15 دقيقة", "30 دقيقة", "45 دقيقة", "60 دقيقة"],
    [15, 30, 45, 60],
  ),
);

const graceOptions = computed(() =>
  getStatusOptions(
    ["30 minutes", "1 Hour", "1:30 Hour", "2 Hour"],
    ["30 دقيقة", "1 ساعة", "1:30 ساعة", "2 ساعة"],
    [30, 60, 90, 120],
  ),
);

const workHoursOptions = computed(() => {
  const options = [];
  for (let h = 4; h <= 9; h += 0.5) {
    const label =
      h === Math.floor(h)
        ? `${h} ${t("common.hours")}`
        : `${Math.floor(h)}:30 ${t("common.hours")}`;
    options.push({ label, value: h });
  }
  return options;
});

const permissionOptions = computed(() => {
  const options = [];
  const labelsEn = [
    "30 minutes",
    "1 Hour",
    "1:30 Hour",
    "2 Hour",
    "2:30 Hour",
    "3 Hour",
    "3:30 Hour",
    "4 Hour",
    "4:30 Hour",
    "5 Hour",
  ];
  const labelsAr = [
    "30 دقيقة",
    "1 ساعة",
    "1:30 ساعة",
    "2 ساعة",
    "2:30 ساعة",
    "3 ساعات",
    "3:30 ساعة",
    "4 ساعات",
    "4:30 ساعة",
    "5 ساعات",
  ];
  const values = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300];
  return getStatusOptions(labelsEn, labelsAr, values);
});

const schema = computed(() => {
  const base = {
    name: yup
      .string()
      .required(t("workSystems.validation.nameEnRequired"))
      .min(2, t("workSystems.validation.nameEnRange"))
      .max(30, t("workSystems.validation.nameEnRange"))
      .matches(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\u2013\u2014]+$/, t("validation.englishOnly")),
    name_ar: yup
      .string()
      .required(t("workSystems.validation.nameArRequired"))
      .min(2, t("workSystems.validation.nameArRange"))
      .max(30, t("workSystems.validation.nameArRange"))
      .matches(/^[\u0600-\u06FF0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\u2013\u2014]+$/, t("validation.arabicOnly")),
     
  };

  if (type.value === "fixed") {
    return toTypedSchema(
      yup.object({
        ...base,
        working_days: yup
          .array()
          .min(1, t("workSystems.validation.workingDaysRequired"))
          .required(t("workSystems.validation.workingDaysRequired")),
        check_in_start: yup
          .string()
          .required(t("workSystems.validation.checkInStartRequired")),
        positive_balance_duration: yup
          .number()
          .transform((value) => (value === "" ? undefined : value))
          .nullable()
          .typeError(t("workSystems.validation.positiveBalanceRequired"))
          .required(t("workSystems.validation.positiveBalanceRequired")),
        positive_balance_factor: yup
          .number()
          .transform((value) => (value === "" ? undefined : value))
          .nullable()
          .typeError(t("workSystems.validation.positiveBalanceFactorRequired"))
          .required(t("workSystems.validation.positiveBalanceFactorRequired"))
          .min(0, t("workSystems.validation.positiveBalanceFactorRange"))
          .max(100, t("workSystems.validation.positiveBalanceFactorRange")),
        flexible_grace_period: yup
          .string()
          .required(t("workSystems.validation.flexibleGracePeriodRequired"))
          .matches(
            /^\d{2}:\d{2}$/,
            t("workSystems.validation.flexibleGracePeriodRequired"),
          ),
        daily_working_hours: yup
          .string()
          .required(t("workSystems.validation.dailyWorkingHoursRequired"))
          .matches(
            /^\d{2}:\d{2}$/,
            t("workSystems.validation.dailyWorkingHoursRequired"),
          ),
        // max_daily_permission_minutes: yup
        //   .number()
        //   .transform((value) => (value === "" ? undefined : value))
        //   .nullable()
        //   .typeError(t("workSystems.validation.maxDailyPermissionRequired"))
        //   .required(t("workSystems.validation.maxDailyPermissionRequired")),
        end_of_work_time: yup.string().nullable(),
        last_checkout_time: yup
          .string()
          .required(t("workSystems.validation.lastCheckoutTimeRequired"))
          .test(
            "last-checkout-after-end",
            t("workSystems.validation.lastCheckoutTimeValidation"),
            function (value) {
              const { end_of_work_time } = this.parent;
              if (!value || !end_of_work_time) return true;
              return value >= end_of_work_time;
            },
          ),
      }),
    );
  } else {
    return toTypedSchema(
      yup.object({
        ...base,
        shifts: yup
          .array()
          .of(
            yup.object({
              period: yup.string().required(),
              check_in_start: yup
                .string()
                .required(t("workSystems.validation.checkInStartRequired")),
              positive_balance_duration: yup
                .number()
                .transform((value) => (value === "" ? undefined : value))
                .nullable()
                .typeError(t("workSystems.validation.positiveBalanceRequired"))
                .required(t("workSystems.validation.positiveBalanceRequired")),
              positive_balance_factor: yup
                .number()
                .transform((value) => (value === "" ? undefined : value))
                .nullable()
                .typeError(
                  t("workSystems.validation.positiveBalanceFactorRequired"),
                )
                .required(
                  t("workSystems.validation.positiveBalanceFactorRequired"),
                )
                .min(0, t("workSystems.validation.positiveBalanceFactorRange"))
                .max(
                  100,
                  t("workSystems.validation.positiveBalanceFactorRange"),
                ),
              flexible_grace_period: yup
                .string()
                .required(
                  t("workSystems.validation.flexibleGracePeriodRequired"),
                )
                .matches(
                  /^\d{2}:\d{2}$/,
                  t("workSystems.validation.flexibleGracePeriodRequired"),
                ),
              daily_working_hours: yup
                .string()
                .required(
                  t("workSystems.validation.dailyWorkingHoursRequired"),
                )
                .matches(
                  /^\d{2}:\d{2}$/,
                  t("workSystems.validation.dailyWorkingHoursRequired"),
                ),
              // max_daily_permission_minutes: yup
              //   .number()
              //   .transform((value) => (value === "" ? undefined : value))
              //   .nullable()
              //   .typeError(
              //     t("workSystems.validation.maxDailyPermissionRequired"),
              //   )
              //   .required(
              //     t("workSystems.validation.maxDailyPermissionRequired"),
              //   ),
              end_of_work_time: yup.string().nullable(),
              last_checkout_time: yup
                .string()
                .required(t("workSystems.validation.lastCheckoutTimeRequired"))
                .test(
                  "last-checkout-after-end",
                  t("workSystems.validation.lastCheckoutTimeValidation"),
                  function (value) {
                    const { end_of_work_time } = this.parent;
                    if (!value || !end_of_work_time) return true;
                    return value >= end_of_work_time;
                  },
                ),
            }),
          )
          .length(3, t("validation.minShifts")),
      }),
    );
  }
});

const initialShifts =
  type.value === "shift"
    ? [
        {
          period: "morning",
          check_in_start: null,
          positive_balance_duration: null,
          positive_balance_factor: null,
          flexible_grace_period: null,
          daily_working_hours: null,
          end_of_work_time: null,
          last_checkout_time: null,
          // max_daily_permission_minutes: null,
        },
        {
          period: "evening",
          check_in_start: null,
          positive_balance_duration: null,
          positive_balance_factor: null,
          flexible_grace_period: null,
          daily_working_hours: null,
          end_of_work_time: null,
          last_checkout_time: "",
          // max_daily_permission_minutes: null,
        },
        {
          period: "night",
          check_in_start: null,
          positive_balance_duration: null,
          positive_balance_factor: null,
          flexible_grace_period: null,
          daily_working_hours: null,
          end_of_work_time: null,
          last_checkout_time: null,
          // max_daily_permission_minutes: null,
        },
      ]
    : [];

const { handleSubmit: validateAndSubmit, errors, values, setValues, setFieldValue, submitCount, meta } = useForm({
  validationSchema: schema,
  validateOnMount: false,
  validateOnBlur: true,
  validateOnChange: true,
  validateOnInput: true, 
  validateOnModelUpdate: true,
  initialValues: {
    name: "",
    name_ar: "",
    type: type.value,
    working_days: [],
    check_in_start: null,
    positive_balance_duration: null,
    positive_balance_factor: null,
    flexible_grace_period: null,
    daily_working_hours: null,
    end_of_work_time: null,
    last_checkout_time: null,
    shifts: initialShifts,
    activate: false,
  },
});

const {
  value: name,
  errorMessage: nameError,
  meta: nameMeta,
} = useField("name");
const {
  value: name_ar,
  errorMessage: nameArError,
  meta: nameArMeta,
} = useField("name_ar");
const { value: working_days } = useField("working_days");

const showError = (field) => {
  const metaField = meta.value?.[field];
  if (!metaField) return errors.value[field] || "";
  return metaField.touched ? errors.value[field] : "";
};
const showShiftError = (index, field) => {
  const key = `shifts[${index}].${field}`;
  const value = values.shifts[index][field];

  if (!errors.value[key]) return "";
  if (submitCount.value > 0) return errors.value[key];

  if (typeof value === "string") {
    return value === "" ? errors.value[key] : "";
  }
  // else if (typeof value === "number") {
  //   return value === null || value === undefined ? errors.value[key] : "";
  // }

  return "";
};
const { value: check_in_start } = useField("check_in_start");
const { value: positive_balance_duration } = useField(
  "positive_balance_duration",
);
const { value: positive_balance_factor } = useField("positive_balance_factor");
const { value: flexible_grace_period } = useField("flexible_grace_period");
const { value: daily_working_hours } = useField("daily_working_hours");
const { value: end_of_work_time } = useField("end_of_work_time");
const { value: last_checkout_time } = useField("last_checkout_time");
// const { value: max_daily_permission_minutes } = useField(
//   "max_daily_permission_minutes",
// );
const { fields: shifts, replace: replaceShifts } = useFieldArray("shifts");

// Automatic Calculation for Fixed
watch(
  () => [
    values.check_in_start,
    values.positive_balance_duration,
    values.flexible_grace_period,
    values.daily_working_hours,
  ],
  ([start, pos, grace, hours]) => {
    if (type.value === "fixed") {
      if (start && pos != null && grace && hours) {
        setFieldValue(
          "end_of_work_time",
          calculateEndTime(start, pos, grace, hours),
        );
      } else {
        setFieldValue("end_of_work_time", null);
      }
    }
  },
);

// Automatic Calculation for Shifts
watch(
  () => values.shifts,
  (newShifts) => {
    if (type.value === "shift" && newShifts) {
      newShifts.forEach((shift, index) => {
        const {
          check_in_start: start,
          positive_balance_duration: pos,
          flexible_grace_period: grace,
          daily_working_hours: hours,
        } = shift;
        if (start && pos != null && grace && hours) {
          const endTime = calculateEndTime(start, pos, grace, hours);
          if (endTime !== shift.end_of_work_time) {
            setFieldValue(`shifts[${index}].end_of_work_time`, endTime);
          }
        } else if (shift.end_of_work_time) {
          setFieldValue(`shifts[${index}].end_of_work_time`, null);
        }
      });
    }
  },
  { deep: true },
);

const triggerPicker = (event) => {
  const input = event.currentTarget
    .closest(".relative")
    ?.querySelector("input");
  if (input && typeof input.showPicker === "function") {
    input.showPicker();
  }
};

const calculateShiftEndTime = (shift) => {
  return calculateEndTime(
    shift.check_in_start,
    shift.positive_balance_duration,
    shift.flexible_grace_period,
    shift.daily_working_hours,
  );
};

const getShiftLabel = (period) => {
  return t(`workSystems.shifts.${period}`);
};

const toggleShift = (index) => {
  expandedShifts.value[index] = !expandedShifts.value[index];
};

const originalData = ref(null);

const handleSubmit = validateAndSubmit(
  async () => {
    if (isEdit.value) {
      // Edit: just save directly with its current active state
      await saveSystem();
    } else {
      // Create: always show modal
      showConflictModal.value = true;
    }
  },
  ({ errors }) => {
    // Auto expand shift if validation failed there
    if (type.value === "shift") {
      Object.keys(errors).forEach((key) => {
        if (key.includes("shifts[")) {
          const index = parseInt(key.match(/\[(\d+)\]/)[1]);
          if (!isNaN(index)) {
            expandedShifts.value[index] = true;
          }
        }
      });
    }
  },
);

const submitFinal = async (activateChoice) => {
  setFieldValue("activate", activateChoice);
  await saveSystem(activateChoice);
  showConflictModal.value = false;
};

const saveSystem = async (activationOverride = null) => {
  submitting.value = true;
  try {
    let data = { ...values };

    // Always send flexible_grace_period and daily_working_hours to API as minutes
    if (type.value === "fixed") {
      data.flexible_grace_period = timeToMinutes(values.flexible_grace_period);
      data.daily_working_hours = timeToMinutes(values.daily_working_hours);
    }
    if (type.value === "shift" && data.shifts) {
      data.shifts = data.shifts.map((shift) => ({
        ...shift,
        flexible_grace_period: timeToMinutes(shift.flexible_grace_period),
        daily_working_hours: timeToMinutes(shift.daily_working_hours),
      }));
    }
    // Prioritize manual override from modal if available
    const shouldActivate =
      activationOverride !== null ? activationOverride : !!values.activate;

    // Type-specific filtering (removing irrelevant fields for the type)
    if (type.value === "fixed") {
      delete data.shifts;
    } else {
      delete data.working_days;
      delete data.check_in_start;
      delete data.end_of_work_time;
      delete data.positive_balance_duration;
      delete data.positive_balance_factor;
      delete data.flexible_grace_period;
      delete data.daily_working_hours;
      delete data.last_checkout_time;
      // delete data.max_daily_permission_minutes;
    }

    if (isEdit.value && originalData.value) {
      const filteredData = {};

      // Basic info
      if (data.name !== originalData.value.name) filteredData.name = data.name;
      if (data.name_ar !== originalData.value.name_ar)
        filteredData.name_ar = data.name_ar;

      // Type specific fields comparison
      if (type.value === "fixed") {
        const fixedFields = [
          "working_days",
          "check_in_start",
          "positive_balance_duration",
          "positive_balance_factor",
          "flexible_grace_period",
          "daily_working_hours",
          "last_checkout_time",
          // "max_daily_permission_minutes",
          "end_of_work_time",
        ];
        fixedFields.forEach((field) => {
          const newVal = data[field];
          const oldVal = originalData.value[field];
          if (Array.isArray(newVal)) {
            if (
              JSON.stringify([...newVal].sort()) !==
              JSON.stringify([...(oldVal || [])].sort())
            ) {
              filteredData[field] = newVal;
            }
          } else if (newVal != oldVal) {
            // Use != for loose comparison (e.g. string vs number from API)
            filteredData[field] = newVal;
          }
        });
      } else {
        // Deep compare shifts
        if (
          JSON.stringify(data.shifts) !==
          JSON.stringify(originalData.value.shifts)
        ) {
          filteredData.shifts = data.shifts;
        }
      }

      // If nothing changed, don't send anything and just redirect back
      if (Object.keys(filteredData).length === 0) {
        toast.info(t("common.noChanges") || "No changes detected");
        router.back();
        return;
      }

      data = filteredData;
    }

    // Always include activate key based on choice
    data.activate = shouldActivate;

    if (isEdit.value) {
      await workSystemService.update(route.params.id, data);
      toast.success(t("workSystems.messages.updated"));
    } else {
      await workSystemService.create(data);
      if (shouldActivate) {
        toast.success(t("workSystems.success.activated"));
      } else {
        toast.success(t("workSystems.success.savedOnly"));
      }
    }
    router.back();
  } catch (error) {
    console.error(error);
    toast.error(error);

    // Auto expand shift if validation failed there
    if (type.value === "shift" && error.response?.data?.errors) {
      const errKeys = Object.keys(error.response.data.errors);
      errKeys.forEach((key) => {
        if (key.includes("shifts[")) {
          const index = parseInt(key.match(/\[(\d+)\]/)[1]);
          expandedShifts.value[index] = true;
        }
      });
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  if (isEdit.value) {
    try {
      const response = await workSystemService.getById(route.params?.id);
      const data = response.data.work_system;
      originalData.value = JSON.parse(JSON.stringify(data));
      type.value = data.type;

      // Map is_active to activate for the form
      let formValues = {
        ...data,
        activate: !!data.is_active,
      };
      // Backend returns flexible_grace_period and daily_working_hours in minutes.
      // Convert them to "HH:mm" strings for the DurationPicker in the form.
      if (data.type === "fixed") {
        formValues = {
          ...formValues,
          flexible_grace_period: minutesToTimeString(
            data.flexible_grace_period,
          ),
          daily_working_hours: minutesToTimeString(data.daily_working_hours),
        };
      } else if (data.type === "shift" && Array.isArray(data.shifts)) {
        formValues = {
          ...formValues,
          shifts: data.shifts.map((shift) => ({
            ...shift,
            flexible_grace_period: minutesToTimeString(
              shift.flexible_grace_period,
            ),
            daily_working_hours: minutesToTimeString(shift.daily_working_hours),
          })),
        };
      }
      setValues(formValues, false);
      if (data.type === "shift") {
        expandedShifts.value = [true, true, true];
      }
    } catch (error) {
      toast.error(error);
    }
  }
});
</script>

<style scoped>
input[type="time"]::-webkit-calendar-picker-indicator {
  display: none !important;
}
</style>
