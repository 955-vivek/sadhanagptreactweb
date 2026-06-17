import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postRequest, getRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';

const ReportSettingsModal = ({ isOpen, onClose, userDetails, showToast }) => {
  const [autoReportStatus, setAutoReportStatus] = useState(1);
  const [reportFrequencyDays, setReportFrequencyDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  // New States for Activity Reminders
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);

  // Fetch the latest parameters from the Profile API whenever the Gear Icon is clicked
  useEffect(() => {
    if (isOpen && userDetails?.user_id) {
      getRequest('/counslor-user-profile', { user_id: userDetails.user_id }, (response) => {
        const res = response?.data;
        if (res?.code === 200 || res?.status === 1 || res?.success) {
          const profile = res.data?.user || {};
          setAutoReportStatus(profile.auto_report_status === 1);
          setReportFrequencyDays(profile.report_frequency_days || 7);
          setReminderEnabled(
            profile.reminder_enabled === 1 || profile.reminder_enabled === true ||
            profile.reminder_status === 1 || profile.reminder_status === true
          );
          setReminderDays(profile.reminder_days || 3);
        }
      });
    }
  }, [isOpen, userDetails]);

  // Push Notification Subscription Check
  useEffect(() => {
    const checkSubscription = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsPushEnabled(true); // hide if not supported
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const browserSubscription = registration ? await registration.pushManager.getSubscription() : null;

        if (userDetails?.user_id) {
          getRequest('/check-push-status', { user_id: userDetails.user_id }, async (response) => {
            const backendHasSub = response.data?.isSubscribed;

            if (browserSubscription && !backendHasSub) {
              await browserSubscription.unsubscribe();
              setIsPushEnabled(false);
            } else if (browserSubscription && backendHasSub) {
              setIsPushEnabled(true);
            } else {
              setIsPushEnabled(false);
            }
          });
        } else {
          setIsPushEnabled(!!browserSubscription);
        }
      } catch (e) {
        setIsPushEnabled(false);
      }
    };

    if (userDetails?.user_id && isOpen) {
      checkSubscription();
    }
  }, [userDetails?.user_id, isOpen]);

  const handleToggleActivityReminders = async () => {
    const turningOn = !reminderEnabled;
    if (turningOn) {
      setReminderEnabled(true);
      postRequest('/update-reminder-preferences', {
        user_id: userDetails.user_id,
        reminder_enabled: true,
        reminder_days: reminderDays || 3
      }, (res) => {
        if (res.data?.status !== 1 && !res.data?.success && res.data?.code !== 200) {
          showToast('Failed to update reminder settings.', 'error');
          setReminderEnabled(false);
        }
      });
    } else {
      setReminderEnabled(false);
      postRequest('/update-reminder-preferences', {
        user_id: userDetails.user_id,
        reminder_enabled: false,
        reminder_days: reminderDays || 3
      }, (res) => {
        if (res.data?.status !== 1 && !res.data?.success && res.data?.code !== 200) {
          showToast('Failed to update reminder settings.', 'error');
          setReminderEnabled(true); // Revert on failure
        }
      });
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showToast('Push notifications are not supported by your browser.', 'error');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('Permission for notifications was denied', 'error');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!publicVapidKey) {
        showToast('VAPID Public Key is missing in .env', 'error');
        return;
      }

      function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      // Send to backend
      postRequest('/notifications-subscribe', {
        user_id: userDetails.user_id,
        subscription: subscription
      }, (response) => {
        const { message, type } = processResponse(response.data);
        if (type === 'success' || response.data?.status === 1) {
          showToast('Push notifications enabled!', 'success');
          setIsPushEnabled(true);
          setReminderEnabled(true); // Sync the toggle visually
        } else {
          showToast(message || 'Failed to save subscription.', 'error');
        }
      });

    } catch (error) {
      console.error(error);
      showToast('Error enabling push notifications', 'error');
    }
  };

  const handleSave = () => {
    setIsSubmitting(true);

    const emailPayload = {
      user_id: userDetails.user_id,
      auto_report_status: autoReportStatus ? 1 : 0,
      report_frequency_days: Number(reportFrequencyDays)
    };

    const reminderPayload = {
      user_id: userDetails.user_id,
      reminder_enabled: reminderEnabled ? 1 : 0,
      reminder_days: reminderDays
    };

    Promise.all([
      new Promise(resolve => postRequest('/toggle-email-report', emailPayload, resolve)),
      new Promise(resolve => postRequest('/update-reminder-preferences', reminderPayload, resolve))
    ]).then(([emailRes, reminderRes]) => {
      setIsSubmitting(false);
      showToast("Settings updated successfully!", "success");
      onClose();
    }).catch(() => {
      setIsSubmitting(false);
      showToast("Failed to update settings.", "error");
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-0">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="relative w-full max-w-sm bg-white dark:bg-[#0F172A] rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-colors duration-300"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a73e8] to-[#2563eb] px-6 py-5 flex items-center justify-between shadow-md z-10">
            <h2 className="text-xl font-bold text-white tracking-tight">Report Settings</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 flex flex-col gap-5">

            {/* Push Notifications Enable Banner */}
            {!isPushEnabled && (
              <div className="bg-gradient-to-r from-[#1a73e8] to-[#2563eb] rounded-2xl p-4 shadow-md text-white mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[15px] mb-0.5">Enable Reminders</h3>
                    <p className="text-blue-100 text-[12px] leading-tight">Get push notifications for mentee updates.</p>
                  </div>
                  <button
                    onClick={handleEnablePushNotifications}
                    className="bg-white text-[#1a73e8] font-bold px-4 py-2 rounded-xl text-[12px] shadow-sm active:scale-95 transition-all whitespace-nowrap"
                  >
                    Allow
                  </button>
                </div>
              </div>
            )}

            {/* Activity Reminders Area - ONLY VISIBLE IF PUSH IS ENABLED */}
            {isPushEnabled && (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[#0f172a] dark:text-[#F8FAFC] font-bold">Activity Reminders</h3>
                    <p className="text-sm text-gray-500 dark:text-[#94A3B8]">Get notified if you miss Sadhana</p>
                  </div>
                  <button
                    type="button"
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${reminderEnabled ? 'bg-[#f97316]' : 'bg-gray-200 dark:bg-[#334155]'}`}
                    onClick={handleToggleActivityReminders}
                  >
                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${reminderEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Reminder Days Selector Area */}
                <AnimatePresence>
                  {reminderEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-[#0f172a] dark:text-[#F8FAFC] font-bold text-[13px]">Remind me after missing</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-[#f8fafc] dark:bg-[#1E293B] rounded-xl border-2 border-transparent focus-within:border-[#f97316]/20 overflow-hidden transition-colors duration-300">
                            <button
                              onClick={() => reminderDays > 1 && setReminderDays(reminderDays - 1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#f97316] hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={reminderDays}
                              onChange={(e) => {
                                if (e.target.value === '') {
                                  setReminderDays('');
                                  return;
                                }
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val > 0 && val <= 10) setReminderDays(val);
                              }}
                              onBlur={() => {
                                if (reminderDays === '') setReminderDays(3);
                              }}
                              className="w-10 text-center bg-transparent text-[#1e293b] dark:text-[#F8FAFC] font-black text-[13px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => reminderDays < 10 && setReminderDays(reminderDays + 1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#f97316] hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            </button>
                          </div>
                          <span className="text-[13px] font-bold text-gray-400">days</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="h-px w-full bg-gray-100 dark:bg-[#1E293B] my-4 transition-colors duration-300"></div>
              </div>
            )}

            {/* Toggle Switch Area */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[#0f172a] dark:text-[#F8FAFC] font-bold">Email Reports</h3>
                <p className="text-sm text-gray-500 dark:text-[#94A3B8]">Receive automated CSV mentee logs</p>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoReportStatus ? 'bg-[#1a73e8]' : 'bg-gray-200 dark:bg-[#334155]'}`}
                onClick={() => setAutoReportStatus(prev => !prev)}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoReportStatus ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Frequency Selector Area */}
            <div className={`transition-opacity duration-300 ${!autoReportStatus ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[#0f172a] dark:text-[#F8FAFC] font-bold">Report Frequency</label>
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Active: {reportFrequencyDays} Days
                </span>
              </div>
              <select
                value={reportFrequencyDays}
                onChange={(e) => setReportFrequencyDays(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] text-gray-900 dark:text-[#F8FAFC] text-sm rounded-xl focus:ring-[#1a73e8] focus:border-[#1a73e8] block p-3 font-medium outline-none transition-colors duration-300"
              >
                <option value={3}>Every 3 Days</option>
                <option value={7}>Weekly (Every 7 Days)</option>
                <option value={14}>Bi-Weekly (Every 14 Days)</option>
                <option value={30}>Monthly (Every 30 Days)</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                This determines how many days backwards the PDF looks.
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[#1a73e8] hover:bg-[#155fc3] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#1a73e8]/30 transition-all active:scale-[0.98] disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Settings...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReportSettingsModal;
