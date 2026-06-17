import { postRequest } from '../services/api';

export const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeToPushNotifications = async (userId) => {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permission for notifications was denied');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  const readyRegistration = await navigator.serviceWorker.ready;
  const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  
  if (!publicVapidKey) {
    throw new Error('Missing VAPID key');
  }

  const subscription = await readyRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
  });

  return new Promise((resolve, reject) => {
    if (userId) {
      postRequest('/notifications-subscribe', {
        user_id: userId,
        subscription: subscription
      }, (response) => {
        if (response?.data?.status === 1) {
          localStorage.setItem('push_reminders_granted', 'true');
          resolve(true);
        } else {
          reject(new Error('Failed to save subscription to server'));
        }
      });
    } else {
      localStorage.setItem('push_reminders_granted', 'true');
      resolve(true);
    }
  });
};
