<template>
  <div class="w-full">

    <div
      class="flex gap-2"
      :class="locale == 'ar' ? 'flex-row-reverse' : 'flex-row'"
    >
      
      <Select
        v-model="hours"
        :options="hourOptions"
        :label="locale == 'ar' ? 'label' : label"
        :searchable="false"
        :required="locale == 'ar' ? false : true"
        :placeholder="t('common.hours')"
        :error="error"
        :type="'duration_hours'"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <span class="text-gray-500 mt-9">:</span>

      <Select
        v-model="minutes"
        :options="minuteOptions"
        :label="locale == 'ar' ? label : 'label'"
        :searchable="false"
        :required="locale == 'ar' ? true : false"
        :placeholder="t('common.minutesLabel')"
        :error="error"
        :type="'duration_minutes'"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>

    <!-- <p v-if="error" class="mt-1 text-xs font-medium text-[#B42318]">
      {{ error }}
    </p> -->
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import Select from "@/components/ui/Select.vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const isFocused = ref(false);

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  label: String,
  required: Boolean,
  error: String,
});

const emit = defineEmits(["update:modelValue"]);

const handleFocus = () => {
  isFocused.value = true;
};

const handleBlur = () => {
  isFocused.value = false;
};

const hourOptions = Array.from({ length: 13 }, (_, i) => {
  const val = String(i).padStart(2, "0");
  return { label: val, value: val };
});

const minuteOptions = Array.from({ length: 60 }, (_, i) => {
  const val = String(i).padStart(2, "0");
  return { label: val, value: val };
});

const hours = computed({
  get() {
    const [h] = (props.modelValue || "").split(":");
    return h || "";
  },
  set(val) {
    let mins = minutes.value;
    // If both hour and minute are cleared -> clear the whole value
    if (!val && !mins) {
      emit("update:modelValue", "");
      return;
    }
    // If user selects an hour and minutes are empty, default minutes to "00"
    if (val && !mins) {
      mins = "00";
    }
    emit("update:modelValue", `${val ?? ""}:${mins ?? ""}`);
  },
});

const minutes = computed({
  get() {
    const [, m] = (props.modelValue || "").split(":");
    return m || "";
  },
  set(val) {
    let hrs = hours.value;
    // If both hour and minute are cleared -> clear the whole value
    if (!val && !hrs) {
      emit("update:modelValue", "");
      return;
    }
    // If user selects minutes and hours are empty, default hours to "00"
    if (val && !hrs) {
      hrs = "00";
    }
    emit("update:modelValue", `${hrs ?? ""}:${val ?? ""}`);
  },
});
</script>