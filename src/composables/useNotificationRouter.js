import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

export const useNotificationRouter = () => {
    const router = useRouter();
    const { locale } = useI18n();

    const handleRedirect = (notification) => {
        const actionType = notification.action_type || (notification.data && notification.data.action_type);
        const actionId = notification.action_id || (notification.data && notification.data.id);
        const isEn = locale.value === 'en';

        if (!actionType) {
            // Fallback to action_url if action_type is missing
            if (notification.action_url) {
                if (notification.action_url.startsWith('/')) {
                    router.push(isEn ? `/en${notification.action_url}` : notification.action_url);
                } else {
                    window.location.href = notification.action_url;
                }
            }
            return;
        }

        let routeName = '';
        let params = {};

        switch (actionType) {
          case "evaluation_form":
            routeName = isEn ? "evaluation-en" : "evaluation";
            break;
          case "external_mission":
            routeName = isEn ? "requests-en-delegation" : "requests-delegation";
            break;
          case "leave_request":
            routeName = isEn ? "requests-en-leave" : "requests-leave";
            break;
          case "missing_punch":
            routeName = isEn
              ? "requests-en-missing-punch"
              : "requests-missing-punch";
            break;
          case "overtime_request":
            routeName = isEn ? "requests-en-overtime" : "requests-overtime";
            break;
          case "permission_request":
            routeName = isEn ? "requests-en-permission" : "requests-permission";
            break;
          case "performance_charter":
            routeName = isEn ? "charter_en" : "charter";
            break;
          case "internal_memo":
            routeName = isEn ? "memos-en" : "memos";
            if (actionId) params = { id: actionId };
            break;
          case "profile":
            routeName = isEn ? "profile-en" : "profile";
            break;
          case "shift_schedule":
            routeName = isEn ? "shifts-en" : "shifts";
            break;
          case "work_system":
            routeName = isEn ? "work-systems-en" : "work-systems";
            break;
          case "employee_message":
            routeName = isEn ? "single-message-en" : "single-message";
            if (actionId) params = { id: actionId };
            break;
          default:
            // Fallback to action_url ONLY for relative paths
            if (
              notification.action_url &&
              notification.action_url.startsWith("/") &&
              !notification.action_url.startsWith("//")
            ) {
              router.push(
                isEn
                  ? `/en${notification.action_url}`
                  : notification.action_url,
              );
            } else {
              router.push(
                isEn ? "/en/notifications-list" : "/notifications-list",
              );
            }
            break;
        }

        if (routeName) {
          router.push({ name: routeName, params });
        }
    };

    return { handleRedirect };
};
