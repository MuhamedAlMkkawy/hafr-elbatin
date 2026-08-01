import { useToast } from "vue-toastification";
import { useI18n } from "vue-i18n";

export const useAppToast = () => {
  const toast = useToast();
  const { t, locale } = useI18n();

  const getOptions = () => ({
    rtl: locale.value === 'ar',
    position: locale.value === 'ar' ? "bottom-left" : "bottom-right",
  });

  const error = (e) => {
    let errorMessage = t("common.error");

    if (e?.response?.data) {
      const data = e.response.data;
      
      // 1. Show first error from data.errors
      if (data.errors && typeof data.errors === 'object') {
        const fields = Object.keys(data.errors);
        if (fields.length > 0) {
          const firstField = fields[0];
          const fieldErrors = data.errors[firstField];
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            errorMessage = fieldErrors[0];
          } else if (typeof fieldErrors === 'string') {
            errorMessage = fieldErrors;
          }
        }
      } 
      // 2. Show message from data
      else if (data.message) {
        errorMessage = data.message;
      }
    } else if (typeof e === 'string') {
       errorMessage = e;
    } else if (e?.message) {
      errorMessage = e.message;
    }

    toast.error(errorMessage, getOptions());
  };

  const success = (message) => {
    toast.success(message, getOptions());
  };

  const info = (message) => {
    toast.info(message, getOptions());
  };

  const warning = (message) => {
    toast.warning(message, getOptions());
  };

  return {
    ...toast,
    error,
    success,
    info,
    warning,
  };
};
