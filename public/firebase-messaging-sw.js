importScripts("https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js");

// TODO: Replace with your actual Firebase Web Config from the Firebase Console
// Project Settings > General > Your Apps > Web app
const firebaseConfig = {
  apiKey: "AIzaSyB5LBp8r-UmFg4CBjtJQPjrJTqdWX77wzs",
  authDomain: "hafr-albatin.firebaseapp.com",
  projectId: "hafr-albatin",
  storageBucket: "hafr-albatin.firebasestorage.app",
  messagingSenderId: "1066498448151",
  appId: "1:1066498448151:web:668f911a5fc24d74e07552",
  measurementId: "G-TN52ZEV3ZQ"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);
  const notificationTitle = payload.notification.title;
  
  // Extract data for click handling
  const data = payload.data || {};
  const actionUrl = data.action_url || "/";

  const notificationOptions = {
    body: payload.notification.body,
    icon: "/favicon.ico",
    data: {
      url: actionUrl,
      ...data
    },
    // Ensure the notification is unique to prevent collapsing if needed
    tag: payload.messageId || Date.now().toString(),
    // Add actions if you want buttons, but user asked for clicking the notification itself
  };

  // 1. Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);

  // 2. Broadcast to all open tabs so they can update counters real-time
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'FCM_BACKGROUND_MESSAGE',
        payload: payload
      });
    });
  });
});

// Handle notification click
self.onnotificationclick = function(event) {
  event.notification.close();

  // 1. Identify the action data
  const data = event.notification.data || {};
  const actionType = data.action_type;
  const actionId = data.action_id || data.id;
  
  // 2. Default to notifications list on frontend
  let targetUrl = "/notifications-list";

  // 3. Match actionTypes to frontend routes (MUST exactly match router/index.js paths)
  // We prioritize the actionType mapping and ignore any absolute redirect links from the backend
  if (actionType) {
    switch (actionType) {
      case 'evaluation_form':
        targetUrl = '/performance/evaluation';
        break;
      case 'external_mission':
      case 'external_missions':
      case 'external-mission':
      case 'external-missions':
        targetUrl = '/requests/delegation';
        break;
      case 'leave_request':
        targetUrl = '/requests/leave';
        break;
      case 'missing_punch':
        targetUrl = '/requests/missing-punch';
        break;
      case 'overtime_request':
        targetUrl = '/requests/overtime';
        break;
      case 'permission_request':
        targetUrl = '/requests/permission';
        break;
      case 'performance_charter':
        targetUrl = '/performance/charter';
        break;
      case 'internal_memo':
        targetUrl = actionId ? `/support/memos/${actionId}` : '/support/complaints';
        break;
      case 'profile':
        targetUrl = '/profile';
        break;
      case 'shift_schedule':
        targetUrl = '/attendance/settings/shifts';
        break;
      case 'work_system':
        targetUrl = '/attendance/settings/work-systems';
        break;
      default:
        // If the actionType is unknown, we stay on notifications-list 
        // and only use data.url if it's a clear relative path on our frontend
        if (data.url && data.url.startsWith('/') && !data.url.startsWith('//')) {
          targetUrl = data.url;
        }
        break;
    }
  } else {
    // If no actionType, check if data.url is a relative path (not an absolute redirect link)
    if (data.url && data.url.startsWith('/') && !data.url.startsWith('//')) {
      targetUrl = data.url;
    }
  }

  // 4. Construct final URL with correct language prefix and open in a new tab
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check existing tabs for language preference
      let isEn = false;
      for (const client of windowClients) {
        if (new URL(client.url).pathname.startsWith('/en')) {
          isEn = true;
          break;
        }
      }

      // Add /en prefix if user preference is detected as English
      if (isEn && targetUrl.startsWith('/') && !targetUrl.startsWith('/en')) {
        targetUrl = `/en${targetUrl}`;
      }
      
      const fullUrl = new URL(targetUrl, self.location.origin).href;

      // 5. Open new tab directly as requested ("روح في تابة جديدة")
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl);
      }
    })
  );
};
