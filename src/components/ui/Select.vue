<template>
  <div v-if="isVisible" class="select-wrapper" v-click-outside="close">
    <label
      v-if="label"
      :for="selectId"
      class="select-label transition-colors duration-300"
      :class="{
        'text-[#0E5F4A]': (isFocused || isOpen) && !error,
        'text-[#B42318]': error,
        'text-[#161616]': !(isFocused || isOpen) && !error,
        '!invisible': label == 'label',
      }"
    >
      <span v-if="required" class="text-[#B42318]">*</span>
      {{ label }}
    </label>

    <div class="relative group">
      <div
        class="relative overflow-hidden"
        :class="[
          { 'trigger-focused': (isOpen || isFocused) && !disabled },
          phoneField ? 'rounded-l-sm' : 'rounded-sm',
        ]"
      >
        <!-- Select Trigger -->
        <div
          ref="triggerRef"
          :id="selectId"
          tabindex="0"
          class="w-full flex items-center gap-2 bg-[#F3F4F6] text-[#161616] px-4 py-2 cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-b-3 focus:outline-none"
          :class="[
            (isOpen || isFocused) && !disabled
              ? error
                ? 'bg-white border border-[#B42318] shadow-sm'
                : 'bg-white border border-[#0D121C] shadow-sm'
              : error
                ? 'border border-[#B42318]/30'
                : 'border-transparent',
            disabled ? '!cursor-not-allowed' : 'cursor-pointer',
          ]"
          @click="toggleDropdown"
          @focus="handleFocus"
          @blur="handleBlur"
        >
          <!-- Prefix Slot -->
          <div v-if="$slots.prefix" class="flex items-center">
            <slot name="prefix" />
          </div>

          <!-- Suffix Slot -->
          <div v-if="$slots.suffix" class="flex items-center">
            <slot name="suffix" />
          </div>

          <div class="flex-1 flex flex-wrap gap-1.5 overflow-hidden">
            <!-- Multi-select tags -->
            <template
              v-if="multiple && Array.isArray(modelValue) && modelValue.length"
            >
              <div
                v-for="val in modelValue"
                :key="val"
                class="flex items-center gap-1 bg-[#0E5F4A] text-white text-xs px-2 py-0.5 rounded-sm"
                @click.stop
              >
                <span>{{ getLabelFromValue(val) }}</span>
                <button
                  type="button"
                  class="hover:text-red-200"
                  @click="removeValue(val)"
                  v-if="!disabled"
                >
                  <Icon name="x-mark" size="xs" />
                </button>
              </div>
            </template>

            <!-- Single select label -->
            <span
              v-else-if="!multiple && modelValue"
              class="text-base"
              :dir="phoneField ? 'ltr' : ''"
            >
              <span
                v-if="
                  !type ||
                  (type == 'duration_hours' &&
                    modelValue != 1 &&
                    modelValue != 2) ||
                  type == 'duration_minutes'
                "
                >{{ getLabelFromValue(modelValue) }}</span
              >
              {{
                type == "duration_minutes"
                  ? modelValue > 10
                    ? t("common.minutes")
                    : t("common.minutesLabel")
                  : type == "duration_hours"
                    ? modelValue == 1
                      ? t("common.oneHour")
                      : modelValue == 2
                        ? t("common.twoHours")
                        : t("common.hours")
                    : ""
              }}
            </span>

            <!-- Placeholder -->
            <span v-else class="text-[#6C737F] text-base select-none" dir="ltr">
              {{ placeholder || t("common.select") }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Clearable button -->
            <button
              v-if="clearable && hasValue && !disabled"
              type="button"
              class="text-gray-400 hover:text-[#B42318] transition-colors cursor-pointer"
              @click.stop="clearValue"
            >
              <Icon name="x-mark" size="sm" />
            </button>

            <Icon
              name="chevron-down"
              size="sm"
              class="transition-transform duration-200 !text-[#0E5F4A]"
              :class="{ 'rotate-180': isOpen }"
            />
          </div>
        </div>

        <div
          class="focus-line"
          :class="{
            'bg-[#B42318]': error,
            'bg-[#0D121C]': !error,
            'w-full': (isOpen || isFocused) && !disabled,
          }"
        ></div>
      </div>

      <!-- Dropdown Menu -->
      <Teleport to="body" :disabled="!teleport">
        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div
            v-if="isOpen"
            class="bg-white rounded-sm shadow-xl border border-gray-100 py-1"
            :class="[
              teleport ? 'fixed' : 'absolute top-full left-0 w-full mt-1',
              insideTable && !isInsideModal ? 'z-[55]' : 'z-[2000]',
            ]"
            :style="teleport ? dropdownStyle : {}"
            @click.stop
          >
          <!-- Search Input -->
          <div
            v-if="searchable"
            class="px-4 py-3 border-b border-gray-100 top-0 bg-white z-20"
          >
            <div class="relative group">
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                class="w-full bg-[#F3F4F6] border-none rounded-[4px] ps-4 pe-10 py-2.5 text-base placeholder:text-[#4D5761] placeholder:text-[16px] outline-none transition-all duration-200"
                :class="lang == 'ar' ? 'text-right' : 'text-left'"
                :placeholder="t('common.search')"
                @click.stop
              />
              <SvgIcon
                name="search_ddl"
                classes="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>

          <!-- Options List -->
          <div
            class="max-h-[200px] overflow-y-auto custom-scrollbar"
            :dir="phoneField ? 'ltr' : ''"
          >
            <template v-if="filteredOptions && filteredOptions.length">
              <!-- Select All -->
              <div
                v-if="
                  multiple &&
                  props.options &&
                  props.options.length &&
                  showSelectAll
                "
                class="px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-3 border-b border-gray-200 transition-colors"
                @click.stop="toggleSelectAll"
              >
                <div
                  class="w-5 h-5 rounded-[4px] border flex items-center justify-center transition-all duration-200"
                  :class="
                    isAllSelected
                      ? 'bg-[#0E5F4A] border-[#0E5F4A]'
                      : 'bg-white border-gray-300'
                  "
                >
                  <svg
                    v-if="isAllSelected"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-3 h-3 text-white"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span
                  class="font-bold text-[#161616] flex-1"
                  :class="lang == 'ar' ? 'text-right' : 'text-left'"
                >
                  {{ t("roles.statusOptions.all") }}
                </span>
              </div>

              <!-- Options -->
              <div
                v-for="(option, index) in filteredOptions"
                :key="getOptionValue(option)"
                class="px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                :class="{
                  'bg-gray-50/50': isSelected(getOptionValue(option)),
                  'border-b border-gray-200':
                    index !== filteredOptions.length - 1,
                }"
                @click.stop="selectOption(option)"
              >
                <!-- Multiple Selection Checkbox (Start) -->
                <div
                  v-if="multiple"
                  class="w-5 h-5 flex items-center justify-center transition-all duration-200 rounded-[4px] border shrink-0"
                  :class="[
                    isSelected(getOptionValue(option))
                      ? 'bg-[#0E5F4A] border-[#0E5F4A]'
                      : 'bg-white border-gray-300',
                  ]"
                >
                  <svg
                    v-if="isSelected(getOptionValue(option))"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-3 h-3 text-white"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>

                <!-- Option Text -->
                <span
                  class="flex-1 text-[#161616]"
                  :class="[
                    isSelected(getOptionValue(option))
                      ? 'font-medium'
                      : 'text-[#161616]',
                    lang == 'ar' ? 'text-right' : 'text-left',
                  ]"
                >
                  <span
                    v-if="
                      !type ||
                      (type == 'duration_hours' &&
                        option.value != 1 &&
                        option.value != 2) ||
                      type == 'duration_minutes'
                    "
                    >{{ getOptionLabel(option) }}</span
                  >
                  {{
                    type == "duration_minutes"
                      ? option.value > 10
                        ? t("common.minutes")
                        : t("common.minutesLabel")
                      : type == "duration_hours"
                        ? option.value == 1
                          ? t("common.oneHour")
                          : option.value == 2
                            ? t("common.twoHours")
                            : t("common.hours")
                        : ""
                  }}
                </span>

                <!-- Single Selection Checkmark (End) -->
                <div
                  v-if="!multiple && isSelected(getOptionValue(option))"
                  class="flex items-center justify-center shrink-0"
                >
                  <SvgIcon name="select_check" />
                </div>
              </div>
            </template>
            <div v-else class="px-4 py-6 text-center text-sm text-gray-400">
              {{ t("common.noResults") }}
            </div>
          </div>
        </div>
      </transition>
      </Teleport>
    </div>

    <p
      v-if="error"
      class="select-error"
      :class="label == 'label' ? '!invisible' : ''"
    >
      {{ error }}
    </p>
    <p v-if="hint && !error" class="select-hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import Icon from "./Icon.vue";
import { useAuthStore } from "@/stores/auth";
import SvgIcon from "./SvgIcon.vue";
import { bus } from "@/utils/eventBus";
const authStore = useAuthStore();
const { t, locale } = useI18n();
const lang = computed(() => locale.value);

const props = defineProps({
  visibilityType: {
    type: String,
    validator: (val) => ["employees", "branches", "all", "none"].includes(val),
    default: "none",
  },
  modelValue: {
    type: [String, Number, Array],
    default: "",
  },
  options: {
    type: Array,
    required: true,
  },
  placeholder: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
  error: {
    type: String,
    default: "",
  },
  hint: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  searchable: {
    type: Boolean,
    default: true,
  },
  optionValue: {
    type: String,
    default: "value",
  },
  optionLabel: {
    type: String,
    default: "label",
  },
  phoneField: {
    type: Boolean,
    default: false,
  },
  type: {
    type: [String, Boolean],
    default: false,
  },
  insideTable: {
    type: Boolean,
    default: false,
  },
  showSelectAll: {
    type: Boolean,
    default: true,
  },
  teleport: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "change", "blur", "focus"]);

const isOpen = ref(false);
const isFocused = ref(false);
const searchQuery = ref("");
const searchInput = ref(null);
const selectId = computed(
  () => `select-${Math.random().toString(36).substr(2, 9)}`,
);

const triggerRef = ref(null);
const dropdownStyle = ref({});
const isInsideModal = ref(false);

onMounted(() => {
  bus.on("close-all-selects", close);
  // Check if we are inside a modal
  if (triggerRef.value) {
    isInsideModal.value = !!triggerRef.value.closest(".modal-body");
  }
});
const updateDropdownPosition = () => {
  if (!props.teleport) return; // Only calculate if teleporting

  if (triggerRef.value && isOpen.value) {
    const rect = triggerRef.value.getBoundingClientRect();

    // 1. Check if trigger is scrolled out of viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      close();
      return;
    }

    // 2. Check if trigger is obscured by its scroll container (e.g. sticky header)
    // Find the nearest parent that might clip it
    let parent = triggerRef.value.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (
        (style.overflow !== "visible" && style.overflowY !== "visible") ||
        style.position === "sticky"
      ) {
        const parentRect = parent.getBoundingClientRect();
        // If the trigger's top is scrolled past the parent's top (accounting for sticky headers)
        // Or if the trigger's bottom is scrolled past the parent's bottom
        if (rect.top < parentRect.top - 2 || rect.bottom > parentRect.bottom + 2) {
          close();
          return;
        }
        // If we found a scrolling container, we don't need to check further ancestors for this specific logic
        if (style.overflow !== "visible") break;
      }
      parent = parent.parentElement;
    }

    const top = rect.bottom + 4;
    const transform = "none";


    dropdownStyle.value = {
      top: `${top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      transform: transform,
    };
  }
};

watch(isOpen, (newVal) => {
  if (newVal) {
    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
  } else {
    window.removeEventListener("scroll", updateDropdownPosition, true);
    window.removeEventListener("resize", updateDropdownPosition);
  }
});

const isAllSelected = computed(() => {
  if (!props.multiple || !props.options || !props.options.length) return false;
  const currentVal = Array.isArray(props.modelValue) ? props.modelValue : [];
  return props.options?.every((opt) =>
    currentVal.includes(getOptionValue(opt)),
  );
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    emit("update:modelValue", []);
    emit("change", []);
  } else {
    const allVals = (props.options || []).map((opt) => getOptionValue(opt));
    emit("update:modelValue", allVals);
    emit("change", allVals);
  }
};

const isVisible = computed(() => {
  if (props.visibilityType === "all") return true;
  if (authStore.isAdmin || authStore.isHr) return true;

  // Use explicit visibilityType if provided
  if (props.visibilityType === "employees" && authStore.isEmployee)
    return false;
  if (props.visibilityType === "branches" && authStore.isManager) return false;

  // Heuristic based on placeholder or label
  const searchStr = (
    props.placeholder +
    " " +
    (props.label || "")
  ).toLowerCase();

  if (authStore.isEmployee) {
    // Hide ddl employees for regular employees
    if (
      searchStr.includes("employee") ||
      searchStr.includes("موظف") ||
      searchStr.includes("user")
    )
      return false;
  }

  if (authStore.isManager) {
    // Hide ddl branches for managers (they only see their branch)
    if (
      searchStr.includes("branch") ||
      searchStr.includes("فرع") ||
      searchStr.includes("جهة")
    )
      return false;
  }

  return true;
});

// Auto-fill logic removed as it causes issues with filters and redundant state changes
// Visibility check still remains for UI purposes

const handleFocus = (event) => {
  isFocused.value = true;
  emit("focus", event);
};

const handleBlur = (event) => {
  isFocused.value = false;
  emit("blur", event);
};

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value && props.searchable) {
    nextTick(() => searchInput.value?.focus());
  }
};

const close = () => {
  isOpen.value = false;
  searchQuery.value = "";
};

const getOptionValue = (option) => {
  return typeof option === "object" ? option[props.optionValue] : option;
};

const getOptionLabel = (option) => {
  return typeof option === "object" ? option[props.optionLabel] : option;
};

const getLabelFromValue = (value) => {
  const option = props.options?.find((opt) => getOptionValue(opt) === value);
  return option ? getOptionLabel(option) : value;
};

const filteredOptions = computed(() => {
  if (!props.options) return [];
  if (!searchQuery.value) return props.options;
  return props.options.filter((opt) =>
    (getOptionLabel(opt) || "")
      .toString()
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase()),
  );
});

const isSelected = (value) => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.includes(value);
  }
  return props.modelValue === value;
};

const selectOption = (option) => {
  const val = getOptionValue(option);

  if (props.multiple) {
    const current = Array.isArray(props.modelValue)
      ? [...props.modelValue]
      : [];
    const index = current.indexOf(val);

    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(val);
    }

    emit("update:modelValue", current);
    emit("change", current);
  } else {
    // Single select: Toggle value if clicking the same one, else set new value
    const newValue = props.modelValue === val ? "" : val;
    emit("update:modelValue", newValue);
    emit("change", newValue);
    close();
  }
};

const removeValue = (val) => {
  if (!props.multiple) return;
  const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
  const index = current.indexOf(val);
  if (index > -1) {
    current.splice(index, 1);
    emit("update:modelValue", current);
    emit("change", current);
  }
};

const hasValue = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.length > 0;
  }
  return props.modelValue !== null && props.modelValue !== "";
});

const clearValue = () => {
  const defaultValue = props.multiple ? [] : "";
  emit("update:modelValue", defaultValue);
  emit("change", defaultValue);
};

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener("click", el.clickOutsideEvent);
  },
};

onUnmounted(() => {
  bus.off("close-all-selects", close);
  window.removeEventListener("scroll", updateDropdownPosition, true);
  window.removeEventListener("resize", updateDropdownPosition);
});
</script>

<style scoped>
@reference {
  @import "tailwindcss";
}

.select-wrapper {
  @apply w-full;
}

.select-label {
  @apply block text-sm font-medium text-[#161616] mb-1.5;
}

.select-error {
  @apply mt-1 text-xs font-medium text-[#B42318];
}

.select-hint {
  @apply mt-1 text-xs text-gray-400;
}

.focus-line {
  @apply absolute bottom-0 left-1/2 h-[3px] w-0 transition-all duration-300 ease-out -translate-x-1/2 pointer-events-none;
}

.trigger-focused .focus-line {
  @apply w-full;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
