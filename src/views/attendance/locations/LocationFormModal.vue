<template>
  <Modal
    :model-value="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    width="xl"
    :title="modalTitle"
  >
    <div class="space-y-4 py-4">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Organizational Unit -->
        <div>
          <Select
            v-model="organizational_unit_id"
            :label="t('locations.placeholders.searchAgency')"
            :placeholder="t('locations.placeholders.enterAgency')"
            :options="organizationalUnitOptions"
            :disabled="mode === 'view' || organizationalUnitsLoading"
            :error="errors.organizational_unit_id"
            required
            searchable
            clearable
          >
            <template #prefix>
              <SvgIcon name="dark_search" />
            </template>
          </Select>
        </div>

        <!-- Map Selection -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-[#161616]">
            <span class="text-[#B42318]">*</span>
            {{ t("locations.fields.locationOnMap") }}
          </label>
          <div v-if="mode !== 'view'" class="relative mb-2">
            <Input
              :key="lang"
              v-model="mapSearch"
              id="map-search-input"
              :placeholder="t('locations.placeholders.searchLocation')"
            >
              <template #suffix>
                <button
                  type="button"
                  class="inline-flex items-center justify-center"
                  @click="handleMapSearch"
                >
                  <SvgIcon name="dark_search" />
                </button>
              </template>
            </Input>
          </div>

          <div class="w-full h-64 bg-gray-100 overflow-hidden relative mt-4">
            <div :key="lang" ref="mapContainer" class="w-full h-full"></div>
            <!-- Map placeholder (must NOT be inside the Google-owned node) -->
            <div
              v-if="!mapLoaded"
              class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm"
            >
              {{ loadingMap ? t("common.loading") : "Google Maps loading..." }}
            </div>
          </div>
          <p
            v-if="errors.latitude || errors.longitude"
            class="text-xs text-[#B42318]"
          >
            {{ t("locations.validation.mapRequired") }}
          </p>
        </div>

        <!-- Latitude & Longitude -->
        <div class="grid grid-cols-1 gap-4">
          <Input
            v-model="latitude"
            type="number"
            step="any"
            :label="t('locations.fields.latitude')"
            :placeholder="t('locations.fields.latitude')"
            :disabled="mode === 'view'"
            required
            :error="errors.latitude"
          />
          <Input
            v-model="longitude"
            type="number"
            step="any"
            :label="t('locations.fields.longitude')"
            :placeholder="t('locations.fields.longitude')"
            :disabled="mode === 'view'"
            required
            :error="errors.longitude"
          />
        </div>

        <!-- Allowed Radius -->
        <div class="space-y-2">
          <Input
            v-model="allowed_radius"
            type="number"
            min="1"
            :label="t('locations.fields.radius')"
            :placeholder="t('locations.placeholders.radius')"
            :error="errors.allowed_radius"
            :disabled="mode === 'view'"
            required
          />
          <div class="flex items-center gap-2 mt-3">
            <SvgIcon name="dark_info" />
            <p class="text-[12px] text-[#384250] font-[500]">
              {{ t("locations.messages.radiusHint") }}
            </p>
          </div>
        </div>
      </form>
    </div>
    <template #footer>
      <!-- Footer Actions -->
      <div v-if="mode !== 'view'" class="flex gap-3 justify-end">
        <Button
          @click="$emit('update:modelValue', false)"
          type="button"
          variant="secondary"
          class="w-32"
        >
          {{ t("common.cancel") }}
        </Button>
        <Button
          variant="primary"
          :loading="submitting"
          type="submit"
          class="w-32"
          @click="handleSubmit"
        >
          {{ t("common.save") }}
        </Button>
      </div>
      <div v-else class="flex gap-3 justify-end pt-4 border-t border-gray-100">
        <Button
          variant="primary"
          class="w-32"
          @click="$emit('update:modelValue', false)"
        >
          {{ t("common.ok") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Icon from "@/components/ui/Icon.vue";
import { useAppToast } from "@/composables/useAppToast";
import { attendanceLocationService } from "@/services/attendanceLocations";
import SvgIcon from "@/components/ui/SvgIcon.vue";

const props = defineProps({
  modelValue: Boolean,
  mode: {
    type: String,
    default: "add", // add, edit, view
  },
  locationData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "saved"]);

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();

const submitting = ref(false);
const mapContainer = ref(null);
const mapSearch = ref("");
const mapLoaded = ref(false);
const loadingMap = ref(false);
const organizationalUnits = ref([]);
const organizationalUnitsLoading = ref(false);
const updatingFromMap = ref(false);
const locationNameAr = ref("");
const locationNameEn = ref("");
const locationName = ref("");

let map = null;
let marker = null;
let autocomplete = null;

const modalTitle = computed(() => {
  if (props.mode === "add") return t("locations.modals.addTitle");
  if (props.mode === "edit") return t("locations.modals.editTitle");
  return t("locations.modals.viewTitle");
});

const schema = toTypedSchema(
  yup.object({
    organizational_unit_id: yup
      .number()
      .nullable()
      .transform((value, originalValue) =>
        originalValue === "" || originalValue === null || isNaN(value)
          ? null
          : value,
      )
      .required(t("locations.validation.agencyRequired")),
    allowed_radius: yup
      .number()
      .nullable()
      .transform((value, originalValue) =>
        originalValue === "" || originalValue === null || isNaN(value)
          ? null
          : value,
      )
      .required(t("locations.validation.radiusRequired"))
      .min(1, t("locations.validation.radiusMin")),
    latitude: yup
      .number()
      .nullable()
      .transform((value, originalValue) =>
        originalValue === "" || originalValue === null || isNaN(value)
          ? null
          : value,
      )
      .required(t("locations.validation.mapRequired")),
    longitude: yup
      .number()
      .nullable()
      .transform((value, originalValue) =>
        originalValue === "" || originalValue === null || isNaN(value)
          ? null
          : value,
      )
      .required(t("locations.validation.mapRequired")),
  }),
);

const {
  handleSubmit: validateAndSubmit,
  errors,
  setValues,
  resetForm,
} = useForm({
  validationSchema: schema,
  validateOnModelUpdate: true,
  initialValues: {
    organizational_unit_id: "",
    allowed_radius: null,
    latitude: "",
    longitude: "",
  },
});

const { value: organizational_unit_id } = useField("organizational_unit_id");
const { value: allowed_radius } = useField("allowed_radius");
const { value: latitude } = useField("latitude");
const { value: longitude } = useField("longitude");

const organizationalUnitOptions = computed(() => {
  return organizationalUnits.value?.map((u) => {
    const level = Number(u.level ?? 0);
    const nameLabel = lang.value === "ar" ? u.name_ar : u.name_en;
    const indent = level > 0 ? "".repeat(level) : "";
    return {
      label: `${indent}${nameLabel}`,
      value: u.id,
    };
  });
});

const fetchOrganizationalUnits = async () => {
  if (organizationalUnitsLoading.value) return;
  organizationalUnitsLoading.value = true;
  try {
    const response = await attendanceLocationService.listOrganizationalUnits({
      paginate: false,
    });
    organizationalUnits.value = response?.data?.organizational_units ?? [];
  } catch (error) {
    console.error("Failed to fetch organizational units", error);
    organizationalUnits.value = [];
  } finally {
    organizationalUnitsLoading.value = false;
  }
};

// Reset form when modal opens
watch(
  () => props.modelValue,
  async (newVal) => {
    if (newVal) {
      fetchOrganizationalUnits();
      mapLoaded.value = false;
      loadingMap.value = false; // Reset loading state when opening

      const data = props.locationData;

      if (props.mode === "add") {
        resetForm({
          values: {
            organizational_unit_id: "",
            allowed_radius: null,
            latitude: "",
            longitude: "",
          },
        });
        mapSearch.value = "";
        locationNameAr.value = "";
        locationNameEn.value = "";
        locationName.value = "";

        await nextTick();
        initMap();
      } else if (data) {
        locationNameAr.value = data.name_ar || "";
        locationNameEn.value = data.name || "";
        locationName.value = lang.value === "ar" ? data.name_ar : data.name;
        mapSearch.value = locationName.value;

        setValues({
          organizational_unit_id: data.organizational_unit_id,
          allowed_radius: data.allowed_radius,
          latitude: data.latitude,
          longitude: data.longitude,
        });

        await nextTick();
        initMap(data.latitude, data.longitude);
      }
    } else {
      // Reset when closing
      mapSearch.value = "";
      locationNameAr.value = "";
      locationNameEn.value = "";
      locationName.value = "";
      map = null;
      marker = null;
      autocomplete = null;
      resetForm();
    }
  },
);

const DEFAULT_CENTER = { lat: 28.4344, lng: 45.9636 };

const normalizeCenter = (lat, lng) => {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  return {
    lat: Number.isFinite(latNum) ? latNum : DEFAULT_CENTER.lat,
    lng: Number.isFinite(lngNum) ? lngNum : DEFAULT_CENTER.lng,
  };
};

const initMap = async (lat = DEFAULT_CENTER.lat, lng = DEFAULT_CENTER.lng) => {
  await nextTick();
  loadGoogleMapsAPI(() => {
    const center = normalizeCenter(lat, lng);
    createMap(center.lat, center.lng);
  });
};

const loadGoogleMapsAPI = (callback) => {
  if (loadingMap.value) return;

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

  loadingMap.value = true;
  const script = document.createElement("script");
  script.id = "google-maps-script";
  script.setAttribute("data-lang", lang.value);
  const key = "AIzaSyAsgESd2pD2rr95HjtTw8jp6zF7yyo-pKg";
  script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=${lang.value}&region=SA`;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    loadingMap.value = false;
    callback();
  };
  script.onerror = () => {
    loadingMap.value = false;
    console.error("Google Maps API failed to load");
  };
  document.head.appendChild(script);
};

const createMap = (lat, lng) => {
  if (!mapContainer.value) return;

  const center = { lat: Number(lat), lng: Number(lng) };

  map = new google.maps.Map(mapContainer.value, {
    center: center,
    zoom: 15,
    disableDefaultUI: false,
    gestureHandling: "greedy",
  });

  const hasCoordinates = !!(latitude.value && longitude.value);
  marker = new google.maps.Marker({
    position: center,
    map: hasCoordinates ? map : null,
    draggable: props.mode !== "view",
  });

  if (props.mode !== "view") {
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      updateCoordinates(pos.lat(), pos.lng());
    });

    map.addListener("click", (e) => {
      marker.setPosition(e.latLng);
      if (!marker.getMap()) marker.setMap(map);
      updateCoordinates(e.latLng.lat(), e.latLng.lng());
    });

    const searchInput = document.getElementById("map-search-input");
    if (searchInput instanceof HTMLInputElement) {
      autocomplete = new google.maps.places.Autocomplete(searchInput, {
        fields: ["geometry", "name", "formatted_address"],
      });
      autocomplete.bindTo("bounds", map);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        map.setCenter(place.geometry.location);
        map.setZoom(17);
        marker.setPosition(place.geometry.location);
        if (!marker.getMap()) marker.setMap(map);
        updateCoordinates(
          place.geometry.location.lat(),
          place.geometry.location.lng(),
        );
      });
    }
  }

  mapLoaded.value = true;
};

const handleMapSearch = async () => {
  if (props.mode === "view") return;
  const query = String(mapSearch.value ?? "").trim();
  if (!query) return;
  if (!map || !marker) return;
  if (typeof google === "undefined" || !google?.maps?.Geocoder) return;

  try {
    const geocoder = new google.maps.Geocoder();

    const { results } = await new Promise((resolve, reject) => {
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === "OK") return resolve({ results });
        reject(new Error(status));
      });
    });

    const first = results?.[0];
    if (!first?.geometry?.location) return;

    map.setCenter(first.geometry.location);
    map.setZoom(17);
    marker.setPosition(first.geometry.location);
    if (!marker.getMap()) marker.setMap(map);
    updateCoordinates(
      first.geometry.location.lat(),
      first.geometry.location.lng(),
    );
    updateLocationName(
      first.geometry.location.lat(),
      first.geometry.location.lng(),
    );
  } catch (error) {
    console.error("Geocoding failed", error);
  }
};

const updateLocationName = async (lat, lng) => {
  if (typeof google === "undefined" || !google.maps.Geocoder) return;

  const geocoder = new google.maps.Geocoder();
  const location = { lat, lng };

  try {
    // Geocode in Arabic
    const arResponse = await new Promise((resolve) => {
      geocoder.geocode({ location, language: "ar" }, (results, status) => {
        resolve(
          status === "OK" && results[0] ? results[0].formatted_address : "",
        );
      });
    });

    // Geocode in English
    const enResponse = await new Promise((resolve) => {
      geocoder.geocode({ location, language: "en" }, (results, status) => {
        resolve(
          status === "OK" && results[0] ? results[0].formatted_address : "",
        );
      });
    });

    locationNameAr.value = arResponse;
    locationNameEn.value = enResponse;
    locationName.value = lang.value === "ar" ? arResponse : enResponse;
    mapSearch.value = locationName.value;
  } catch (error) {
    console.error("Multi-language geocoding failed:", error);
  }
};

const updateCoordinates = (lat, lng) => {
  updatingFromMap.value = true;
  latitude.value = Number(Number(lat).toFixed(6));
  longitude.value = Number(Number(lng).toFixed(6));
  updateLocationName(lat, lng);
  nextTick(() => {
    updatingFromMap.value = false;
  });
};

watch(
  [latitude, longitude],
  ([lat, lng]) => {
    if (props.mode === "view") return;
    if (updatingFromMap.value) return;
    if (!map || !marker) return;
    if (lat === "" || lat === null || lat === undefined) return;
    if (lng === "" || lng === null || lng === undefined) return;

    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return;

    const pos = { lat: latNum, lng: lngNum };
    marker.setPosition(pos);
    if (!marker.getMap()) marker.setMap(map);
    map.setCenter(pos);
  },
  { flush: "post" },
);

// Watch for language changes while modal is open
watch(lang, async (newLang, oldLang) => {
  if (props.modelValue && newLang !== oldLang) {
    mapLoaded.value = false;
    loadingMap.value = false;
    if (mapContainer.value) {
      mapContainer.value.innerHTML = "";
    }

    // Update display names if we have them
    if (locationNameAr.value || locationNameEn.value) {
      locationName.value =
        newLang === "ar" ? locationNameAr.value : locationNameEn.value;
      if (props.mode !== "view") {
        mapSearch.value = locationName.value;
      }
    }

    await nextTick();
    initMap(latitude.value, longitude.value);
  }
});

const handleSubmit = validateAndSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      ...values,
      name: locationNameEn.value || locationName.value,
      name_ar: locationNameAr.value || locationName.value,
    };
    if (props.mode === "add") {
      await attendanceLocationService.create(payload);
      toast.success(t("locations.messages.created"));
    } else {
      await attendanceLocationService.update(props.locationData.id, payload);
      toast.success(t("locations.messages.updated"));
    }
    emit("saved");
    emit("update:modelValue", false);
  } catch (error) {
    toast.error(error);
  } finally {
    submitting.value = false;
  }
});
</script>

<style scoped>
.z-modal {
  z-index: 1000;
}
</style>
