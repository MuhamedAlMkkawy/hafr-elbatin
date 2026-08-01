import { createRouter, createWebHistory } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/LoginView.vue"),
    meta: { public: true },
  },
  {
    path: "/en/login",
    name: "login-en",
    component: () => import("@/views/LoginView.vue"),
    meta: { public: true },
  },
  {
    path: "/",
    component: () => import("@/layouts/DashboardLayout.vue"),
    children: [
      {
        path: "",
        name: "dashboard",
        component: () => import("@/views/DashboardHomeView.vue"),
      },
      {
        path: "settings",
        redirect: "/settings/general",
      },
      {
        path: "settings/general",
        name: "settings-general",
        component: () => import("@/views/SettingsView.vue"),
      },
      {
        path: "settings/roles",
        name: "settings-roles",
        component: () => import("@/views/roles/RolesIndexView.vue"),
      },
      {
        path: "branches",
        name: "branches",
        component: () => import("@/views/branches/BranchesIndexView.vue"),
      },
      {
        path: "employees",
        name: "employees",
        component: () => import("@/views/employees/EmployeesIndexView.vue"),
      },
      {
        path: "employees/view/:id",
        name: "employees-view",
        component: () => import("@/views/employees/EmployeeDetailsView.vue"),
      },
      {
        path: "employees/:id/edit",
        name: "employees-edit",
        component: () => import("@/views/employees/EmployeeEditView.vue"),
      },
      {
        path: "settings/roles/create",
        name: "settings-roles-create",
        component: () => import("@/views/roles/RoleFormView.vue"),
      },
      {
        path: "settings/roles/view/:id",
        name: "settings-roles-view",
        component: () => import("@/views/roles/RoleDetailsView.vue"),
      },
      {
        path: "settings/roles/:id",
        name: "settings-roles-edit",
        component: () => import("@/views/roles/RoleFormView.vue"),
      },
      {
        path: "attendance/daily",
        name: "attendance-daily",
        component: () => import("@/views/attendance/DailyAttendanceView.vue"),
      },
      {
        path: "attendance/settings",
        component: () =>
          import("@/views/attendance/AttendanceSettingsView.vue"),
        children: [
          {
            path: "",
            name: "attendance-settings",
            redirect: { name: "work-systems" },
          },
          {
            path: "work-systems",
            name: "work-systems",
            component: () =>
              import("@/views/attendance/work-systems/WorkSystemsIndexView.vue"),
          },
          {
            path: "work-systems/create",
            name: "work-systems-create",
            component: () =>
              import("@/views/attendance/work-systems/WorkSystemFormView.vue"),
          },
          {
            path: "work-systems/:id/edit",
            name: "work-systems-edit",
            component: () =>
              import("@/views/attendance/work-systems/WorkSystemFormView.vue"),
          },
          {
            path: "work-systems/:id",
            name: "work-systems-view",
            component: () =>
              import("@/views/attendance/work-systems/WorkSystemDetailsView.vue"),
          },
          {
            path: "shifts",
            name: "shifts",
            component: () =>
              import("@/views/attendance/shifts/ShiftsIndexView.vue"),
          },
          {
            path: "shifts/:id/schedules",
            name: "shift-schedules",
            component: () =>
              import("@/views/attendance/shifts/ShiftSchedulesView.vue"),
          },
          {
            path: "shifts/:id/schedules/create",
            name: "shift-schedules-create",
            component: () =>
              import("@/views/attendance/shifts/ScheduleFormView.vue"),
          },
          {
            path: "shifts/:id/schedules/:scheduleId/edit",
            name: "shift-schedules-edit",
            component: () =>
              import("@/views/attendance/shifts/ScheduleFormView.vue"),
          },
          {
            path: "shifts/:id/schedules/:scheduleId",
            name: "shift-schedules-view",
            component: () =>
              import("@/views/attendance/shifts/ScheduleDetailsView.vue"),
          },
          {
            path: "punch-location",
            name: "punch-location",
            component: () =>
              import("@/views/attendance/locations/LocationsIndexView.vue"),
          },
          {
            path: "notifications",
            name: "notifications",
            component: () =>
              import("@/views/attendance/notifications/NotificationSettingsIndexView.vue"),
          },
          {
            path: "notifications/:eventKey/edit",
            name: "notifications-edit",
            component: () =>
              import("@/views/attendance/notifications/NotificationEditPageView.vue"),
          },
        ],
      },
      {
        path: "requests/overtime",
        name: "requests-overtime",
        component: () =>
          import("@/views/requests/overtime/OvertimeRequestsIndexView.vue"),
      },
      {
        path: "requests/leave",
        name: "requests-leave",
        component: () =>
          import("@/views/requests/leave/LeaveRequestsIndexView.vue"),
      },
      {
        path: "requests/permission",
        name: "requests-permission",
        component: () =>
          import("@/views/requests/permission/PermissionRequestsIndexView.vue"),
      },
      {
        path: "requests/missing-punch",
        name: "requests-missing-punch",
        component: () =>
          import("@/views/requests/missing-punch/MissingPunchRequestsIndexView.vue"),
      },
      {
        path: "requests/delegation",
        name: "requests-delegation",
        component: () =>
          import("@/views/requests/external-mission/ExternalMissionRequestsIndexView.vue"),
      },
      {
        path: "requests/settings",
        component: () => import("@/views/requests/RequestsSettingsView.vue"),
        children: [
          {
            path: "",
            name: "requests-settings",
            redirect: { name: "leave-types" },
          },
          {
            path: "holidays",
            name: "holidays",
            component: () =>
              import("@/views/requests/settings/HolidaysIndexView.vue"),
          },
          {
            path: "leave-types",
            name: "leave-types",
            component: () =>
              import("@/views/requests/settings/LeaveTypesIndexView.vue"),
          },
          {
            path: "permissions",
            name: "requests-permissions",
            component: () =>
              import("@/views/requests/settings/PermissionsSettingsView.vue"),
          },
          {
            path: "overtime",
            name: "requests-overtime-settings",
            component: () =>
              import("@/views/requests/settings/OvertimeSettingsView.vue"),
          },
          {
            path: "notifications",
            name: "requests-notifications",
            component: () =>
              import("@/views/requests/notifications/RequestsNotificationSettingsIndexView.vue"),
          },
          {
            path: "notifications/:eventKey/edit",
            name: "requests-notifications-edit",
            component: () =>
              import("@/views/requests/notifications/RequestsNotificationEditPageView.vue"),
          },
        ],
      },
      {
        path: "support",
        children: [
          {
            path: "",
            redirect: "support/complaints",
          },
          {
            path: "complaints",
            name: "complaints",
            component: () => import("@/views/support/SupportIndexView.vue"),
          },
          {
            path: "memos/:id",
            name: "memos",
            component: () => import("@/views/support/view/MemoIndexView.vue"),
          },
          {
            path: "add_memo",
            name: "add_memo",
            component: () => import("@/views/support/view/MemoFormIndex.vue"),
          },
          {
            path: ":id/edit",
            name: "edit",
            component: () => import("@/views/support/view/MemoFormIndex.vue"),
          },
          {
            path: "contact",
            name: "contact",
            component: () =>
              import("@/views/support/contact/ContactIndexView.vue"),
          },
          {
            path: "contact/:id",
            name: "single-message",
            component: () =>
              import("@/views/support/contact/ContactSingleView.vue"),
          },
        ],
      },
      {
        path: "reports",
        children: [
          {
            path: "absence",
            name: "reports-absence",
            component: () =>
              import("@/views/reports/absence/AbsenceReportsIndexView.vue"),
          },
          {
            path: "absence/:id",
            name: "reports-absence-details",
            component: () =>
              import("@/views/reports/absence/AbsenceReportDetailsView.vue"),
          },
          {
            path: "absence/details/logs",
            name: "reports-absence-logs",
            component: () =>
              import("@/views/reports/absence/AbsenceEmployeeDailyView.vue"),
          },
          {
            path: "hours",
            name: "reports-working-hours",
            component: () =>
              import("@/views/reports/working-hours/WorkingHoursReportsIndexView.vue"),
          },
          {
            path: "leaves",
            name: "reports-leaves",
            component: () =>
              import("@/views/reports/leaves/LeavesReportsIndexView.vue"),
          },
          {
            path: "leaves/details",
            name: "reports-leaves-details",
            component: () =>
              import("@/views/reports/leaves/LeavesReportDetailsView.vue"),
          },
          {
            path: "leaves/department/:id",
            name: "reports-leaves-department",
            component: () =>
              import("@/views/reports/leaves/LeavesDepartmentDetailsView.vue"),
          },
          {
            path: "leaves/employee/:id",
            name: "reports-leaves-employee",
            component: () =>
              import("@/views/reports/leaves/LeavesEmployeeDetailsView.vue"),
          },
          {
            path: "permissions",
            name: "reports-permissions",
            component: () =>
              import("@/views/reports/permissions/PermissionsReportsIndexView.vue"),
          },
          {
            path: "permissions/details/:id",
            name: "reports-permissions-details",
            component: () =>
              import("@/views/reports/permissions/PermissionsReportDetailsView.vue"),
          },
          {
            path: "attendance",
            name: "reports-attendance",
            component: () =>
              import("@/views/reports/attendance/AttendanceReportsIndexView.vue"),
          },
          {
            path: "attendance/details",
            name: "reports-attendance-details",
            component: () =>
              import("@/views/reports/attendance/AttendanceReportDetailsView.vue"),
          },
          {
            path: "attendance/employee/:id",
            name: "reports-attendance-employee",
            component: () =>
              import("@/views/reports/attendance/AttendanceEmployeeDailyView.vue"),
          },
          {
            path: "attendance/logs",
            name: "reports-attendance-logs",
            component: () =>
              import("@/views/reports/attendance/AttendanceLogsView.vue"),
          },
        ],
      },
      {
        path: "notifications-list",
        name: "notifications-list",
        component: () => import("@/views/notifications/NotificationsView.vue"),
      },
      {
        path: "add-message",
        name: "add-message",
        component: () => import("@/views/support/contact/ContactFormView.vue"),
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("@/views/profile/ProfileIndexView.vue"),
      },
      {
        path: "activity-logs",
        name: "profile-activity-logs",
        component: () => import("@/views/profile/ProfileLogsView.vue"),
      },
      {
        path: "scheduale",
        name: "scheduale",
        component: () => import("@/views/profile/SchedualeIndexView.vue"),
      },
      {
        path: "evaluation/:id",
        name: "evaluation-view",
        component: () => import("@/views/evaluation/view/EvaluationView.vue"),
      },
      {
        path: "performance",
        children: [
          {
            path: "charter",
            name: "charter",
            component: () =>
              import("@/views/performance/PerformanceIndexView.vue"),
          },
          {
            path: ":id",
            name: "single-charter",
            component: () =>
              import("@/views/performance/view/CharterIndexView.vue"),
          },
          {
            path: "add",
            name: "add-charter",
            component: () =>
              import("@/views/performance/view/CharterFormIndex.vue"),
          },
          {
            path: ":id/edit",
            name: "edit-charter",
            component: () =>
              import("@/views/performance/view/CharterFormIndex.vue"),
          },
          {
            path: "evaluation",
            name: "evaluation",
            component: () =>
              import("@/views/evaluation/EvaluationIndexView.vue"),
          },
          {
            path: "evaluation/:id",
            name: "single-evaluation",
            component: () =>
              import("@/views/evaluation/view/EvaluationView.vue"),
          },
          {
            path: "evaluation/:id/edit",
            name: "edit-evaluation",
            component: () =>
              import("@/views/evaluation/view/EvaluationFormIndex.vue"),
          },
          {
            path: "evaluation/:id/evaluate",
            name: "evaluate-evaluation",
            component: () =>
              import("@/views/evaluation/view/EvaluationFormIndex.vue"),
          },
          {
            path: "appraisal",
            name: "appraisal",
            component: () =>
              import("@/views/general-evaluation/GeneralEvaluationIndexView.vue"),
          },
        ],
      },
      {
        path: "/:id/evaluate",
        name: "evaluation-employee",
        component: () =>
          import("@/views/evaluation/view/EvaluationFormIndex.vue"),
      },
      {
        path: "/:id/general-evaluate",
        name: "general-evaluation-employee",
        component: () =>
          import("@/views/general-evaluation/view/GeneralEvaluationFormView.vue"),
      },
      {
        path: "logs",
        name: "audit-logs",
        component: () => import("@/views/audit-logs/AuditLogsIndexView.vue"),
      },
      {
        path: "structure",
        name: "structure",
        component: () => import("@/views/structure/StructureView.vue"),
      },
      {
        path: "401",
        name: "401",
        component: () => import("@/views/errors/UnauthorizedView.vue"),
        meta: { public: true },
      },
      {
        path: ":pathMatch(.*)*",
        name: "not-found",
        component: () => import("@/views/errors/NotFoundView.vue"),
        meta: { public: true },
      },
    ],
  },
  {
    path: "/en",
    component: () => import("@/layouts/DashboardLayout.vue"),
    children: [
      {
        path: "",
        name: "dashboard-en",
        component: () => import("@/views/DashboardHomeView.vue"),
      },
      {
        path: "settings",
        redirect: "/en/settings/general",
      },
      {
        path: "settings/general",
        name: "settings-en-general",
        component: () => import("@/views/SettingsView.vue"),
      },
      {
        path: "settings/roles",
        name: "settings-en-roles",
        component: () => import("@/views/roles/RolesIndexView.vue"),
      },
      {
        path: "branches",
        name: "branches-en",
        component: () => import("@/views/branches/BranchesIndexView.vue"),
      },
      {
        path: "employees",
        name: "employees-en",
        component: () => import("@/views/employees/EmployeesIndexView.vue"),
      },
      {
        path: "employees/view/:id",
        name: "employees-en-view",
        component: () => import("@/views/employees/EmployeeDetailsView.vue"),
      },
      {
        path: "employees/:id/edit",
        name: "employees-en-edit",
        component: () => import("@/views/employees/EmployeeEditView.vue"),
      },
      {
        path: "settings/roles/create",
        name: "settings-en-roles-create",
        component: () => import("@/views/roles/RoleFormView.vue"),
      },
      {
        path: "settings/roles/view/:id",
        name: "settings-en-roles-view",
        component: () => import("@/views/roles/RoleDetailsView.vue"),
      },
      {
        path: "settings/roles/:id",
        name: "settings-en-roles-edit",
        component: () => import("@/views/roles/RoleFormView.vue"),
      },
      {
        path: "attendance/daily",
        name: "attendance-en-daily",
        component: () => import("@/views/attendance/DailyAttendanceView.vue"),
      },
      {
        path: "attendance/settings",
        component: () =>
          import("@/views/attendance/AttendanceSettingsView.vue"),
        children: [
          {
            path: "",
            name: "attendance-en-settings",
            redirect: { name: "work-systems-en" },
          },
          {
            path: "work-systems",
            name: "work-systems-en",
            component: () =>
              import("@/views/attendance/work-systems/WorkSystemsIndexView.vue"),
          },
          {
            path: "work-systems/create",
            name: "work-systems-en-create",
            component: () =>
              import("@/views/attendance/work-systems/WorkSystemFormView.vue"),
          },
          {
            path: "work-systems/:id/edit",
            name: "work-systems-en-edit",
            component: () =>
              import("@/views/attendance/work-systems/WorkSystemFormView.vue"),
          },
          {
            path: "work-systems/:id",
            name: "work-systems-en-view",
            component: () =>
              import("@/views/attendance/work-systems/WorkSystemDetailsView.vue"),
          },
          {
            path: "shifts",
            name: "shifts-en",
            component: () =>
              import("@/views/attendance/shifts/ShiftsIndexView.vue"),
          },
          {
            path: "shifts/:id/schedules",
            name: "shift-schedules-en",
            component: () =>
              import("@/views/attendance/shifts/ShiftSchedulesView.vue"),
          },
          {
            path: "shifts/:id/schedules/create",
            name: "shift-schedules-en-create",
            component: () =>
              import("@/views/attendance/shifts/ScheduleFormView.vue"),
          },
          {
            path: "shifts/:id/schedules/:scheduleId/edit",
            name: "shift-schedules-en-edit",
            component: () =>
              import("@/views/attendance/shifts/ScheduleFormView.vue"),
          },
          {
            path: "shifts/:id/schedules/:scheduleId",
            name: "shift-schedules-en-view",
            component: () =>
              import("@/views/attendance/shifts/ScheduleDetailsView.vue"),
          },
          {
            path: "punch-location",
            name: "punch-location-en",
            component: () =>
              import("@/views/attendance/locations/LocationsIndexView.vue"),
          },
          {
            path: "notifications",
            name: "notifications-en",
            component: () =>
              import("@/views/attendance/notifications/NotificationSettingsIndexView.vue"),
          },
          {
            path: "notifications/:eventKey/edit",
            name: "notifications-en-edit",
            component: () =>
              import("@/views/attendance/notifications/NotificationEditPageView.vue"),
          },
        ],
      },
      {
        path: "requests/overtime",
        name: "requests-en-overtime",
        component: () =>
          import("@/views/requests/overtime/OvertimeRequestsIndexView.vue"),
      },
      {
        path: "requests/leave",
        name: "requests-en-leave",
        component: () =>
          import("@/views/requests/leave/LeaveRequestsIndexView.vue"),
      },
      {
        path: "requests/permission",
        name: "requests-en-permission",
        component: () =>
          import("@/views/requests/permission/PermissionRequestsIndexView.vue"),
      },
      {
        path: "requests/missing-punch",
        name: "requests-en-missing-punch",
        component: () =>
          import("@/views/requests/missing-punch/MissingPunchRequestsIndexView.vue"),
      },
      {
        path: "requests/delegation",
        name: "requests-en-delegation",
        component: () =>
          import("@/views/requests/external-mission/ExternalMissionRequestsIndexView.vue"),
      },
      {
        path: "requests/settings",
        component: () => import("@/views/requests/RequestsSettingsView.vue"),
        children: [
          {
            path: "",
            name: "requests-en-settings",
            redirect: { name: "leave-types-en" },
          },
          {
            path: "holidays",
            name: "holidays-en",
            component: () =>
              import("@/views/requests/settings/HolidaysIndexView.vue"),
          },
          {
            path: "leave-types",
            name: "leave-types-en",
            component: () =>
              import("@/views/requests/settings/LeaveTypesIndexView.vue"),
          },
          {
            path: "permissions",
            name: "requests-en-permissions",
            component: () =>
              import("@/views/requests/settings/PermissionsSettingsView.vue"),
          },
          {
            path: "overtime",
            name: "requests-en-overtime-settings",
            component: () =>
              import("@/views/requests/settings/OvertimeSettingsView.vue"),
          },
          {
            path: "notifications",
            name: "requests-notifications-en",
            component: () =>
              import("@/views/requests/notifications/RequestsNotificationSettingsIndexView.vue"),
          },
          {
            path: "notifications/:eventKey/edit",
            name: "requests-notifications-en-edit",
            component: () =>
              import("@/views/requests/notifications/RequestsNotificationEditPageView.vue"),
          },
        ],
      },
      {
        path: "support",
        children: [
          {
            path: "",
            redirect: "support/complaints",
          },
          {
            path: "complaints",
            name: "complaints-en",
            component: () => import("@/views/support/SupportIndexView.vue"),
          },
          {
            path: "memos/:id",
            name: "memos-en",
            component: () => import("@/views/support/view/MemoIndexView.vue"),
          },
          {
            path: "add_memo",
            name: "add_memo_en",
            component: () => import("@/views/support/view/MemoFormIndex.vue"),
          },
          {
            path: ":id/edit",
            name: "edit_en",
            component: () => import("@/views/support/view/MemoFormIndex.vue"),
          },
          {
            path: "contact",
            name: "contact_en",
            component: () =>
              import("@/views/support/contact/ContactIndexView.vue"),
          },
          {
            path: "contact/:id",
            name: "single-message_en",
            component: () =>
              import("@/views/support/contact/ContactSingleView.vue"),
          },
        ],
      },
      {
        path: "reports",
        children: [
          {
            path: "absence",
            name: "reports-absence-en",
            component: () =>
              import("@/views/reports/absence/AbsenceReportsIndexView.vue"),
          },
          {
            path: "absence/:id",
            name: "reports-absence-details-en",
            component: () =>
              import("@/views/reports/absence/AbsenceReportDetailsView.vue"),
          },
          {
            path: "absence/details/logs",
            name: "reports-absence-logs-en",
            component: () =>
              import("@/views/reports/absence/AbsenceEmployeeDailyView.vue"),
          },
          {
            path: "hours",
            name: "reports-working-hours-en",
            component: () =>
              import("@/views/reports/working-hours/WorkingHoursReportsIndexView.vue"),
          },
          {
            path: "leaves",
            name: "reports-leaves-en",
            component: () =>
              import("@/views/reports/leaves/LeavesReportsIndexView.vue"),
          },
          {
            path: "leaves/details",
            name: "reports-leaves-details-en",
            component: () =>
              import("@/views/reports/leaves/LeavesReportDetailsView.vue"),
          },
          {
            path: "leaves/department/:id",
            name: "reports-leaves-department-en",
            component: () =>
              import("@/views/reports/leaves/LeavesDepartmentDetailsView.vue"),
          },
          {
            path: "leaves/employee/:id",
            name: "reports-leaves-employee-en",
            component: () =>
              import("@/views/reports/leaves/LeavesEmployeeDetailsView.vue"),
          },
          {
            path: "permissions",
            name: "reports-permissions-en",
            component: () =>
              import("@/views/reports/permissions/PermissionsReportsIndexView.vue"),
          },
          {
            path: "permissions/details/:id",
            name: "reports-permissions-details-en",
            component: () =>
              import("@/views/reports/permissions/PermissionsReportDetailsView.vue"),
          },
          {
            path: "attendance",
            name: "reports-attendance-en",
            component: () =>
              import("@/views/reports/attendance/AttendanceReportsIndexView.vue"),
          },
          {
            path: "attendance/details",
            name: "reports-attendance-details-en",
            component: () =>
              import("@/views/reports/attendance/AttendanceReportDetailsView.vue"),
          },
          {
            path: "attendance/employee/:id",
            name: "reports-attendance-employee-en",
            component: () =>
              import("@/views/reports/attendance/AttendanceEmployeeDailyView.vue"),
          },
          {
            path: "attendance/logs",
            name: "reports-attendance-logs-en",
            component: () =>
              import("@/views/reports/attendance/AttendanceLogsView.vue"),
          },
        ],
      },
      {
        path: "notifications-list",
        name: "notifications-list-en",
        component: () => import("@/views/notifications/NotificationsView.vue"),
      },
      {
        path: "evaluation/:id",
        name: "evaluation-view-en",
        component: () => import("@/views/evaluation/view/EvaluationView.vue"),
      },
      {
        path: "performance",
        children: [
          {
            path: "charter",
            name: "charter_en",
            component: () =>
              import("@/views/performance/PerformanceIndexView.vue"),
          },
          {
            path: ":id",
            name: "single-charter-en",
            component: () =>
              import("@/views/performance/view/CharterIndexView.vue"),
          },
          {
            path: "add",
            name: "add-charter-en",
            component: () =>
              import("@/views/performance/view/CharterFormIndex.vue"),
          },
          {
            path: ":id/edit",
            name: "edit-charter-en",
            component: () =>
              import("@/views/performance/view/CharterFormIndex.vue"),
          },
          {
            path: "evaluation",
            name: "evaluation-en",
            component: () =>
              import("@/views/evaluation/EvaluationIndexView.vue"),
          },
          {
            path: "evaluation/:id",
            name: "single-evaluation-en",
            component: () =>
              import("@/views/evaluation/view/EvaluationView.vue"),
          },
          {
            path: "evaluation/:id/edit",
            name: "edit-evaluation-en",
            component: () =>
              import("@/views/evaluation/view/EvaluationFormIndex.vue"),
          },
          {
            path: "evaluation/:id/evaluate",
            name: "evaluate-evaluation-en",
            component: () =>
              import("@/views/evaluation/view/EvaluationFormIndex.vue"),
          },
          {
            path: "appraisal",
            name: "appraisal-en",
            component: () =>
              import("@/views/general-evaluation/GeneralEvaluationIndexView.vue"),
          },
        ],
      },
      {
        path: ":id/evaluate",
        name: "evaluation-employee-en",
        component: () =>
          import("@/views/evaluation/view/EvaluationFormIndex.vue"),
      },
      {
        path: ":id/general-evaluate",
        name: "general-evaluation-employee-en",
        component: () =>
          import("@/views/general-evaluation/view/GeneralEvaluationFormView.vue"),
      },
      {
        path: "add-message",
        name: "add-message_en",
        component: () => import("@/views/support/contact/ContactFormView.vue"),
      },
      {
        path: "profile",
        name: "profile-en",
        component: () => import("@/views/profile/ProfileIndexView.vue"),
      },
      {
        path: "activity-logs",
        name: "profile-activity-logs-en",
        component: () => import("@/views/profile/ProfileLogsView.vue"),
      },
      {
        path: "scheduale",
        name: "scheduale_en",
        component: () => import("@/views/profile/SchedualeIndexView.vue"),
      },
      {
        path: "logs",
        name: "audit-logs-en",
        component: () => import("@/views/audit-logs/AuditLogsIndexView.vue"),
      },
      {
        path: "structure",
        name: "structure-en",
        component: () => import("@/views/structure/StructureView.vue"),
      },
      {
        path: "401",
        name: "401-en",
        component: () => import("@/views/errors/UnauthorizedView.vue"),
        meta: { public: true },
      },
      {
        path: ":pathMatch(.*)*",
        name: "not-found-en",
        component: () => import("@/views/errors/NotFoundView.vue"),
        meta: { public: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  auth.restore();

  const isAuthenticated = auth.isAuthenticated;

  const isLoginPage = to.name === "login" || to.name === "login-en";
  const isAddMessagePage =
    to.name === "add-message" || to.name === "add-message_en";

  // Public pages (login, not-found, unauthorized)
  if (to.meta?.public) {
    if (isLoginPage && isAuthenticated) {
      return { name: to.path.startsWith("/en") ? "dashboard-en" : "dashboard" };
    }
    return true;
  }

  // Special case: allow add-message even if not authenticated
  if (isAddMessagePage) {
    return true;
  }

  // Private routes: redirect unauthenticated users to login
  if (!isAuthenticated) {
    return { name: to.path.startsWith("/en") ? "login-en" : "login" };
  }

  // Authenticated users can access everything else
  return true;
});

export default router;
