<template>
  <Modal
    :model-value="modelValue"
    :title="t('locations.modals.viewTitle')"
    width="xl"
    @update:model-value="close"
  >
    <div v-if="locationData" class="space-y-6 py-4 px-2">
      <!-- Agency & Location -->
      <div class="space-y-4">
        <!-- Agency Name -->
        <div class="flex items-start">
          <span
            class="text-[12px] font-[500] text-[#6C737F] order-1 w-[130px]"
            >{{ t("locations.fields.agencyName") }}</span
          >
          <span class="text-[16px] font-[600] text-[#384250] order-2">{{
            agencyName
          }}</span>
        </div>

        <!-- Location Address -->
        <div class="flex items-start">
          <span
            class="text-[12px] font-[500] text-[#6C737F] order-1 w-[130px]"
            >{{ t("locations.fields.location") }}</span
          >
          <span
            class="text-[16px] font-[600] text-[#384250] max-w-[70%] leading-relaxed order-2"
          >
            {{ locationAddress || "-" }}
          </span>
        </div>
      </div>

      <!-- Map Display -->
      <div class="relative w-full h-[220px] bg-gray-50 overflow-hidden">
        <div ref="mapContainer" class="w-full h-full"></div>
        <div
          v-if="!addressLoaded"
          class="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-[2px]"
        >
          <Icon
            name="arrowPath"
            size="lg"
            class="animate-spin text-[#0E5F4A]"
          />
        </div>
      </div>

      <!-- Details Grid -->
      <div
        class="grid grid-cols-2 gap-x-12 gap-y-6 pt-2 border-t border-gray-100/50"
      >
        <!-- Longitude -->
        <div class="flex items-center">
          <span
            class="text-[12px] font-medium text-[#6C737F] order-1 w-[130px]"
            >{{ t("locations.fields.longitude") }}</span
          >
          <p class="text-[16px] font-[600] text-[#384250] order-2">
            {{ locationData.longitude }}
          </p>
        </div>
        <!-- Latitude -->
        <div class="flex items-center">
          <span
            class="text-[12px] font-medium text-[#6C737F] order-1 w-[130px]"
            >{{ t("locations.fields.latitude") }}</span
          >
          <p class="text-[16px] font-[600] text-[#384250] order-2">
            {{ locationData.latitude }}
          </p>
        </div>
        <!-- Radius -->
        <div class="flex items-center">
          <span
            class="text-[12px] font-medium text-[#6C737F] order-1 w-[130px]"
            >{{ t("locations.fields.radius") }}</span
          >
          <p class="text-[16px] font-[600] text-[#384250] order-2 shrink-0">
            {{ locationData.allowed_radius }}
            {{ t("locations.placeholders.radius") }}
          </p>
        </div>
        <!-- Status -->
        <div class="flex items-center">
          <span
            class="text-[12px] font-medium text-[#6C737F] order-1 w-[130px]"
            >{{ t("locations.fields.status") }}</span
          >
          <div
            class="flex items-center gap-2 py-1 px-3 rounded-full order-2"
            :class="!locationData.is_active ? 'bg-[#E5E7EB]' : 'bg-[#ECFDF3]'"
          >
            <span
              class="w-[10px] h-[10px] rounded-full"
              :class="!locationData.is_active ? 'bg-[#4D5761]' : 'bg-[#085D3A]'"
            ></span>
            <span
              class="text-[14px] font-[500]"
              :class="
                !locationData.is_active ? 'text-[#1F2A37]' : 'text-[#085D3A]'
              "
            >
              {{
                locationData.is_active
                  ? t("roles.statusOptions.active")
                  : t("roles.statusOptions.inactive")
              }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <Button variant="secondary" size="md" @click="close">
          {{ t("common.cancel") }}
        </Button>
        <Button variant="primary" size="md" @click="handleEdit">
          {{ t("common.edit") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import Icon from "@/components/ui/Icon.vue";

const props = defineProps({
  modelValue: Boolean,
  locationData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "edit"]);

const { t, locale } = useI18n();
const lang = computed(() => locale.value);

const mapContainer = ref(null);
const locationAddress = ref("");
const addressLoaded = ref(false);
let map = null;
let marker = null;

const agencyName = computed(() => {
  if (!props.locationData?.organizational_unit) return "-";
  return lang.value === "ar"
    ? props.locationData.organizational_unit.name_ar
    : props.locationData.organizational_unit.name_en;
});

const close = () => {
  emit("update:modelValue", false);
};

const handleEdit = () => {
  emit("edit", props.locationData);
};

const initMap = async () => {
  if (!props.locationData || !mapContainer.value) return;
  await nextTick();

  const lat = Number(props.locationData.latitude);
  const lng = Number(props.locationData.longitude);

  if (isNaN(lat) || isNaN(lng)) {
    addressLoaded.value = true;
    return;
  }

  const center = { lat, lng };

  loadGoogleMapsAPI(() => {
    try {
      if (!mapContainer.value) return;
      map = new google.maps.Map(mapContainer.value, {
        center: center,
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        styles: [
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6C737F" }],
          },
        ],
      });

      marker = new google.maps.Marker({
        position: center,
        map: map,
        draggable: false, // Ensure marker is fixed
      });

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: center }, (results, status) => {
        if (status === "OK" && results[0]) {
          locationAddress.value = results[0].formatted_address;
        }
        addressLoaded.value = true;
      });
    } catch (error) {
      console.error("Error initializing map in details view:", error);
      addressLoaded.value = true;
    }
  });
};

const loadGoogleMapsAPI = (callback) => {
  const existingScript = document.getElementById("google-maps-script");
  const scriptLang = existingScript?.getAttribute("data-lang");

  if (existingScript && scriptLang === lang.value) {
    if (typeof google !== "undefined") {
      callback();
    } else {
      existingScript.addEventListener("load", callback);
    }
    return;
  }

  // Remove existing script if language changed
  if (existingScript) {
    existingScript.remove();
    // Also remove the google object to force reload with new language
    if (window.google) {
      delete window.google;
    }
  }

  const script = document.createElement("script");
  script.id = "google-maps-script";
  script.setAttribute("data-lang", lang.value);
  const key = "AIzaSyAsgESd2pD2rr95HjtTw8jp6zF7yyo-pKg";
  script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=${lang.value}&region=SA`;
  script.async = true;
  script.defer = true;
  script.onload = callback;
  script.onerror = () => {
    addressLoaded.value = true;
    console.error("Google Maps API failed to load");
  };
  document.head.appendChild(script);
};

watch(lang, async (newLang, oldLang) => {
  if (props.modelValue && newLang !== oldLang) {
    addressLoaded.value = false;
    if (mapContainer.value) {
      mapContainer.value.innerHTML = "";
    }
    await nextTick();
    initMap();
  }
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        initMap();
      });
    } else {
      // Clean up or reset if needed
      locationAddress.value = "";
      addressLoaded.value = false;
    }
  },
);
</script>

<style scoped>
/* Optional: Add custom styles to match the premium requirement */
:deep(.modal-container) {
  border-radius: 20px;
}
</style>
